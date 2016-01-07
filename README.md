## contracted
There are many situations where explicit expectations help stability and make integrations easier.
Any sort of library that can interact with multiple drivers
(e.g. Dropbox, S3, Drive, etc.) can benefit from explicitly stating the expectations of
implemenations. In Java & PHP for example, they have builtin `interfaces` which are used 
to express expectations. JS core lacks the notiion of `interfaces` - this lib tries to fill that hole!

One specific use case for contracts is the npm lib, `cacheman`.
There are multiple drivers (redis, mongodb, memory) for caching and the core lib 
expects the drivers to implement specific methods. The author implements his own 
checking of the drivers to ensure the expected methods exists.

###### Example
```js
'use strict';

const Contracted = require('contracted');
const Integration = require('./integration');

const contract = new Contracted();

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