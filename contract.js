'use strict';

const help          = require('./help');
const Errors        = require('./errors');
const TermAgreement = require('./term-agreement');

/**
 * Let's make sure our object/classes have the behaviour
 * we expect!
 *
 * For minified code, argument names get scrambled, so 
 * we should only legitamtely use arg_length for 
 * contract argument validation
 *
 * @todo cleanup class names
 * @todo add a way to only add missing methods
 * 
 * `````````````````````````````````````````````````````````
 * Contract.addTerms('StorageHandler', {'save' : 2,'get':1 });
 * 
 * `````````````````````````````````````````````````````````
 *
 * For node.js we can validate argument names since there
 * isn't any obfuscation going on
 * 
 * ````````````````````````````````````````````````````````
 * // Basic setup for terms
 * Contract.addTerms('StorageHandler', {
 *     save : ['name', 'callback'],
 *     get  : ['name'] // can also be get: 'name'
 * });
 */
class Contract {
    constructor(validator) {

        /**
         * @todo add robust validation to args/returns
         * @type {Object}
         */
        this.validator = validator;

        /**
         * Stores terms for agreements
         *
         * @type {Object}
         */
        this.terms     = {};

        /**
         * @todo  
         * relates to validator
         * use https://github.com/chriso/validator.js
         * and replace with 'is' + obligation();
         * 
         * @type {Object}
         */
        this.obligations = {
            required : function(val) {
                return (val !== undefined);
            },
            _default : function(val, obligation) {
                return (typeof val === obligation);
            }
        };
    }

    /**
     * Add terms to an agreement
     * 
     * @param {String} agreement
     * @param {Object} terms
     */
    addTerms(agreement, terms) {

        if (typeof agreement === 'object') {
            terms = agreement.methods;
            agreement  = agreement.name;
        }

        if (typeof agreement !== 'string') {
            throw new Error('agreements are hard to fetch without a name {String}');
        }

        this.terms[agreement] = this.getTerms(agreement);

        for (const method in terms) {
            const term = this.toTerm(agreement, method);

            term.readRequirements(terms[method]);
            this.terms[agreement][term.method] = term;
        }
    }

    /**
     * Make testing much easier, can tweak prototype 
     * to swap class
     *
     * @param  {String} agreement
     * @param  {String} method
     * @return {Object}
     */
    toTerm(agreement, method) {
        return new TermAgreement(agreement, method);
    }

    /**
     * Get terms of an agreement
     *
     * @param  {String} agreement
     * @return {Object}
     */
    getTerms(agreement) {

        if (typeof agreement === 'string') {
            return this.terms[agreement] || {};
        }

        throw new Error('Cannot comprehend agreements not called by name');
    }

    /**
     * @param  {Function} Model
     * @param  {String} agreement
     */
    checkAgreement(agreement, Model) {

        const terms  = this.getTerms(agreement);
        let test     = Model;

        if (typeof Model === 'function') {
            test = Model.prototype;
        }  

        for (const method in terms) {

            this.checkTerms(
                terms[method],
                Model,
                test[method]
            );
        }

        if (!Model.$fulfills) {
            Model.$fulfills = {};
        }

        Model.$fulfills[agreement] = true;
    }

    term(terms) {
        return () => {
            this.argument(terms, argument);
        };
    }


    arguments(terms, args)  {
        const term = this.toTerm('', '');
        const run = (args) => {
            term.arguments(terms, args);
        };

        // if no args ... assume decorator
        if (!args) {
            return run;
        }

        return run.call(this, args);
    }

    agreement(terms, Model) {
        terms = Array.isArray(terms) ? terms : [terms];
        const run = (Model) => {
            terms.map(term => {
                this.checkAgreement(term, Model);
            });
        };

        // if no Model ... assume decorator
        if (!Model) {
            return run;
        }

        return run.call(this, Model);
    }

    checkTerms(terms, Model, method) {

        if (method === undefined) {
            Errors.missingDefinition(Model, terms);
        }

        // Cache args on method
        method.$args = help.methodArgs(method);

        const argsMismatch = (method.$args.length !== terms.getLength());

        if (argsMismatch) {
            Errors.missingArgs(Model, terms);
        }

        for (const i in method.$args) {
            const arg  = terms.args[i];
            arg.testName(method.$args[i]);
        }

        return terms;
    }

    wrapTerms(Model, terms) {

        const methodName = terms.method;
        const newAttr    = Symbol.for('_fn_' + methodName);
        const hasMethod  = (Model.prototype[methodName]);

        // @note a method can fulfill multple contracts, how will those be affected?
        const method = Model.prototype[newAttr] = Model.prototype[methodName];

        Model.prototype[methodName] = function() {

            const methodTerms = Contract.prototype.checkTerms(
                terms,
                Model,
                method
            );

            methodTerms.validateArguments(arguments);

            const res = Model.prototype[newAttr].call(this, arguments);

            methodTerms.validateReturn(res);

            return res;
        };

        // @todo move for newAttr above to only using original
        Model.prototype[methodName]._original = Model.prototype[newAttr];
    }

    /**
     * Re-bind model methods with functions that 
     * validate the arguments and return types
     *
     * @param  {Function} Model
     * @return {Function}
     */
    contractify(Model) {

        if (!Model.$agreements) {
            return;
        }

        Model.$agreements.map(agreement => {
           const terms = this.getTerms(agreement);

           for (const methodName in terms) {
                const term = terms[methodName];
                const noArgs = (term.getLength() === 0);

                if (noArgs) {
                    return;
                }
                
                this.wrapTerms(Model, term); 
           }
       });

       return Model;
    }
}

module.exports = Contract;
