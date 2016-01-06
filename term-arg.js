'use strict';

const Errors  = require('./errors');

const REGEX_MODEL = /^[A-Z]/;
       
class TermArg {

    constructor(rule, arg) {
        this.rule = rule;

        const hasDetails = (arg.indexOf(':') !== -1);
            
        if (hasDetails) {
           const details = arg.split(':');

           this.name = details[0];
           this.demands = details[1];
           return;
        }

        const isModel = REGEX_MODEL.test(arg);

        if (isModel) {
            this.demands = '' + arg
        } else if (arg === 'callback' || arg === 'cb') {
            this.demands = 'function';
        } else if (arg === 'options'){
            this.demands = 'object';
        }
    }

    testArg(arg) {
        if (arg !== this.name) {
            // Errors.badArgName(className, methodName, argName, fnArgName, idx);
            throw new Error('Bad arg name');
        }
    }

    toJSON() {
        return {
            requirement: this.requirement,
            name: this.name
        };
    }
}

module.exports = TermArg;
