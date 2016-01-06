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
 * @todo  cleanup class names
 * 
 * `````````````````````````````````````````````````````````
 * Contract.addTerm('StorageHandler', {'save' : 2,'get':1 });
 * 
 * `````````````````````````````````````````````````````````
 *
 * For node.js we can validate argument names since there
 * isn't any obfuscation going on
 * 
 * ````````````````````````````````````````````````````````
 * // Basic setup for terms
 * Contract.addTerm('StorageHandler', {
 *     save : ['name', 'callback'],
 *     get  : ['name'] // can also be get : 'name'
 * });
 *
 * // Specify return type and expected arg types
 * Contract.addTerm('StorageHandler', {
 *     // method called save, 
 *     // param[0]{name='name', type: 'string'}, param[1]{name='callback', type: 'function'}
 *     // returns string
 *    'save->string' : ['name:string', 'callback'], // callback is known as a function 
 *    get  : 'name:string' // can also be get : ['name:string']
 * });
 *
 * // Use an existing function/class to source
 * // for terms
 * function StorageHandler() {}
 * 
 * StorageHandler.prototype.save = function(name, callback) {
 *     return '';
 * };
 *
 * StorageHandler.prototype.get = function(name) {}
 *
 * Contract.addTerm(StorageHandler);
 * 
 * ````````````````````````````````````````````````````````
 */

class Contract {
    constructor(validator) {

        this.validator = validator;
        this.terms     = {};

        this.obligations = {
            required : function(val) {
                return (val !== undefined);
            },
            _default : function(val, obligation) {
                // use https://github.com/chriso/validator.js
                // and replace with
                // 'is' + obligation();
                // 
                return (typeof val === obligation);
            }
        };
    }

    addTerm(agreement, terms) {

        if (typeof agreement === 'object') {
            terms = agreement.methods;
            agreement  = agreement.name;
        }

        this.terms[agreement] = this.getTerms(agreement);

        for (const method in terms) {
            const term        = new TermAgreement(agreement, method);

            term.readRequirements(terms[method]);
            this.terms[agreement][term.method] = term;
        }
    }

    getTerms(agreement) {

        if (typeof agreement === 'string') {
            return this.terms[agreement] || {};
        }

        throw new Error('Cannot comprehend agreements not called by name');
    }

    checkAgreement(Model, agreement) {

        const terms  = this.getTerms(agreement);
        let test     = Model;

        if (typeof Model === 'function') {
            test = Model.prototype;
        }  

        for (const method in terms) {

            this.checkTerms(
                Model, 
                method, 
                test[method],
                terms[method], 
                terms
            );
        }
    }

    agreement(Model, terms) {

        terms = Array.isArray(terms) ? terms : [terms];

        terms.map(term => {
            this.checkAgreement(Model, term);
        });

        return true;
    }

    checkTerms(Model, methodName, method, rules) {

        if (method === undefined) {
            Errors.missingDefinition(Model, methodName);
        }

        // Cache args on method
        method.$args = help.methodArgs(method);

        const argsMismatch = (method.$args.length !== rules.getLength());

        if (argsMismatch) {
            Errors.missingArgs(Model, methodName, rules.getArgNames());
        }

        for (const i in method.$args) {
            const arg  = rules.args[i];
            arg.testArg(method.$args[i]);
        }

        return rules;
    }

    reBind(Model, methodName, terms) {
        const newAttr   = Symbol.for('_fn_' + methodName);
        const hasMethod = (Model.prototype[methodName]);

        // @note a method can fulfill multple contracts
        //       unsure how below will be affected
        const method = Model.prototype[newAttr] = Model.prototype[methodName];

        

        Model.prototype[methodName] = function() {

            const methodTerms = Contract.prototype.checkTerms(
                Model, 
                methodName, 
                method, 
                terms
            );

            methodTerms.validateArgs(arguments);

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

        if (!Model.agreements) {
            return;
        }

        for (const i in Model.agreements) {

           const agreement  = Model.agreements[i];
           const terms = this.getTerms(agreement);

           for (const method in terms) {
                const noExpectedArgs = (terms[method].getLength() === 0);

                if (noExpectedArgs) {
                    continue;
                }
                
                this.reBind(Model, method, terms[method]); 
           }
       }

       return Model;
    }

    // @todo add a way to only add missing methods
}

module.exports = Contract;
module.exports.TermAgreement = TermAgreement;