var uuid = require('uuid');
module.exports = {

    schema: true,

    attributes: {

        parkingID: {
            type: 'string',
        },
        plateNumber: {
            type: 'string'
        },
        parkingZone: {
            type: 'string',
        },
        color: {
            type: 'string',
        },
        status: {
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
        ownerMobileNumber: {
            type: 'string'
        },
        customerType: {
            type: 'string'
        },
        snap: {
            type: 'string',
        },
        scratchesSnap: {
            type: 'array',
        },
        venue: {
            model: 'venue'
        },
        employeeID: {
            model: 'user'
        },
        accountID: {
            model: 'account'
        },
        transactionID: {
            model: 'dailytransactional'
        },
        arrivalTimeStamp: {
            type: 'date'
        },
        departureTimeStamp: {
            type: 'date'
        },
        log: {
            type: 'array',
        },
        uniqueID: {
            type: 'string'
        },
        loginAs: {
            type: 'string'
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
        revalidatedBy : {
            type: 'json'
        },
        revalidatedAt: {
            type: 'date'
        },
        newfeeSplitUp : {
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
    beforeCreate: function(values, callback) {
        //      values.transactionID = uuid.v4();
        callback();
    }
};
