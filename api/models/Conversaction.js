/**
 * Conversaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    type: {
      type: 'string'
    },
    groupID: {
      model: 'venue'
    },
    accountID: {
      model: 'account'
    },
    senderID: {
      model: 'user'
    },
    receiverID: {
      model: 'user'
    },
    read : {
      type : 'boolean'
    },
    message: {
      type: 'string'
    },
    chats: {
        collection: 'chat',
        via: 'thread'
    },
  }
};

