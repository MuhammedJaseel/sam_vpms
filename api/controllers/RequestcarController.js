var analysisService = require('../services/analysisService.js');
var moment = require('moment-timezone');
sails = require('sails');
const admin = require('firebase-admin');
const axios = require('axios').default;

const serviceAccount = require('../../vpms-54025-firebase-adminsdk-qpcpc-d996ab7376.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// var async = require('asyncawait/async');
// var await = require('asyncawait/await');
function to(promise) {
    return promise.then(data => {
       return [null, data];
    })
    .catch(err => [err]);
}
module.exports = {
    hello:function(req,res){
        sails.sockets.join(req.socket,'myroom');
        res.json({message:'youve subscribed to a room'});
    },
    testPPP : function(req,res){
        sails.sockets.broadcast('myroom','dailytransactional',{message:'socket event!'});
        res.send();
    },
    testAsync: function(req, res){
        // async(() => {
        //   let params = this._parseParams(req);
        // //   let userName = await(User.findOne(params.id)).userName
        //   [err, user] = await (to(User.findOne(params.id)));
        //   if(!user) return res.send('err');;
        //   return res.send("Hi there" + user.userName + "!");
        // })();
    },
    JoinSocketforRoom: function(req,res){
        sails.sockets.join(req.socket, req.param('room'));
        res.json({message:'youve subscribed ' + req.socket + ' to a ' + req.param('room')});
    },
    sendSocketforRoom: function(req,res){
        sails.sockets.broadcast(req.param('room'), req.param('event'), {message:'socket event!'});
        res.json({message:' Event ' + req.param('event') + ' sent to a ' + req.param('room')});
    },
    leaveRoom : function(req, res){
        sails.sockets.leave( req.socket, req.param('room') );
        res.json({message:  req.socket + ' Leaved from room ' + req.param('room')});
    },
    emitSocket: function(req, res){
        sails.sockets.emit( req.param('socketIds'), req.param('event'), {message:'socket event!'});
        res.json({message: req.param('socketIds') + ' emitted from room ' + req.param('room')});
    },
    checkChatInit: function(req, res){
        Chat.create(req.allParams()).then(function(carObj, err) {
            res.send([carObj, err]);
        });
    },
    listRoom: function(req, res){
        console.log("--------------- Room ----------------");
        console.log( sails.sockets.rooms());
        console.log("--------------- subscribers ----------------");
        console.log( sails.sockets.subscribers());
        // console.log("--------------- clients ----------------");
        // console.log( sails.sockets.clients());
        res.json({});
    },
    _parseParams: function(req){
        let params = req.allParams();
        // Do some parsing here...
        return params;
    },
    // yyyyyyyyyyy : function (promise) {
    //     return promise.then(data => {
    //        return [null, data];
    //     })
    //     .catch(err => [err]);
    //  },
    requestCarFromAPICall: function(req, res, next) {
        // console.log("--------------------------------------------------------------------------");
        // console.log("Requested Car calle∫d");
        // console.log("--------------------------------------------------------------------------");
        if (req.method === 'POST') {
            var log = [];
            var updatedLog = [];
            var newdate = new Date();

            // var originalPlateNumber=req.param('plateNumber');
            // var updatedPlateNumber=originalPlateNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

            Dailytransactional.findOneByParkingID(req.param('parkingID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                // if(req.param('plateNumber')!=car.plateNumber){
                //  res.send({notMatching : 'notMatching'});
                //  return;
                // }
                // if(req.param('parkingID')!=car.parkingID){
                //  res.send({notMatching : 'notMatching'});
                //  return;
                // }
                if(car.status == "parked" && car.free == false){
                    if(car.venue && car.venue.settings && car.venue.settings.verifyOption){ // and check transaction is free and its verify / oscar transaction car
                        console.log("Car requested falied. Oscar paid service.");
                        return res.send({
                            car: {
                                status: "requested",
                                message: "You can't request a car because it's paid parking. Kindly check the valet desk."
                            }
                        });
                    } else 
                        otherwiseCall()
                } else 
                    otherwiseCall();

                function otherwiseCall(){
                    if (car.status == "parked") { 
                        if (car.log != undefined) {
                            for (var i = 0; i < car.log.length; i++) {
                                log.push(car.log[i]);
                            }
                        }
    
                        console.log(JSON.stringify(car) + "Actual Status" + car.status);
    
                        updatedLog = {
                            'activity': 'requested',
                            'by': req.param('mobile'),
                            'at': newdate,
                            'userProfile': req.param('profileImage')
                        };
    
    
                        // console.log( req.param('dateTime') + "-----------"+ new Date(req.param('dateTime')))
    
                        if(req.param('specialRequest')){
                            updatedLog['specialRequest'] = {
                                timeZone : "Asia/Kolkata",
                                // option : req.param('option'),
                                // remarks : req.param('remarks'),
                                dateTime : new Date(parseInt(req.param('dateTime'))),
                                accepted : false,
                                by : {}
                            }
                        }
    
                        console.log('request car server==>==>==>' + JSON.stringify(updatedLog));
                        log.push(updatedLog);
    
                        var ownerDetails = {
                            ownerMobileNumber: req.param('mobile'),
                            status: 'requested',
                            log: log
                        };
    
                        Dailytransactional.update(car.id, ownerDetails, function venueUpdated(err, car) {
                            console.log("-Updated-");   
                            Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                                if (err) {
                                    venueDetails = {};
                                }
                                sails.sockets.broadcast('myroom','dailytransactional',{
                                    message: 'socket event!', 
                                    data : {
                                            id: car[0].id,
                                            parkingID: car[0].parkingID,
                                            plateNumber: car[0].plateNumber,
                                            parkingZone: car[0].parkingZone,
                                            color: car[0].color,
                                            brand: car[0].brand,
                                            snap: car[0].snap,
                                            ownerMobileNumber: car[0].ownerMobileNumber,
                                            status: car[0].status,
                                            accountID: car[0].accountID,
                                            venue: venueDetails,
                                            log: car[0].log,
                                            changeLog: car[0].changeLog,
                                            remarks: car[0].remarks,
                                            modelName: car[0].modelName,
                                            createdAt: new Date(),
                                            customerType :  car[0].customerType,
                                            carID : car[0].carID,
                                            free :  car[0].free,
                                            documents :  car[0].documents,
                                            description :  car[0].description,
                                            updatedAt : car[0].updatedAt,
                                            fees : car[0].fees, 
                                            validatedBy : car[0].validatedBy,
                                            validatedAt : car[0].validatedAt, 
                                            cashAcceptedBy : car[0].cashAcceptedBy, 
                                            cashAcceptedAt : car[0].cashAcceptedAt,
                                            amountPaid :car[0].amountPaid
                                        },
                                        id: car[0].id,
                                        verb : 'updated'
                                });
                                console.log("Venue Detail" + JSON.stringify(venueDetails));
                                Dailytransactional.publishUpdate(car[0].id, {
                                    id: car[0].id,
                                    parkingID: car[0].parkingID,
                                    plateNumber: car[0].plateNumber,
                                    parkingZone: car[0].parkingZone,
                                    color: car[0].color,
                                    brand: car[0].brand,
                                    snap: car[0].snap,
                                    ownerMobileNumber: car[0].ownerMobileNumber,
                                    status: car[0].status,
                                    accountID: car[0].accountID,
                                    venue: venueDetails,
                                    log: car[0].log,
                                    changeLog: car[0].changeLog,
                                    remarks: car[0].remarks,
                                    modelName: car[0].modelName,
                                    createdAt: new Date(),
                                    customerType :  car[0].customerType,
                                    carID : car[0].carID,
                                    free :  car[0].free,
                                    documents :  car[0].documents,
                                    description :  car[0].description,
                                    updatedAt : car[0].updatedAt,
                                    fees : car[0].fees, 
                                    validatedBy : car[0].validatedBy,
                                    validatedAt : car[0].validatedAt, 
                                    cashAcceptedBy : car[0].cashAcceptedBy, 
                                    cashAcceptedAt : car[0].cashAcceptedAt
    
                                });
    
                            });
                            //publishcreate
                            Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                                if(!err){
                                    Mastertransactional.update(masterData[0].id, ownerDetails, function venueUpdated(err, car) {
                                        console.log("-Master-Updated-");
                                    });
                                }
                            });
                        });
                        return res.send({ car: car });
                    } else if (car.status == "requested") {
                        console.log("Car requested already. It will be ready soon. Please try after some time for the status!");
                        return res.send({
                            car: {
                                status: "requested",
                                message: "Car requested already. It will be ready soon. Please try after some time for the status!"
                            }
                        });
                    } else if (car.status == "accept") {
                        console.log("Car request processed. It is ready in portico!!!");
                        return res.send({
                            car: {
                                status: "accept",
                                message: "Car request processed. It is ready in portico!!!"
                            }
                        });
    
                    }
                }
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to requested car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }

    },
    requestCarFromAPICallET: function(req, res, next) {
        // console.log("--------------------------------------------------------------------------");
        // console.log("Requested Car calle∫d");
        // console.log("--------------------------------------------------------------------------");
        if (req.method === 'POST') {
            var log = [];
            var updatedLog = [];
            var newdate = new Date();

            // var originalPlateNumber=req.param('plateNumber');
            // var updatedPlateNumber=originalPlateNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

            Dailytransactional.findOneByParkingID(req.param('parkingID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                // if(req.param('plateNumber')!=car.plateNumber){
                //  res.send({notMatching : 'notMatching'});
                //  return;
                // }
                // if(req.param('parkingID')!=car.parkingID){
                //  res.send({notMatching : 'notMatching'});
                //  return;
                // }

              

                if(car.status == "parked"){
                    otherwiseCall();
                } else 
                    otherwiseCall();

                function otherwiseCall(){
                    if (car.status == "parked") { 
                        if (car.log != undefined) {
                            for (var i = 0; i < car.log.length; i++) {
                                log.push(car.log[i]);
                            }
                        }
    
                        console.log(JSON.stringify(car) + "Actual Status" + car.status);
    
                        updatedLog = {
                            'activity': 'requested',
                            'by': req.param('mobile'),
                            'at': newdate,
                            'userProfile': req.param('profileImage')
                        };
    
                        if(car.status == "parked" && car.free == false){
                            if(car.venue && car.venue.settings && car.venue.settings.verifyOption){ // and check transaction is free and its verify / oscar transaction car
                                updatedLog = {
                                    'activity': 'requested',
                                    'by': req.param('mobile'),
                                    'requestedBy':'Guest',
                                    'at': newdate,
                                    'userProfile': req.param('profileImage')
                                };
                            } 
                        }
    
                        // console.log( req.param('dateTime') + "-----------"+ new Date(req.param('dateTime')))
    
                        if(req.param('specialRequest')){
                            updatedLog['specialRequest'] = {
                                timeZone : "Asia/Kolkata",
                                // option : req.param('option'),
                                // remarks : req.param('remarks'),
                                dateTime : new Date(parseInt(req.param('dateTime'))),
                                accepted : false,
                                by : {}
                            }
                        }
    
                        console.log('request car server==>==>==>' + JSON.stringify(updatedLog));
                        log.push(updatedLog);
    
                        var ownerDetails = {
                            ownerMobileNumber: req.param('mobile'),
                            status: 'requested',
                            log: log
                        };
    
                        Dailytransactional.update(car.id, ownerDetails, function venueUpdated(err, car) {
                            console.log("-Updated-");   
                            Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                                if (err) {
                                    venueDetails = {};
                                }
                                sails.sockets.broadcast('myroom','dailytransactional',{
                                    message: 'socket event!', 
                                    data : {
                                            id: car[0].id,
                                            parkingID: car[0].parkingID,
                                            plateNumber: car[0].plateNumber,
                                            parkingZone: car[0].parkingZone,
                                            color: car[0].color,
                                            brand: car[0].brand,
                                            snap: car[0].snap,
                                            ownerMobileNumber: car[0].ownerMobileNumber,
                                            status: car[0].status,
                                            accountID: car[0].accountID,
                                            venue: venueDetails,
                                            log: car[0].log,
                                            changeLog: car[0].changeLog,
                                            remarks: car[0].remarks,
                                            modelName: car[0].modelName,
                                            createdAt: new Date(),
                                            customerType :  car[0].customerType,
                                            carID : car[0].carID,
                                            free :  car[0].free,
                                            documents :  car[0].documents,
                                            description :  car[0].description,
                                            updatedAt : car[0].updatedAt,
                                            fees : car[0].fees, 
                                            validatedBy : car[0].validatedBy,
                                            validatedAt : car[0].validatedAt, 
                                            cashAcceptedBy : car[0].cashAcceptedBy, 
                                            cashAcceptedAt : car[0].cashAcceptedAt,
                                            amountPaid :car[0].amountPaid
                                        },
                                        id: car[0].id,
                                        verb : 'updated'
                                });
                                console.log("Venue Detail" + JSON.stringify(venueDetails));
                                Dailytransactional.publishUpdate(car[0].id, {
                                    id: car[0].id,
                                    parkingID: car[0].parkingID,
                                    plateNumber: car[0].plateNumber,
                                    parkingZone: car[0].parkingZone,
                                    color: car[0].color,
                                    brand: car[0].brand,
                                    snap: car[0].snap,
                                    ownerMobileNumber: car[0].ownerMobileNumber,
                                    status: car[0].status,
                                    accountID: car[0].accountID,
                                    venue: venueDetails,
                                    log: car[0].log,
                                    changeLog: car[0].changeLog,
                                    remarks: car[0].remarks,
                                    modelName: car[0].modelName,
                                    createdAt: new Date(),
                                    customerType :  car[0].customerType,
                                    carID : car[0].carID,
                                    free :  car[0].free,
                                    documents :  car[0].documents,
                                    description :  car[0].description,
                                    updatedAt : car[0].updatedAt,
                                    fees : car[0].fees, 
                                    validatedBy : car[0].validatedBy,
                                    validatedAt : car[0].validatedAt, 
                                    cashAcceptedBy : car[0].cashAcceptedBy, 
                                    cashAcceptedAt : car[0].cashAcceptedAt
    
                                });
    
                            });
                            //publishcreate
                            Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                                if(!err){
                                    Mastertransactional.update(masterData[0].id, ownerDetails, function venueUpdated(err, car) {
                                        console.log("-Master-Updated-");
                                    });
                                }
                            });
                        });
                        return res.send({ car: car });
                    } else if (car.status == "requested") {
                        console.log("Car requested already. It will be ready soon. Please try after some time for the status!");
                        return res.send({
                            car: {
                                status: "requested",
                                message: "Car requested already. It will be ready soon. Please try after some time for the status!"
                            }
                        });
                    } else if (car.status == "accept") {
                        console.log("Car request processed. It is ready in portico!!!");
                        return res.send({
                            car: {
                                status: "accept",
                                message: "Car request processed. It is ready in portico!!!"
                            }
                        });
    
                    }
                }
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to requested car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }

    },
    requestCarSpeciallyforOscar: function(req, res, next) {
        if (req.method === 'POST') {
            var log = [];
            var updatedLog = [];
            var newdate = new Date();

            Dailytransactional.findOneByParkingID(req.param('parkingID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                if(req.param('plateNumber').toUpperCase().replace(/\s/g,'') !== car.plateNumber.toUpperCase().replace(/\s/g,'')){
                    return res.send({
                        car: {
                            status: "failed",
                            message: "Platenumber doesn't match. Kindly check the valet desk."
                        }
                    });
                } else {
                    if(car.status == "parked" && car.free == false){
                        if(car.venue && car.venue.settings && car.venue.settings.verifyOption){ // and check transaction is free and its verify / oscar transaction car
                            console.log("Car requested falied. Oscar paid service.");
                            return res.send({
                                car: {
                                    status: "requested",
                                    message: "You can't request a car because it's paid parking. Kindly check the valet desk."
                                }
                            });
                        } else 
                            otherwiseCall()
                    } else 
                        otherwiseCall();
                }
                

                function otherwiseCall(){
                    if (car.status == "parked") { 
                        if (car.log != undefined) {
                            for (var i = 0; i < car.log.length; i++) {
                                log.push(car.log[i]);
                            }
                        }
    
                        console.log(JSON.stringify(car) + "Actual Status" + car.status);
    
                        updatedLog = {
                            'activity': 'requested',
                            'by': req.param('mobile'),
                            'at': newdate,
                            'userProfile': req.param('profileImage')
                        };
    
    
                        if(req.param('specialRequest')){
                            updatedLog['specialRequest'] = {
                                timeZone : "Asia/Kolkata",
                                // option : req.param('option'),
                                // remarks : req.param('remarks'),
                                dateTime : new Date(parseInt(req.param('dateTime'))),
                                accepted : false,
                                by : {}
                            }
                        }
    
                        // console.log('request car server==>==>==>' + JSON.stringify(updatedLog));
                        log.push(updatedLog);
    
                        var ownerDetails = {
                            ownerMobileNumber: req.param('mobile'),
                            status: 'requested',
                            log: log
                        };
    
                        Dailytransactional.update(car.id, ownerDetails, function venueUpdated(err, car) {
                            console.log("-Updated-");   
                            Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                                if (err) {
                                    venueDetails = {};
                                }
                                sails.sockets.broadcast('myroom','dailytransactional',{
                                    message: 'socket event!', 
                                    data : {
                                            id: car[0].id,
                                            parkingID: car[0].parkingID,
                                            plateNumber: car[0].plateNumber,
                                            parkingZone: car[0].parkingZone,
                                            color: car[0].color,
                                            brand: car[0].brand,
                                            snap: car[0].snap,
                                            ownerMobileNumber: car[0].ownerMobileNumber,
                                            status: car[0].status,
                                            accountID: car[0].accountID,
                                            venue: venueDetails,
                                            log: car[0].log,
                                            changeLog: car[0].changeLog,
                                            remarks: car[0].remarks,
                                            modelName: car[0].modelName,
                                            createdAt: new Date(),
                                            customerType :  car[0].customerType,
                                            carID : car[0].carID,
                                            free :  car[0].free,
                                            documents :  car[0].documents,
                                            description :  car[0].description,
                                            updatedAt : car[0].updatedAt,
                                            fees : car[0].fees, 
                                            validatedBy : car[0].validatedBy,
                                            validatedAt : car[0].validatedAt, 
                                            cashAcceptedBy : car[0].cashAcceptedBy, 
                                            cashAcceptedAt : car[0].cashAcceptedAt,
                                            amountPaid :car[0].amountPaid
                                        },
                                        id: car[0].id,
                                        verb : 'updated'
                                });
                                console.log("Venue Detail" + JSON.stringify(venueDetails));
                                Dailytransactional.publishUpdate(car[0].id, {
                                    id: car[0].id,
                                    parkingID: car[0].parkingID,
                                    plateNumber: car[0].plateNumber,
                                    parkingZone: car[0].parkingZone,
                                    color: car[0].color,
                                    brand: car[0].brand,
                                    snap: car[0].snap,
                                    ownerMobileNumber: car[0].ownerMobileNumber,
                                    status: car[0].status,
                                    accountID: car[0].accountID,
                                    venue: venueDetails,
                                    log: car[0].log,
                                    changeLog: car[0].changeLog,
                                    remarks: car[0].remarks,
                                    modelName: car[0].modelName,
                                    createdAt: new Date(),
                                    customerType :  car[0].customerType,
                                    carID : car[0].carID,
                                    free :  car[0].free,
                                    documents :  car[0].documents,
                                    description :  car[0].description,
                                    updatedAt : car[0].updatedAt,
                                    fees : car[0].fees, 
                                    validatedBy : car[0].validatedBy,
                                    validatedAt : car[0].validatedAt, 
                                    cashAcceptedBy : car[0].cashAcceptedBy, 
                                    cashAcceptedAt : car[0].cashAcceptedAt
    
                                });
    
                            });
                            //publishcreate
                            Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                                if(!err){
                                    Mastertransactional.update(masterData[0].id, ownerDetails, function venueUpdated(err, car) {
                                        console.log("-Master-Updated-");
                                    });
                                }
                            });
                        });
                        return res.send({ car: car });
                    } else if (car.status == "requested") {
                        console.log("Car requested already. It will be ready soon. Please try after some time for the status!");
                        return res.send({
                            car: {
                                status: "requested",
                                message: "Car requested already. It will be ready soon. Please try after some time for the status!"
                            }
                        });
                    } else if (car.status == "accept") {
                        console.log("Car request processed. It is ready in portico!!!");
                        return res.send({
                            car: {
                                status: "accept",
                                message: "Car request processed. It is ready in portico!!!"
                            }
                        });
                    }
                }
            });
        } else if (req.isSocket) {
            sails.sockets.join(req.socket,'myroom');
        }
    },
    requestCarByGuest: function(req, res, next) {
        // console.log("--------------------------------------------------------------------------");
        // console.log("Requested Car called");
        // console.log("--------------------------------------------------------------------------");
        if (req.method === 'POST') {
            var log = [];
            var updatedLog = [];
            var newdate = new Date();

            // var originalPlateNumber=req.param('plateNumber');
            // var updatedPlateNumber=originalPlateNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

            Dailytransactional.findOneByCarID(req.param('parkingID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                // if(req.param('plateNumber')!=car.plateNumber){
                //  res.send({notMatching : 'notMatching'});
                //  return;
                // }
                // if(req.param('parkingID')!=car.parkingID){
                //  res.send({notMatching : 'notMatching'});
                //  return;
                // }
                if (car.status == "parked") {
                    if (car.log != undefined) {
                        for (var i = 0; i < car.log.length; i++) {
                            log.push(car.log[i]);
                        }
                    }

                    console.log(JSON.stringify(car) + "Actual Status" + car.status);

                    updatedLog = {
                        'activity': 'requested',
                        'by': req.param('mobile'),
                        'at': newdate,
                        'userProfile': req.param('profileImage')
                    };


                    // console.log( req.param('dateTime') + "-----------"+ new Date(req.param('dateTime')))

                    if(req.param('specialRequest')){
                        updatedLog['specialRequest'] = {
                            timeZone : "Asia/Kolkata",
                            // option : req.param('option'),
                            // remarks : req.param('remarks'),
                            dateTime : new Date(parseInt(req.param('dateTime'))),
                            accepted : false,
                            by : {}
                        }
                    }

                    console.log('request car server==>==>==>' + JSON.stringify(updatedLog));
                    log.push(updatedLog);

                    var ownerDetails = {
                        ownerMobileNumber: req.param('mobile'),
                        status: 'requested',
                        log: log
                    };

                    Dailytransactional.update(car.id, ownerDetails, function venueUpdated(err, car) {
                        console.log("-Updated-");
                        // var venueDetails = {};

                        Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                            if (err) {
                                venueDetails = {};
                            }
                            sails.sockets.broadcast('myroom','dailytransactional',{
                                message: 'socket event!', 
                                data : {
                                    id: car[0].id,
                                    parkingID: car[0].parkingID,
                                    plateNumber: car[0].plateNumber,
                                    parkingZone: car[0].parkingZone,
                                    color: car[0].color,
                                    brand: car[0].brand,
                                    snap: car[0].snap,
                                    ownerMobileNumber: car[0].ownerMobileNumber,
                                    status: car[0].status,
                                    accountID: car[0].accountID,
                                    venue: venueDetails,
                                    log: car[0].log,
                                    changeLog: car[0].changeLog,
                                    remarks: car[0].remarks,
                                    modelName: car[0].modelName,
                                    createdAt: new Date(),
                                    customerType :  car[0].customerType,
                                    carID : car[0].carID,
                                    free :  car[0].free,
                                    documents :  car[0].documents,
                                    description :  car[0].description,
                                    updatedAt : car[0].updatedAt,
                                    fees : car[0].fees, 
                                    validatedBy : car[0].validatedBy,
                                    validatedAt : car[0].validatedAt, 
                                    cashAcceptedBy : car[0].cashAcceptedBy, 
                                    cashAcceptedAt : car[0].cashAcceptedAt,
                                    amountPaid :car[0].amountPaid
                                },
                                id: car[0].id,
                                verb : 'updated'
                            });
                            console.log("Venue Detail" + JSON.stringify(venueDetails));
                            Dailytransactional.publishUpdate(car[0].id, {
                                id: car[0].id,
                                parkingID: car[0].parkingID,
                                plateNumber: car[0].plateNumber,
                                parkingZone: car[0].parkingZone,
                                color: car[0].color,
                                brand: car[0].brand,
                                snap: car[0].snap,
                                ownerMobileNumber: car[0].ownerMobileNumber,
                                status: car[0].status,
                                accountID: car[0].accountID,
                                venue: venueDetails,
                                log: car[0].log,
                                changeLog: car[0].changeLog,
                                remarks: car[0].remarks,
                                modelName: car[0].modelName,
                                createdAt: new Date(),
                                customerType :  car[0].customerType,
                                carID : car[0].carID,
                                free :  car[0].free,
                                documents :  car[0].documents,
                                description :  car[0].description,
                                updatedAt : car[0].updatedAt,
                                fees : car[0].fees, 
                                validatedBy : car[0].validatedBy,
                                validatedAt : car[0].validatedAt, 
                                cashAcceptedBy : car[0].cashAcceptedBy, 
                                cashAcceptedAt : car[0].cashAcceptedAt

                            });

                        });
                        //publishcreate
                        Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                            if(!err){
                                Mastertransactional.update(masterData[0].id, ownerDetails, function venueUpdated(err, car) {
                                    console.log("-Master-Updated-");
                                });
                            }
                        });
                    });
                    return res.send({ car: car });
                } else if (car.status == "requested") {
                    console.log("Car requested already. It will be ready soon. Please try after some time for the status!");
                    return res.send({
                        car: {
                            status: "requested",
                            message: "Car requested already. It will be ready soon. Please try after some time for the status!"
                        }
                    });
                } else if (car.status == "accept") {
                    console.log("Car request processed. It is ready in portico!!!");
                    return res.send({
                        car: {
                            status: "accept",
                            message: "Car request processed. It is ready in portico!!!"
                        }
                    });

                }

            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to requested car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }

    },
    specialRequestAccepted: function(req, res, next) {
        // console.log("--------------------------------------------------------------------------");
        // console.log("Special request accept called");
        // console.log("--------------------------------------------------------------------------");
        if (req.method === 'POST') {
            Dailytransactional.findOne(req.param('dailytransactionalID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                if (req.param('dailytransactionalID') != car.id) {
                    res.send({ notMatching: 'notMatching' });
                    return;
                }

                var carDetails = {
                    log: req.param('log')
                };

                Dailytransactional.update(car.id, carDetails, function carUpdated(err, car) {
                    console.log("-special-");
                    //publishcreate
                    // var venueDetails = {};
                    Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                        if (err) {
                            venueDetails = {};
                        }
                        console.log("Venue Detail" + JSON.stringify(venueDetails));
                        var temp = {
                            id: car[0].id,
                            parkingID: car[0].parkingID,
                            plateNumber: car[0].plateNumber,
                            parkingZone: car[0].parkingZone,
                            color: car[0].color,
                            brand: car[0].brand,
                            snap: car[0].snap,
                            ownerMobileNumber: car[0].ownerMobileNumber,
                            status: car[0].status,
                            accountID: car[0].accountID,
                            venue: venueDetails,
                            log: car[0].log,
                            remarks: car[0].remarks,
                            modelName: car[0].modelName,
                            createdAt: new Date(),
                            changeLog: car[0].changeLog,
                            customerType :  car[0].customerType,
                            carID : car[0].carID,
                            free :  car[0].free,
                            documents :  car[0].documents,
                            description :  car[0].description,
                            updatedAt : car[0].updatedAt,
                            amountPaid :car[0].amountPaid
                        }
                        if (car[0].scratchesSnap)
                            temp['scratchesSnap'] = car[0].scratchesSnap;
                        
                        sails.sockets.broadcast('myroom','dailytransactional',{
                            message: 'socket event!', 
                            data : temp,
                            id: car[0].id,
                            verb : 'updated'
                        });

                        Dailytransactional.publishUpdate(car[0].id, temp);

                    });
                    Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                        if(!err){
                            Mastertransactional.update(masterData[0].id, carDetails, function venueUpdated(err, car) {
                                console.log("-Master-Special-");
                            });
                        }   
                    });
                });
                return res.send({ car: 'success' });
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to accepted car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    getCarDetailsByParkingID: function(req,res,next){
        if (req.method === 'POST') {
            Dailytransactional.findOneByParkingID(req.param('parkingID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                 return res.send({ car: car });
            });
        }
    },
    acceptCarFromAPICall: function(req, res, next) {
        // console.log("--------------------------------------------------------------------------");
        // console.log("Accepted Car called");
        // console.log("--------------------------------------------------------------------------");
        if (req.method === 'POST') {
            var log = [];
            var updatedLog = [];
            var newdate = new Date();

            Dailytransactional.findOne(req.param('dailytransactionalID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                if (req.param('dailytransactionalID') != car.id) {
                    res.send({ notMatching: 'notMatching' });
                    return;
                }

                if (car.log != undefined) {
                    for (var i = 0; i < car.log.length; i++) {
                        log.push(car.log[i]);
                    }
                    if (car.log[car.log.length - 1].activity == 'accept') {
                        return res.send({ car: 'carAlreadyInacceptedState' });
                    }
                }
                //console.log("old log---------"+JSON.stringify(log)); 
                updatedLog = {
                    'activity': 'accept',
                    'by': req.param('employeeID'),
                    'employeeName': req.param('employeeName'),
                    'at': newdate,
                    'userProfile': req.param('profileImage')
                };
                if(req.param('assignedBy'))
                    updatedLog['assignedBy'] = req.param('assignedBy');
                console.log('Accepted car server==>==>==>' + JSON.stringify(updatedLog));
                log.push(updatedLog);
                //console.log('updated log-----'+JSON.stringify(log));

                var carDetails = {
                    status: 'accept',
                    log: log
                };

                axios.post('https://api.vpms.valeters.ae/requestcar/notifyGuest', {
                    parkingID: car.carID,
                    stat: 'otw'
                }).then().catch()

                Dailytransactional.update(car.id, carDetails, function carUpdated(err, car) {
                    console.log("-accepted-");
                    //res.send({car : car});
                    //publishcreate
                    // var venueDetails = {};
                    Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                        if (err) {
                            venueDetails = {};
                        }

                        console.log("Venue Detail" + JSON.stringify(venueDetails));
                        var temp = {
                            id: car[0].id,
                            parkingID: car[0].parkingID,
                            plateNumber: car[0].plateNumber,
                            parkingZone: car[0].parkingZone,
                            color: car[0].color,
                            brand: car[0].brand,
                            snap: car[0].snap,
                            ownerMobileNumber: car[0].ownerMobileNumber,
                            status: car[0].status,
                            accountID: car[0].accountID,
                            venue: venueDetails,
                            log: car[0].log,
                            remarks: car[0].remarks,
                            modelName: car[0].modelName,
                            createdAt: new Date(),
                            changeLog: car[0].changeLog,
                            customerType :  car[0].customerType,
                            carID : car[0].carID,
                            free :  car[0].free,
                            documents :  car[0].documents,
                            description :  car[0].description,
                            updatedAt : car[0].updatedAt,
                            fees : car[0].fees, 
                            validatedBy : car[0].validatedBy,
                            validatedAt : car[0].validatedAt, 
                            cashAcceptedBy : car[0].cashAcceptedBy, 
                            cashAcceptedAt : car[0].cashAcceptedAt,
                            amountPaid :car[0].amountPaid
                        }
                        if (car[0].scratchesSnap)
                            temp['scratchesSnap'] = car[0].scratchesSnap;

                        sails.sockets.broadcast('myroom','dailytransactional',{
                            message: 'socket event!', 
                            data : temp,
                            id: car[0].id,
                            verb : 'updated'
                        });

                        Dailytransactional.publishUpdate(car[0].id, temp);

                    });

                    try {
                        Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                            if(!err){
                                Mastertransactional.update(masterData[0].id, carDetails, function venueUpdated(err, car) {
                                    console.log("-Master-accepted-");
                                });
                            }
                        });
                    } catch(e) {
                        console.error(e)
                    }
                });

                return res.send({ car: 'success' });
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to accepted car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    notifyGuest: async function(req, res, next) {
        const parkingID = req.param('parkingID')
        const stat = req.param('stat')

        const car = await Car.findOne({ parkingID })
        let tokens = await NotificationSubscription.find({ user: car.employeeID })

        tokens = tokens.reduce((tokens, subscription) => {
            return [...tokens, subscription.token];
        }, []);

        if (tokens) {
            const message = {
                tokens,
                notification: {}
            }

            switch (stat) {
                case 'otw':
                    message.notification.title = 'On The Way'
                    message.notification.body = `${capitalizeFirstLetter(car.color)} ${car.brand} is on the way. Please be ready.`
                    break
                case 'fp':
                    message.notification.title = 'Ready To Pick Up'
                    message.notification.body = `${capitalizeFirstLetter(car.color)} ${car.brand} is ready for pickup at the valet.`
                    break
                default:
                    return res.ok()
            }
    
            try {
                await admin.messaging().sendMulticast(message)
            } catch (err) {
                console.error(err)
            }
        }

        return res.ok()

        function capitalizeFirstLetter(string) {
            return string[0].toUpperCase() + string.slice(1);
        }
    },
    tester: async function(req, res, next) {
        await axios.post('https://api.vpms.valeters.ae/requestcar/notifyGuest', { parkingID: 'car8' })
        return res.ok();
    },
    readyStateApiCall: function(req, res, next) {
        // console.log("--------------------------------------------------------------------------");
        // console.log("Ready State Car called");
        // console.log("--------------------------------------------------------------------------");
        if (req.method === 'POST') {
            var log = [];
            var updatedLog = [];
            var newdate = new Date();
            Dailytransactional.findOne(req.param('dailytransactionalID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                if (req.param('dailytransactionalID') != car.id) {
                    res.send({ notMatching: 'notMatching' });
                    return;
                }

                if (car.log != undefined) {
                    for (var i = 0; i < car.log.length; i++) {
                        log.push(car.log[i]);
                    }
                    if (car.log[car.log.length - 1].activity == 'ready') {
                        return res.send({ car: 'carAlreadyInacceptedState' });
                    }
                }
                //console.log("old log---------"+JSON.stringify(log)); 
                updatedLog = {
                    'activity': 'ready',
                    'by': req.param('employeeID'),
                    'employeeName': req.param('employeeName'),
                    'at': newdate,
                    'userProfile': req.param('profileImage')
                };
                log.push(updatedLog);
                console.log('updated log-----'+JSON.stringify(log));

                var carDetails = {
                    status: 'ready',
                    log: log
                };
                console.log(car);

                axios.post('https://api.vpms.valeters.ae/requestcar/notifyGuest', {
                    parkingID: car.carID,
                    stat: 'fp'
                }).then().catch()

                Dailytransactional.update(car.id, carDetails, function carUpdated(err, car) {
                    if(err){
                        console.log(err);
                    }
                    console.log("-ready-");
                    //res.send({car : car});
                    //publishcreate
                    // var venueDetails = {};
                    console.log(car);
                    Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                        if (err) {
                            venueDetails = {};
                        }

                        console.log("Venue Detail" + JSON.stringify(venueDetails));
                        var temp = {
                            id: car[0].id,
                            parkingID: car[0].parkingID,
                            plateNumber: car[0].plateNumber,
                            parkingZone: car[0].parkingZone,
                            color: car[0].color,
                            brand: car[0].brand,
                            snap: car[0].snap,
                            ownerMobileNumber: car[0].ownerMobileNumber,
                            status: car[0].status,
                            accountID: car[0].accountID,
                            venue: venueDetails,
                            log: car[0].log,
                            remarks: car[0].remarks,
                            modelName: car[0].modelName,
                            createdAt: new Date(),
                            changeLog: car[0].changeLog,
                            customerType :  car[0].customerType,
                            carID : car[0].carID,
                            free :  car[0].free,
                            documents :  car[0].documents,
                            description :  car[0].description,
                            updatedAt : car[0].updatedAt,
                            fees : car[0].fees, 
                            validatedBy : car[0].validatedBy,
                            validatedAt : car[0].validatedAt, 
                            cashAcceptedBy : car[0].cashAcceptedBy, 
                            cashAcceptedAt : car[0].cashAcceptedAt,
                            amountPaid :car[0].amountPaid
                        }
                        if (car[0].scratchesSnap)
                            temp['scratchesSnap'] = car[0].scratchesSnap;

                        sails.sockets.broadcast('myroom','dailytransactional',{
                            message: 'socket event!', 
                            data : temp,
                            id: car[0].id,
                            verb : 'updated'
                        });

                        Dailytransactional.publishUpdate(car[0].id, temp);

                    });

                    try{
                        Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                            if(!err){
                                Mastertransactional.update(masterData[0].id, carDetails, function venueUpdated(err, car) {
                                    console.log("-Master-ready-");
                                });
                            }
                        });
                    } catch(e){
                        
                    }

                });

                return res.send({ car: 'success' });
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to accepted car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }


    },
    rejectCarFromAPICall: function(req, res, next) {
        var log = [];
        var updatedLog = [];
        var newdate = new Date();

        if (req.method === 'POST') {
            Dailytransactional.findOne(req.param('dailytransactionalID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                if (req.param('dailytransactionalID') != car.id) {
                    res.send({ notMatching: 'notMatching' });
                    return;
                }

                if (car.log != undefined) {
                    for (var i = 0; i < car.log.length; i++) {
                        log.push(car.log[i]);
                    }
                }
                //console.log("old log---------"+JSON.stringify(log));
                updatedLog = {
                    'activity': 'reject',
                    'by': req.param('employeeID'),
                    'employeeName': req.param('employeeName'),
                    'at': newdate
                };

                log.push(updatedLog);

                var carDetails = {
                    //status:'reject',
                    log: log
                };

                Dailytransactional.update(car.id, carDetails, function carUpdated(err, car) {
                    console.log("-rejected-");
                    //res.send({car : car});
                    //publishcreate
                    Dailytransactional.publishUpdate(car[0].id, {
                        id: car[0].id,
                        parkingID: car[0].parkingID,
                        plateNumber: car[0].plateNumber,
                        parkingZone: car[0].parkingZone,
                        color: car[0].color,
                        brand: car[0].brand,
                        snap: car[0].snap,
                        ownerMobileNumber: car[0].ownerMobileNumber,
                        status: car[0].status,
                        accountID: car[0].accountID,
                        venue: car[0].venue,
                        log: car[0].log,
                        changeLog: car[0].changeLog,
                        customerType :  car[0].customerType,
                        carID : car[0].carID,
                        free :  car[0].free,
                        documents :  car[0].documents,
                        description :  car[0].description,
                        updatedAt : car[0].updatedAt
                    });


                    Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                        if(!err){
                            Mastertransactional.update(masterData[0].id, carDetails, function venueUpdated(err, car) {
                                console.log("-Master-accepted-");
                            });
                        }
                    });
                });
                return res.send({ car: 'success' });
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to rejected car');
            // });
        }



    },
    completeCarFromAPICall: function(req, res, next) {
        if (req.method === 'POST') {
            var log = [];
            var updatedLog = [];
            var newdate = new Date();
            console.log("call from android.....");
            Dailytransactional.findOne(req.param('dailytransactionalID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                if (req.param('dailytransactionalID') != car.id) {
                    res.send({ notMatching: 'notMatching' });
                    return;
                }

                if (car.log != undefined) {
                    for (var i = 0; i < car.log.length; i++) {
                        log.push(car.log[i]);
                    }
                    if (car.log[car.log.length - 1].activity == 'completed') {
                        return res.send({ car: 'carAlreadyInCompletedState' });
                    }
                }
                //console.log("old log---------"+JSON.stringify(log));

                updatedLog = {
                    'activity': 'completed',
                    'by': req.param('employeeID'),
                    'employeeName': req.param('employeeName'),
                    'at': newdate,
                    'userProfile': req.param('profileImage'),
                    'cashierName': (req.param('userObject') ? req.param('userObject').cashierName: ''),
                    'fees' : (req.param('userObject') ? req.param('userObject').fees : 0),
                    'missedUserName' :  ( req.param('userObject') ? req.param('userObject').name: ''),
                    'missedUserMobile' : (  req.param('userObject') ? req.param('userObject').mobile : '')
                };
                if (req.param('proofs')) {
                    if (req.param('proofs').length > 0) {
                        updatedLog['proofs'] = req.param('proofs');
                        updatedLog['missedUserName'] = req.param('userObject').name;
                        updatedLog['missedUserMobile'] = req.param('userObject').mobile;
                    }
                }

                if (req.param('proofs')) {
                    if (req.param('proofs').length > 0) {
                        updatedLog['proofs'] = req.param('proofs');
                        updatedLog['missedUserName'] = req.param('userObject').name;
                        updatedLog['missedUserMobile'] = req.param('userObject').mobile;
                    }
                }
                log.push(updatedLog);
                //console.log('updated log-----'+JSON.stringify(log));
                var carDetails = {
                    status: 'complete',
                    log: log,
                    free : req.param('free'),
                    documents : req.param('documents'),
                    description : req.param('description')
                };
                ////////////////////
                if(req.param('amountPaid')){ // Secure parking only
                    carDetails['amountPaid'] = req.param('amountPaid');
                    carDetails['fees'] =  (req.param('userObject') ? req.param('userObject').fees : 0);
                } else if(req.param('amountPaid') === false){
                    carDetails['amountPaid'] = req.param('amountPaid');
                    carDetails['fees'] = (req.param('userObject') ? req.param('userObject').fees : 0);
                }
                if((req.param('amountPaid') == true || req.param('amountPaid') == 'true') && car.amountPaid == false){ 
                    analysisService.insertDailyFeesData(car.accountID.id, car.venue.id, (req.param('userObject') ? req.param('userObject').fees : 0), ()=>{});
                    carDetails['paidAt'] = new Date();
                }
                //////////////////////////

                if(req.param('otherInfo'))
                    carDetails['otherInfo'] = req.param('otherInfo');

                if(req.param('feeSplitUp'))
                    carDetails['feeSplitUp'] = req.param('feeSplitUp');

                Dailytransactional.destroy(car.id).exec(function destroy(err) {
                    console.log("-completed-");

                    // console.log("000000 \n\n\n\n\n\n\n" + car.accountID.id )
                    // if(car.accountID.id == '5b45bb80a23561f14ad08a2f'){
                    //     console.log("entered \n\n\n\n\n\n\n" + req.param('fees') )
                    //     if(req.param('fees') == 0 ){
                    //         console.log("11111111111 \n\n\n\n\n\n\n")
                    //         var transporter = nodemailer.createTransport("SMTP", {
                    //             host: 'email-smtp.us-east-1.amazonaws.com',
                    //             service: 'SES',
                    //             "secure": true,
                    //             "port": 465,
                    //             auth: {
                    //               user: process.env.NODEMAILER_USER,
                    //               pass: process.env.NODEMAILER_PASS
                    //             },
                    //           });
                        
                    //           var mailOptions = {
                    //             from: process.env.ALERTS_EMAIL,
                    //             to: process.env.OPERATIONS_EMAIL,
                    //             subject: "EValetz Alert - Free Transaction",
                    //             bcc: process.env.BCC_EMAIL,
                    //             html : '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="https://evaletz.com:2018/images/temp-home.JPG"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;">Dear Mr. ' + 'Guru Prasad,' + '</p><p style="margin: 1em 0px;"> Guest type has been modified for below transaction: </p><p style="margin: 1em 0px;margin-top: 10px;">Ticket Number: ' +  car.parkingID.toUpperCase() +'</p><p style="margin: 1em 0px;">Plate Number: ' + car.plateNumber.toUpperCase()+'</p><p style="margin: 1em 0px;">Guest Type: ' + car.customerType + '</p><p style="margin: 1em 0px;margin-top: 10px;">Hence, <b>NO PARKING FEE.</b></p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a></span>&nbsp;and we will be happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>EValetz Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/EValetzMobileApp/" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://plus.google.com/u/0/116399189801627499126?hl=en" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://twitter.com/EvaletzApp" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://evaletz.com/" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>'
                    //           }
                    //           transporter.sendMail(mailOptions, function (err, response) {
                    //             if (err) {
                    //               console.log('email failed..........' + JSON.stringify(err));
                    //             }
                    //             if (response) {
                    //               console.log('email success..........' + JSON.stringify(response));
                    //             }
                    //           });
                            
                    //         var message = "Alert: NO PARKING FEE for Ticket No: "+ car.parkingID.toUpperCase() +" Plate No: "+ car.plateNumber.toUpperCase()+" Guest Type: " + car.customerType;
                    //         var post_req = http.request("http://dlsonline.in/httpapi/httpapi?token=eb85c56dfe3b58a8a7806e88ba3b0c5f&sender=EVALET&number=8904860031&route=2&type=Text-1&sms=" + message, function(res) {
                    //             console.log('Response: ' + res);
                    //         });
                    //         post_req.end();
                    //     }
                    // }

                    sails.sockets.broadcast('myroom','dailytransactional',{
                        message: 'socket event!', 
                        data : {
                            id: car.id,
                            parkingID: car.parkingID,
                            plateNumber: car.plateNumber,
                            parkingZone: car.parkingZone,
                            color: car.color,
                            brand: car.brand,
                            snap: car.snap,
                            ownerMobileNumber: car.ownerMobileNumber,
                            status: car.status,
                            accountID: car.accountID,
                            venue: car.venue
                        },
                        id: car.id,
                        verb : 'destroyed'
                    });
                    Dailytransactional.publishDestroy(car.id, {
                        id: car.id,
                        parkingID: car.parkingID,
                        plateNumber: car.plateNumber,
                        parkingZone: car.parkingZone,
                        color: car.color,
                        brand: car.brand,
                        snap: car.snap,
                        ownerMobileNumber: car.ownerMobileNumber,
                        status: car.status,
                        accountID: car.accountID,
                        venue: car.venue


                    }, {
                        id: car.id,
                        parkingID: car.parkingID,
                        plateNumber: car.plateNumber,
                        parkingZone: car.parkingZone,
                        color: car.color,
                        brand: car.brand,
                        snap: car.snap,
                        ownerMobileNumber: car.ownerMobileNumber,
                        status: car.status,
                        accountID: car.accountID,
                        venue: car.venue
                    });

                    try{
                        Mastertransactional.find().where({ "transactionID": car.id }).exec(function found(err, masterData) {
                            if (err) return next(err);
                            if(masterData && masterData.length > 0){
                                Mastertransactional.update(masterData[0].id, carDetails, function venueUpdated(err, car) {
                                    if (err) return next(err);
                                    console.log("-Master-accepted-");
                                    Venue.findOne(masterData[0].venue).exec(function(err, venueDetails) {
                                        if(venueDetails){
                                            if((venueDetails.settings && venueDetails.settings.verifyOption))
                                                analysisService.insertDailyFeesData(masterData[0].accountID, masterData[0].venue, (req.param('userObject') ? req.param('userObject').fees : 0), ()=>{});
                                        }
                                    });
                                });
                            }
                        });
                    } catch(e){

                    }
                });
                return res.send({ car: car.id });
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to completed car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }



    },
    holdCarFromAPICall: function(req, res, next) {
        var log = [];
        var updatedLog = [];
        var newdate = new Date();
        if (req.method === 'POST') {
            Dailytransactional.findOne(req.param('dailytransactionalID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                if (req.param('dailytransactionalID') != car.id) {
                    res.send({ notMatching: 'notMatching' });
                    return;
                }
                if (car.log != undefined) {
                    for (var i = 0; i < car.log.length; i++) {
                        log.push(car.log[i]);
                    }
                }
                //console.log("old log---------"+JSON.stringify(log));
                updatedLog = {
                    'activity': 'hold',
                    'by': req.param('employeeID'),
                    'employeeName': req.param('employeeName'),
                    'at': newdate
                };

                log.push(updatedLog);
                //console.log('updated log-----'+JSON.stringify(log));
                var carDetails = {
                    //status:'hold',
                    log: log
                };

                Dailytransactional.update(car.id, carDetails, function carUpdated(err, car) {
                    console.log("-hold-");
                    //res.send({car : car});
                    //publishcreate
                    Dailytransactional.publishUpdate(car[0].id, {
                        id: car[0].id,
                        parkingID: car[0].parkingID,
                        plateNumber: car[0].plateNumber,
                        parkingZone: car[0].parkingZone,
                        color: car[0].color,
                        brand: car[0].brand,
                        snap: car[0].snap,
                        ownerMobileNumber: car[0].ownerMobileNumber,
                        status: car[0].status,
                        accountID: car[0].accountID,
                        venue: car[0].venue,
                        log: car[0].log,
                        changeLog: car[0].changeLog,
                    });
                    Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                        if(!err){
                            Mastertransactional.update(masterData[0].id, carDetails, function venueUpdated(err, car) {
                                console.log("-Master-holded-");
                            });
                        }
                    });
                });
                return res.send({ car: 'success' });
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to hold car');
            // });
        }
    },
    updateDriverforParkFromAPICall: function(req, res, next) {
        // console.log("--------------------------------------------------------------------------");
        // console.log("Update parking Driver Called");
        // console.log("--------------------------------------------------------------------------");
        if (req.method === 'POST') {
            var log = [];
            var updatedLog = {};
            // var newdate = new Date();
            Dailytransactional.findOne(req.param('dailytransactionalID')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                if (req.param('dailytransactionalID') != car.id) {
                    res.send({ notMatching: 'notMatching' });
                    return;
                }

                updatedLog = {
                    'activity': 'parked',
                    'by': req.param('employeeID'),
                    'employeeName': req.param('employeeName'),
                    'at': car.createdAt,
                    'userProfile': req.param('profileImage')
                };
                log.push(updatedLog);
                var carDetails = {
                    log: log
                };
                Dailytransactional.update(car.id, carDetails, function carUpdated(err, car) {
                    // var venueDetails = {};

                    Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                        if (err) {
                            venueDetails = {};
                        }


                        sails.sockets.broadcast('myroom','dailytransactional',{
                            message: 'socket event!', 
                            data : {
                                id: car[0].id,
                                parkingID: car[0].parkingID,
                                plateNumber: car[0].plateNumber,
                                parkingZone: car[0].parkingZone,
                                color: car[0].color,
                                brand: car[0].brand,
                                snap: car[0].snap,
                                ownerMobileNumber: car[0].ownerMobileNumber,
                                status: car[0].status,
                                accountID: car[0].accountID,
                                venue: venueDetails,
                                log: car[0].log,
                                remarks: car[0].remarks,
                                modelName: car[0].modelName,
                                createdAt: new Date(),
                                changeLog: car[0].changeLog,
                                customerType :  car[0].customerType,
                                carID : car[0].carID,
                                free :  car[0].free,
                                documents :  car[0].documents,
                                description :  car[0].description,
                                updatedAt : car[0].updatedAt,
                                amountPaid :car[0].amountPaid
                            },
                            id: car[0].id,
                            verb : 'updated'
                        });
                        console.log("Venue Detail" + JSON.stringify(venueDetails));
                        Dailytransactional.publishUpdate(car[0].id, {
                            id: car[0].id,
                            parkingID: car[0].parkingID,
                            plateNumber: car[0].plateNumber,
                            parkingZone: car[0].parkingZone,
                            color: car[0].color,
                            brand: car[0].brand,
                            snap: car[0].snap,
                            ownerMobileNumber: car[0].ownerMobileNumber,
                            status: car[0].status,
                            accountID: car[0].accountID,
                            venue: venueDetails,
                            log: car[0].log,
                            remarks: car[0].remarks,
                            modelName: car[0].modelName,
                            createdAt: new Date(),
                            changeLog: car[0].changeLog,
                            customerType :  car[0].customerType,
                            carID : car[0].carID,
                            free :  car[0].free,
                            documents :  car[0].documents,
                            description :  car[0].description,
                            updatedAt : car[0].updatedAt
                        });

                    });
                    Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                        if(!err){
                            Mastertransactional.update(masterData[0].id, carDetails, function venueUpdated(err, car) {
                                console.log("-Master-accepted-");
                            });
                        }
                    });
                });
                return res.send({ car: 'success' });

            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to requested car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    onlineSync: function(req, res, next) {
        if (req.method === 'POST') {
            if(req.param('status') == 'completed' || req.param('status') == 'complete')
                req.allParams().status = 'complete';
            
            req.allParams().fees  = Number(req.param('fees')) || 0;
            console.log("call from android.....");

            // console.log("call from android....." + JSON.stringify(req.allParams()));
            // req.allParams().createdAt = new Date(req.allParams().createdAt);
            if (req.param('id').indexOf('offline') > -1) { // has to be added only offline
                if (req.param('status') == 'parked') {
                    delete req.allParams().id;
                    // delete req.allParams().createdAt;
                    delete req.allParams().markImageBlob;
                    delete req.allParams().markImageIsThere;
                    delete req.allParams().offlineEdited;
                    delete req.allParams().ownerMobileNumber;
                    console.log(req.allParams());
                    Dailytransactional.create(req.allParams(), function(err, carObj){
                         // carObjID = carObj.id;
                         if (err) return res.send({ success: 'failed0', err: err });
                        // var venueDetails = {};
                        Venue.findOne(carObj.venue).exec(function(err, venueDetails) {
                            if (err) {
                                venueDetails = {};
                            }
                            analysisService.insertDailyData(carObj.accountID, venueDetails.id,function() {});

                            sails.sockets.broadcast('myroom','dailytransactional',{
                                message: 'socket event!', 
                                data : {
                                    id: carObj.id,
                                    parkingID: carObj.parkingID,
                                    plateNumber: carObj.plateNumber,
                                    snap: carObj.snap,
                                    scratchesSnap: carObj.scratchesSnap,
                                    parkingZone: carObj.parkingZone,
                                    color: carObj.color,
                                    brand: carObj.brand,
                                    employeeID: carObj.employeeID,
                                    accountID: carObj.accountID,
                                    venue: venueDetails,
                                    status: carObj.status,
                                    log: carObj.log,
                                    loginAs: req.param('loginAs'),
                                    remarks: carObj.remarks,
                                    modelName: carObj.modelName,
                                    createdAt: req.allParams().createdAt,
                                    changeLog: carObj.changeLog,
                                    carID : carObj.carID,
                                    free : carObj.free,
                                    documents : carObj.documents,
                                    description : carObj.description,
                                },
                                id: carObj.id,
                                verb : 'created'
                            });
                        });
                        carObj['transactionID'] = carObj.id;

                        if((req.param('amountPaid') == "true" || req.param('amountPaid') == true  ) && req.param('fees') && req.param('fees') > 0)
                                analysisService.insertDailyFeesData(carObj.accountID, carObj.venue, (req.param('fees') ? req.param('fees') : 0), ()=>{});
                                
                        Mastertransactional.create(carObj).then(function(carObj1) {
                            console.log("Master created ---" + carObj1.transactionID);
                            res.send({ success: "success" });
                        });
                    })
                    // .then(function(carObj) {
                       
                    // });
                } else { // Offline added but not in parked state
                    notParkedState();
                }
            } else { // edit car , request car , accept car, complete car revalidate car 
                notParkedState();
            }

            function notParkedState() {
                if (req.param('id').indexOf('offline') > -1) {
                    if (req.param('status') != "complete") {
                        delete req.allParams().id;
                        // delete req.allParams().createdAt;
                        delete req.allParams().markImageBlob;
                        delete req.allParams().markImageIsThere;
                        delete req.allParams().offlineEdited;
                        delete req.allParams().ownerMobileNumber;
                        // console.log(JSON.stringify(req.allParams()))
                        Dailytransactional.create(req.allParams()).then(function(carObj) {
                            // carObjID = carObj.id;
                            // var venueDetails = {};
                            Venue.findOne(carObj.venue).exec(function(err, venueDetails) {
                                if (err) {
                                    venueDetails = {};
                                }
                                analysisService.insertDailyData(carObj.accountID,venueDetails.id, function() {});
                                sails.sockets.broadcast('myroom','dailytransactional',{
                                    message: 'socket event!', 
                                    data : {
                                        id: carObj.id,
                                        parkingID: carObj.parkingID,
                                        plateNumber: carObj.plateNumber,
                                        snap: carObj.snap,
                                        scratchesSnap: carObj.scratchesSnap,
                                        parkingZone: carObj.parkingZone,
                                        color: carObj.color,
                                        brand: carObj.brand,
                                        employeeID: carObj.employeeID,
                                        accountID: carObj.accountID,
                                        venue: venueDetails,
                                        status: carObj.status,
                                        log: carObj.log,
                                        loginAs: req.param('loginAs'),
                                        ownerMobileNumber: carObj.ownerMobileNumber,
                                        createdAt: carObj.createdAt,
                                        remarks: carObj.remarks,
                                        modelName: carObj.modelName,
                                        changeLog: carObj.changeLog,
                                        carID : carObj.carID,
                                        free : carObj.free,
                                        documents : carObj.documents,
                                        description : carObj.description,
                                    },
                                    id: carObj.id,
                                    verb : 'created'
                                });
                            });
                            carObj['transactionID'] = carObj.id;

                            if((req.param('amountPaid') == "true" || req.param('amountPaid') == true  ) && req.param('fees') && req.param('fees') > 0)
                                analysisService.insertDailyFeesData(carObj.accountID, carObj.venue, (req.param('fees') ? req.param('fees') : 0), ()=>{});

                            Mastertransactional.create(carObj).then(function(carObj1) {
                                console.log("Master created ---" + carObj1.transactionID);
                                res.send({ success: "success" });
                            });
                        });
                    } else {
                        delete req.allParams().id;
                        // delete req.allParams().createdAt;
                        delete req.allParams().markImageBlob;
                        delete req.allParams().markImageIsThere;
                        delete req.allParams().offlineEdited;
                        delete req.allParams().ownerMobileNumber;
                        req.allParams()['transactionID'] = null;
                        Mastertransactional.create(req.allParams()).then(function(carObj1) {
                            console.log("Master created ---" + carObj1.transactionID);

                            var carObj = carObj1;
                            Venue.findOne(carObj.venue).exec(function(err, venueDetails) {
                                if (err) {
                                    venueDetails = {};
                                }
                                analysisService.insertDailyData(carObj.accountID,venueDetails.id, function() {});
                                sails.sockets.broadcast('myroom','dailytransactional',{
                                    message: 'socket event!', 
                                    data : carObj,
                                    id: carObj.id,
                                    verb : 'destroyed'
                                });
                            });

                            analysisService.insertDailyData(carObj1.accountID, carObj1.venue, function() {
                                if((req.param('amountPaid') == "true" || req.param('amountPaid') == true ) && req.param('fees') && req.param('fees') > 0)
                                    analysisService.insertDailyFeesData(carObj1.accountID, carObj1.venue, (req.param('fees') ? req.param('fees') : 0), ()=>{});

                                if(carObj1.cashAcceptedBy && req.param('fees') && req.param('fees') > 0)
                                    analysisService.insertDailyFeesData(carObj1.accountID, carObj1.venue, (req.param('fees') ? req.param('fees') : 0), ()=>{});
                            });
                            res.send({ success: "success" });
                        });
                    }
                } else {
                    Dailytransactional.findOne(req.param('id')).exec(function foundCar(err, car) {
                        if (err) return res.send({ success: 'failed1', err: err });
                        if (car) {
                            if (car.status == 'parked' && req.param('status') == 'parked') {
                                updateRecords();
                            } else if ((car.status == 'requested' && req.param('status') == 'parked') || (car.status == 'accept' && req.param('status') == 'parked') || (car.status == 'complete' && req.param('status') == 'parked') || (car.status == 'accept' && req.param('status') == 'requested') || (car.status == 'complete' && req.param('status') == 'requested') || (car.status == 'complete' && req.param('status') == 'accept')) {
                                res.send({ success: 'success' });
                            } 
                            else {
                                updateRecords();
                            }
                        } else {
                            // id not found
                            // check already completed
                            completeCarProgress();
                        }   

                        function completeCarProgress(){
                            if(req.allParams().status == 'complete'){
                                var temp = req.allParams();
                                delete temp.ownerMobileNumber;
                                // find 
                                Mastertransactional.find().where({ "or" : [ { "transactionID": req.param('id') },  { "id": req.param('id') } ] }).exec(function found(err, masterData) {
                                    if (err) res.send({ success: 'failed2', err : err });
                                    car = masterData[0];
                                    if(req.param('revalidatedAt')){
                                        // revalidate 
                                        // - + fees values in fees collcted table 
                                        Account.findOne(car.accountID).exec(function found(err, accountVenues) {
                                            if(err) return res.send();
                                            if(accountVenues && accountVenues.timeZone)
                                                timeZone = accountVenues.timeZone;
                                            yearMonthVenueDataUpdate(()=> {});
                                            yearMonthTransDataUpdate(()=>{});
                                            totalVenueTansUpdate(()=>{});
                                            totalTransUpdate(()=>{});

                                            function yearMonthVenueDataUpdate(CBdone){
                                                Yearmonthvenuetransactional.find().where({"accountID": car.accountID,  "venueID": car.venue,  'year': moment.utc(car.updatedAt).tz(timeZone).format('YYYY')
                                                , 'month' : moment.utc(car.updatedAt).tz(timeZone).format('MM') }).exec(function found(err, masterData) { 
                                                    if(masterData.length > 0){
                                                        if(!car.fees)
                                                            car.fees = 0;
                                                        Yearmonthvenuetransactional.update(masterData[0].id, { fees : ((masterData[0].fees - car.fees) + req.param('fees'))   
                                                        }, function updated(err, car) {
                                                            CBdone();
                                                        });                       
                                                    } else 
                                                    CBdone();
                                                });
                                            }
                                            
                                            function yearMonthTransDataUpdate(CBdone){
                                                Yearmonthtransactional.find().where({ "accountID": car.accountID, 'year': moment.utc(car.updatedAt).tz(timeZone).format('YYYY')
                                                , 'month' : moment.utc(car.updatedAt).tz(timeZone).format('MM') }).exec(function found(err, masterData) { 
                                                    if(masterData.length > 0){
                                                        if(!car.fees)
                                                            car.fees = 0;
                                                        Yearmonthtransactional.update(masterData[0].id, {  fees : ((masterData[0].fees - car.fees) + req.param('fees'))   
                                                        }, function updated(err, car) {
                                                            CBdone();
                                                        });
                                                    } else 
                                                        CBdone();
                                                });
                                            }
                    
                                            function totalVenueTansUpdate(CBdone){
                                                Totalvenuetransactional.find().where({ "accountID": car.accountID,  "venueID": car.venue,'date': moment.utc(car.updatedAt).tz(timeZone).format('YYYY-MM-DD')}).exec(function found(err, masterData) { 
                                                    if(masterData.length > 0){
                                                        Totalvenuetransactional.update(masterData[0].id, {  fees : ((masterData[0].fees - car.fees) + req.param('fees'))
                                                        }, function updated(err, car) {
                                                            CBdone();
                                                        });
                                                    } else  
                                                        CBdone();
                                                });
                                            }
                    
                                            function totalTransUpdate(CBdone){
                                                Totaltransactional.find().where({ "accountID": car.accountID,'date': moment.utc(car.updatedAt).tz(timeZone).format('YYYY-MM-DD')}).exec(function found(err, masterData) { 
                                                    if(masterData.length > 0){
                                                        Totaltransactional.update(masterData[0].id, {  fees : ((masterData[0].fees - car.fees) + req.param('fees'))
                                                        }, function updated(err, car) {
                                                            CBdone();
                                                        });
                                                    } else  
                                                        CBdone();
                                                });
                                            }
                                        });
                                    }else {
                                        if((req.param('amountPaid') == "true" || req.param('amountPaid') == true ) && !car.amountPaid && req.param('fees') && req.param('fees') > 0)
                                            analysisService.insertDailyFeesData(car.accountID, car.venue, (req.param('fees') ? req.param('fees') : 0), ()=>{});
                                        
                                        if(req.param('cashAcceptedBy')){
                                            analysisService.insertDailyFeesData(car.accountID, car.venue, (req.param('fees') ? req.param('fees') : 0), ()=>{});
                                        }
                                    } 
                                    Venue.findOne(req.param('venue')).exec(function(err, venueDetails) {
                                        if (err) {
                                            venueDetails = {};
                                            return res.send({ success: 'failed3' , err : err });
                                        }
                                        sails.sockets.broadcast('myroom','dailytransactional',{
                                            message: 'socket event!', 
                                            data : {
                                                id: car.id,
                                                parkingID: car.parkingID,
                                                plateNumber: car.plateNumber,
                                                parkingZone: car.parkingZone,
                                                color: car.color,
                                                brand: car.brand,
                                                snap: car.snap,
                                                ownerMobileNumber: car.ownerMobileNumber,
                                                status: car.status,
                                                accountID: car.accountID,
                                                venue: venueDetails,
                                                log: car.log,
                                                loginAs: req.param('loginAs'),
                                                employeeID: car.employeeID,
                                                scratchesSnap: car.scratchesSnap,
                                                createdAt: car.createdAt,
                                                remarks: car.remarks,
                                                modelName: car.modelName,
                                                changeLog: car.changeLog,
                                            },
                                            id: car.id,
                                            verb : 'updated'
                                        });
                                        delete temp.id;
                                        Mastertransactional.update(masterData[0].id, temp, function updatedResult(err, car) {
                                            if (err) res.send({ success: 'failed4', err : err });
                                            console.log("-Master-accepted-");
                                            Dailytransactional.destroy(masterData[0].transactionID).exec(function destroy(err) {});
                                            res.send({ success: 'success' });
                                        });
                                    });
                                });
                            }
                        }

                        function updateRecords() {
                            var temp = req.allParams();
                            delete temp.ownerMobileNumber;

                            // if (car.status == 'parked' && req.param('status') == 'parked') {
                            //     if((req.param('amountPaid') == "true" || req.param('amountPaid') == true ) && !car.amountPaid && req.param('fees') && req.param('fees') > 0)
                            //         analysisService.insertDailyFeesData(car.accountID, car.venue, (req.param('fees') ? req.param('fees') : 0), ()=>{});
                            // } else {
            
                            if((req.param('amountPaid') == "true" || req.param('amountPaid') == true ) && !car.amountPaid && req.param('fees') && req.param('fees') > 0)
                                analysisService.insertDailyFeesData(car.accountID, car.venue, (req.param('fees') ? req.param('fees') : 0), ()=>{});
                            // }                            
                            if(req.allParams().status == 'complete'){
                                // destory car from daily transactional table 
                                Dailytransactional.destroy(req.param('id')).exec(function destroy(err) {});
                                completeCarProgress();
                            }else {
                                console.log("" + JSON.stringify(req.allParams()) + "\n\n\n\n");
                                Dailytransactional.update(req.param('id'), temp, function updatedResult(err, car1) {
                                    if (err) {
                                        console.log("errrrr " + JSON.stringify(err));
                                        return res.send({ success: 'failed5', err : err });
                                    }
                                    car = temp;
                                    console.log("-Daily-");
                                    Venue.findOne(car.venue).exec(function(err, venueDetails) {
                                        if (err) {
                                            venueDetails = {};
                                            console.log("errrrr " + JSON.stringify(err));
                                            return res.send({ success: 'failed6', err : err });
                                        }
                                        sails.sockets.broadcast('myroom','dailytransactional',{
                                            message: 'socket event!', 
                                            data : {
                                                id: car.id,
                                                parkingID: car.parkingID,
                                                plateNumber: car.plateNumber,
                                                parkingZone: car.parkingZone,
                                                color: car.color,
                                                brand: car.brand,
                                                snap: car.snap,
                                                ownerMobileNumber: car.ownerMobileNumber,
                                                status: car.status,
                                                accountID: car.accountID,
                                                venue: venueDetails,
                                                log: car.log,
                                                loginAs: req.param('loginAs'),
                                                employeeID: car.employeeID,
                                                scratchesSnap: car.scratchesSnap,
                                                createdAt: car.createdAt,
                                                remarks: car.remarks,
                                                modelName: car.modelName,
                                                changeLog: car.changeLog,
                                            },
                                            id: car.id,
                                            verb : 'updated'
                                        });
                                        Mastertransactional.find().where({ "transactionID": req.param('id') }).exec(function found(err, masterData) {
                                            if (err) res.send({ success: 'failed7', err : err });
                                            delete temp.id;
                                            Mastertransactional.update(masterData[0].id, temp, function updatedResult(err, car) {
                                                if (err) res.send({ success: 'failed8', err : err });
                                                console.log("-Master-accepted-");
                                                res.send({ success: 'success' });
                                            });
                                        });
                                    });
                                });
                            }                           
                        }
                    });
                }
            }
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed');
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    checkEvaletzServerUpbeforeSync: function(req, res, next) {
        return res.send({ success: 'success' });
    },
    venueWiseTotalticketUser: function(req, res, next) {
        // Mastertransactional.find().where({ venue : req.param('venueID') , accountID : req.param('accountID') }).exec(function found(err, masterData) {
        //     Venue.update(req.param('venueID'), { ticketNumerUsed : (masterData.length + 1) }, function venueUpdated(err, car) {
        //         return res.send({ newTicket : masterData.length + 1 });
        //     });
        // });
        Venue.findOne({ id : req.param('venueID')}).exec(function found(err, masterData) {
            if (err) return next(err);
            if(masterData){
                if(!masterData.ticketNumerUsed)
                    masterData.ticketNumerUsed = 0;
                Venue.update(req.param('venueID'), { 'ticketNumerUsed' : ( masterData.ticketNumerUsed + 1) }, function venueUpdated(err, car) {
                    if (err) return next(err);
                    return res.send({ newTicket : masterData.ticketNumerUsed + 1 });
                });
            }
        });
    },
    getCarDetailsforValidationforSearch: function(req,res,next){
        if (req.method === 'POST') {
            Dailytransactional.find().where({ or : 
                [ { 'parkingID' : req.param('search')}, 
                { 'plateNumber' : req.param('search')} 
                ]
            }).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                 return res.send({ car: car });
            });
        }
    },
    validatedByValidator: function(req,res,next){
        if (req.method === 'POST') {
            var carObj = {
                validatedBy : req.param('validatedBy'), 
                validatedAt: new Date()
            };
            Dailytransactional.update(req.param('id'), carObj).exec(function(err, carObj) {
                // var venueDetails = {};
                if(err){
                    res.send();
                } else {
                    try{
                        Venue.findOne(carObj[0].venue).exec(function(err, venueDetails) {
                            if (err) {
                                venueDetails = {};
                            }
                            sails.sockets.broadcast('myroom','dailytransactional',{
                                message: 'socket event!', 
                                data : {
                                    id: carObj[0].id,
                                    parkingID: carObj[0].parkingID,
                                    plateNumber: carObj[0].plateNumber,
                                    snap: carObj[0].snap,
                                    scratchesSnap: carObj[0].scratchesSnap,
                                    parkingZone: carObj[0].parkingZone,
                                    color: carObj[0].color,
                                    brand: carObj[0].brand,
                                    employeeID: carObj[0].employeeID,
                                    accountID: carObj[0].accountID,
                                    venue: venueDetails,
                                    status: carObj[0].status,
                                    log: carObj[0].log,
                                    changeLog: carObj[0].changeLog,
                                    loginAs:  carObj[0].loginAs,
                                    editCar: true,
                                    remarks: carObj[0].remarks,
                                    modelName: carObj[0].modelName,
                                    createdAt: carObj[0].createdAt,
                                    carID : carObj[0].carID,
                                    free :  carObj[0].free,
                                    documents :  carObj[0].documents,
                                    description :  carObj[0].description,
                                    updatedAt : carObj[0].updatedAt,
                                    customerType : carObj[0].customerType,
                                    cashierName : carObj[0].cashierName,
                                    fees : carObj[0].fees,
                                    amountPaid : carObj[0].amountPaid,
                                    validatedBy :  carObj[0].validatedBy, 
                                    validatedAt:  carObj[0].validatedAt
                                },
                                id: carObj[0].id,
                                verb : 'updated'
                            });
                            Dailytransactional.publishUpdate(carObj[0].id, {
                                id: carObj[0].id,
                                parkingID: carObj[0].parkingID,
                                plateNumber: carObj[0].plateNumber,
                                snap: carObj[0].snap,
                                scratchesSnap: carObj[0].scratchesSnap,
                                parkingZone: carObj[0].parkingZone,
                                color: carObj[0].color,
                                brand: carObj[0].brand,
                                employeeID: carObj[0].employeeID,
                                accountID: carObj[0].accountID,
                                venue: venueDetails,
                                status: carObj[0].status,
                                log: carObj[0].log,
                                changeLog: carObj[0].changeLog,
                                loginAs:  carObj[0].loginAs,
                                editCar: true,
                                remarks: carObj[0].remarks,
                                modelName: carObj[0].modelName,
                                createdAt: carObj[0].createdAt,
                                carID : carObj[0].carID,
                                free :  carObj[0].free,
                                documents :  carObj[0].documents,
                                description :  carObj[0].description,
                                updatedAt : carObj[0].updatedAt,
                                customerType : carObj[0].customerType,
                                cashierName : carObj[0].cashierName,
                                fees : carObj[0].fees,
                                amountPaid : carObj[0].amountPaid,
                                validatedBy :  carObj[0].validatedBy, 
                                validatedAt:  carObj[0].validatedAt
                            });
                        });
                        var carObj1 = {
                            free : true,
                            validatedBy : req.param('validatedBy'), 
                            validatedAt: new Date()
                        }
                        Mastertransactional.update({ "transactionID": req.param('id') }, carObj1).exec(function(err, carObj1) {
                            res.send({ success: "success" });
                        });
                    }catch(e){
                        res.send();
                    }
                }
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to requested car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    validatedByCashier: function(req,res,next){ 
        if (req.method === 'POST') {
            var log = [];
            Dailytransactional.findOne(req.param('id')).populateAll().exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }

                if (car.status == "parked") {
                    if (car.log != undefined) {
                        for (var i = 0; i < car.log.length; i++) {
                            log.push(car.log[i]);
                        }
                    }

                    console.log(JSON.stringify(car) + "Actual Status" + car.status);

                    var updatedLog = {
                        'activity': 'requested',
                        'by': req.param('cashAcceptedBy').userName,
                        'at': new Date(),
                        'userProfile': req.param('cashAcceptedBy').profileImage
                    };
    
                    // console.log('request car server==>==>==>' + JSON.stringify(updatedLog));
                    log.push(updatedLog);

                    var ownerDetails = {
                        // ownerMobileNumber: req.param('cashAcceptedBy').mobile,
                        status: 'requested',
                        log: log,
                        cashAcceptedBy: req.param('cashAcceptedBy'),
                        cashAcceptedAt : new Date(),
                        fees :  req.param('fees')
                    };

                    if(req.param('bill'))
                        ownerDetails['bill'] = req.param('bill');

                    if(req.param('feeSplitUp'))
                        ownerDetails['feeSplitUp'] = req.param('feeSplitUp');

                    if(req.param('otherInfo'))
                        ownerDetails['otherInfo'] = req.param('otherInfo');

                    if(!car.validatedBy && req.param('validationType')){
                        ownerDetails['validatedBy'] = req.param('cashAcceptedBy');
                        ownerDetails['validatedBy'].validationType = req.param('validationType');  // type 1 / 2 
                        ownerDetails['validatedAt'] = new Date();
                        ownerDetails['documents']  = req.param('documents'); 
                        ownerDetails['description']  = req.param('description'); 
                    }

                    Dailytransactional.update(car.id, ownerDetails, function venueUpdated(err, car) {
                        console.log("-Updated-");
                        // var venueDetails = {};

                        Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                            if (err) {
                                venueDetails = {};
                            }

                            sails.sockets.broadcast('myroom','dailytransactional',{
                                message: 'socket event!', 
                                data : {
                                    id: car[0].id,
                                    parkingID: car[0].parkingID,
                                    plateNumber: car[0].plateNumber,
                                    parkingZone: car[0].parkingZone,
                                    color: car[0].color,
                                    brand: car[0].brand,
                                    snap: car[0].snap,
                                    ownerMobileNumber: car[0].ownerMobileNumber,
                                    status: car[0].status,
                                    accountID: car[0].accountID,
                                    venue: venueDetails,
                                    log: car[0].log,
                                    changeLog: car[0].changeLog,
                                    remarks: car[0].remarks,
                                    modelName: car[0].modelName,
                                    createdAt: car[0].createdAt, //new Date(),
                                    customerType :  car[0].customerType,
                                    carID : car[0].carID,
                                    free :  car[0].free,
                                    documents :  car[0].documents,
                                    description :  car[0].description,
                                    updatedAt : car[0].updatedAt,
                                    fees : car[0].fees, 
                                    validatedBy : car[0].validatedBy,
                                    validatedAt : car[0].validatedAt, 
                                    cashAcceptedBy : car[0].cashAcceptedBy, 
                                    cashAcceptedAt : car[0].cashAcceptedAt,
                                    bill : car[0].bill
                                },
                                id: car[0].id,
                                verb : 'updated'
                            });
                            console.log("Venue Detail" + JSON.stringify(venueDetails));
                            Dailytransactional.publishUpdate(car[0].id, {
                                id: car[0].id,
                                parkingID: car[0].parkingID,
                                plateNumber: car[0].plateNumber,
                                parkingZone: car[0].parkingZone,
                                color: car[0].color,
                                brand: car[0].brand,
                                snap: car[0].snap,
                                ownerMobileNumber: car[0].ownerMobileNumber,
                                status: car[0].status,
                                accountID: car[0].accountID,
                                venue: venueDetails,
                                log: car[0].log,
                                changeLog: car[0].changeLog,
                                remarks: car[0].remarks,
                                modelName: car[0].modelName,
                                createdAt: car[0].createdAt, //new Date(),
                                customerType :  car[0].customerType,
                                carID : car[0].carID,
                                free :  car[0].free,
                                documents :  car[0].documents,
                                description :  car[0].description,
                                updatedAt : car[0].updatedAt,
                                fees : car[0].fees, 
                                validatedBy : car[0].validatedBy,
                                validatedAt : car[0].validatedAt, 
                                cashAcceptedBy : car[0].cashAcceptedBy, 
                                cashAcceptedAt : car[0].cashAcceptedAt,
                                bill : car[0].bill
                            });

                        });
                        //publishcreate
                        Mastertransactional.find().where({ "transactionID": car[0].id }).exec(function found(err, masterData) {
                            if(!err){
                                Mastertransactional.update(masterData[0].id, ownerDetails, function venueUpdated(err, car) {
                                    console.log("-Master-Updated-");
                                    // Amount saving during verify & request 
                                    // Venue.findOne(masterData[0].venue).exec(function(err, venueDetails) {
                                    //     if(venueDetails){
                                    //         if(venueDetails.settings && venueDetails.settings.verifyOption && req.param('fees'))
                                    //             analysisService.insertDailyFeesData(masterData[0].accountID, masterData[0].venue, req.param('fees'), ()=>{});
                                    //     }
                                    // });
                                });
                            }
                        });
                    });
                    return res.send({ car: car });
                } else if (car.status == "requested") {
                    console.log("Car requested already. It will be ready soon. Please try after some time for the status!");
                    return res.send({
                        car: {
                            status: "requested",
                            message: "Car requested already. It will be ready soon. Please try after some time for the status!"
                        }
                    });
                } else if (car.status == "accept") {
                    console.log("Car request processed. It is ready in portico!!!");
                    return res.send({
                        car: {
                            status: "accept",
                            message: "Car request processed. It is ready in portico!!!"
                        }
                    });

                }
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to requested car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    revalidatedByCashier: function(req,res,next){ 
        if (req.method === 'POST') {
            var timeZone = '';
            Mastertransactional.findOne(req.param('id')).exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }

                if (car.status == "complete") {
                    if(car.log[car.log.length - 1 ].activity == 'completed'){
                        car.log[car.log.length - 1 ].fees = req.param('fees');
                    }

                    var ownerDetails = {
                        log : car.log,
                        fees :  req.param('fees'),
                        feeSplitUp : req.param('feeSplitUp'),
                        newfeeSplitUp : req.param('newfeeSplitUp')
                    };

                    Account.findOne(req.param('accountID')).exec(function found(err, accountData) {
                        console.log(accountData)
                        if(!accountData.timeZone)
                            timeZone =  "Asia/Kolkata";
                        else 
                            timeZone  = accountData.timeZone;

                        yearMonthVenueDataUpdate(()=> {
                            yearMonthTransDataUpdate(()=>{
                                totalVenueTansUpdate(()=>{
                                    totalTransUpdate(()=>{
                                
                                        if(!car.revalidatedBy && req.param('validationType')){
                                            ownerDetails['revalidatedBy'] = req.param('revalidatedBy');
                                            ownerDetails['revalidatedBy'].validationType = req.param('validationType');  // type 1 / 2 ....
                                            ownerDetails['revalidatedAt'] = new Date();
                                            ownerDetails['documents']  = req.param('documents'); 
                                            ownerDetails['description']  = req.param('description'); 
                                        }
                                        if(req.param('bill'))
                                            ownerDetails['bill'] = req.param('bill');

                                        Mastertransactional.update(car.id, ownerDetails, function venueUpdated(err, car) {
                                            console.log("-Updated-");
                                            // var venueDetails = {};
                    
                                            Venue.findOne(car[0].venue).exec(function(err, venueDetails) {
                                                if (err) {
                                                    venueDetails = {};
                                                }
                    
                                                sails.sockets.broadcast('myroom','mastertransactional',{
                                                    message: 'socket event!', 
                                                    data : {
                                                        id: car[0].id,
                                                        parkingID: car[0].parkingID,
                                                        plateNumber: car[0].plateNumber,
                                                        parkingZone: car[0].parkingZone,
                                                        color: car[0].color,
                                                        brand: car[0].brand,
                                                        snap: car[0].snap,
                                                        ownerMobileNumber: car[0].ownerMobileNumber,
                                                        status: car[0].status,
                                                        accountID: car[0].accountID,
                                                        venue: venueDetails,
                                                        log: car[0].log,
                                                        changeLog: car[0].changeLog,
                                                        remarks: car[0].remarks,
                                                        modelName: car[0].modelName,
                                                        createdAt: car[0].createdAt, //new Date(),
                                                        customerType :  car[0].customerType,
                                                        carID : car[0].carID,
                                                        free :  car[0].free,
                                                        documents :  car[0].documents,
                                                        description :  car[0].description,
                                                        updatedAt : car[0].updatedAt,
                                                        fees : car[0].fees, 
                                                        validatedBy : car[0].validatedBy,
                                                        validatedAt : car[0].validatedAt, 
                                                        cashAcceptedBy : car[0].cashAcceptedBy, 
                                                        cashAcceptedAt : car[0].cashAcceptedAt,
                                                        revalidatedBy : car[0].revalidatedBy,
                                                        revalidatedAt : car[0].revalidatedAt,
                                                        feeSplitUp :  car[0].feeSplitUp,
                                                        newfeeSplitUp :  car[0].newfeeSplitUp
                                                    },
                                                    id: car[0].id,
                                                    verb : 'updated'
                                                });
                                                console.log("Venue Detail" + JSON.stringify(venueDetails));
                                                Mastertransactional.publishUpdate(car[0].id, {
                                                    id: car[0].id,
                                                    parkingID: car[0].parkingID,
                                                    plateNumber: car[0].plateNumber,
                                                    parkingZone: car[0].parkingZone,
                                                    color: car[0].color,
                                                    brand: car[0].brand,
                                                    snap: car[0].snap,
                                                    ownerMobileNumber: car[0].ownerMobileNumber,
                                                    status: car[0].status,
                                                    accountID: car[0].accountID,
                                                    venue: venueDetails,
                                                    log: car[0].log,
                                                    changeLog: car[0].changeLog,
                                                    remarks: car[0].remarks,
                                                    modelName: car[0].modelName,
                                                    createdAt: car[0].createdAt, //new Date(),
                                                    customerType :  car[0].customerType,
                                                    carID : car[0].carID,
                                                    free :  car[0].free,
                                                    documents :  car[0].documents,
                                                    description :  car[0].description,
                                                    updatedAt : car[0].updatedAt,
                                                    fees : car[0].fees, 
                                                    validatedBy : car[0].validatedBy,
                                                    validatedAt : car[0].validatedAt, 
                                                    cashAcceptedBy : car[0].cashAcceptedBy, 
                                                    cashAcceptedAt : car[0].cashAcceptedAt,
                                                    revalidatedBy : car[0].revalidatedBy,
                                                    revalidatedAt : car[0].revalidatedAt,
                                                    feeSplitUp :  car[0].feeSplitUp,
                                                    newfeeSplitUp :  car[0].newfeeSplitUp
                                                });                
                                            });
                    
                                        });
                                    });
                                });
                            });
                        });


                        function yearMonthVenueDataUpdate(CBdone){
                            Yearmonthvenuetransactional.find().where({ "accountID": req.param('accountID'), "venueID": req.param('venueID'),  'year': moment.utc(car.updatedAt).tz(timeZone).format('YYYY')
                            , 'month' : moment.utc(car.updatedAt).tz(timeZone).format('MM') }).exec(function found(err, masterData) { 
                                if(masterData.length > 0){
                                    if(!car.fees)
                                        car.fees = 0;
                                    Yearmonthvenuetransactional.update(masterData[0].id, { fees : ((masterData[0].fees - car.fees) + req.param('fees'))   
                                    }, function updated(err, car) {
                                        CBdone();
                                    });                       
                                } else 
                                CBdone();
                            });
                        }
                        
                        function yearMonthTransDataUpdate(CBdone){
                            Yearmonthtransactional.find().where({ "accountID": req.param('accountID'), 'year': moment.utc(car.updatedAt).tz(timeZone).format('YYYY')
                            , 'month' : moment.utc(car.updatedAt).tz(timeZone).format('MM') }).exec(function found(err, masterData) { 
                                if(masterData.length > 0){
                                    if(!car.fees)
                                        car.fees = 0;
                                    Yearmonthtransactional.update(masterData[0].id, {  fees : ((masterData[0].fees - car.fees) + req.param('fees'))   
                                    }, function updated(err, car) {
                                        CBdone();
                                    });
                                } else 
                                    CBdone();
                            });
                        }
    
                        
    
                        function totalVenueTansUpdate(CBdone){
                            Totalvenuetransactional.find().where({ "accountID": req.param('accountID'),  "venueID": req.param('venueID'),'date': moment.utc(car.updatedAt).tz(timeZone).format('YYYY-MM-DD')}).exec(function found(err, masterData) { 
                                if(masterData.length > 0){
                                    Totalvenuetransactional.update(masterData[0].id, {  fees : ((masterData[0].fees - car.fees) + req.param('fees'))
                                    }, function updated(err, car) {
                                        CBdone();
                                    });
                                } else  
                                    CBdone();
                            });
                        }


                        function totalTransUpdate(CBdone){
                            Totaltransactional.find().where({ "accountID": req.param('accountID'),'date': moment.utc(car.updatedAt).tz(timeZone).format('YYYY-MM-DD')}).exec(function found(err, masterData) { 
                                if(masterData.length > 0){
                                    Totaltransactional.update(masterData[0].id, {  fees : ((masterData[0].fees - car.fees) + req.param('fees'))
                                    }, function updated(err, car) {
                                        CBdone();
                                    });
                                } else  
                                    CBdone();
                            });
                        }

                    });
                    return res.send({ car: car });
                } else 
                    return res.send({});
            });
        } else if (req.isSocket) {
            // Mastertransactional.find({}).exec(function(e, listOfDaily) {
            //     Mastertransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to requested car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    venueWiseBillNumberUser: function(req, res, next) {
        Venue.findOne({ id : req.param('venueID')}).exec(function found(err, masterData) {
            if (err) return next(err);
            if(masterData){
                if(!masterData.billNumberUsed)
                    masterData.billNumberUsed = 0;
                Venue.update(req.param('venueID'), { 'billNumberUsed' : ( masterData.billNumberUsed + 1) }, function venueUpdated(err, car) {
                    if (err) return next(err);
                    return res.send({ newBillNumber : masterData.billNumberUsed + 1 });
                });
            }
        });
    },
    reverseCarStatusIntoParkedState: function(req, res, next) {
        if (req.method === 'POST') {
            Dailytransactional.findOne(req.param('id')).exec(function foundCar(err, car) {
                if (err) return next(err);
                if (!car) {
                    res.send({ notValidCar: 'notValidCar' });
                    return;
                }
                if(car){
                    if(car.log.length > 0){
                        if(car.log.length == 2)
                            car.log.splice(1,1);
                        if(car.log.length == 3){
                            car.log.splice(2,1);
                            car.log.splice(1,1);
                        }
                        updateMaster(car);
                    }
                }
                function updateMaster(car){
                    Dailytransactional.update(req.param('id'), { log : car.log, status : 'parked' }, function updated(err, updatedCar) {
                        if (err) return next(err);
                        Mastertransactional.find().where({ "transactionID": car.id }).exec(function found(err, masterData) {
                            if (err) return next(err);
                            if(masterData && masterData.length > 0){
                                Mastertransactional.update(masterData[0].id, { log : car.log, status : 'parked' }, function updated(err, masterCarUpdated) {
                                    if (err) return next(err);
                                    try{
                                        Venue.findOne({ id : car.venue}).exec(function found(err, venue) {
                                            updatedCar[0].venue = venue;
                                            sails.sockets.broadcast('myroom','dailytransactional',{
                                                message: 'socket event!', 
                                                data : updatedCar[0],
                                                id: updatedCar[0].id,
                                                verb : 'reversed'
                                            });
                                        });
                                    } catch(e){}
                                    return res.send({ car : car});
                                });
                            }
                        });
                    });
                }
            });
        } 
    },
    // insertAmountWhileFeeCollected: function(req, res, next){
    //     Dailytransactional.findOne(req.param('id')).exec(function foundCar(err, car) {
    //         if(err) return next(err);
    //         if(car){
    //             if(car.amountPaid)
    //                 analysisService.insertDailyFeesData(car.accountID, car.venue, car.fees);
    //         }
    //     });
    // }
};

// async function sendNotificationViaFCM(car) {
//     const car = await Car.findOne({ parkingID: 'car8' })
//     let tokens = await NotificationSubscription.find({ user: car.employeeID })

//     tokens = tokens.reduce((tokens, subscription) => {
//         return [...tokens, subscription.token];
//     }, []);

//     if (tokens) {
//         const message = {
//             tokens,
//             notification: {
//                 title: 'On The Way',
//                 body: `Your ${car.brand} is on the way. Please be ready.`
//             }
//         }

//         const data = {}

//         try {
//             const response = await admin.messaging().sendMulticast(message)
//             data.FCMsuccess = response
//         } catch (err) {
//             data.FCMerror = err
//         }

//         return res.send({ car: 'success', data });
//     }
// }