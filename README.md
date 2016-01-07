## contract-js
There are many situations where it is helpful to have explicit expectations
built into a class/library. Any sort of library that can interact with multiple drivers
(e.g. Dropbox, S3, Drive, etc.) can benefit for explicitly stating the expectations of
implemenations. In Java & PHP for example, they have builtin `interfaces` which are used 
to express expectations. JS lacks that and this tries to fill that hole!

One specific use case for contracts is `cacheman`
There are multiple drivers (redis, mongodb, memory) for caching and the core lib 
expects the drivers to implement certain methods. The author implements his own 
checking of the drivers to ensure the expected methods exists.

###### Example
```js
'use strict';

const Contract = require('contract');
const Integration = require('./integration');

const contract = new Contract();

// What are the terms we expect to be fullfilled?
contract.addTerms('StorageHandler', {
   'save->string' : ['name:string', 'callback?'],
   'get->Promise'  : 'name:string' // can also be ['name:string']
});

// ...
class Storage {
    constructor(contract) {
        this.contract = contract;
        this.drivers = {};
        this.driver = null;
    }

    use(Driver) {
        // Does the integration meet our contract expectations?
        this.contract.agreement(Integration, 'StorageHandler');
        this.drivers[Driver.name] = new Driver(this);
    }

    save(name, callback) {
        return this.driver.save(name, callback);
    }

    // ... get, etc
}

````