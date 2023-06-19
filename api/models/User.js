var uuid = require('uuid');
module.exports = {

    schema: true,

    attributes: {

        fullName: {
            type: 'string',
        },
        userName: {
            type: 'string',
        },
        password: {
            type: 'string',
        },
        employeeID: {
            type: 'string',
        },
        joiningDate: {
            type: 'string',
        },
        documents: {
            type: 'array',
        },
        profileImage: {
            type: 'string',
        },
        accountID: {
            model: 'account'
        },
        email: {
            type: 'string',
            email: true,
            unique: true
                // required: true,
        },
        rate : {
            type: 'string',
        },
        mobile: {
            type: 'string',
            unique: true
        },
        role: {
            type: 'string',
        },
        validationType: {
            type: 'string'
        },
        sendReport: {
            type: 'boolean',
            defaultsTo: false
        },
        outletName: {
            type: 'string'
        },
        licenseNumber: {
            type: 'string',
        },
        revalidate : {
            type: 'boolean',
            defaultsTo: false
        },
        venues: {
            collection: 'venue',
            via: 'users'
        },
        companyName: {
            type: 'string',
        },
        extraOptions:{
            type: 'json'
        },
        master: {
            collection: 'mastertransactional',
            via: 'employeeID'
        },
        daily: {
            collection: 'dailytransactional',
            via: 'employeeID'
        },
        cars: {
            collection: 'car',
            via: 'employeeID'
        },
        status: {
            type : 'string'
        },
        toJSON: function() {
            var obj = this.toObject();
            delete obj.password;
            return obj;
        }
    },
    beforeCreate: function(values, callback) {
        callback();
    },
    // afterCreate: function(values, callback) {
    //     try {
    //         sails.sockets.broadcast('myroom','refreshDB', {
    //             message: 'socket event create!', 
    //             id: values.accountID,
    //             verb : 'userDB'
    //         });
    //         callback();
    //     } catch(e){
    //         callback();
    //   }
    // },
    afterUpdate: function(values, callback) {
        try {
            sails.sockets.broadcast('myroom','refreshDB', {
                message: 'socket event update!',
                id: values.accountID,
                verb : 'userDB',
                obj : values
            });
            callback();
        } catch(e){
            callback();
        }
    }
};
