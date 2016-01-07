'use strict';

const Errors  = require('./errors');

const REGEX_MODEL = /^[A-Z]/;
       
class TermArg {

    constructor(terms, arg, idx) {
        this.terms = terms;
        this.idx  = idx;
        this.parseArg(arg);
    }

    /**
     * Parse details about the arg
     *
     * @param  {String} arg
     */
    parseArg(arg) {
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

    /**
     * Does the arg name match up?
     * 
     * @param  {String} name
     */
    testName(name) {
        if (name !== this.name) {
            Errors.badArgName('', this.terms, this, arg);
        }
    }

    /**
     * Does the arg value match up?
     *
     * @param  {Mixed} value
     */
    testValue(value) {
        if (typeof value !== this.demands) {
            Errors.badArgValue('', this.terms, this, typeof value);
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
