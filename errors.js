'use strict';

const Errors = {
    missingDefinition : function(className, methodName) {
        throw new Error(
            className +  ' Interface | missing_definition | @' + methodName
        );
    },
    missingArgs : function(className, methodName, argNames) {
        throw new Error(
           className +  ' Interface | missing_args | expects @' + methodName + '(' + argNames.join(', ') + ')'
        );
    },
    badArgName : function(className, methodName, validArgName, badArgName, idx) {
        throw new Error(
            className +  ' Interface |  bad_argument_name (' + ( idx) + ') | expects ('+ validArgName + ') not('+ badArgName +') for @' + methodName + ' '
        );
    },
    badReturn : function(className, methodName, validReturnType, invalidReturnType) {
        throw new Error(
           className +  ' | bad_return | expects `' + validReturnType + '` not `' + invalidReturnType + '`'
        );
    }
};

module.exports = Errors;
