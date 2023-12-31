var uuid = require('uuid');
sails = require('sails');

module.exports = {

    schema: true,

    attributes: {

        accountID: {
            type: 'string',
        },
        accountName: {
            type: 'string',
        },
        subscriptionID: {
            model: 'subscription'
        },
        status: {
            type: 'string',
            enum: ['active', 'blocked', 'expired']
        },
        usedVenuesCount: {
            type: 'string'
        },
        usedCarsCount: {
            type: 'string'
        },
        defaultVenue: {
            model: 'venue'
        },
        users: {
            collection: 'user',
            via: 'accountID'
        },
        venues: {
            collection: 'venue',
            via: 'account'
        },
        master: {
            collection: 'mastertransactional',
            via: 'accountID'
        },
        year: {
            collection: 'yearmonthtransactional',
            via: 'accountID'
        },
        day: {
            collection: 'totaltransactional',
            via: 'accountID'
        },
        subscriptionLog: {
            type: 'array'
        },
        barCodeAccess: {
            type: "boolean",
            defaultsTo: true
        },
        cameraAccess: {
            type: "boolean",
            defaultsTo: false
        },
        CEDAccess: {
            type: "boolean",
            defaultsTo: false
        },
        markImage: {
            type: "boolean",
            defaultsTo: true
        },
        fingerPrint: {
            type: "boolean",
            defaultsTo: false
        },
        pushNotification: {
            type: "boolean",
            defaultsTo: true
        },
        readPlateNumber: {
            type: "boolean",
            defaultsTo: false
        },
        autoGeneratedTicketNumber: {
            type: "boolean",
            defaultsTo: false
        },
        rate: {
            type: 'integer'
        },
        vibrate: {
            type: "boolean",
            defaultsTo: true
        },
        freeVenues:{
            type: "boolean",
            defaultsTo : true
        },
        region: {
            type: 'string'
        },
        timeZone: {
            type: 'string'
        },
        customerTypes: {
            type: 'array'
        },
        excelFormatSettings: {
            type: 'array'
        },
        chats: {
            collection: 'chat',
            via: 'accountID'
        },
        otherInfo: {
            type: 'json'
        },
        toJSON: function() {
            var obj = this.toObject();
            delete obj.excelFormatSettings;
            delete obj.subscriptionLog;
            return obj;
        }
    },
    beforeCreate: function(values, callback) {
        values.accountID = uuid.v4();
        callback();
    },
    afterUpdate: function (values, cb) {
        var _temp = values;
        delete _temp.excelFormatSettings;
        delete _temp.subscriptionLog;
        sails.sockets.broadcast('myroom','account', {
            message: 'socket event!', 
            data : _temp,
            id: _temp.id,
            verb : 'updated'
        });
        cb();
    }
};
