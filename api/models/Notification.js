/**
 * Notification.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    count : {
      type : 'number',
      defaultsTo : 0
    },
    userID : {
      model  : 'user'
    },
    accountID : {
      model : 'account'
    }
  }
};

