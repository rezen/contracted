'use strict';

const regx = {
    ARGS:  /([^\s,]+)/g,
    COMMENTS : /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
    FUNCNAME : /function (.{1,})\(/,
    HAS_CLASS : /^\s*class\s+/,
    CLASS_CONSTRUCTOR : /constructor\(([A-Za-z0-9,_$\s]+)?\)\s+?/,
    CLASS : /class\s+([A-Za-z_0-9]+)((\s+extends\s+([A-Za-z_0-9]+))?)\s?\{/g,
};

function methodArgs(method) {

    if (method === undefined) {
        return [];
    }

    if (typeof method !== 'string') {
        method = method.toString().replace(regx.COMMMENTS, '');
    }

    let idx = { 
        start: method.indexOf('(') + 1,
        end :  method.indexOf(')')
    };

    let result = method.slice(idx.start, idx.end).match(regx.ARGS);
    
    if (result === null) {
        return [];
    }

    return result;
}

function isType(value, expects) {
    const test = [typeof value];

    if (value.constructor && value.constructor.name) {
        test.push(value.constructor.name);
    }

    return (test.indexOf(expects) !== -1);
}

function argsToArray(args) {
    return Array.prototype.slice.call(args);
}

module.exports.argsToArray = argsToArray;
module.exports.isType     = isType;
module.exports.methodArgs = methodArgs;
