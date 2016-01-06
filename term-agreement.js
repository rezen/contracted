'use strict';

const Errors  = require('./errors');
const TermArg = require('./term-arg');

class TermAgreement {

    constructor(className, method, requirements) {
        const breakdown = method.split('->');
        
        this.fromClass    = className;
        this.method       = breakdown[0];
        this.returnType   = breakdown[1] || undefined;
        this.args = [];
    }

    getArgNames() {
        return this.args.map(arg => {
            return arg.name;
        });
    }

    validateArgs(args) {
        
        if (args.length !== this.getLength()) {
            // @todo how do we handle this?
        }

        for (const i in this.args) {

            const arg         = this.args[i];
            const shouldBe    = arg.demands;
            const argType     = (typeof args[i]);
            const argPosition = 1 + parseInt(i);
        
            if (argType !== shouldBe) {
                throw new Error('@' + this.method  + ' | bad_arg | expects type `' + shouldBe + '` for arg(' +  argPosition + ', '+arg.name + ')' );
            }
        }
    }

    validateReturn(res) {

        if (!this.returnType) {
            return true;
        }

        const unexpectedReturn = (typeof res !== this.returnType);

        if (unexpectedReturn) {
            Errors.badReturn(this.fromClass, this.method, this.returnType, typeof res);
        }

        return true;
    }

    getLength() {
        return this.args.length;
    }

    readRequirements(requirements) {

        let args = requirements = requirements || [];

        const isConfig = (typeof requirements === 'object' && requirements.args);

        if (isConfig) {
            this.returnType = requirements.return;
            args    = requirements.args || [];
        }

        if (!Array.isArray(args)) {
            args = [args];
        }

        this.args = args.map(arg => {
            return new TermArg(this, arg);
        });
    }
}

module.exports = TermAgreement;
