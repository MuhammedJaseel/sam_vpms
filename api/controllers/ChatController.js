var _ = require('lodash');

module.exports = {
    create: function(req, res){
        Chat.create(req.allParams()).exec(function(error, Obj) {
            if (error)  return res.send({ error : error});
            res.send(Obj);
        });
    },
    getChatHistory: function(req, res){
        Chat.find().where( { "or" : [{ "accountID": req.param('accountID')},  {"groupID": req.param('venueID')}, {senderID : req.param('senderID')}, { receiverID : req.param('receiverID')} ] }).sort('createdAt DESC')
        .populate( 'accountID' , {select: ['id','accountName']})
        .populate( 'groupID' , {select: ['id','venueName', 'logo']})
        .populate( 'senderID' , {select: ['id','userName', 'profileImage']})
        .populate( 'receiverID' ,{ select: ['id','userName', 'profileImage']})
        .exec(function found(error, data) { 
            if (error)  return res.send([]);
            return res.send(data);
        });
    },
    getConversactionHistory: function(req, res){
        var query = {};
        if( req.param('venueID'))
            query = { "accountID": req.param('accountID'), "or" : [ { "groupID": req.param('venueID')},{ senderID : req.param('userID')}, { receiverID : req.param('userID')}  ] }
        else 
            query = { "accountID": req.param('accountID') }

        Conversaction.find().where(query).sort('updatedAt DESC')
        .populate( 'accountID' , {select: ['id','accountName']})
        .populate( 'groupID' , {select: ['id','venueName', 'logo']})
        .populate( 'senderID' , {select: ['id','userName', 'profileImage', 'status']})
        .populate( 'receiverID' ,{ select: ['id','userName', 'profileImage', 'status']})
        .limit(12)
        .exec(function found(error, data) { 
            if (error)  return res.send([]);
            return res.send(_.filter(data, (o)=>{
                if(o.type =='individual'){
                    if(o.receiverID.id  == req.param('userID')){
                        o.display  = o.senderID; return o;
                    } else {
                        o.display  = o.receiverID;return o;
                    } 
                } else {
                    o.display  = o.groupID;
                    return o;
                }                     
            }));
        });
    },
    // getChatHistorywithLazyload: function(req, res){
    //     Chat.native(function(err, collection) {
    //         collection.distinct('thread', function(err, data) {
    //             return res.send(data);
    //         });
    //     });
    // },
    getContactsanddGroups: function(req, res){
        try{
            User.find({}, {
                role : 1,
                venues : 1
            }).where({ 'id'  : req.param('userID')}).populate('venues', { select : ['id', 'logo', 'venueName']}).exec(function foundUsers(err, subsidiaryUsers) {
                if(err) return res.send({users : users, group : []});
                if(subsidiaryUsers && subsidiaryUsers.length > 0)
                    subsidiaryUsers = subsidiaryUsers[0];

                if(subsidiaryUsers.role == 'accountadmin'){
                    User.find({},{
                        fields : {
                            id: 1,
                            userName: 1,
                            profileImage : 1,
                            status : 1
                        }
                    }).where({ 'accountID'  : req.param('accountID') }).exec(function foundUsers(err, users) {
                        if(err) return res.send({users : [], group : []});
                        if(users){
                            Venue.find({},{
                                fields : {
                                    id : 1,
                                    venueName: 1,
                                    logo : 1
                                }
                            }).where({ 'account' : req.param('accountID')}).exec((err, venues)=>{
                                if(err) return res.send({users : users, group : []});
                                if(venues)
                                    return res.send({users : users, group : venues});
                            });
                        } else 
                            return res.send({users : [], group : []});
                    });                   
                } else {
                    if(subsidiaryUsers){
                        Venue.find().where({ id  : subsidiaryUsers.venues[0].id}).populate('users', { select : ['id', 'userName', 'profileImage']}).exec(function(err, venues) {
                            if(err) return res.send({users : [], group : []});
                            if(venues && venues.length > 0) {
                                User.find({},{
                                    fields : {
                                        id: 1,
                                        userName: 1,
                                        profileImage : 1,
                                        status : 1
                                    }
                                }).where({ 'accountID'  : req.param('accountID') , role : 'accountadmin' }).exec(function foundUsers(err, accountadminUsers) {
                                    if(err) return res.send({users : [], group : []});
                                    if(accountadminUsers){
                                        return res.send({users : _.merge(venues[0].users , accountadminUsers), group : subsidiaryUsers.venues});
                                    } else 
                                        return res.send({users : [], group : []});
                                });      
                            } else 
                                return res.send({users : [], group : subsidiaryUsers.venues});
                        });                
                    }
                    else 
                        return res.send({users : [], group : []});
                } 
            });
            
        } catch(e){
            return res.send({users : [], group : []});
        }
    },
    findUserandGroupConversactionID: function(req, res){
        var query = {};
        if(req.param('venueID')){
            query = { "accountID": req.param('accountID'), "groupID": req.param('venueID')}
            Conversaction.find().where(query).sort('updatedAt DESC')
            .populate( 'accountID' , {select: ['id','accountName']})
            .populate( 'groupID' , {select: ['id','venueName', 'logo']})
            .populate( 'senderID' , {select: ['id','userName', 'profileImage']})
            .populate( 'receiverID' ,{ select: ['id','userName', 'profileImage']})
            .populate( 'chats' ,{ limit: 12 })
            .limit(1)
            .exec(function found(error, data) { 
                if (error)  return res.send([]);
                return res.send(data);
            });
        }
        else {
            Chat.find().where({
                "accountID": req.param('accountID'),
                senderID: req.param('senderID'),
                receiverID: req.param('receiverID')
              }).exec(function (error, Obj) {
                Chat.find().where({
                "accountID": req.param('accountID'),
                  receiverID: req.param('senderID'),
                  senderID: req.param('receiverID')
                }).exec(function (error, Obj2) {
                  if ((Obj2 && Obj) && (Obj.length > 0 || Obj2.length > 0)) {
                    if (Obj.length > 0)
                        findConversaction(Obj[0].thread);
                    else if (Obj2.length > 0)
                        findConversaction(Obj2[0].thread);
                    else
                        return res.send([]);           
                  } else 
                  return res.send([]);
                });
              });

              function findConversaction(thread){
                Conversaction.find().where({ id : thread }).sort('updatedAt DESC')
                .populate( 'accountID' , {select: ['id','accountName']})
                .populate( 'groupID' , {select: ['id','venueName', 'logo']})
                .populate( 'senderID' , {select: ['id','userName', 'profileImage', 'status']})
                .populate( 'receiverID' ,{ select: ['id','userName', 'profileImage', 'status']})
                .populate( 'chats' ,{ limit: 12 })
                .limit(1)
                .exec(function found(error, data) { 
                    if (error)  return res.send([]);
                    return res.send(data);
                });
              } 
           
        }
    },
    getConverasctionChatList : function(req, res){
        Conversaction.find().where({ id : req.param('id')}).sort('updatedAt DESC')
        .populate( 'accountID' , {select: ['id','accountName']})
        .populate( 'groupID' , {select: ['id','venueName', 'logo']})
        .populate( 'senderID' , {select: ['id','userName', 'profileImage', 'status']})
        .populate( 'receiverID' ,{ select: ['id','userName', 'profileImage', 'status']})
        .populate('chats', { limit : 12, sort : 'createdAt DESC' })
        .limit(1)
        .exec(function found(error, data) { 
            if (error)  return res.send([]);
            return res.send(_.filter(data, (o)=>{
                if(o.type == 'individual'){
                    if(o.receiverID.id  == req.param('userID')){
                        o.display  = o.senderID; 
                        return o;
                    } else {
                        o.display  = o.receiverID;
                        return o;
                    } 
                } else {
                    o.display  = o.groupID;
                    return o;
                }                     
            }));
        });
    },
    conversactionSeenByReceiver : function(req, res){
        Conversaction.findOne({id : req.param('thread')}).exec(function (err, converse) {
            var __temp = converse.seen ? converse.seen : [];
            __temp.push(req.param('userID'));
            Conversaction.update({}, {seen : __temp})
                .exec(function(err, updated) {
                    return res.send(updated);
                });
        });
    }
};

