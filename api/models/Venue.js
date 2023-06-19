var uuid = require('uuid');
module.exports = {

  schema: true,

  attributes: {

    venueID: {
  		type: 'string'
  	}, 						
	  venueName: {
  		type: 'string',
    },
    ticketNumerUsed: {
  		type: 'integer',
    }, 
    billNumberUsed: {
  		type: 'integer',
  	}, 		
    account:{
      model: 'account'
    },				
    short : {
  		type: 'string',
  	}, 		
    parkingZones : {
  		type: 'array',
  	}, 		
    logo : {
  		type: 'string',
    },	
    amount : {
  		type: 'float',
      defaultsTo : 0
    },
    VAT : {
  		type: 'float',
    }, 
    VATType : {
      type:'string'
    },
    defaultValues: {
      type: 'json'
    },		
    automaticTokenGeneration: {
      type : 'boolean',
      defaultsTo : false
    },
    printToken: {
      type : 'boolean',
      defaultsTo : false
    },
    paymentMode: {
      type: 'json'
    },
    twoLevelValidation: {
      type : 'boolean',
      defaultsTo : false
    },
    cashierValidateOption: {
      type : 'boolean',
      defaultsTo : false
    },	
    settings:{
      type: 'json',
      defaultsTo: {
        keyandDashboardCopy : false,
        verifyOption : false,
        SMS : false,
        requestCar : true,
        parkingZoneAutomaticAllocaton : false,
        initialBillPrint :false
      }
    },
    users:{
      collection: 'user',
      via: 'venues'
    },
    master:{
      collection: 'mastertransactional',
      via: 'venue'
    },
    uniqueID:{
      type:'string'
    },
    chats: {
        collection: 'chat',
        via: 'groupID'
    },			
  },
  beforeCreate: function(values, callback) {
    values.venueID = uuid.v4();
    callback();
  },
  afterCreate: function(values, callback) {
    try {
      sails.sockets.broadcast('myroom','refreshDB', {
          message: 'socket event create!', 
          id: values.account,
          verb : 'venueDB'
      });
      callback();
    } catch(e){
      callback();
    }
  },
  afterUpdate: function(values, callback) {
    callback();
    // try {
    //   sails.sockets.broadcast('myroom','refreshDB', {
    //       message: 'socket event!', 
    //       id: values.account,
    //       verb : 'venueDB'
    //   });
    //   callback();
    // } catch(e){
    //   callback();
    // }
  }
};

