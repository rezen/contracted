'use strict';

var reflect = require('./reflect');

/**
 * Let's make sure our object/classes have the behaviour
 * we expect!
 *
 * For minified code, argument names get scrambled, so 
 * we should only legitamtely use arg_length for 
 * contract argument validation
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


var REGEX_MODEL = /^[A-Z]/;

var Errors = {
    missingDefinition : function(className, funcName) {
        throw new Error(
            className +  ' Interface | missing_definition | @' + funcName
        );
    },
    missingArgs : function(className, funcName, argNames) {
        throw new Error(
           className +  ' Interface | missing_args | expects @' + funcName + '(' + argNames.join(', ') + ')'
        );
    },
    badArgName : function(className, funcName, validArgName, badArgName, idx) {
        throw new Error(
            className +  ' Interface |  bad_argument_name (' + ( idx) + ') | expects ('+ validArgName + ') not('+ badArgName +') for @' + funcName + ' '
        );
    },
    badReturn : function(className, funcName, validReturnType, invalidReturnType) {
        throw new Error(
           className +  ' | bad_return | expects `' + validReturnType + '` not `' + invalidReturnType + '`'
        );
    }
};

function TermRule(className, method, requirements) {
    var breakdown = method.split('->');
    
    this.fromClass    = className;
    this.method       = breakdown[0];
    this.returnType   = breakdown[1] || undefined;
    this.argLength    = 0;
    this.requirements = [];
    this.argNames     = [];
}

TermRule.prototype.validateArgs = function(args) {
   
    for (var i in this.requirements) {

        var shouldBe    = this.requirements[i];
        var argType     = (typeof args[i]);
        var argPosition = 1 + parseInt(i);

        if (argType !== shouldBe) {
            throw new Error('@' + this.method  + ' | bad_arg | expects type `' + shouldBe + '` for arg(' +  argPosition + ', '+ this.argNames[i] + ')' );
        }
    }
};

TermRule.prototype.readRequirements = function(requirements) {

    requirements = requirements || [];

    var isConfig = (typeof requirements === 'object' && requirements.args);

    if (isConfig) {
        this.returnType = requirements.return;
        requirements    = requirements.args || [];
    }

    if (!Array.isArray(requirements)) {
        requirements = [requirements];
    }

    for (var i in requirements) {

        var details    = null;
        var req        = requirements[i];
        var hasDetails = (req.indexOf(':') !== -1);
        
        if (hasDetails) {
           details = req.split(':');

           req = details[0];
           details = details[1];
        } else {
            var isModel = REGEX_MODEL.test(req);

            if (isModel) {
                details = '' + req;
            } else if (req === 'callback' || req === 'cb') {
                details = 'function';
            } else if (req === 'options'){
                details = 'object';
            }
        }

        if (details !== null) {
            this.requirements.push(details);
        }

        this.argLength += 1;

        this.argNames.push(req);
    }
}



function Contract(validator) {

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

Contract.prototype.addTerm =  function(name, rules) {

    if (typeof name === 'object') {
        rules = name.methods;
        name  = name.name;
    }

    this.terms[name] = this.terms[name] || {};

    for (var method in rules) {
        var rule        = new TermRule(name, method);
        var methodRules = rules[rule.method];

        rule.readRequirements(rules[method]);
        this.terms[name][rule.method] = rule;
    }
};

Contract.prototype.getTerm = function(term) {
    return this.terms[term]  || {};
};

Contract.prototype.checkAgreement = function(Model, terms) {
    var rules = {};

    if (typeof terms === 'string') {
        rules = this.terms[terms];
    } else if (typeof terms === 'object') {
        // @todo
    }

    var test      = Model;
    var className = '';

    if (typeof Model === 'function') {
        test =  Model.prototype;
        className = reflect.getClassName(Model.toString());
    }  

    for (var method in rules) {

        this.functionTerms(
            className, 
            method, 
            test[method],
            rules[method], 
            terms
        );
    }
}

Contract.prototype.agreement = function(Model, terms) {

    if (!Array.isArray(terms)) {
        terms = [terms];
    }

    for (var i in terms) {
        this.checkAgreement(Model, terms[i]);
    }

    return true;
};


Contract.prototype.functionTerms =  function(className, funcName, method, rules) {

    className = className || '';

    if (method === undefined) {
        Errors.missingDefinition(className, funcName);
    }

    var fncArgs = reflect.getParamNames(method);

    var argLengthMisMatch = (fncArgs.length !==  rules.argLength);

    // Rules that include argument names
    if (argLengthMisMatch) {
        Errors.missingArgs(className, funcName, rules.argNames);
    }

    for (var i in fncArgs) {
        var idx             = 1 + parseInt(i);
        var argName         = rules.argNames[i];
        var fncArgName      = fncArgs[i];
        var argNameMisMatch = (fncArgName !== argName);

        if (argNameMisMatch) {
            Errors.badArgName(className, funcName, argName, fncArgName, idx);
       }
    }

    return rules;
};

Contract.prototype.reBind = function(Model, className, method, terms) {

    var self = this;
    var params = []
    var hasMethod = (Model.prototype[method]);

    if (hasMethod) {
        params = reflect.getParamNames(Model.prototype[method]);
        Model.prototype[method].params = params;
    }

    Model.prototype['_c_' + method] = Model.prototype[method];

    Model.prototype[method] = function() {

        var methodRules = Contract.prototype.functionTerms(
            className, 
            method, 
            Model.prototype['_c_' + method ], 
            terms
        );  

        var missingArgs = (methodRules.argsLength !== arguments.length);

        if (missingArgs) {
            // @todo sort out
            // Errors.missingArgs(className, method, methodRules.argNames);
        }

        methodRules.validateArgs(arguments);

        var res = Model.prototype['_c_' + method].call(this, arguments);

        var unexpectedReturn = (terms.returnType && typeof res !== terms.returnType);

        if (unexpectedReturn) {
            Errors.badReturn(className, method, terms.returnType, typeof res);
        }

        return res;
    }
}

Contract.prototype.contractify = function(Model) {

    if (!Model.agreements) {
        return;
    }

    var className = reflect.getClassName(Model.toString());

    for (var i in Model.agreements) {

       var term  = Model.agreements[i];
       var terma = this.getTerm(term);

       for (var method in terma) {
            
            var hasNoRequirements = (terma[method].requirements.length === 0);

            if (hasNoRequirements) {
                continue;
            }
            
            this.reBind(Model, className, method, terma[method]); 
       }
   }
};

Contract.prototype.addMissing = function(Model) {

    if (!Model.agreements) {
        return;
    }

    var placeHolder = function(name, method){
        
        return function(){
            Errors.missingDefinition(name, method);
        }
    };

    var className = reflect.getClassName(Model.toString());

    for (var i in Model.agreements) {

       var term  = Model.agreements[i];
       var terms = this.getTerm(term);

       for (var method in terms) {
            
            if (Model.prototype[method]) {
                continue;
            }

            Model.prototype[method] = placeHolder(className, method);
       }
   }
};

module.exports          = Contract;
module.exports.TermRule = TermRule;