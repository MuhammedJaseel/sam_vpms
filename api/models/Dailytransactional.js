var uuid = require('uuid');
module.exports = {

    schema: true,

    attributes: {

        parkingID: {
            type: 'string'
        },
        plateNumber: {
            type: 'string',
            unique: true
        },
        parkingZone: {
            type: 'string',
        },
        color: {
            type: 'string',
        },
        brand: {
            type: 'string',
        },
        modelName: {
            type: 'string',
        },
        remarks: {
            type: 'string',
        },
        changeLog: {
            type: 'array',
        },
        snap: {
            type: 'string',
        },
        scratchesSnap: {
            type: 'array',
        },
        ownerMobileNumber: {
            type: 'string'
        },
        customerType: {
            type: 'string'
        },
        status: {
            type: 'string',
            enum: ['parked', 'requested', 'accept', 'reject', 'hold', 'ready']
        },
        accountID: {
            model: 'account'
        },
        venue: {
            model: 'venue'
        },
        employeeID: {
            model: 'user'
        },
        log: {
            type: 'array',
        },
        loginAs: {
            type: 'string',
        },
        carID: {
            type: 'string',
        },
        free : {
            type: 'boolean',
            defaultsTo: false
        },
        documents: {
            type: 'array'
        },
        description : {
            type : 'string'
        }, 
        cashierName : {
            type : 'string'
        }, 
        fees : {
            type : 'float',
            defaultsTo: 0
        },
        amountPaid : {
            type: 'boolean',
            defaultsTo: false
        },
        validatedBy : {
            type: 'json'
        },
        validatedAt: {
            type: 'date'
        },
        cashAcceptedBy : {
            type: 'json'
        },
        cashAcceptedAt: {
            type: 'date'
        },
        emirates : {
            type : 'string'
        },
        feeSplitUp : {
            type: 'json'
        },
        bill : {
            type: 'string'
        },
        otherInfo : {
            type: 'json'
        },
        device : {
            type: 'string'
        },
        paidAt: {
            type: 'date'
        }
    },
    // afterUpdate: function(dailytransactional, cb){

    //   Dailytransactional.publishUpdate(dailytransactional.venue, {});
    //   cb();

    // }
};

