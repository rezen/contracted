'use strict';

function toName(Model) {

    if (typeof Model === 'string') {
        return Model;
    }

    return Model.name || '';
}

const Errors = {
    missingDefinition : function(Model, terms) {
        throw new Error(
            toName(Model) +  ' Interface | missing_definition | @' + terms.method
        );
    },
    missingArgs : function(Model, terms) {
        throw new Error(
           toName(Model) +  ' Interface | missing_args | expects @' + terms.method + '(' + terms.getArgNames().join(', ') + ')'
        );
    },
    badArgName : function(Model, terms, args, badArg) {

        idx   = idx || '?';

        throw new Error(
            toName(Model)  +  ' Interface |  bad_argument_name (' + (args.idx) + ') | expects ('+ args.name + ') not('+ badArg +') for @' + methodName + ' '
        );
    },
    badArgValue : function(Model, terms, args, badValue) {

       throw new Error(
            toName(Model)  +  ' Interface | bad_arg_value | expects type `' + shouldBe + '` for arg('+arg.name + ')' 
        );
    },
    badReturn : function(Model, terms, invalidReturnType) {

        throw new Error(
           toName(Model) +  ' | bad_return | expects `' + terms.returnType + '` not `' + invalidReturnType + '`'
        );
    }
};

module.exports = Errors;
