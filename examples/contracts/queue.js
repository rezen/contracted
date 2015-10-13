'use strict';

module.exports = {
    name : 'Queue',
    methods : {
        setup   : ['config'],
        connect : ['callback'],
        push    : ['job', 'data', 'options', 'callback'],
        bulk    : ['jobs', 'data'],
    }
};