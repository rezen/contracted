'use strict';

var reflect = {};

reflect.REGEX_HAS_CLASS = /^\s*class\s+/;

reflect.REGEX_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

reflect.REGEX_FUNCNAME = /function (.{1,})\(/;

var REG_CLASS_CONSTRUCTOR = /constructor\(([A-Za-z0-9,_$\s]+)\)\s+?/;

reflect.getClassName = function(object) {

    var Constructor;
    var funcString = object;
    var results    = [];

    if (typeof object === 'function') {
        Constructor = object;       
    } else if (typeof object !== 'string') {
        Constructor = (object).constructor;
    }

    if (Constructor) {

        // ES6+ has name
        if (Constructor.name){
            return Constructor.name;
        }

        funcString = Constructor.toString().trim();        
    }

    results = (reflect.REGEX_FUNCNAME).exec(funcString);

    if (!results) {
        results = reflect.isRealClass(funcString);

        if (results){
            return reflect.getRealClass(funcString);
        }
    }

    if (results.length < 1) {
        return '';
    }

    return results[1];
};

reflect.isRealClass = function(funcString) {
    return reflect.REGEX_HAS_CLASS.exec(funcString);
}

reflect.getRealClass = function(object) {

    var funcString = object;

    if (typeof object !== 'string') {
        funcString = (object).constructor.toString();
    }

    funcString = funcString.trim();

    var REGEX_CLASS = /class\s+([A-Za-z_0-9]+)((\s+extends\s+([A-Za-z_0-9]+))?)\s?\{/g;
    var results     = (REGEX_CLASS).exec(funcString);
    var parentClass = results[4];

    if (!results) {
        return '';
    }

    if (results.length < 1) {
        return '';
    }

    return results[1];
};

reflect.enumerateObject = function(object, callback) {

    for (let name of Object.getOwnPropertyNames(Object.getPrototypeOf(object))) {
        let value = object[name];
        callback(name, value);
    }
};

reflect.methods = function(object) {

    var methods = [];

    reflect.enumerateObject(object, function(name, value) {
        let method = value;

        // Supposedly you'd like to skip constructor
        if (!(method instanceof Function) || method === object.constructor) return;
        
        methods.push(name);
    });

    return methods;
};

reflect.removeComments = function(funcString) {

    return funcString.replace(reflect.REGEX_COMMENTS, '');
};

/**
 * Get the names of the parameters for a function. Angularjs uses the same 
 * sort of inspection to inject dependancies
 * 
 * http://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
 * @param  {Function} func 
 * @return {Array}
 */
reflect.getParamNames = function(func) {

    if (func === undefined) {
        return [];
    }

    var REG_ARGS = /([^\s,]+)/g;
    var funcString  = reflect.removeComments(func.toString());

    if (reflect.isRealClass(funcString)) {
        funcString = REG_CLASS_CONSTRUCTOR.exec(funcString)[0] + '{}';
    }

    var idx = { 
        start: funcString.indexOf('(') + 1,
        end :  funcString.indexOf(')')
    };

    var result = funcString.slice(idx.start, idx.end).match(REG_ARGS);
    
    if (result === null) {
        return [];
    }

    return result;
}

module.exports = reflect;
