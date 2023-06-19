var uuid = require('uuid');
module.exports = {

schema: true,
	
attributes: {
		
	subscriptionName: {
  		type: 'string',
  	}, 				
	duration: {
  		type: 'integer',
  	}, 						
	price: {
  		type: 'float',
  	}, 							
	numberOfCars: {
  		type: 'integer',
  	}, 					
	numberOfVenues: {
  		type: 'integer',
  	},
  accounts:{
      collection: 'account',
      via: 'subscriptionID'
    }, 					
  },
	  beforeCreate: function(values, callback) {
	    //values.subscriptionID = uuid.v4();
	    callback();
	  }
};

