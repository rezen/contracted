'use strict';

var assert   = require('assert');
var Contract = require('./contract');

var contract = new Contract();

describe('Contract', function() {

    describe('#addTerm()', function() {

        contract.addTerm({
            name : 'StorageHandler',
            methods : {
                save: {
                    args : [
                        'name:string',
                        'handler:function'
                    ],
                   return : 'string'
                },
                get: {
                    args : [
                        'name:string', 'handler:function'
                    ]
                } 
            }
        });

        it('Term is added to contract with configured name', function () {
           assert.equal(typeof contract.terms.StorageHandler, 'object');
           assert.equal(contract.terms.StorageHandler.get instanceof Contract.TermRule, true);
        });

        it('Adding a verbose config vs. lite will end up with the same config', function () {
            var configs = {}
            
            configs.verbose = JSON.stringify(contract.terms.StorageHandler);

            delete contract.terms.StorageHandler;
            
            contract.addTerm('StorageHandler', {
                'save->string' : [
                    'name:string', 'handler:function'
                ],
                get  : [
                    'name:string', 'handler:function'
                ]
            });

            configs.lite = JSON.stringify(contract.terms.StorageHandler);

            assert.equal(configs.verbose, configs.lite);
        });
    });

    describe('#agreement()', function() {

        var evalutions = {
            missingMethod: {save: function(name, handler) {}},
            missingArgs1: {save: function(name) {}},
            missingArgs2: {save: function() {}},
            complete: {save: function(name, handler) {}, get: function(name, handler) {}},  
        };

        function Fullfill() {}

        Fullfill.prototype.get = function(name, handler) {};
        Fullfill.prototype.save =  function(name, handler) {};

        it('Throws an exception if a method is missing - missing @get', function() {
            assert.throws(function() {
                contract.agreement(evalutions.missingMethod, 'StorageHandler');

            }, function(err) {
                return (err.toString().indexOf('@get') !== -1);
            });
        });

        it('Throws an exception if a method is missing an arg - missing `handler` for @get', function() {
            assert.throws(function() {
                contract.agreement(evalutions.missingArgs1, 'StorageHandler');

            }, function(err) {
                return (err.toString().indexOf('missing_args') !== -1);
            });
        });

        it('Throws an exception if a method is missing an arg - missing `handler` for @get', function() {
            assert.throws(function() {
                contract.agreement(evalutions.missingArgs2, 'StorageHandler');

            }, function(err) {
                return (err.toString().indexOf('missing_args') !== -1);
            });
        });

        it('Passes with contract fullfillment', function() {
            assert.doesNotThrow(contract.agreement.bind(contract, Fullfill, 'StorageHandler'));
        });
    });

    describe('#contractify', function() {

        function LocalStorage() {
            this.driver = 'localstorage';
        }

        LocalStorage.prototype.save = function(name, handler) {
            return '' + name;
        };

        LocalStorage.prototype.get = function(name, handler) {
            return 'name';
        }

        LocalStorage.agreements = [
            'StorageHandler'
        ];

        contract.contractify(LocalStorage);

        var storage = new LocalStorage();

        it('Will tweak the prototype', function() {
            assert.equal(typeof LocalStorage.prototype._c_save, 'function');
        });

        it('Will validate the passed arguments', function() {
            assert.throws(storage.save.bind(storage, 9, function(){}));
            assert.doesNotThrow(storage.save.bind(storage, '9', function(){}));
        });

        it('Will validate the return value', function() {

            // Force prototype to return number
            LocalStorage.prototype._c_save = function(name, handler) {return 1;};

            assert.throws(storage.save.bind(storage, '9', function(){}), function(err) {
                return (err.toString().indexOf('number') !== -1);
            });

            LocalStorage.prototype._c_save = function(name, handler) {return '1';};

            assert.equal(storage.save('9', function(){}), '1');
        });
    });
});