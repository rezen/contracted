'use strict';

const Errors  = require('./errors');
const TermArg = require('./term-arg');

class TermAgreement {

    constructor(agreement, method) {
        const breakdown = method.split('->');

        this.fromClass  = agreement;
        this.method     = breakdown[0];
        this.returnType = breakdown[1] || undefined;
        this.args       = [];
    }

    /**
     * @return {Array}
     */
    getArgNames() {
        return this.args.map(arg => {
            return arg.name;
        });
    }

    /**
     * Pass in `arguments` from a method and test against
     * the agreement
     *
     * @param  {Arguments} args
     */
    validateArguments(args) {
        if (args.length !== this.getLength()) {
            /**
             * @todo 
             * how do we handle this since not all args are required?
             */
        }

        for (const i in this.args) {
            const arg  = this.args[i];
            arg.testValue(args[i]);
        }
    }

    /**
     * Does the return value meet expectations?
     *
     * @param  {Mixed} res
     */
    validateReturn(res) {

        if (!this.returnType) {
            return true;
        }

        const unexpectedReturn = (typeof res !== this.returnType);

        if (unexpectedReturn) {
            Errors.badReturn(this.fromClass, this, typeof res);
        }

        return true;
    }

    /**
     * @return {Integer}
     */
    getLength() {
        return this.args.length;
    }

    /**
     * Read the method requirements and map them to args
     *
     * @todo  rename?
     * @param  {Array|Object} requirements
     */
    readRequirements(requirements) {

        let args = requirements = requirements || [];
        const isConfig = (typeof requirements === 'object' && requirements.args);

        if (isConfig) {
            this.returnType = requirements.return;
            args = requirements.args || [];
        }

        if (!Array.isArray(args)) {
            args = [args];
        }

        this.args = args.map((arg, idx) => {
            return this.toArg(arg, idx);
        });
    }

    /**
     * Make testing much easier, can tweak prototype to swap class
     *
     * @param  {String}  arg
     * @param  {Integer} idx
     * @return {Object}
     */
    toArg(arg, idx) {
        return new TermArg(this, arg, idx);
    }
}

module.exports = TermAgreement;
