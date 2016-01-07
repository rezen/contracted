'use strict';

const help    = require('./help');
const Errors  = require('./errors');

const REGEX_MODEL = /^[A-Z]/;
       
class TermArg {

    constructor(terms, arg, idx) {
        this.terms = terms;
        this.idx   = idx;
        this.optional = false;
        this.parseArg(arg);
    }

    /**
     * Parse details about the arg
     *
     * @param  {String} arg
     */
    parseArg(arg) {
        const isOptional = (arg.indexOf('?') !== -1);

        if (isOptional) {
            this.optional = true;
            arg = arg.replace(/\?/g, '');
        }

        const hasDetails = (arg.indexOf(':') !== -1);
            
        if (hasDetails) {
           const tmp = arg.split(':');

           this.name = tmp[0];
           arg = tmp[1];
        }

        const isModel = REGEX_MODEL.test(arg);

        if (isModel) {
            this.demands = '' + arg
        } else if (arg === 'callback' || arg === 'cb') {
            this.demands = 'function';
        } else if (arg === 'options'){
            this.demands = 'object';
        } else {
            this.demands = arg;
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

        if (value === undefined) {

            if (this.optional) {
                return;
            }

            if (this.demands === 'mixed' ) {
                Errors.badArgValue('', this.terms, this, undefined);
            }
        }

        if (this.demands !== 'mixed' && !help.isType(value, this.demands)) {
            Errors.badArgValue('', this.terms, this, typeof value);
        }
    }

    toJSON() {
        return {
            name: this.name,
            demands: this.demands,
            optional: this.optional
        };
    }
}

module.exports = TermArg;
