var uuid = require('uuid');
var _ = require('lodash');

module.exports = {

  attributes: {
    type: {
      type: 'string',
      required: true
    },
    read: {
      type: 'boolean',
      defaultsTo: false
    },
    message: {
      type: 'string'
    },
    files: {
      type: 'array'
    },
    groupID: {
      model: 'venue'
    },
    accountID: {
      model: 'account'
    },
    senderID: {
      model: 'user',
      required: true
    },
    receiverID: {
      model: 'user'
    },
    thread: {
      model: 'conversaction'
    },
    seen:{
      type: 'array'
    }
  },
  afterCreate: function(values, cb){
    console.log("after creation triggered..........." );
    Conversaction.find().where({ id : values.thread }).sort('updatedAt DESC')
        .populate( 'accountID' , {select: ['id','accountName']})
        .populate( 'groupID' , {select: ['id','venueName', 'logo']})
        .populate( 'senderID' , {select: ['id','userName', 'profileImage', 'status']})
        .populate( 'receiverID' ,{ select: ['id','userName', 'profileImage', 'status']})
        .populate('chats', { limit : 12 })
        .limit(1)
        .exec(function found(error, data) { 
            if (error)  return cb();
            var associatedData = data[0];
            if(values.type != 'group'){
              sails.sockets.broadcast('myroom',values.senderID, {
                  message: 'socket event!', 
                  data : associatedData,
                  id: values.accountID,
                  verb : 'chat'
              });
            }
            
            if(values.receiverID){
              sails.sockets.broadcast('myroom',values.receiverID, {
                  message: 'socket event!', 
                  data : associatedData,
                  id: values.accountID,
                  verb : 'chat'
              });
            }
            
            if(values.groupID){
              sails.sockets.broadcast('myroom',values.groupID, {
                  message: 'socket event!', 
                  data : associatedData,
                  id: values.accountID,
                  verb : 'chat'
              });
              sails.sockets.broadcast('myroom',values.accountID, {
                  message: 'socket event!', 
                  data : associatedData,
                  id: values.accountID,
                  verb : 'chat'
              });
            }
            return cb();
        });
  },
  beforeCreate: function (values, cb) {
    try{
      if (values.type != 'group') {
        Chat.find().where({
          senderID: values.senderID,
          receiverID: values.receiverID
        }).exec(function (error, Obj) {
          Chat.find().where({
            receiverID: values.senderID,
            senderID: values.receiverID
          }).exec(function (error, Obj2) {
            if ((Obj2 && Obj) && (Obj.length > 0 || Obj2.length > 0)) {
              if (Obj.length > 0){
                Conversaction.update(Obj[0].thread, { message: values.message, senderID: values.senderID,
                  receiverID: values.receiverID},  function userUpdated(err,obj222){
                    console.log(err);
                    values.thread = Obj[0].thread;                    
                    return cb();
                  });
              }
              else if (Obj2.length > 0){
                Conversaction.update(Obj2[0].thread, { message: values.message, senderID: values.senderID,
                  receiverID: values.receiverID},  function userUpdated(err,obj){
                    console.log(err);
                    values.thread = Obj2[0].thread;
                    return cb();
                  });
              }
              else{
                Conversaction.create(values).exec(function(error, convs) {
                  values.thread = convs.id;
                  return cb();
                });              
              }              
            } else {
              Conversaction.create(values).exec(function(error, convs) {
                values.thread = convs.id;
                return cb();
              })
            }
          });
        });
      } else {
        Conversaction.findOne({ "groupID" : values.groupID}).exec(function(error, convs) {
          if(error){
            Conversaction.create(values).exec(function(error, convs) {
              values.thread = convs.id;
              return cb();
            });
          } else if(convs){
            Conversaction.update(convs.id, { message: values.message, senderID: values.senderID,
            receiverID: values.receiverID, type : 'group'},  function userUpdated(err,obj){
              console.log(err);
              values.thread = convs.id;
              return cb();
            });
          } else {  
            Conversaction.create(values).exec(function(error, convs) {
              values.thread = convs.id;
              return cb();
            });
          } 
        });
      }
    }catch(e){
      return cb();
    }
  }
};
