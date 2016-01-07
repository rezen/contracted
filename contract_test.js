'use strict';

const assert   = require('assert');
const Contract = require('./contract');

describe('Contract', function() {
    const contract = new Contract();

    describe('#addTerms()', function() {

        contract.addTerms({
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

        it('Term is added to contract with configured name', function() {
           assert.equal(typeof contract.terms.StorageHandler, 'object');
           assert.equal(contract.terms.StorageHandler.get instanceof Contract.TermAgreement, true);
        });

        it('Adding a verbose config vs. lite will end up with the same config', function() {
            const configs = {}
            
            configs.verbose = JSON.stringify(contract.terms.StorageHandler);

            delete contract.terms.StorageHandler;
            
            contract.addTerms('StorageHandler', {
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

        const evalutions = {
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

        const storage = new LocalStorage();
        const saveAttr = Symbol.for('_fn_save');

        it('Will tweak the prototype', function() {

            assert.equal(typeof LocalStorage.prototype[saveAttr], 'function');
        });

        it('Will validate the passed arguments', function() {
            assert.throws(storage.save.bind(storage, 9, function(){}));
            assert.doesNotThrow(storage.save.bind(storage, '9', function(){}));
        });

        it('Will validate the return value', function() {

            // Force prototype to return number
            LocalStorage.prototype[saveAttr] = function(name, handler) {return 1;};

            assert.throws(storage.save.bind(storage, '9', function(){}), function(err) {
                return (err.toString().indexOf('number') !== -1);
            });

            LocalStorage.prototype[saveAttr] = function(name, handler) {return '1';};

            assert.equal(storage.save('9', function(){}), '1');
        });

    });
});