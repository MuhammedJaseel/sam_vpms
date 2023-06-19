var path = require('path');
var nodemailer = require('nodemailer');
var fs = require("fs");
var xl = require('excel4node');
var _ = require('lodash');
var exportService = require('../services/exportService.js');
var moment = require('moment');
var momentTZ = require('moment-timezone');
var timezone = "Asia/Kolkata";
sails = require('sails');
var ObjectId = require('mongodb').ObjectID;
var SPaccountID = process.env.SP_ACCOUNT_ID; // Get today completed after 2 AM (Only for Secure Parking)

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
    // update car details
    updateParkedZone: function(req, res, next) {
        if (req.method === 'POST') {
            console.log('update parked zone ' + req.param('parkingZone'));
            Dailytransactional.findOne({ id: req.param('id') }).exec(function findCar(err, foundData) {
                if (err) return next(err);
                Dailytransactional.update(req.param('id'), { parkingZone: req.param('parkingZone') }, function userUpdated(err, car) {
                    if (err) return next(err);
                    console.log('parkingZone Updated...');
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
                                log: car[0].log
        
                            },
                            id: car[0].id,
                            verb : 'updated'
                        });
                        // console.log("Venue Detail" + JSON.stringify(venueDetails));
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
                            log: car[0].log
    
                        });
    
                    });
                    Mastertransactional.find().where({ "transactionID": req.param('id') }).exec(function found(err, masterData) {
                        if (err) return next(err);
                        Mastertransactional.update(masterData[0].id, { parkingZone: req.param('parkingZone') }, function venueUpdated(err, car) {
                            if (err) return next(err);
                            console.log("-Master-Updated-");
                        });
                    });
                    return res.send({ success: 'success' });
                });
            });
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('socket id ' + req.socket.id + ' is now subscribed to requested car');
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    getCarDetailsFromAPICall: function(req, res, next) {
        if (req.method === 'POST') {
            var parkedCar = [];
            var requestedCar = [];
            var veneuesProcessed = 0;
            if (req.param('role') === 'manager' || req.param('role') === 'chauffeur' || req.param('role') === 'driver') {
                var venueIDs = req.param('venueID');
                for (var j = 0; j < venueIDs.length; j++) {
                    Dailytransactional.find().where({ "venue": venueIDs[j].id }).populate('venue').exec(function found(err, dailyData) {
                        if (err) return next(err);
                        for (var i = 0; i < dailyData.length; i++) {
                            if (dailyData[i].status == "parked") {
                                parkedCar.push(dailyData[i]);
                            }
                            if (dailyData[i].status == "requested" || dailyData[i].status == "accept") {
                                requestedCar.push(dailyData[i]);
                            }
                        }
                        veneuesProcessed++;
                        if (veneuesProcessed == venueIDs.length) {
                            res.send({ parked: parkedCar, requested: requestedCar });

                        }
                    });
                }
                if (venueIDs.length == 0)
                    res.send({ notFound: 'notFound' });
            } else if (req.param('role') == 'accountadmin') {
                Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    for (var j = 0; j < accountVenues.venues.length; j++) {
                        Dailytransactional.find().where({ "venue": accountVenues.venues[j].id }).populate('venue').exec(function found(err, dailyData) {
                            if (err) return next(err);
                            for (var i = 0; i < dailyData.length; i++) {
                                if (dailyData[i].status == "parked") {
                                    parkedCar.push(dailyData[i]);
                                }
                                if (dailyData[i].status == "requested" || dailyData[i].status == "accept") {
                                    requestedCar.push(dailyData[i]);
                                }
                            }
                            veneuesProcessed++;
                            if (veneuesProcessed == accountVenues.venues.length) {
                                console.log('accountadmin');
                                res.send({ parked: parkedCar, requested: requestedCar, accountVenues: accountVenues.venues });
                            }
                        });
                    }
                });
            } else if (req.param('role') == 'admin') {
                // Dailytransactional.find().populateAll().exec(function found(err, dailyData) { //
                //     if (err) return next(err);
                //     for (var i = 0; i < dailyData.length; i++) {
                //         if (dailyData[i].status == "parked") {
                //             parkedCar.push(dailyData[i]);
                //         }
                //         if (dailyData[i].status == "requested" || dailyData[i].status == "accept") {
                //             requestedCar.push(dailyData[i]);
                //         }

                //     }
                    // console.log('admin');
                    res.send({ parked: [], requested: [] });
                // });
            } else 
                return res.send();
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('Dailytransactional with socket id ' + req.socket.id + ' is now subscribed');
            // });
        }
    },
    getCarDetailsFromAPICallOnlyforOscar: function(req, res, next) {
        if (req.method === 'POST') {
            var parkedCar = [];
            var requestedCar = [];
            var veneuesProcessed = 0;
            // process.kill(process.pid, 'SIGUSR2');
            if (req.param('role') == 'manager' || req.param('role') == 'chauffeur' || req.param('role') == 'driver') {
                var venueIDs = req.param('venueID');
                for (var j = 0; j < venueIDs.length; j++) {
                    Dailytransactional.find({},{
                        "fields":
                        {
                            "parkingID": 1,
                            "plateNumber": 1,
                            "snap": 1,
                            "parkingZone": 1,
                            "color": 1,
                            "brand": 1,
                            "status": 1,
                            // "modelName": 1,
                            "log": 1,
                            // "changeLog": 1,
                            "scratchesSnap": 1,
                            "loginAs": 1,
                            "remarks": 1,
                            "customerType": 1,
                            "free": 1,
                            "documents": 1,
                            "description": 1,
                            "createdAt" : 1,
                            "updatedAt" : 1,
                            "venue": 1,
                            "fees": 1,
                            "validatedBy" :1,
                            "validatedAt" : 1,
                            "cashAcceptedBy" : 1,
                            "cashAcceptedAt" : 1,
                            "id": 1, 
                            'feeSplitUp' : 1,
                            'newfeeSplitUp' : 1
                        }
                    }).where({ "venue": venueIDs[j].id }).populate('venue').exec(function found(err, dailyData) {
                        if (err) return next(err);
                        for (var i = 0; i < dailyData.length; i++) {
                            if (dailyData[i].status == "parked") {
                                parkedCar.push(dailyData[i]);
                            }
                            if (dailyData[i].status == "requested" || dailyData[i].status == "accept") {
                                requestedCar.push(dailyData[i]);
                            }
                        }
                        veneuesProcessed++;
                        if (veneuesProcessed == venueIDs.length) {
                            res.send({ parked: parkedCar, requested: requestedCar });
                            parkedCar = null;
                            requestedCar = null;
                        }
                    });

                }
                if (venueIDs.length == 0)
                    res.send({ notFound: 'notFound' });
            } else if (req.param('role') == 'accountadmin') {
                Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    for (var j = 0; j < accountVenues.venues.length; j++) {
                        Dailytransactional.find({},{
                            "fields":
                            {
                                "parkingID": 1,
                                "plateNumber": 1,
                                "snap": 1,
                                "parkingZone": 1,
                                "color": 1,
                                "brand": 1,
                                "status": 1,
                                // "modelName": 1,
                                "log": 1,
                                // "changeLog": 1,
                                "scratchesSnap": 1,
                                "loginAs": 1,
                                "remarks": 1,
                                "customerType": 1,
                                "free": 1,
                                "documents": 1,
                                "description": 1,
                                "createdAt" : 1,
                                "updatedAt" : 1,
                                "venue": 1,
                                "fees": 1,
                                "validatedBy" :1,
                                "validatedAt" : 1,
                                "cashAcceptedBy" : 1,
                                "cashAcceptedAt" : 1,
                                "id": 1, 
                                'feeSplitUp' : 1,
                                'newfeeSplitUp' : 1
                            }
                        }).where({ "venue": accountVenues.venues[j].id }).populate('venue').exec(function found(err, dailyData) {
                            if (err) return next(err);
                            for (var i = 0; i < dailyData.length; i++) {
                                if (dailyData[i].status == "parked") {
                                    parkedCar.push(dailyData[i]);
                                }
                                if (dailyData[i].status == "requested" || dailyData[i].status == "accept") {
                                    requestedCar.push(dailyData[i]);
                                }
                            }
                            veneuesProcessed++;
                            if (veneuesProcessed == accountVenues.venues.length) {
                                console.log('accountadmin');
                                res.send({ parked: parkedCar, requested: requestedCar, accountVenues: accountVenues.venues });
                                parkedCar = null;
                                requestedCar = null;
                                // setTimeout(() => {
                                //     process.kill(process.pid, 'SIGUSR2');
                                //     // parkedCar = null;
                                //     // requestedCar = null;
                                // }, 10000);
                                
                            }
                        });
                    }
                });
            } else if (req.param('role') == 'admin') {
                // Dailytransactional.find().populateAll().exec(function found(err, dailyData) { //
                //     if (err) return next(err);
                //     for (var i = 0; i < dailyData.length; i++) {
                //         if (dailyData[i].status === "parked") {
                //             parkedCar.push(dailyData[i]);
                //         }
                //         if (dailyData[i].status === "requested" || dailyData[i].status === "accept") {
                //             requestedCar.push(dailyData[i]);
                //         }

                //     }
                    // console.log('admin');
                    res.send({ parked: [], requested: [] });
                //     parkedCar = null;
                //     requestedCar = null;
                // });
            } else {
                return res.send();
            }
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('Dailytransactional with socket id ' + req.socket.id + ' is now subscribed');
            // });
        }
    },
    getCarDetailsFromAPICallOnlyforOscarwithLazyLoading: function(req, res, next) {
        if (req.method === 'POST') {
            if (req.param('role') == 'manager' || req.param('role') == 'chauffeur' || req.param('role') == 'driver') {
                var venueIDs = req.param('venueID');
                if(venueIDs.length > 0){
                    var query = {};
                    Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                        if(err) return res.send();
                        if(accountVenues && accountVenues.timeZone)
                            timezone = accountVenues.timeZone;
                            if(req.param('status') != 'requested'){
                                query = { 'status' : req.param('status')}
                            } 
        
                            if(req.param('venueID') &&  venueIDs.length > 0)
                                query['venue'] = venueIDs[0].id
        
                            if(req.param('search') && req.param('status') != 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                            } 
                            
                            if(req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                                query['status'] = { "!": 'parked' }
                            }
        
                            if(!req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { status  : { contains: 'requested' } },
                                    { status  : { contains: 'accept' } },
                                    { status  : { contains: 'ready' } }
                                ]
                            }
        
                            if(req.param('status') == 'complete'){
                                query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),timezone)).format() }
                                ////////////////////////////////
                            }
                            
                           if(req.param('status') != 'complete'){
                                Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    Dailytransactional.find({},{
                                        "fields":
                                        {
                                            "parkingID": 1,
                                            "plateNumber": 1,
                                            "snap": 1,
                                            "parkingZone": 1,
                                            "color": 1,
                                            "brand": 1,
                                            "status": 1,
                                            "modelName": 1,
                                            "log": 1,
                                            // "changeLog": 1,
                                            "scratchesSnap": 1,
                                            "loginAs": 1,
                                            "remarks": 1,
                                            "customerType": 1,
                                            "free": 1,
                                            "documents": 1,
                                            "description": 1,
                                            "createdAt" : 1,
                                            "updatedAt" : 1,
                                            "venue": 1,
                                            "fees": 1,
                                            "validatedBy" :1,
                                            "validatedAt" : 1,
                                            "cashAcceptedBy" : 1,
                                            "cashAcceptedAt" : 1,
                                            "id": 1, 
                                            'feeSplitUp' : 1,
                                            'newfeeSplitUp' : 1,
                                            'amountPaid' : 1, 
                                            otherInfo : 1
                                        }
                                    }).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue').exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        return res.send(_temp);
                                    });
                                });
                           } else {
                                Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    Mastertransactional.find({},{
                                        "fields":
                                        {
                                            "parkingID": 1,
                                            "plateNumber": 1,
                                            "snap": 1,
                                            "parkingZone": 1,
                                            "color": 1,
                                            "brand": 1,
                                            "status": 1,
                                            "modelName": 1,
                                            "log": 1,
                                            // "changeLog": 1,
                                            "scratchesSnap": 1,
                                            "loginAs": 1,
                                            "remarks": 1,
                                            "customerType": 1,
                                            "free": 1,
                                            "documents": 1,
                                            "description": 1,
                                            "createdAt" : 1,
                                            "updatedAt" : 1,
                                            "venue": 1,
                                            "fees": 1,
                                            "validatedBy" :1,
                                            "validatedAt" : 1,
                                            "cashAcceptedBy" : 1,
                                            "cashAcceptedAt" : 1,
                                            "id": 1, 
                                            'feeSplitUp' : 1,
                                            'newfeeSplitUp' : 1,
                                            'amountPaid' : 1, 
                                            otherInfo : 1
                                        }
                                    }).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').populate('venue').exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        // if(req.param('skip') == 0)
                                        //     _temp['accountVenues'] = accountVenues.venues;
                                        return res.send(_temp);
                                    });
                                });
                           }
                    });
                }
                if (venueIDs.length == 0)
                    res.send({ notFound: 'notFound' });
            } else if (req.param('role') == 'accountadmin') {
                Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    if(accountVenues.timeZone)
                        timezone = accountVenues.timeZone;
                    var query = {};
                    if(req.param('status') != 'requested'){
                        query = { "accountID": req.param('accountID'), 'status' : req.param('status')}
                    } else 
                        query = { "accountID": req.param('accountID')}


                    if(req.param('venueID') &&  req.param('venueID').length > 0)
                        query['venue'] = req.param('venueID')[0].id;

                    if(req.param('search') && req.param('status') != 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                    } 
                    
                    if(req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                        query['status'] = { "!": 'parked' }
                    }

                    if(!req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { status  : { contains: 'requested' } },
                            { status  : { contains: 'accept' } },
                            { status  : { contains: 'ready' } }
                        ]
                    }

                    if(req.param('status') == 'complete'){
                        query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"), timezone)).format() }
                        ////////////////////////////////
                    }
                    
                   if(req.param('status') != 'complete'){
                        Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                            Dailytransactional.find({},{
                                "fields":
                                {
                                    "parkingID": 1,
                                    "plateNumber": 1,
                                    "snap": 1,
                                    "parkingZone": 1,
                                    "color": 1,
                                    "brand": 1,
                                    "status": 1,
                                    "modelName": 1,
                                    "log": 1,
                                    // "changeLog": 1,
                                    "scratchesSnap": 1,
                                    "loginAs": 1,
                                    "remarks": 1,
                                    "customerType": 1,
                                    "free": 1,
                                    "documents": 1,
                                    "description": 1,
                                    "createdAt" : 1,
                                    "updatedAt" : 1,
                                    "venue": 1,
                                    "fees": 1,
                                    "validatedBy" :1,
                                    "validatedAt" : 1,
                                    "cashAcceptedBy" : 1,
                                    "cashAcceptedAt" : 1,
                                    "id": 1, 
                                    'feeSplitUp' : 1,
                                    'newfeeSplitUp' : 1,
                                    'amountPaid' : 1, 
                                    otherInfo : 1
                                }
                            }).where(query).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' ) ).skip(req.param('skip')).limit(req.param('limit')).populate('venue').exec(function found(err, dailyData) {
                                if (err) return next(err);
                                var _temp = { car: dailyData, length : dailyDataLength};
                                if(req.param('skip') == 0 &&  req.param('status')  == 'parked')
                                    _temp['accountVenues'] = accountVenues.venues;
                                return res.send(_temp);
                            });
                        });
                   } else {
                        Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                            Mastertransactional.find({},{
                                "fields":
                                {
                                    "parkingID": 1,
                                    "plateNumber": 1,
                                    "snap": 1,
                                    "parkingZone": 1,
                                    "color": 1,
                                    "brand": 1,
                                    "status": 1,
                                    "modelName": 1,
                                    "log": 1,
                                    // "changeLog": 1,
                                    "scratchesSnap": 1,
                                    "loginAs": 1,
                                    "remarks": 1,
                                    "customerType": 1,
                                    "free": 1,
                                    "documents": 1,
                                    "description": 1,
                                    "createdAt" : 1,
                                    "updatedAt" : 1,
                                    "venue": 1,
                                    "fees": 1,
                                    "validatedBy" :1,
                                    "validatedAt" : 1,
                                    "cashAcceptedBy" : 1,
                                    "cashAcceptedAt" : 1,
                                    "id": 1, 
                                    'feeSplitUp' : 1,
                                    'newfeeSplitUp' : 1,
                                    'amountPaid' : 1, 
                                    otherInfo : 1
                                }
                            }).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').populate('venue').exec(function found(err, dailyData) {
                                if (err) return next(err);
                                var _temp = { car: dailyData, length : dailyDataLength};
                                // if(req.param('skip') == 0)
                                //     _temp['accountVenues'] = accountVenues.venues;
                                return res.send(_temp);
                            });
                        });
                   }
                });
            } else if (req.param('role') == 'admin') {
                // Dailytransactional.find().populateAll().exec(function found(err, dailyData) { //
                //     if (err) return next(err);
                    // for (var i = 0; i < dailyData.length; i++) {
                    //     if (dailyData[i].status == "parked") {
                    //         parkedCar.push(dailyData[i]);
                    //     }
                    //     if (dailyData[i].status == "requested" || dailyData[i].status == "accept") {
                    //         requestedCar.push(dailyData[i]);
                    //     }

                    // }
                    // console.log('admin');
                    res.send({ parked: [], requested: [] });
                // });
            } else 
                return res.send();
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('Dailytransactional with socket id ' + req.socket.id + ' is now subscribed');
            // });
        }
    },
    getCarDetailsFromAPICallOnlyforMobilewithLazyLoading: function(req, res, next) {
        if (req.method === 'POST') {
            var mobileFilelds = {
                "fields":
                {
                    "parkingID": 1,
                    "plateNumber": 1,
                    "parkingZone": 1,
                    // "color": 1,
                    "brand": 1,
                    "status": 1,
                    "modelName": 1,
                    "log": 1,
                    // "loginAs": 1,
                    "free": 1,
                    "createdAt" : 1,
                    "updatedAt" : 1,
                    "venue": 1,
                    "fees": 1,
                    "validatedBy" :1,
                    // "validatedAt" : 1,
                    // "cashAcceptedBy" : 1,
                    // "cashAcceptedAt" : 1,
                    "id": 1, 
                    // 'feeSplitUp' : 1,
                    'newfeeSplitUp' : 1,
                    "bill": 1,
                    // "revalidatedBy" : 1,
                    "amountPaid" : 1,
                    "ownerMobileNumber": 1,
                    "otherInfo": 1
                }
            };
            if (req.param('role') == 'manager' || req.param('role') == 'chauffeur' || req.param('role') == 'driver') {
                var venueIDs = req.param('venueID');
                if(venueIDs.length > 0){
                    var query = {};
                    Account.findOne(req.param('accountID')).populate('venues',{ select : ['venueName', 'id'] }).exec(function found(err, accountVenues) {
                        if(err) return res.send();
                        if(accountVenues && accountVenues.timeZone)
                            timezone = accountVenues.timeZone;
                            if(req.param('status') != 'requested'){
                                query = { 'status' : req.param('status')}
                            } 
        
                            if(req.param('venueID') &&  venueIDs.length > 0)
                                query['venue'] = venueIDs[0].id
        
                            if(req.param('search') && req.param('status') != 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                            } 
                            
                            if(req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                                query['status'] = { "!": 'parked' }
                            }
        
                            if(!req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { status  : { contains: 'requested' } },
                                    { status  : { contains: 'accept' } },
                                    { status  : { contains: 'ready' } }
                                ]
                            }
        
                            if(req.param('status') == 'complete'){
                                query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),timezone)).format() }
                                ////////////////////////////////
                                if(SPaccountID == req.param('accountID')){ // Get today completed after 2 AM
                                    query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 01:59"),timezone)).format() }
                                }
                            }
                            
                            if(req.param('status') != 'complete'){
                                Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    if(req.param('status') != 'requested'){
                                        Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                            if (err) return next(err);
                                            var _temp = { car: dailyData, length : dailyDataLength};
                                            return res.send(_temp);
                                        });
                                    } else {
                                        if(req.param('sortByRequested') == "indianSort" && !req.param('search')){
                                            delete query.or;
                                            query['status'] ='requested';
        
                                            Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyRequestedDataLength) {
                                                if(dailyRequestedDataLength > req.param('skip')) {
                                                    Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                        if (err) return next(err);
                                                        var _temp = { car: dailyData, length : dailyDataLength};
                                                        return res.send(_temp);
                                                    });
                                                } else if(dailyRequestedDataLength <= req.param('skip')) {
                                                    // query['status'] = 'accept';
                                                    delete query['status'];
                                                    query['or'] = [
                                                        { status  : { contains: 'accept' } },
                                                        { status  : { contains: 'ready' } }
                                                    ];
                                                    var skip = req.param('skip') - dailyRequestedDataLength
                                                    Dailytransactional.find({},mobileFilelds).where(query).skip(skip).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                        if (err) return next(err);
                                                        var _temp = { car: dailyData, length : dailyDataLength};
                                                        return res.send(_temp);
                                                    });
                                                }
                                            });
                                        } else {
                                           Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                if (err) return next(err);
                                                var _temp = { car: dailyData, length : dailyDataLength};
                                                return res.send(_temp);
                                            });
                                        }                                          
                                    }
                                });
                            } else {
                                Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    Mastertransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        if(req.param('skip') == 0)
                                            _temp['accountVenues'] = accountVenues.venues;
                                        return res.send(_temp);
                                    });
                                });
                            }
                    });
                }
                if (venueIDs.length == 0)
                    res.send({ notFound: 'notFound' });
            } else if (req.param('role') == 'accountadmin') {
                Account.findOne(req.param('accountID')).populate('venues',{ select : ['venueName', 'id'] }).exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    if(accountVenues.timeZone)
                        timezone = accountVenues.timeZone;
                    var query = {};
                    if(req.param('status') != 'requested'){
                        query = { "accountID": req.param('accountID'), 'status' : req.param('status')}
                    } else 
                        query = { "accountID": req.param('accountID')}


                    if(req.param('venueID') &&  req.param('venueID').length > 0)
                        query['venue'] = req.param('venueID')[0].id;

                    if(req.param('search') && req.param('status') != 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                    } 
                    
                    if(req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                        query['status'] = { "!": 'parked' }
                    }

                    if(!req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { status  : { contains: 'requested' } },
                            { status  : { contains: 'accept' } },
                            { status  : { contains: 'ready' } }
                        ]
                    }

                    if(req.param('status') == 'complete'){
                        query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"), timezone)).format() }
                        ////////////////////////////////
                        if(SPaccountID == req.param('accountID')){ // Get today completed after 2 AM
                            query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 01:59"),timezone)).format() }
                        }
                    }
                    
                    if(req.param('status') != 'complete'){
                        Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                            if(req.param('status') != 'requested'){
                                Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                    if (err) return next(err);
                                    var _temp = { car: dailyData, length : dailyDataLength};
                                    return res.send(_temp);
                                });
                            } else {
                                if(req.param('sortByRequested') == "indianSort" && !req.param('search')){
                                    delete query.or;
                                    query['status'] ='requested';

                                    Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyRequestedDataLength) {
                                        if(dailyRequestedDataLength > req.param('skip')) {
                                            Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                if (err) return next(err);
                                                var _temp = { car: dailyData, length : dailyDataLength};
                                                return res.send(_temp);
                                            });
                                        } else if(dailyRequestedDataLength <= req.param('skip')) {
                                            // query['status'] = 'accept';
                                            delete query['status'];
                                            query['or'] = [
                                                { status  : { contains: 'accept' } },
                                                { status  : { contains: 'ready' } }
                                            ];
                                            var skip = req.param('skip') - dailyRequestedDataLength
                                            Dailytransactional.find({},mobileFilelds).where(query).skip(skip).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                if (err) return next(err);
                                                var _temp = { car: dailyData, length : dailyDataLength};
                                                return res.send(_temp);
                                            });
                                        }
                                    });
                                } else {
                                    Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        return res.send(_temp);
                                    });
                                }                                          
                            }
                        });
                    } else {
                        mobileFilelds['fields']['newfeeSplitUp'] = 1;
                            Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                Mastertransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                    if (err) return next(err);
                                    var _temp = { car: dailyData, length : dailyDataLength};
                                    if(req.param('skip') == 0)
                                        _temp['accountVenues'] = accountVenues.venues;
                                    return res.send(_temp);
                                });
                            });
                    }
                });
            } else if (req.param('role') == 'admin') {
                // Dailytransactional.find().populateAll().exec(function found(err, dailyData) { //
                //     if (err) return next(err);
                    res.send({ parked: [], requested: [] });
                // });
            } else 
                return res.send();
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('Dailytransactional with socket id ' + req.socket.id + ' is now subscribed');
            // });
        }
    },
    getReport: function(req, res, next) {
        if (req.method === 'POST') {
            var masterDatas = [];
            if (req.param('role') == 'manager' || req.param('role') == 'accountadmin' || req.param('role') == 'accountinguser') {
                var fromDate = req.param('fromDate');
                var toDate = req.param('toDate');
                var venueIDs = req.param('venueID');
                var accountID = req.param('accountID');

                Account.findOne(accountID).exec(function foundUsers(err, account) {
                    if(account && account.timeZone)
                        timezone = account.timeZone;
                    else 
                        timezone = "Asia/Kolkata";
                    if (venueIDs == 'All') {
                        Mastertransactional.find().where({ "accountID": accountID, or : [ { 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }},
                        { 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()}}] }).sort('createdAt ASC').populate('venue').exec(function found(err, masterData) {
                            if (err) {
                                return next(err);
                            }
                            if (masterData) {
                                masterAllReport(0);
    
                                function masterAllReport(j) {
                                    if (j < masterData.length) {
                                        // if ((new Date(masterData[j].createdAt).getTime() >= fromDate) && (new Date(masterData[j].createdAt).getTime() <= toDate)) {
                                            // console.log('' + fromDate >= masterData.createdAt + '---' + toDate <= masterData.createdAt + '');
                                            // if (((new Date((new Date(masterData[j].createdAt).getFullYear()) + '/' + (new Date(masterData[j].createdAt).getMonth() + 1) + '/' + (new Date(masterData[j].createdAt).getDate())).getTime()) >= (new Date((new Date(fromDate).getFullYear()) + '/' + (new Date(fromDate).getMonth() + 1) + '/' + (new Date(fromDate).getDate())).getTime())) && ((new Date((new Date(toDate).getFullYear()) + '/' + (new Date(toDate).getMonth() + 1) + '/' + (new Date(toDate).getDate())).getTime()) >= (new Date((new Date(masterData[j].createdAt).getFullYear()) + '/' + (new Date(masterData[j].createdAt).getMonth() + 1) + '/' + (new Date(masterData[j].createdAt).getDate())).getTime()))) {
                                            masterDatas.push(masterData[j]);
                                        // }
                                        j++;
                                        masterAllReport(j);
                                    } else {
                                        console.log('else part');
                                        res.send(masterDatas);
                                    }
                                }
                            }
                        });
                    } else {
                        Mastertransactional.find().where({ "venue": venueIDs , or : [ { 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }},{ 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }} ]  }).sort('createdAt ASC').populate('venue').exec(function found(err, masterData) {
                            if (err) return next(err);
                            if (masterData) {
                                masterReport(0);
    
                                function masterReport(i) {
                                    if (i < masterData.length) {
                                        // if ((new Date(masterData[i].createdAt).getTime() >= fromDate) && (new Date(masterData[i].createdAt).getTime() <= toDate)) {
                                            // if (((new Date((new Date(masterData[i].createdAt).getFullYear()) + '/' + (new Date(masterData[i].createdAt).getMonth() + 1) + '/' + (new Date(masterData[i].createdAt).getDate())).getTime()) >= (new Date((new Date(fromDate).getFullYear()) + '/' + (new Date(fromDate).getMonth() + 1) + '/' + (new Date(fromDate).getDate())).getTime())) && ((new Date((new Date(toDate).getFullYear()) + '/' + (new Date(toDate).getMonth() + 1) + '/' + (new Date(toDate).getDate())).getTime()) >= (new Date((new Date(masterData[i].createdAt).getFullYear()) + '/' + (new Date(masterData[i].createdAt).getMonth() + 1) + '/' + (new Date(masterData[i].createdAt).getDate())).getTime()))) {
                                            // console.log('' + fromDate >= masterData.createdAt + '---' + toDate <= masterData.createdAt + '');
                                            masterDatas.push(masterData[i]);
                                        // }
                                        i++;
                                        masterReport(i);
                                    } else {
                                        console.log('else part');
                                        res.send(masterDatas);
                                    }
                                }
                            }
                        });
                    }
                });
            }
        }
    },
    getReportforOscar: function(req, res, next) {
        if (req.method === 'POST') {
            // var masterDatas = [];
            return res.send([]);
           /* var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');

            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                if (venueIDs == 'All') {
                    Mastertransactional.find({}, {
                        "fields":
                        {
                            "parkingID": 1,
                            "plateNumber": 1,
                            "parkingZone": 1,
                            "color": 1,
                            "brand": 1,
                            // "status": 1,
                            "modelName": 1,
                            "log": 1,
                            // "changeLog": 1,
                            // "scratchesSnap": 1,
                            // "loginAs": 1,
                            // "remarks": 1,
                            // "customerType": 1,
                            // "free": 1,
                            // "documents": 1,
                            // "description": 1,
                            "createdAt" : 1,
                            "updatedAt" : 1,
                            "venue": 1,
                            // "fees": 1,
                            // "validatedBy" :1,
                            // "validatedAt" : 1,
                            // "cashAcceptedBy" : 1,
                            // "cashAcceptedAt" : 1,
                            // "id": 1
                        }
                    }).where({ "accountID": accountID, or : [ { 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }},
                    { 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()}}] }).sort('createdAt ASC').populate('venue', { select : ['venueName'] }).exec(function found(err, masterData) {
                        if (err) {
                            return res.send([]);
                        }
                        if (masterData) {
                            return res.send(masterData);
                        }
                    });
                } else {
                    Mastertransactional.find({}, {
                        "fields":
                        {
                            "parkingID": 1,
                            "plateNumber": 1,
                            "parkingZone": 1,
                            "color": 1,
                            "brand": 1,
                            // "status": 1,
                            "modelName": 1,
                            "log": 1,
                            // "changeLog": 1,
                            // "scratchesSnap": 1,
                            // "loginAs": 1,
                            // "remarks": 1,
                            // "customerType": 1,
                            // "free": 1,
                            // "documents": 1,
                            // "description": 1,
                            "createdAt" : 1,
                            "updatedAt" : 1,
                            "venue": 1,
                            // "fees": 1,
                            // "validatedBy" :1,
                            // "validatedAt" : 1,
                            // "cashAcceptedBy" : 1,
                            // "cashAcceptedAt" : 1,
                            // "id": 1
                        }
                    }).where({ "venue": venueIDs , or : [ { 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }},{ 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }} ]  }).sort('createdAt ASC').populate('venue', { select : ['venueName'] }).exec(function found(err, masterData) {
                        if (err) return res.send([]);
                        if (masterData) {
                            return res.send(masterData);
                        }
                    });
                }
            }); */ 
        }
    },
    getReportforOscarwithPagination: function(req, res, next) {
        // var masterDatas = [];
        if (req.method === 'POST') {
            var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');
            var query = {};
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                // if (venueIDs == 'All') {
                     query = { "accountID": accountID, or : [ { 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }},
                        { 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()}}, 
                            // { parkingID : {contains: req.param('search')}},
                            // { plateNumber : {contains: req.param('search')}},
                            // { brand : {contains: req.param('search')} }

                        ] }
                if (venueIDs != 'All') 
                    query['venue'] = venueIDs;

                if(req.param('query') == 'parkingID'){
                    query['parkingID'] = {contains: req.param('search')}
                } else if(req.param('query') == 'plateNumber'){
                    query['plateNumber'] = {contains: req.param('search')}
                } else if(req.param('query') == 'brand'){
                    query['brand'] = {contains: req.param('search')}
                }

                Mastertransactional.find({}, {
                    "fields":
                    {
                        "parkingID": 1,
                        "plateNumber": 1,
                        "brand": 1,
                    }
                }).where(query).sort('createdAt ASC').exec(function found(err, masterData) {
                    if (err) {
                        return res.send({ length : 0 });
                    }
                    if (masterData) {
                        Mastertransactional.find({}, {
                            "fields":
                            {
                                "parkingID": 1,
                                "plateNumber": 1,
                                "parkingZone": 1,
                                "color": 1,
                                "brand": 1,
                                "status": 1,
                                "modelName": 1,
                                "log": 1,
                                "changeLog": 1,
                                "scratchesSnap": 1,
                                "loginAs": 1,
                                "remarks": 1,
                                "customerType": 1,
                                "free": 1,
                                "documents": 1,
                                "description": 1,
                                "createdAt" : 1,
                                "updatedAt" : 1,
                                "venue": 1,
                                "fees": 1,
                                "validatedBy" :1,
                                "validatedAt" : 1,
                                "cashAcceptedBy" : 1,
                                "cashAcceptedAt" : 1,
                                "id": 1
                            }
                        }).where(query).sort('createdAt ASC').populate('venue', { select : ['venueName'] }).skip(req.param('skip')).limit(req.param('limit')).exec(function found(err, original) {
                            if (err) {
                                return res.send({ length : 0, data : []});
                            }
                            if (original) {
                                query['status'] = 'parked';
                                Mastertransactional.find().where(query).exec(function found(err, parked) {
                                    query['status'] = 'requested';
                                    Mastertransactional.find().where(query).exec(function found(err, requested) {
                                        query['status'] = 'accept';
                                        Mastertransactional.find().where(query).exec(function found(err, accepted) {
                                            query['status'] = 'complete';
                                            Mastertransactional.find().where(query).exec(function found(err, complete) {
                                                return res.send({ length : masterData.length , data : original, 
                                                parked : parked.length, requested : requested.length, accepted : accepted.length , complete: complete.length});
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    } else 
                    return res.send({ length : 0 });
                }); 
                    // Mastertransactional.find({}, {
                    //     "fields":
                    //     {
                    //         "parkingID": 1,
                    //         "plateNumber": 1,
                    //         "parkingZone": 1,
                    //         "color": 1,
                    //         "brand": 1,
                    //         // "status": 1,
                    //         "modelName": 1,
                    //         "log": 1,
                    //         // "changeLog": 1,
                    //         // "scratchesSnap": 1,
                    //         // "loginAs": 1,
                    //         // "remarks": 1,
                    //         // "customerType": 1,
                    //         // "free": 1,
                    //         // "documents": 1,
                    //         // "description": 1,
                    //         "createdAt" : 1,
                    //         "updatedAt" : 1,
                    //         "venue": 1,
                    //         // "fees": 1,
                    //         // "validatedBy" :1,
                    //         // "validatedAt" : 1,
                    //         // "cashAcceptedBy" : 1,
                    //         // "cashAcceptedAt" : 1,
                    //         // "id": 1
                    //     }
                    // }).where({ "accountID": accountID, or : [ { 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }},
                    // { 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()}}] }).sort('createdAt ASC').populate('venue', { select : ['venueName'] }).exec(function found(err, masterData) {
                    //     if (err) {
                    //         return res.send([]);
                    //     }
                    //     if (masterData) {
                    //         return res.send({ length : masterData.length, });
                    //     }
                    // });
                                         /*Mastertransactional.find({}, {
                        "fields":
                        {
                            "parkingID": 1,
                            "plateNumber": 1,
                            "parkingZone": 1,
                            "color": 1,
                            "brand": 1,
                            // "status": 1,
                            "modelName": 1,
                            "log": 1,
                            // "changeLog": 1,
                            // "scratchesSnap": 1,
                            // "loginAs": 1,
                            // "remarks": 1,
                            // "customerType": 1,
                            // "free": 1,
                            // "documents": 1,
                            // "description": 1,
                            "createdAt" : 1,
                            "updatedAt" : 1,
                            "venue": 1,
                            // "fees": 1,
                            // "validatedBy" :1,
                            // "validatedAt" : 1,
                            // "cashAcceptedBy" : 1,
                            // "cashAcceptedAt" : 1,
                            // "id": 1
                        }
                    }).where({ "accountID": accountID, or : [
                    {parkingID: {contains: req.param('search')}},
                    {plateNumber: {contains: req.param('search')}},
                    {brand: {contains: req.param('search')}}  
                ] }).sort('createdAt ASC').populate('venue', { select : ['venueName'] }).skip(req.param('skip')).limit(req.param('limit')).exec(function found(err, original) {
                        if (err) {
                            return res.send({ length : 0, data : []});
                        }
                        if (original) {                                                 
                            return res.send({ length : 0 , data : original});
                        }
                    }); */
                // } else {
                    /* Mastertransactional.find({}, {
                        "fields":
                        {
                            "parkingID": 1,
                            "plateNumber": 1,
                            "parkingZone": 1,
                            "color": 1,
                            "brand": 1,
                            // "status": 1,
                            "modelName": 1,
                            "log": 1,
                            // "changeLog": 1,
                            // "scratchesSnap": 1,
                            // "loginAs": 1,
                            // "remarks": 1,
                            // "customerType": 1,
                            // "free": 1,
                            // "documents": 1,
                            // "description": 1,
                            "createdAt" : 1,
                            "updatedAt" : 1,
                            "venue": 1,
                            // "fees": 1,
                            // "validatedBy" :1,
                            // "validatedAt" : 1,
                            // "cashAcceptedBy" : 1,
                            // "cashAcceptedAt" : 1,
                            // "id": 1
                        }
                    }).where({ "venue": venueIDs , or : [ { 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }},{ 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }} ]  }).sort('createdAt ASC').populate('venue', { select : ['venueName'] }).exec(function found(err, masterData) {
                        if (err) return res.send([]);
                        if (masterData) {
                            return res.send(masterData);
                        }
                    }); */
                // }
            });
        }
    },
    getReportforAdmin: function(req, res, next) {
        if (req.method === 'POST') {
            var masterDatas = [];
            var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var accountID = req.param('accountID');
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                if (accountID == 'All Account') {
                    Mastertransactional.find().where({ 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()  } }).sort('createdAt ASC').populate('venue').exec(function found(err, masterData) {
                        if (err) {
                            return next(err);
                        }
                        if (masterData) {
                            // masterAllReport(0);
    
                            // function masterAllReport(j) {
                            //     if (j < masterData.length) {
                            //         if ((new Date(masterData[j].createdAt).getTime() >= fromDate) && (new Date(masterData[j].createdAt).getTime() <= toDate)) {
                            //             masterDatas.push(masterData[j]);
                            //         }
                            //         j++;
                            //         masterAllReport(j);
                                // } else {
                                    console.log('else part');
                                    res.send(masterData);
                                // }
                            // }
                        }
                    });
                } else {
                    Account.find({ "id": accountID }).populate('venues').exec(function found(err, accountDate) {
                        if (err) res.send([]);
                        if (accountDate) {
                            accountDate = accountDate[0];
                            // console.log(JSON.stringify(accountDate.venues))
                            if (accountDate.venues && accountDate.venues.length > 0) {
                                getEachVenueData(0);
    
                                function getEachVenueData(v) {
                                    if (v < accountDate.venues.length) {
                                        // console.log( fromDate +"=====" +  new Date(fromDate)+ '========>='+  moment(fromDate).format('YYYY-MM-DD') + '<='  +  moment(toDate).format('YYYY-MM-DD'))
                                        Mastertransactional.find().where({ "venue": accountDate.venues[v].id, 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format() , '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()   } }).populate('venue').sort('createdAt ASC').exec(function found(err, masterData) {
                                            if (err) {
                                                v++;
                                                getEachVenueData(v);
                                            }
                                            if (masterData) {
                                                masterReport(0);
    
                                                function masterReport(i) {
                                                    if (i < masterData.length) {
                                                        // if ((new Date(masterData[i].createdAt).getTime() >= fromDate) && (new Date(masterData[i].createdAt).getTime() <= toDate)) {
                                                            masterDatas.push(masterData[i]);
                                                        // }
                                                        i++;
                                                        masterReport(i);
                                                    } else {
                                                        v++;
                                                        getEachVenueData(v);
                                                    }
                                                }
                                            } else {
                                                v++;
                                                getEachVenueData(v);
                                            }
                                        });
                                    } else {
                                        console.log('final part');
                                        res.send(masterDatas);
                                    }
                                }
                            } else {
                                console.log('final part 1');
                                res.send(masterDatas);
                            }
                        }
                    });
                }
            });
        }
    },// Send Report Via Email 
    sendReportforAdmin: function(req, res, next) {
        if (req.method === 'POST') {
            var masterDatas = [];
            var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var accountID = req.param('accountID');
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                if (accountID == 'All Account') {
                    Mastertransactional.find().where({'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' :moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()   } }).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                        if (err) {
                            return next(err);
                        }
                        if (masterData) {
                            masterReport(0);

                            function masterReport(i) {
                                if (i < masterData.length) {
                                    // if ((new Date(masterData[i].createdAt).getTime() >= fromDate) && (new Date(masterData[i].createdAt).getTime() <= toDate)) {
                                        masterDatas.push(masterData[i]);
                                    // }
                                    i++;
                                    masterReport(i);
                                } else {
                                    convertDataforExcellFormat(masterDatas);
                                }
                            }
                        }
                    });
                } else {
                    Account.find({ "id": accountID }).populate('venues').exec(function found(err, accountDate) {
                        if (err) res.send([]);
                        if (accountDate) {
                            accountDate = accountDate[0];
                            console.log(JSON.stringify(accountDate.venues))
                            if (accountDate.venues && accountDate.venues.length > 0) {
                                getEachVenueData(0);

                                function getEachVenueData(v) {
                                    if (v < accountDate.venues.length) {
                                        Mastertransactional.find().where({ "venue": accountDate.venues[v].id , 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }}).populateAll().sort('createdAt ASC').exec(function found(err, masterData) {
                                            if (err) {
                                                v++;
                                                getEachVenueData(v);
                                            }
                                            if (masterData) {
                                                masterReport(0);

                                                function masterReport(i) {
                                                    if (i < masterData.length) {
                                                        // if ((new Date(masterData[i].createdAt).getTime() >= fromDate) && (new Date(masterData[i].createdAt).getTime() <= toDate)) {
                                                            masterDatas.push(masterData[i]);
                                                        // }
                                                        i++;
                                                        masterReport(i);
                                                    } else {
                                                        v++;
                                                        getEachVenueData(v);
                                                    }
                                                }
                                            } else {
                                                v++;
                                                getEachVenueData(v);
                                            }
                                        });
                                    } else {
                                        console.log('final part');
                                        convertDataforExcellFormat(masterDatas);
                                    }
                                }
                            } else {
                                console.log('final part 1');
                                convertDataforExcellFormat(masterDatas);
                            }
                        }
                    });
                }
            });
            function convertDataforExcellFormat(masterData) {
                exportService.convertDataforExcellFormatforAdmin(masterData, fromDate, toDate, function(masterData) {
                    exportService.exportXLSforAdmin(masterData, accountID, fromDate, toDate, function(generatedXlsName) {
                        var transporter = nodemailer.createTransport("SMTP", {
                            host: process.env.NODEMAILER_HOST,
                            port: process.env.NODEMAILER_PORT,
                            auth: {
                                user: process.env.NODEMAILER_USER,
                                pass: process.env.NODEMAILER_PASS
                            },
                        });
    
                        var mailOptions = {
                            from: process.env.REPORTER_EMAIL,
                            to: req.param('email'),
                            bcc: "",
                            subject: 'Valeters Report Service',
                            html: '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="https://evaletz.com:2018/images/temp-home.JPG"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;"></p><p style="margin: 1em 0px;margin-top: 10px;">Greetings!</p><p style="margin: 1em 0px;"> The report generated for the period between ' + (new Date(req.param('fromDate')).getDate() + "-" + (new Date(req.param('fromDate')).getMonth() + 1) + "-" + new Date(req.param('fromDate')).getFullYear()) + ' and ' + (new Date(req.param('toDate')).getDate() + "-" + (new Date(req.param('toDate')).getMonth() + 1) + "-" + new Date(req.param('toDate')).getFullYear()) + '. Please find attached valet parking report. We would encourage you to use our Evaletz application to generate weekly/monthly reports. </p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a></span>&nbsp;and we will be more than happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>EValetz Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/EValetzMobileApp/" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://plus.google.com/u/0/116399189801627499126?hl=en" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://twitter.com/EvaletzApp" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://evaletz.com/" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>',
                            attachments: [{
                                filename: generatedXlsName,
                                filePath: "assets/images/" + generatedXlsName,
                                cid: 'newDate'
                            }]
                        }
                        transporter.sendMail(mailOptions, function(err, response) {
                            if (err) {
                                console.log('email failed..........' + JSON.stringify(err));
                                console.log("next account")
                                res.send(masterDatas);
                            }
                            if (response) {
                                console.log('mail send success');
                                console.log("next account");
                                res.send(masterDatas);
                                fs.unlinkSync("assets/images/" + generatedXlsName);
                            }
                        });
                    });
                });
            }
        }
    },
    downloadReportforAdmin: function(req, res, next) {
        if (req.method === 'POST') {
            var masterDatas = [];
            var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var accountID = req.param('accountID');
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                if (accountID == 'All Account') {
                    Mastertransactional.find().where({'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format() , '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()  } }).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                        if (err) {
                            return next(err);
                        }
                        if (masterData) {
                            masterReport(0);

                            function masterReport(i) {
                                if (i < masterData.length) {
                                    // if ((new Date(masterData[i].createdAt).getTime() >= fromDate) && (new Date(masterData[i].createdAt).getTime() <= toDate)) {
                                        masterDatas.push(masterData[i]);
                                    // }
                                    i++;
                                    masterReport(i);
                                } else {
                                    convertDataforExcellFormat(masterDatas);
                                }
                            }
                        }
                    });
                } else {
                    Account.find({ "id": accountID }).populate('venues').exec(function found(err, accountDate) {
                        if (err) res.send([]);
                        if (accountDate) {
                            accountDate = accountDate[0];
                            // console.log(JSON.stringify(accountDate.venues))
                            if (accountDate.venues && accountDate.venues.length > 0) {
                                getEachVenueData(0);

                                function getEachVenueData(v) {
                                    if (v < accountDate.venues.length) {
                                        Mastertransactional.find().where({ "venue": accountDate.venues[v].id,  'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format() , '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()   } }).populateAll().sort('createdAt ASC').exec(function found(err, masterData) {
                                            if (err) {
                                                v++;
                                                getEachVenueData(v);
                                            }
                                            if (masterData) {
                                                masterReport(0);

                                                function masterReport(i) {
                                                    if (i < masterData.length) {
                                                        // if ((new Date(masterData[i].createdAt).getTime() >= fromDate) && (new Date(masterData[i].createdAt).getTime() <= toDate)) {
                                                            masterDatas.push(masterData[i]);
                                                        // }
                                                        i++;
                                                        masterReport(i);
                                                    } else {
                                                        v++;
                                                        getEachVenueData(v);
                                                    }
                                                }
                                            } else {
                                                v++;
                                                getEachVenueData(v);
                                            }
                                        });
                                    } else {
                                        console.log('final part');
                                        convertDataforExcellFormat(masterDatas);
                                    }
                                }
                            } else {
                                console.log('final part 1');
                                convertDataforExcellFormat(masterDatas);
                            }
                        }
                    });
                }
            });
        }

        function convertDataforExcellFormat(masterData) {
            exportService.convertDataforExcellFormatforAdmin(masterData, fromDate, toDate, function(masterData) {
                exportService.exportXLSforAdmin(masterData, accountID, fromDate, toDate, function(generatedXlsName) {
                    res.send(generatedXlsName);
                });
            });
        }
    }, // Send Report Via Email 
    sendReport: function(req, res, next) {
        if (req.method === 'POST') {
            var masterDatas = [];
            var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
            
                if (venueIDs == 'All' || venueIDs == '' || venueIDs == null) {
                    Mastertransactional.find().where({ "accountID": accountID,  or : [ { 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()   } }, 
                    { 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()   } }] }).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                        if (err) {
                            return next(err);
                        }
                        if (masterData) {
                            /*masterAllReport(0);

                            function masterAllReport(j) {
                                if (j < masterData.length) {
                                    if ((new Date(masterData[j].createdAt).getTime() >= fromDate) && (new Date(masterData[j].createdAt).getTime() <= toDate)) {
                                        console.log('' + fromDate >= masterData.createdAt + '---' + toDate <= masterData.createdAt + '');
                                        obj = {};
                                        obj.Sino = (masterDatas.length) + 1;
                                        obj.AccountName = masterData[j].accountID.accountName;
                                        if (masterData[j].venue) {
                                            obj.Venuename = masterData[j].venue.venueName;
                                        }
                                        obj.Date = new Date(masterData[j].createdAt);
                                        obj.TokenNumber = masterData[j].parkingID;
                                        obj.plateNumber = masterData[j].plateNumber;
                                        if (masterData[j].snap == null || masterData[j].snap == undefined || masterData[j].snap == '' || masterData[j].snap == 'undefined')
                                            obj.plateSnap = 'noImage';
                                        else
                                            obj.plateSnap = masterData[j].snap;
                                        obj.scratchesSnap = masterData[j].scratchesSnap;

                                        getData(0);

                                        function getData(l) {
                                            if (l < masterData[j].log.length) {
                                                if (masterData[j].log[l].activity == 'parked') {
                                                    obj.ParkedAt = masterData[j].createdAt;
                                                    obj.ParkedBy = masterData[j].log[l].employeeName;
                                                }
                                                if (masterData[j].log[l].activity == 'requested') {
                                                    obj.RequestedAt = masterData[j].log[l].at;
                                                    obj.RequestedBy = masterData[j].log[l].by;
                                                }
                                                if (masterData[j].log[l].activity == 'accept') {
                                                    obj.AcceptedAt = masterData[j].log[l].at;
                                                    obj.AcceptedBy = masterData[j].log[l].employeeName;
                                                }
                                                if (masterData[j].log[l].activity == 'completed') {
                                                    obj.completedAt = masterData[j].log[l].at;
                                                    obj.completedBy = masterData[j].log[l].employeeName;
                                                }
                                                if (masterData[j].log[l].activity == 'ready') {
                                                    obj.ReadyAt = masterData[j].log[l].at;
                                                    obj.ReadyBy = masterData[j].log[l].employeeName;
                                                }
                                                if (masterData[j].log[l].activity == 'completed' && masterData[j].log[l].proofs) {
                                                    if (masterData[j].log[l].proofs.length > 0) {
                                                        obj.cardMissed = 'yes';
                                                        obj.name = masterData[j].log[l].missedUserName;
                                                        obj.mobileNumber = masterData[j].log[l].missedUserMobile;
                                                        obj.proofs = masterData[j].log[l].proofs;
                                                    }
                                                }
                                                l++;
                                                getData(l);

                                            } else {
                                                masterDatas.push(obj);
                                                console.log('Master data pushed..')
                                                j++;
                                                masterAllReport(j);
                                            }
                                        }
                                    } else {
                                        j++;
                                        masterAllReport(j);
                                    }
                                } else {
                                    console.log('else part');
                                    exportASExcellData();
                                }

                            }*/
                            convertDataforExcellFormat(masterData,  account.excelFormatSettings || []);

                        }

                    });
                } else {
                    Mastertransactional.find().where({ "venue": venueIDs, or : [ { 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() } }, 
                    {
                        'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() } 
                    } ] }).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                        if (err) return next(err);
                        if (masterData) {
                            convertDataforExcellFormat(masterData,  account.excelFormatSettings || []);
                        }
                    });
                }
            });
        }

        function convertDataforExcellFormat(masterData , formattedData) {
            exportService.convertDataforExcellFormatforDynamic(masterData, fromDate, toDate,formattedData, function(masterData) {
                exportService.exportXLSforDynamic(masterData, venueIDs, fromDate, toDate,formattedData, function(generatedXlsName) {
                    var transporter = nodemailer.createTransport("SMTP", {
                        host: process.env.NODEMAILER_HOST,
                        port: process.env.NODEMAILER_PORT,
                        auth: {
                            user: process.env.NODEMAILER_USER,
                            pass: process.env.NODEMAILER_PASS
                        },
                    });

                    var mailOptions = {
                        from: process.env.REPORTER_EMAIL,
                        to: req.param('email'),
                        bcc: process.env.BCC_EMAIL,
                        subject: 'Valeters Report Service',
                        html: '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="http://valeters.ae/assets/imgs/logo1.png"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;"></p><p style="margin: 1em 0px;margin-top: 10px;">Greetings!</p><p style="margin: 1em 0px;"> The report generated for the period between ' + (new Date(req.param('fromDate')).getDate() + "-" + (new Date(req.param('fromDate')).getMonth() + 1) + "-" + new Date(req.param('fromDate')).getFullYear()) + ' and ' + (new Date(req.param('toDate')).getDate() + "-" + (new Date(req.param('toDate')).getMonth() + 1) + "-" + new Date(req.param('toDate')).getFullYear()) + '. Please find attached valet parking report. </p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@vpms.valeters.ae" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@vpms.valeters.ae</a></span>&nbsp;and we will be more than happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>Valeters Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/OscarValetParking" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="#" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="#" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="http://valeters.ae" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>',
                        attachments: [{
                            filename: generatedXlsName,
                            filePath: "assets/images/" + generatedXlsName,
                            cid: 'newDate'
                        }]
                    }
                    transporter.sendMail(mailOptions, function(err, response) {
                        if (err) {
                            console.log('email failed..........' + JSON.stringify(err));
                            console.log("next account")
                            res.send(masterDatas);
                        }
                        if (response) {
                            console.log('mail send success');
                            console.log("next account");
                            res.send(masterDatas);
                            fs.unlinkSync("assets/images/" + generatedXlsName);
                        }
                    });
                });
            });
        }
    },
    sendReportforDynamic: function(req, res, next) {
        if (req.method === 'POST') {
            var masterDatas = [];
            var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
            
                if (venueIDs == 'All' || venueIDs == '' || venueIDs == null) {
                    Mastertransactional.find().where({ "accountID": accountID, 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()   } }).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                        if (err) {
                            return next(err);
                        }
                        if (masterData) {
                            convertDataforExcellFormat(masterData, account.excelFormatSettings || []);
                        }

                    });
                } else {
                    Mastertransactional.find().where({ "venue": venueIDs, 'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()   } }).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                        if (err) return next(err);
                        if (masterData) {
                            convertDataforExcellFormat(masterData, account.excelFormatSettings || []);
                        }
                    });
                }
            });
        }

        function convertDataforExcellFormat(masterData, formattedData) {
            exportService.convertDataforExcellFormatforDynamic(masterData, fromDate, toDate, formattedData, function(masterData) {
                exportService.exportXLSforDynamic(masterData, venueIDs, fromDate, toDate, formattedData, function(generatedXlsName) {
                    var transporter = nodemailer.createTransport("SMTP", {
                        host: process.env.NODEMAILER_HOST,
                        port: process.env.NODEMAILER_PORT,
                        auth: {
                            user: process.env.NODEMAILER_USER,
                            pass: process.env.NODEMAILER_PASS
                        },
                    });

                    var mailOptions = {
                        from: process.env.REPORTER_EMAIL,
                        to: req.param('email'),
                        bcc: process.env.BCC_EMAIL,
                        subject: 'Valeters Report Service',
                        html: '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="https://evaletz.com:2018/images/temp-home.JPG"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;"></p><p style="margin: 1em 0px;margin-top: 10px;">Greetings!</p><p style="margin: 1em 0px;"> The report generated for the period between ' + (new Date(req.param('fromDate')).getDate() + "-" + (new Date(req.param('fromDate')).getMonth() + 1) + "-" + new Date(req.param('fromDate')).getFullYear()) + ' and ' + (new Date(req.param('toDate')).getDate() + "-" + (new Date(req.param('toDate')).getMonth() + 1) + "-" + new Date(req.param('toDate')).getFullYear()) + '. Please find attached valet parking report. We would encourage you to use our Evaletz application to generate weekly/monthly reports. </p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a></span>&nbsp;and we will be more than happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>EValetz Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/EValetzMobileApp/" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://plus.google.com/u/0/116399189801627499126?hl=en" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://twitter.com/EvaletzApp" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://evaletz.com/" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>',
                        attachments: [{
                            filename: generatedXlsName,
                            filePath: "assets/images/" + generatedXlsName,
                            cid: 'newDate'
                        }]
                    }
                    transporter.sendMail(mailOptions, function(err, response) {
                        if (err) {
                            console.log('email failed..........' + JSON.stringify(err));
                            console.log("next account")
                            res.send(masterDatas);
                        }
                        if (response) {
                            console.log('mail send success');
                            console.log("next account");
                            res.send(masterDatas);
                            fs.unlinkSync("assets/images/" + generatedXlsName);
                        }
                    });
                });
            });
        }
    },
    downloadReport: function(req, res, next) {
        if (req.method === 'POST') {
            var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                if (venueIDs == 'All' || venueIDs == '' || venueIDs == null) {
                    Mastertransactional.find().where({ "accountID": accountID, 
                    or : [{ 'createdAt': { '>=':  moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()}}, { 'updatedAt': { '>=':  moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }}] }).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                        if (err) {
                            return next(err);
                        }
                        if (masterData) {
                            exportService.convertDataforExcellFormatforDynamic(masterData, fromDate, toDate,  (account.excelFormatSettings || []), function(masterData) {
                                exportService.exportXLSforDynamic(masterData, venueIDs, fromDate, toDate, (account.excelFormatSettings || []), function(data) {
                                    res.send(data);
                                });
                            });
                        }
                    });
                } else {
                    Mastertransactional.find().where({ "venue": venueIDs, or: [{'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format() , '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()  } },{ 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format() , '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()  } }] }).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                        if (err) return next(err);
                        if (masterData) {
                            exportService.convertDataforExcellFormatforDynamic(masterData, fromDate, toDate, (account.excelFormatSettings || []), function(masterData) {
                                exportService.exportXLSforDynamic(masterData, venueIDs, fromDate, toDate, (account.excelFormatSettings || []), function(data) {
                                    res.send(data);
                                });
                            });
                        }
                    });
                }
            });
        }
    },
    downloadReportLargeData: function(req, res, next) {
        if (req.method === 'POST') {
            var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
               
                var query = {};
                if (venueIDs == 'All' || venueIDs == '' || venueIDs == null) {
                    query =  { "accountID": accountID, or : [{ 'createdAt': { '>=':  moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()}}, { 'updatedAt': { '>=':  moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() }}] }
                }  else {  
                    query = { "venue": venueIDs, or: [{'createdAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format() , '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()  } },{ 'updatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format() , '<=' :  moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format()  } }] }                  
                }
                Mastertransactional.count(query).sort('createdAt ASC').exec(function found(err, countData) {
                    if (err) {
                        return next(err);
                    }
                    if (countData) {
                        if(countData <= 1000){
                            Mastertransactional.find().where(query).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                                exportService.convertDataforExcellFormatforDynamic(masterData, fromDate, toDate,  (account.excelFormatSettings || []), function(masterData) {
                                    exportService.exportXLSforDynamic(masterData, ((venueIDs == 'All' || venueIDs == '' || venueIDs == null) ? ''  : venueIDs), fromDate, toDate, (account.excelFormatSettings || []), function(data) {
                                        return res.send(data);
                                    });
                                });
                            });
                        } else {
                            res.send('no.xlsx');
                            var limit = 100;
                            var numberofHydration =  countData / limit;
                            var wb = new xl.Workbook();
                            ////////////////////// Static ////////////////////
                            var excellData = wb.addWorksheet('Report', {
                                pageSetup: {
                                    fitToWidth: 1
                                },
                                headerFooter: {
                                    oddHeader: '',
                                    oddFooter: ''
                                }
                            });
                            var largeText = wb.createStyle({
                                font: {
                                    name: 'Cambria',
                                    size: 20
                                }
                            });
                            excellData.column(2).setWidth(25);
                            excellData.row(2).setHeight(25);
                            excellData.column(3).setWidth(25);
                            excellData.column(5).setWidth(25);  
                            ////////////////////// Static //////////////////// 

                            runExcellFunctionforNumberofHydration(0);

                            function runExcellFunctionforNumberofHydration(h){
                                if(h < numberofHydration){
                                    Mastertransactional.find().where(query).sort('createdAt ASC').skip((h * limit)).limit(limit).populateAll().exec(function found(err, masterData) {
                                        //////////////////////////////////
                                        exportService.convertDataforExcellFormatforDynamicLargeData(masterData, fromDate, toDate,  (account.excelFormatSettings || []), h, limit,function(masterData) {
                                            exportService.exportXLSforDynamicLargeData(masterData, ((venueIDs == 'All' || venueIDs == '' || venueIDs == null) ? ''  : venueIDs), fromDate, toDate, (account.excelFormatSettings || []), excellData, h, limit, largeText, function(data) {
                                                excellData = data;
                                                h++;
                                                runExcellFunctionforNumberofHydration(h);
                                            });
                                        });
                                        /////////////////////////////////////
                                    });
                                } else {
                                    // final wb xls file 
                                    var newDate = new Date().getTime();
                                    wb.write("assets/images/" + newDate + ".xlsx", function(err, stats) {
                                        console.log('Excel.xlsx written and has the following stats');
                                        // return res.send(newDate + ".xlsx");
                                        var transporter = nodemailer.createTransport("SMTP", {
                                            host: process.env.NODEMAILER_HOST,
                                            port: process.env.NODEMAILER_PORT,
                                            auth: {
                                                user: process.env.NODEMAILER_USER,
                                                pass: process.env.NODEMAILER_PASS
                                            },
                                        });
                    
                                        var mailOptions = {
                                            from: process.env.REPORTER_EMAIL,
                                            to: req.param('email'),
                                            bcc: process.env.BCC_EMAIL,
                                            subject: 'Valeters Report Service',
                                            html: '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="https://evaletz.com:2018/images/temp-home.JPG"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;"></p><p style="margin: 1em 0px;margin-top: 10px;">Greetings!</p><p style="margin: 1em 0px;"> The report generated for the period between ' + (new Date(req.param('fromDate')).getDate() + "-" + (new Date(req.param('fromDate')).getMonth() + 1) + "-" + new Date(req.param('fromDate')).getFullYear()) + ' and ' + (new Date(req.param('toDate')).getDate() + "-" + (new Date(req.param('toDate')).getMonth() + 1) + "-" + new Date(req.param('toDate')).getFullYear()) + '. Please find attached valet parking report. We would encourage you to use our Evaletz application to generate weekly/monthly reports. </p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a></span>&nbsp;and we will be more than happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>EValetz Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/EValetzMobileApp/" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://plus.google.com/u/0/116399189801627499126?hl=en" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://twitter.com/EvaletzApp" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://evaletz.com/" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>',
                                            attachments: [{
                                                filename: newDate + ".xlsx",
                                                filePath: "assets/images/" + newDate+ ".xlsx",
                                                cid: 'newDate'
                                            }]
                                        }
                                        transporter.sendMail(mailOptions, function(err, response) {
                                        });
                                    });
                                }
                            }
                        }
                    }
                });
            });
        }
    },

    sendReportLargeData: function(req, res, next) {
        if (req.method === 'POST') {
            const msg = {
                from: {
                    name: 'Valeters VPMS Report',
                    email: process.env.REPORTER_EMAIL
                },
                to: req.param('email'),
                bcc: process.env.BCC_EMAIL,
                subject: 'Valeters Report Service',
                text: 'Please see attachment. Thank you!',
                html: '<strong>Please see attachment. Thank you!</strong>',
            };

            var fromDate = req.param('fromDate');
            var toDate = req.param('toDate');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');

            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if (!account) {
                    next({ message: 'account not found', status: 400 });
                }

                account && account.timeZone
                    ? timezone = account.timeZone
                    : timezone = "Asia/Kolkata";

                var query = {};

                const qgte = moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"), timezone)).format();
                const qlte = moment.utc(momentTZ.tz((moment(toDate).format("YYYY-MM-DD") + " 23:59:00"), timezone)).format();

                const or = [
                    { 'createdAt': { '>=': qgte, '<=': qlte } },
                    { 'updatedAt': { '>=': qgte, '<=': qlte } }
                ];

                (venueIDs == 'All' || venueIDs == '' || venueIDs == null)
                    ? query = { accountID, or }
                    : query = { "venue": venueIDs, or }

                Mastertransactional.count(query).sort('createdAt ASC').exec(function found(err, countData) {
                    if (err) next({ err, status: 500 });

                    if (countData) {
                        if(countData <= 1000){
                            Mastertransactional.find().where(query).sort('createdAt ASC').populateAll().exec(function found(err, masterData) {
                                if (err) next({ err, status: 500 });

                                exportService.convertDataforExcellFormatforDynamic(masterData, fromDate, toDate,  (account.excelFormatSettings || []), function(masterData) {
                                    exportService.exportXLSforDynamic(masterData, ((venueIDs == 'All' || venueIDs == '' || venueIDs == null) ? ''  : venueIDs), fromDate, toDate, (account.excelFormatSettings || []), function(data) {
                                        const pathToAttachment = path.join(process.env.SAILS_PROJECT_ROOT, 'assets', 'images', data);
                                        let attachment = fs.readFileSync(pathToAttachment).toString("base64");

                                        msg.attachments = [
                                            {
                                                content: attachment,
                                                filename: data,
                                                disposition: 'attachment'
                                            }
                                        ];

                                        sgMail
                                            .send(msg)
                                            .then(() => res.send())
                                            .catch(err => next({ err, status: 500 }));
                                    });
                                });
                            });
                        } else {
                            res.send('no.xlsx');

                            var limit = 100;
                            var numberofHydration =  countData / limit;
                            var wb = new xl.Workbook();

                            var excellData = wb.addWorksheet('Report', {
                                pageSetup: {
                                    fitToWidth: 1
                                },
                                headerFooter: {
                                    oddHeader: '',
                                    oddFooter: ''
                                }
                            });

                            var largeText = wb.createStyle({
                                font: {
                                    name: 'Cambria',
                                    size: 20
                                }
                            });

                            excellData.column(2).setWidth(25);
                            excellData.row(2).setHeight(25);
                            excellData.column(3).setWidth(25);
                            excellData.column(5).setWidth(25);  

                            runExcellFunctionforNumberofHydration(0);

                            function runExcellFunctionforNumberofHydration(h) {
                                if (h < numberofHydration) {
                                    Mastertransactional.find().where(query).sort('createdAt ASC').skip((h * limit)).limit(limit).populateAll().exec(function found(err, masterData) {
                                        if (err) next({ err, status: 500 });

                                        exportService.convertDataforExcellFormatforDynamicLargeData(masterData, fromDate, toDate,  (account.excelFormatSettings || []), h, limit,function(masterData) {
                                            exportService.exportXLSforDynamicLargeData(masterData, ((venueIDs == 'All' || venueIDs == '' || venueIDs == null) ? ''  : venueIDs), fromDate, toDate, (account.excelFormatSettings || []), excellData, h, limit, largeText, function(data) {
                                                excellData = data;
                                                h++;
                                                runExcellFunctionforNumberofHydration(h);
                                            });
                                        });
                                    });
                                } else {
                                    var newDate = new Date().getTime();

                                    wb.write("assets/images/" + newDate + ".xlsx", function(err, stats) {
                                        if (err) next({ err, status: 500 });

                                        const pathToAttachment = path.join(process.env.SAILS_PROJECT_ROOT, 'assets', 'images', `${newDate}.xlsx`);
                                        let attachment = fs.readFileSync(pathToAttachment).toString("base64");

                                        msg.attachments = [
                                            {
                                                content: attachment,
                                                filename: `${newDate}.xlsx`,
                                                disposition: 'attachment'
                                            }
                                        ];

                                        sgMail
                                            .send(msg)
                                            .then(() => res.send())
                                            .catch(err => next({ err, status: 500 }));
                                    });
                                }
                            }
                        }
                    }
                });
            });
        }
    },

    postFeedback: function(req, res, next) {
        var transporter = nodemailer.createTransport("SMTP", {
            host: process.env.NODEMAILER_HOST,
            port: process.env.NODEMAILER_PORT,
            auth: {
                user: process.env.NODEMAILER_USER,
                pass: process.env.NODEMAILER_PASS
            },
        });
        var mailOptions = {
            from: process.env.SUPPORT_EMAIL,
            to: process.env.SOLUTIONS_EMAIL,
            subject: 'Suport ticket raised from ' + req.param('accountName'),
            text: "Type: " + req.param('type') + " \ncomments: " + req.param('comments') + " \n sender: " + req.param('email') + "\nHotel name: " + req.param('accountName')
        }

        transporter.sendMail(mailOptions, function(err, response) {
            if (err) {
                console.log('email failed..........' + JSON.stringify(err));
                res.send(err);
            }
            if (response) {
                console.log('mail send success');

                var mailOptions2 = {
                    from: process.env.SUPPORT_EMAIL,
                    to: req.param('email'),
                    subject: 'Evaletz app - Thank you for your feedback',
                    text: ''
                }

                transporter.sendMail(mailOptions2, function(err, response) {
                    if (err) {
                        console.log('email failed..........' + JSON.stringify(err));
                    }
                    if (response) {
                        console.log('mail send success');
                    }
                });
                res.send(response);

            }
        });

    },
    checkAndDeleteRow: function(req, res, next) {
        Dailytransactional.findOne(req.param('id')).exec(function found(err, data) {
            if (err) {
                return res.send({ success: 'error' });
            } else if (!data) {
                return res.send({ success: 'error' });
            } else {
                data.success = 'success';
                return res.send(data);
            }
        });
    },
    getTodayAnalyticsforanAccount: function(req, res, next){ 
        Account.findOne(req.body.accountID).exec(function foundUsers(err, account) {
            if(account && account.timeZone)
                timezone = account.timeZone;
            else 
                timezone = "Asia/Kolkata";
            Mastertransactional.find().where({ "accountID": req.body.accountID, 'updatedAt':  
                { 
                    '>=' : moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 00:00"),timezone)).format()  , '<=' :  moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 23:59:00"),timezone)).format() 
                } 
            } ).exec(function found(err, masterData) { 
                if(masterData && masterData.length > 0){
                    var _carArray = [];
                    _carArray.push(_.filter(masterData, function(car){
                        return car.status == 'parked';
                    }).length);
                    _carArray.push(_.filter(masterData, function(car){
                        return car.status == 'requested';
                    }).length);
                    _carArray.push(_.filter(masterData, function(car){
                        return (car.status == 'requested' &&  car.log.length == 2 && car.log[1].specialRequest);
                    }).length);
                    _carArray.push(_.filter(masterData, function(car){
                        return car.status == 'accept';
                    }).length);
                    _carArray.push(_.filter(masterData, function(car){
                        return car.status == 'complete';
                    }).length);
                    res.send(_carArray);
                } else 
                return res.send([0,0,0,0,0]);
            });
        });
    },
    getAccountAnalyticsData: function(req, res, next){
        Yearmonthtransactional.find().where({ "accountID": req.body.accountID }).exec(function found(err, masterData) { 
            if(masterData && masterData.length > 0){
                var yearWise = _.chain(masterData)
                .groupBy("year")
                .map(function(value, key) {
                    return [key, _.reduce(value, function(result, currentObject) {
                        return {
                            count: result.total + currentObject.total,
                            fees: result.fees + currentObject.fees
                        }
                    }, {
                        count: 0,
                        fees : 0
                    })];
                })
                .object()
                .value();
                var keys1 = Object.keys(yearWise);
                getYears(0);
                function getYears(k1){
                    if(k1 < keys1.length){   
                        // console.log(  yearWise[keys1[k1]] + keys1[k1]  )
                        yearWise[keys1[k1]].month = _.map(_.filter(masterData, function(y){ 
                                return y.year == keys1[k1];
                        }), 'month');   
                        yearWise[keys1[k1]].count = _.map(_.filter(masterData, function(y){ 
                                return y.year == keys1[k1];
                        }), 'total');   
                        yearWise[keys1[k1]].fees = _.map(_.filter(masterData, function(y){ 
                            return y.year == keys1[k1];
                        }), 'fees');
                        k1++;
                        getYears(k1);
                    } else {
                        // console.log(JSON.stringify(yearWise));
                        res.send(yearWise);
                        yearWise = null;
                    }
                }                          
            } else 
            return res.send({});
        });
    },
    getYearMonthTodayRecords: function(req, res, next){
        if(req.body.accountID){
            Totaltransactional.find().where({ "accountID": req.body.accountID, 'date':  {  ">=":  moment(req.body.fromDate).format('YYYY-MM-DD'), "<=":  moment(req.body.toDate).format('YYYY-MM-DD') } }).exec(function found(err, masterData) { 
                if(masterData && masterData.length > 0){
                    return res.send({
                        count: _.map(masterData,'total'),
                        fees: _.map(masterData,'fees'),
                        date: _.map(masterData, 
                            function(d) {
                                return parseInt(d.date.toString().substring(8,10));
                            }
                        )
                    });
                } else 
                return res.send({});
            });
        } else 
            return res.send({});       
    },
    getTodayAnalyticsforaVenue: function(req, res, next){ 
        Account.findOne(req.body.accountID).exec(function foundUsers(err, account) {
            if(account && account.timeZone)
                timezone = account.timeZone;
            else 
                timezone = "Asia/Kolkata";
            Mastertransactional.find().where({ "accountID": req.body.accountID, "venue": req.body.venueID, 'updatedAt':  
                { 
                    '>=' : moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 00:00"),timezone)).format()  , '<=' :  moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 23:59:00"),timezone)).format() 
                } 
            } ).exec(function found(err, masterData) { 
                if(masterData && masterData.length > 0){
                    var _carArray = [];
                    _carArray.push(_.filter(masterData, function(car){
                        return car.status == 'parked';
                    }).length);
                    _carArray.push(_.filter(masterData, function(car){
                        return car.status == 'requested';
                    }).length);
                    _carArray.push(_.filter(masterData, function(car){
                        return (car.status == 'requested' &&  car.log.length == 2 && car.log[1].specialRequest);
                    }).length);
                    _carArray.push(_.filter(masterData, function(car){
                        return car.status == 'accept';
                    }).length);
                    _carArray.push(_.filter(masterData, function(car){
                        return car.status == 'complete';
                    }).length);
                    res.send(_carArray);
                } else 
                return res.send([0,0,0,0,0]);
            });
        });
    },
    getVenueAnalyticsData: function(req, res, next){
        Yearmonthvenuetransactional.find().where({ "accountID": req.body.accountID, "venueID" : req.body.venueID }).exec(function found(err, masterData) { 
            if(masterData && masterData.length > 0){
                var yearWise = _.chain(masterData)
                .groupBy("year")
                .map(function(value, key) {
                    return [key, _.reduce(value, function(result, currentObject) {
                        return {
                            count: result.total + currentObject.total,
                            fees: result.fees + currentObject.fees
                        }
                    }, {
                        count: 0,
                        fees: 0
                    })];
                })
                .object()
                .value();
                var keys1 = Object.keys(yearWise);
                getYears(0);
                function getYears(k1){
                    if(k1 < keys1.length){   
                        // console.log(  yearWise[keys1[k1]] + keys1[k1]  )
                        yearWise[keys1[k1]].month = _.map(_.filter(masterData, function(y){ 
                                return y.year == keys1[k1];
                        }), 'month');   
                        yearWise[keys1[k1]].count = _.map(_.filter(masterData, function(y){ 
                                return y.year == keys1[k1];
                        }), 'total');
                        yearWise[keys1[k1]].fees = _.map(_.filter(masterData, function(y){ 
                            return y.year == keys1[k1];
                        }), 'fees');   
                        k1++;
                        getYears(k1);
                    } else {
                        // console.log(JSON.stringify(yearWise));
                        res.send(yearWise);
                        yearWise = null;
                    }
                }                          
            } else 
            return res.send({});
        });
    },
    getYearMonthTodayRecordsVenue: function(req, res, next){
        if(req.body.accountID){
            Totalvenuetransactional.find().where({ "accountID": req.body.accountID, "venueID" : req.body.venueID, 'date':  {  ">=":  moment(req.body.fromDate).format('YYYY-MM-DD'), "<=":  moment(req.body.toDate).format('YYYY-MM-DD') } }).exec(function found(err, masterData) { 
                if(masterData && masterData.length > 0){
                    return res.send({
                        count: _.map(masterData,'total'),
                        fees: _.map(masterData,'fees'),
                        date: _.map(masterData, 
                            function(d) {
                                return parseInt(d.date.toString().substring(8,10));
                            }
                        )
                    });
                } else 
                return res.send({});
            });
        } else 
            return res.send({});
    }, 
    overAllAccountVenueWiseData : function(req, res, next){
        Totalvenuetransactional.find().where({ "accountID": req.body.accountID, 'date':  {  ">=":  moment(req.body.fromDate).format('YYYY-MM-DD'), "<=":  moment(req.body.toDate).format('YYYY-MM-DD') } }).exec(function found(err, masterData) { 
            if(masterData && masterData.length > 0){
                var allVenueRecord =  _.chain(masterData)
                .groupBy("venueID")
                .map(function(value, key) {
                    return {
                            date : _.pluck((_.filter(value, (d)=> { return d.date = d.date.substr(-2) } )),'date'),
                            venue : key,
                            fees: (_.pluck(value, "fees")),
                            count: (_.pluck(value, "total"))
                        }
                })
                .value();
                runQuery(0);
                function runQuery(q){
                    if(q < allVenueRecord.length){
                        Venue.findOne(allVenueRecord[q].venue).exec(function(err, venueDetails) {
                            if(venueDetails)
                                allVenueRecord[q].venue = venueDetails.venueName;
                            q++;
                            runQuery(q);
                        });
                    }else {
                        res.send(allVenueRecord);
                        allVenueRecord = null;
                    }
                }
            } else 
            return res.send({});
        });
    },
    assignedVenueWiseData : function(req, res, next){
        Totalvenuetransactional.find().where({ "venueID": req.body.venueID, 'date':  {  ">=":  moment(req.body.fromDate).format('YYYY-MM-DD'), "<=":  moment(req.body.toDate).format('YYYY-MM-DD') } }).exec(function found(err, masterData) { 
            if(masterData && masterData.length > 0){
                var allVenueRecord =  _.chain(masterData)
                .groupBy("venueID")
                .map(function(value, key) {
                    return {
                            date : _.pluck((_.filter(value, (d)=> { return d.date = d.date.substr(-2) } )),'date'),
                            venue : key,
                            fees: (_.pluck(value, "fees")),
                            count: (_.pluck(value, "total"))
                        }
                })
                .value();
                runQuery(0);
                function runQuery(q){
                    if(q < allVenueRecord.length){
                        Venue.findOne(allVenueRecord[q].venue).exec(function(err, venueDetails) {
                            if(venueDetails)
                                allVenueRecord[q].venue = venueDetails.venueName;
                            q++;
                            runQuery(q);
                        });
                    }else {
                        res.send(allVenueRecord);
                        allVenueRecord = null;
                    }
                }
            } else 
            return res.send({});
        });
    },
    dashboardDatum: function(req, res, next){
        Array.prototype.sum = function (prop) {
            var total = 0
            for ( var i = 0, _len = this.length; i < _len; i++ ) {
                if(this[i][prop])
                    total += this[i][prop]
            }
            return total;
        }
        var data = [];
        if(req.body.accountID){
            Yearmonthtransactional.find().where({ "accountID": req.body.accountID}).exec(function found(err, masterData) { 
                if(masterData && masterData.length > 0){
                    data = [{
                        count: masterData.sum('total'),// _.sum(masterData, (a)=> { return a.total }),
                        fees: masterData.sum('fees'), //_.sum(masterData, (a) => { return a.fees })
                     }]
                     Totaltransactional.find().where({ "accountID": req.body.accountID, date : moment(req.body.date).format('YYYY-MM-DD')}).exec(function found(err, masterData1) { 
                        if(masterData1 && masterData1.length > 0){
                            data.push({
                                count: masterData1.sum('total'),
                                fees: masterData1.sum('fees'),
                            });
                            User.find().where({ "accountID": req.body.accountID}).exec(function found(err, users) { 
                                data.push({ users : users.length, userCount : _.filter(users, (c) => { return (c.role == 'driver' || c.role == 'chauffeur'  || c.role == 'validator' || c.role == 'accountinguser' )}).length  });
                                return res.send(data);
                            });
                        } else {
                            data.push({
                                count: 0,
                                fees: 0
                             });
                            User.find().where({ "accountID": req.body.accountID}).exec(function found(err, users) { 
                                data.push({ users : users.length, userCount : _.filter(users, (c) => { return (c.role == 'driver' || c.role == 'chauffeur'  || c.role == 'validator' || c.role == 'accountinguser'  )}).length });
                                return res.send(data);
                            });
                        }
                    });
                } else  {
                    data.push({
                        count: 0,
                        fees: 0
                     });
                    data.push({
                        count: 0,
                        fees: 0
                     });
                    User.find().where({ "accountID": req.body.accountID}).exec(function found(err, users) { 
                        data.push({ users : users.length, userCount : _.filter(users, (c) => { return (c.role == 'driver' || c.role == 'chauffeur'  || c.role == 'validator' || c.role == 'accountinguser'  )}).length  });
                        return res.send(data);
                    });
                }
            });
        } else 
            return res.send(data);       
    }, 
    getCompletedCarList: function(req, res, next) {
        if (req.method === 'POST') {
            var requestedCar = [];
            if (req.param('role') == 'manager' || req.param('role') == 'chauffeur' || req.param('role') == 'driver') {
                var venueIDs = req.param('venueID');
                Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    getCarDetailsBasedonEachState(0);
                    
                    function getCarDetailsBasedonEachState(j){
                        if(j < venueIDs.length){
                            Mastertransactional.find({},{
                                "fields":
                                {
                                    "parkingID": 1,
                                    "plateNumber": 1,
                                    "snap": 1,
                                    "parkingZone": 1,
                                    "color": 1,
                                    "brand": 1,
                                    "status": 1,
                                    "modelName": 1,
                                    "log": 1,
                                    "changeLog": 1,
                                    "scratchesSnap": 1,
                                    "loginAs": 1,
                                    "remarks": 1,
                                    "customerType": 1,
                                    "free": 1,
                                    "documents": 1,
                                    "description": 1,
                                    "createdAt" : 1,
                                    "updatedAt" : 1,
                                    "venue": 1,
                                    "fees": 1,
                                    "validatedBy" :1,
                                    "validatedAt" : 1,
                                    "cashAcceptedBy" : 1,
                                    "cashAcceptedAt" : 1,
                                    "id": 1,
                                    feeSplitUp : 1,
                                    newfeeSplitUp : 1
                                }
                            }).where({ "venue": venueIDs[j].id, updatedAt : { '>=' : moment.utc(moment.tz((moment.tz(accountVenues.timeZone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),accountVenues.timeZone)).format() }, status : 'complete' }).sort({}).populate('venue', { select : ['venueName'] }).exec(function found(err, dailyData1) { // subtract(2, 'days') 
                                if (err) {
                                    j++;
                                    getCarDetailsBasedonEachState(j);
                                }
                                requestedCar =  _.merge(requestedCar,dailyData1); // dailyData1;
                                j++;
                                getCarDetailsBasedonEachState(j);
                            });
                        }else {
                            res.send({ completedCar: requestedCar });
                        }
                    }
                });
            
                if (venueIDs.length == 0)
                    res.send({ notFound: 'notFound' });
            } else if (req.param('role') == 'accountadmin') {
                Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    Mastertransactional.find({},{
                        "fields":
                        {
                            "parkingID": 1,
                            "plateNumber": 1,
                            "snap": 1,
                            "parkingZone": 1,
                            "color": 1,
                            "brand": 1,
                            "status": 1,
                            "modelName": 1,
                            "log": 1,
                            "changeLog": 1,
                            "scratchesSnap": 1,
                            "loginAs": 1,
                            "remarks": 1,
                            "customerType": 1,
                            "free": 1,
                            "documents": 1,
                            "description": 1,
                            "createdAt" : 1,
                            "updatedAt" : 1,
                            "venue": 1,
                            "fees": 1,
                            "validatedBy" :1,
                            "validatedAt" : 1,
                            "cashAcceptedBy" : 1,
                            "cashAcceptedAt" : 1,
                            "id": 1,
                            feeSplitUp : 1,
                            newfeeSplitUp : 1
                        }
                    }).where({ "accountID":  req.param('accountID'), updatedAt : { '>=' : moment.utc(moment.tz((moment.tz(accountVenues.timeZone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"), accountVenues.timeZone)).format() }, status : 'complete' }).sort({}).populate('venue', { select : ['venueName'] }).exec(function found(err, dailyData1) {
                        if (err) {
                            res.send({ completedCar: [] });
                        }
                        requestedCar = dailyData1;
                        res.send({ completedCar: requestedCar });
                        requestedCar = null;
                    });

                    // getCarDetailsBasedonEachState(0);
                                        
                    // function getCarDetailsBasedonEachState(j){
                    //     if(j <  accountVenues.venues.length){
                    //         Mastertransactional.find().where({ "venue":  accountVenues.venues[j].id, createdAt : { '>=' : moment.utc(moment.tz((moment.tz(accountVenues.timeZone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"), accountVenues.timeZone)).format() }, status : 'complete' }).populateAll().exec(function found(err, dailyData1) {
                    //             if (err) {
                    //                 j++;
                    //                 getCarDetailsBasedonEachState(j);
                    //             };
                    //             requestedCar =  _.merge(requestedCar,dailyData1);
                    //             j++;
                    //             getCarDetailsBasedonEachState(j);
                    //         });
                    //     } else {
                    //         res.send({ completedCar: requestedCar });
                    //     }
                    // }
                });
            } else if (req.param('role') == 'admin') {
                // Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                //     if (err) return next(err);
                //     if (!accountVenues) {
                //         return res.send({ notFound: 'notFound' });
                //     }
                //     Mastertransactional.find({},{
                //         "fields":
                //         {
                //             "parkingID": 1,
                //             "plateNumber": 1,
                //             "snap": 1,
                //             "parkingZone": 1,
                //             "color": 1,
                //             "brand": 1,
                //             "status": 1,
                //             "modelName": 1,
                //             "log": 1,
                //             "changeLog": 1,
                //             "scratchesSnap": 1,
                //             "loginAs": 1,
                //             "remarks": 1,
                //             "customerType": 1,
                //             "free": 1,
                //             "documents": 1,
                //             "description": 1,
                //             "createdAt" : 1,
                //             "updatedAt" : 1,
                //             "venue": 1,
                //             "fees": 1,
                //             "validatedBy" :1,
                //             "validatedAt" : 1,
                //             "cashAcceptedBy" : 1,
                //             "cashAcceptedAt" : 1,
                //             "id": 1, 
                //             feeSplitUp : 1,
                //             newfeeSplitUp : 1
                //         }
                //     }).where({ updatedAt : { '>=' : moment.utc(moment.tz((moment.tz(accountVenues.timeZone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),accountVenues.timeZone)).format() }, status : 'complete' }).sort({}).populate('venue', { select : ['venueName'] }).populate('accountID', { select: ["accountName", "id"]}).exec(function found(err, dailyData1) {
                //         if (err) return next(err);
                //         requestedCar =  dailyData1;
                        res.send({ completedCar: [] });
                //     });
                // });
            } else 
                return res.send();
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('Dailytransactional with socket id ' + req.socket.id + ' is now subscribed');
            // });
        }
    },
    getCompletedCarListTodayOnlyforOscar: function(req, res, next) {
        if (req.method === 'POST') {
            var requestedCar = [];
            if (req.param('role') == 'manager' || req.param('role') == 'chauffeur' || req.param('role') == 'driver') {
                var venueIDs = req.param('venueID');
                Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    getCarDetailsBasedonEachState(0);
                    
                    function getCarDetailsBasedonEachState(j){
                        if(j < venueIDs.length){
                            Mastertransactional.find({},{
                                "fields":
                                {
                                    "parkingID": 1,
                                    "plateNumber": 1,
                                    "snap": 1,
                                    "parkingZone": 1,
                                    "color": 1,
                                    "brand": 1,
                                    "status": 1,
                                    "modelName": 1,
                                    "log": 1,
                                    // "changeLog": 1,
                                    "scratchesSnap": 1,
                                    "loginAs": 1,
                                    "remarks": 1,
                                    "customerType": 1,
                                    "free": 1,
                                    "documents": 1,
                                    "description": 1,
                                    "createdAt" : 1,
                                    "updatedAt" : 1,
                                    "venue": 1,
                                    "fees": 1,
                                    "validatedBy" :1,
                                    "validatedAt" : 1,
                                    "cashAcceptedBy" : 1,
                                    "cashAcceptedAt" : 1,
                                    "id": 1,
                                    feeSplitUp : 1,
                                    newfeeSplitUp : 1, 
                                    otherInfo : 1
                                }
                            }).where({ "venue": venueIDs[j].id, updatedAt : { '>=' : moment.utc(moment.tz((moment.tz(accountVenues.timeZone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),accountVenues.timeZone)).format() }, status : 'complete' }).sort({}).populate('venue', { select : ['venueName'] }).exec(function found(err, dailyData1) {
                                if (err) {
                                    j++;
                                    getCarDetailsBasedonEachState(j);
                                }
                                requestedCar =  _.merge(requestedCar,dailyData1); // dailyData1;
                                j++;
                                getCarDetailsBasedonEachState(j);
                            });
                        }else {
                            res.send({ completedCar: requestedCar });
                            requestedCar = null;
                        }
                    }
                });
            
                if (venueIDs.length == 0)
                    res.send({ notFound: 'notFound' });
            } else if (req.param('role') == 'accountadmin') {
                Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    Mastertransactional.find({},{
                        "fields":
                        {
                            "parkingID": 1,
                            "plateNumber": 1,
                            "snap": 1,
                            "parkingZone": 1,
                            "color": 1,
                            "brand": 1,
                            "status": 1,
                            "modelName": 1,
                            "log": 1,
                            // "changeLog": 1,
                            "scratchesSnap": 1,
                            "loginAs": 1,
                            "remarks": 1,
                            "customerType": 1,
                            "free": 1,
                            "documents": 1,
                            "description": 1,
                            "createdAt" : 1,
                            "updatedAt" : 1,
                            "venue": 1,
                            "fees": 1,
                            "validatedBy" :1,
                            "validatedAt" : 1,
                            "cashAcceptedBy" : 1,
                            "cashAcceptedAt" : 1,
                            "id": 1,
                            feeSplitUp : 1,
                            newfeeSplitUp : 1
                        }
                    }).where({ "accountID":  req.param('accountID'), updatedAt : { '>=' : moment.utc(moment.tz((moment.tz(accountVenues.timeZone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"), accountVenues.timeZone)).format() }, status : 'complete' }).sort({}).populate('venue', { select : ['venueName'] }).exec(function found(err, dailyData1) {
                        if (err) {
                            res.send({ completedCar: [] });
                        }
                        requestedCar = dailyData1;
                        res.send({ completedCar: requestedCar });
                        requestedCar = null;
                    });
                });
            } else if (req.param('role') == 'admin') {
                // Account.findOne(req.param('accountID')).populate('venues').exec(function found(err, accountVenues) {
                //     if (err) return next(err);
                //     if (!accountVenues) {
                //         return res.send({ notFound: 'notFound' });
                //     }
                //     Mastertransactional.find({},{
                //         "fields":
                //         {
                //             "parkingID": 1,
                //             "plateNumber": 1,
                //             "snap": 1,
                //             "parkingZone": 1,
                //             "color": 1,
                //             "brand": 1,
                //             "status": 1,
                //             "modelName": 1,
                //             "log": 1,
                //             // "changeLog": 1,
                //             "scratchesSnap": 1,
                //             "loginAs": 1,
                //             "remarks": 1,
                //             "customerType": 1,
                //             "free": 1,
                //             "documents": 1,
                //             "description": 1,
                //             "createdAt" : 1,
                //             "updatedAt" : 1,
                //             "venue": 1,
                //             "fees": 1,
                //             "validatedBy" :1,
                //             "validatedAt" : 1,
                //             "cashAcceptedBy" : 1,
                //             "cashAcceptedAt" : 1,
                //             "id": 1,
                //             feeSplitUp : 1,
                //             newfeeSplitUp : 1
                //         }
                //     }).where({ updatedAt : { '>=' : moment.utc(moment.tz((moment.tz(accountVenues.timeZone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),accountVenues.timeZone)).format() }, status : 'complete' }).sort({}).populate('venue', { select : ['venueName'] }).populate('accountID', { select: ["accountName", "id"]}).exec(function found(err, dailyData1) {
                //         if (err) return next(err);
                //         requestedCar =  dailyData1;
                        res.send({ completedCar: [] });
                //         requestedCar = null;
                //     });
                // });
            } else 
                return res.send();
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('Dailytransactional with socket id ' + req.socket.id + ' is now subscribed');
            // });
        }
    },
    populateAccoutUsersVenues: function(req, res, next) {
        User.find({}, {
            fields : {
                "email" :1,
                "role" : 1,
                'id': 1,
                'userName' : 1,
                'profileImage' :1,
                'venue' : 1,
            }
        }).where({ "accountID":  req.param('accountID')}).sort().populate('venues', { select : ['venueName','id']}).exec(function found(err, masterData) { 
            return res.send(masterData);
        });
    },
    guestCarHistories: function(req, res, next) {
        Mastertransactional.find().where({ "carID":  req.param('parkingID')}).sort().populate('venue', { select : ['venueName','id']}).exec(function found(err, masterData) { 
            return res.send(masterData);
        });
    },
    editGusetCar: function(req, res, next) {
        Car.findOne({ id: req.param('id') }).exec(function findCar(err, foundData) {
            if (err) return next(err);
            Car.update(  req.param('id'), { "modelName" :   req.param('modelName'), color :  req.param('color'), plateNumber :  req.param('plateNumber'), brand :  req.param('brand')}, function userUpdated(err, car) {
                if (err) return next(err);
                return res.send({ success: 'success' });
            });
        });
    },
    deleteCarByGuest: function(req, res, next) {
        Car.findOne({ id: req.param('id') }).exec(function findCar(err, foundData) {
            if (err) return next(err);
            Car.destroy(req.param('id'), function Destroyed(err, destroyObj) {
                if (err) return next(err);
                return res.send(destroyObj);
            });
        });
    },
    gettingAccountingUserDashboardDatum: function(req, res, next) {
        Array.prototype.sum = function (prop) {
            var total = 0
            for ( var i = 0, _len = this.length; i < _len; i++ ) {
                if(this[i][prop])
                    total += this[i][prop]
            }
            return total;
        }
        var data = { totalCollected : {},
            todayCollected : {},
            users : {}
         };
        Yearmonthvenuetransactional.find().where({ "venueID": req.body.venueID}).exec(function found(err, masterData) { 
            if(masterData && masterData.length > 0){
                data['totalCollected'] = { // total amt
                    count: masterData.sum('total'),// _.sum(masterData, (a)=> { return a.total }),
                    fees: masterData.sum('fees'), //_.sum(masterData, (a) => { return a.fees })
                 }
                 Totalvenuetransactional.find().where({ "venueID": req.body.venueID, date : moment(req.body.date).format('YYYY-MM-DD')}).exec(function found(err, masterData1) { 
                    if(masterData1 && masterData1.length > 0){
                        data['todayCollected'] = { // today date amt
                            count: masterData1.sum('total'),
                            fees: masterData1.sum('fees'),
                        };
                        getVenueUsers();
                    } else {
                        data['todayCollected'] = {
                            count: 0,
                            fees: 0
                         }
                         getVenueUsers();
                    }
                });
            } else  {
                data['totalCollected'] =  {
                    count: 0,
                    fees: 0
                 };
                 data['todayCollected'] = {
                    count: 0,
                    fees: 0
                 }
                 getVenueUsers();
            }
        });

        var users;
        function getVenueUsers(){
            Venue.find({ "id": req.body.venueID}).populate('users', { select : ['userName', 'role'] }).exec(function found(err, venue) { 
                if(venue.length > 0)
                    users = venue[0].users;
                else 
                    users = [];
                data['users'] = { users : users.length, userCount : _.filter(users, (c) => { return (c.role == 'driver' || c.role == 'chauffeur' || c.role == 'validator' || c.role == 'accountinguser' )}).length  } ;

                Dailytransactional.find().where({ "venue": req.body.venueID
                }).exec(function found(err, masterData) { 
                    if(!masterData)
                        masterData = [];
                    Mastertransactional.find().where({ "venue": req.body.venueID, "status" : 'complete',
                        or : [{ 'createdAt': { '>=':  moment.utc(momentTZ.tz(( moment(req.body.date).format('YYYY-MM-DD') + " 00:00"),req.body.timezone)).format(), '<=' : moment.utc(momentTZ.tz((  moment(req.body.date).format('YYYY-MM-DD')  + " 23:59:00"), req.body.timezone)).format()}}, { 'updatedAt': { '>=':  moment.utc(momentTZ.tz((  moment(req.body.date).format('YYYY-MM-DD') + " 00:00"),req.body.timezone)).format(), '<=' : moment.utc(momentTZ.tz(( moment(req.body.date).format('YYYY-MM-DD') + " 23:59:00"),req.body.timezone)).format() }}] 
                    }).exec(function found(err, masterData2) { 
                        if(!masterData2)
                            masterData2 = [];
                        return res.send({
                            "info" : data,
                            "totalCarsProcessedToday" : masterData.length,
                            "totalCarsinParkedState" : _.filter(masterData, (p)=>{
                                return p.status == 'parked';
                            }).length,
                            "totalCarsinRequestedState" : _.filter(masterData, (p)=>{
                                return p.status == 'requested';
                            }).length, 
                            "totalCarsinCompletedState" : _.filter(masterData2, (p)=>{
                                return p.status == 'complete';
                            }).length
                        });
                    });
                });
            });
        }
    },
    getCompletedCarDetails: function(req, res, next) {
        Mastertransactional.find().where({ "transactionID": req.param('transactionID') }).populate('venue').exec(function found(err, masterData) {
            if(masterData.length > 0 )
                return res.send({ success : masterData[0]});
            else 
                return res.send({ error : 'nofound'});
        });
    },
    accountAdminDashboardDatum: function(req, res, next) {
        Account.findOne(req.param('accountID')).exec(function found(err, accountVenues) {
            if (err) return next(err);
            if(accountVenues){
                if(accountVenues.timeZone)
                    timezone = accountVenues.timeZone;
                var query = {};
                query = { "accountID": req.param('accountID')}
                query['status'] = 'parked';
                Dailytransactional.count(query).sort('createdAt DESC').exec(function found(err, parked) {
                    query['status'] = { "!": 'parked' };
                    Dailytransactional.count(query).sort('createdAt DESC').exec(function found(err, requested) {
                        query['status'] = 'complete';
                        query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"), timezone)).format() }
                        Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, complete) {
                            return res.send({parked : parked, requested : requested, complete : complete});
                        });
                    });
                });   
            } else 
                return res.send({parked : [], requested : [], complete : []});
        });
    },
    getAccountVenueswithUsers: function(req, res, next) {
        Venue.find().where({ "account": req.param('accountID') }).populate('users',{ select : ['userName', 'profileImage', 'role', 'id'],  where: {
            role : 'driver'
          }}).exec(function found(err, venueData) {
            if (err) return res.send({ venues : []});
            if(venueData){
                return res.send({ venues : venueData});
            }
        });
    },
    getVenueIDwithUsers: function(req, res, next) {
        Venue.find().where({ "id": req.param('venueID') }).populate('users',{ select : ['userName', 'profileImage', 'role', 'id'],  where: {
            role : 'driver'
          }}).exec(function found(err, venueData) {
            if (err) return res.send({ venues : []});
            if(venueData){
                return res.send({ venues : venueData});
            }
        });
    },
    getAccountVenuesOnly: function(req, res, next) {
        Venue.find({}, {
            "fields":{
                venueName : 1,
                id: 1
            }                              
        }).where({ "account": req.param('accountID') }).sort('createdAt ASC').exec(function found(err, venueData) {
            if (err) return res.send({ venues : []});
            if(venueData){
                return res.send({ venues : venueData});
            }
        })
    },
    getVenuewithFilteredDrivers: function(req, res, next) {
        Venue.findOne({ "id": req.param('venueID') }).populate('users',{ select : ['userName', 'profileImage', 'role', 'id'],  where: {
            role : 'driver'
          }}).sort('createdAt ASC').exec(function found(err, venueData) {
            if (err) return res.send({});
            if(venueData){
                return res.send(venueData);
            }
        })
    },
    getVenueIDwithFilteredDrivers: function(req, res, next) {
        try {
            Venue.findOne({ "id": req.param('venueID') }).populate('users',{ select : ['userName', 'profileImage', 'role', 'id'],  where: {
                role : 'driver'
              }}).sort('createdAt ASC').exec(function found(err, venueData) {
                if (err) return res.send({ users : []});
                if(venueData){
                    return res.send({ users : venueData.users});
                }
            });
        } catch(e){
            return res.send({ users : []});
        }
    },
    getUserswithVenueswithMinimumFileds : function(req, res, next) {
        try {
            User.find({ "accountID": req.param('accountID') }, {
                "fields":
                {
                    "userName" : 1,
                    "email" : 1,
                    "role" : 1,
                    "venues" :1,
                    "id": 1
                }
            }).populate('venues',{ select : ['venueName', 'id']}).sort('createdAt ASC').exec(function found(err, data) {
                if (err) return res.send({ users : [] });
                if(data){
                    return res.send({ users : data });
                }
            });
        } catch(e){
            return res.send({ users : [] });
        }
    },
    getCarDetailsFromAPICallOnlyforMobilewithLazyLoadingOfflineOnly : function(req, res, next) {
        /*if (req.method === 'POST') {
            var mobileFilelds = {
                "fields":
                {
                    "parkingID": 1,
                    "plateNumber": 1,
                    "parkingZone": 1,
                    // "color": 1,
                    "brand": 1,
                    "status": 1,
                    "modelName": 1,
                    "log": 1,
                    // "loginAs": 1,
                    "free": 1,
                    "createdAt" : 1,
                    "updatedAt" : 1,
                    "venue": 1,
                    "fees": 1,
                    // "validatedBy" :1,
                    // "validatedAt" : 1,
                    // "cashAcceptedBy" : 1,
                    // "cashAcceptedAt" : 1,
                    "id": 1, 
                    // 'feeSplitUp' : 1,
                    // 'newfeeSplitUp' : 1,
                    // "revalidatedBy" : 1,
                    "amountPaid" : 1, 
                    'bill': 1
                }
            };
            if (req.param('role') == 'manager' || req.param('role') == 'chauffeur' || req.param('role') == 'driver') {
                var venueIDs = req.param('venueID');
                if(venueIDs.length > 0){
                    var query = {};
                    Account.findOne(req.param('accountID')).exec(function found(err, accountVenues) {
                        if(err) return res.send();
                        if(accountVenues && accountVenues.timeZone)
                            timezone = accountVenues.timeZone;
                            if(req.param('status') != 'requested'){
                                query = { 'status' : req.param('status')}
                            } 
        
                            if(req.param('venueID') &&  venueIDs.length > 0)
                                query['venue'] = venueIDs[0].id
        
                            if(req.param('search') && req.param('status') != 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                            } 
                            
                            if(req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                                query['status'] = { "!": 'parked' }
                            }
        
                            if(!req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { status  : { contains: 'requested' } },
                                    { status  : { contains: 'accept' } }
                                ]
                            }
        
                            if(req.param('status') == 'complete'){
                                query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),timezone)).format() }
                                ////////////////////////////////
                            }
                            
                           if(req.param('status') != 'complete'){
                                Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        return res.send(_temp);
                                    });
                                });
                           } else {
                                Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    Mastertransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        if(req.param('skip') == 0)
                                            _temp['accountVenues'] = accountVenues.venues;
                                        return res.send(_temp);
                                    });
                                });
                           }
                    });
                }
                if (venueIDs.length == 0)
                    res.send({ notFound: 'notFound' });
            } else if (req.param('role') == 'accountadmin') {
                Account.findOne(req.param('accountID')).exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    if(accountVenues.timeZone)
                        timezone = accountVenues.timeZone;
                    var query = {};
                    if(req.param('status') != 'requested'){
                        query = { "accountID": req.param('accountID'), 'status' : req.param('status')}
                    } else 
                        query = { "accountID": req.param('accountID')}


                    if(req.param('venueID') &&  req.param('venueID').length > 0)
                        query['venue'] = req.param('venueID')[0].id;

                    if(req.param('search') && req.param('status') != 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                    } 
                    
                    if(req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                        query['status'] = { "!": 'parked' }
                    }

                    if(!req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { status  : { contains: 'requested' } },
                            { status  : { contains: 'accept' } }
                        ]
                    }

                    if(req.param('status') == 'complete'){
                        query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"), timezone)).format() }
                        ////////////////////////////////
                    }
                    
                   if(req.param('status') != 'complete'){
                        Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                            Dailytransactional.find({},mobileFilelds).where(query).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' ) ).skip(req.param('skip')).limit(req.param('limit')).exec(function found(err, dailyData) {
                                if (err) return next(err);
                                var _temp = { car: dailyData, length : dailyDataLength};
                                if(req.param('skip') == 0)
                                    _temp['accountVenues'] = accountVenues.venues;
                                return res.send(_temp);
                            });
                        });
                   } else {
                    mobileFilelds['fields']['newfeeSplitUp'] = 1;
                        Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                            Mastertransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').exec(function found(err, dailyData) {
                                if (err) return next(err);
                                var _temp = { car: dailyData, length : dailyDataLength};
                                if(req.param('skip') == 0)
                                    _temp['accountVenues'] = accountVenues.venues;
                                return res.send(_temp);
                            });
                        });
                   }
                });
            } else if (req.param('role') == 'admin') {
                // Dailytransactional.find().populateAll().exec(function found(err, dailyData) { //
                //     if (err) return next(err);
                    res.send({ parked: [], requested: [] });
                // });
            } else 
                return res.send();
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('Dailytransactional with socket id ' + req.socket.id + ' is now subscribed');
            // });
        }*/
        if (req.method === 'POST') {
            var mobileFilelds = {
                "fields":
                {
                    "parkingID": 1,
                    "plateNumber": 1,
                    "parkingZone": 1,
                    "color": 1,
                    "brand": 1,
                    "status": 1,
                    "modelName": 1,
                    "log": 1,
                    "loginAs": 1,
                    "free": 1,
                    "createdAt" : 1,
                    "updatedAt" : 1,
                    "venue": 1,
                    "fees": 1,
                    "validatedBy" :1,
                    "validatedAt" : 1,
                    "cashAcceptedBy" : 1,
                    "cashAcceptedAt" : 1,
                    "id": 1, 
                    'feeSplitUp' : 1,
                    'newfeeSplitUp' : 1,
                    "bill": 1,
                    "revalidatedBy" : 1,
                    "revalidatedAt" : 1,
                    "amountPaid" : 1
                }
            };
            if (req.param('role') == 'manager' || req.param('role') == 'chauffeur' || req.param('role') == 'driver') {
                var venueIDs = req.param('venueID');
                if(venueIDs.length > 0){
                    var query = {};
                    Account.findOne(req.param('accountID')).populate('venues',{ select : ['venueName', 'id'] }).exec(function found(err, accountVenues) {
                        if(err) return res.send();
                        if(accountVenues && accountVenues.timeZone)
                            timezone = accountVenues.timeZone;
                            if(req.param('status') != 'requested'){
                                query = { 'status' : req.param('status')}
                            } 
        
                            if(req.param('venueID') &&  venueIDs.length > 0)
                                query['venue'] = venueIDs[0].id
        
                            if(req.param('search') && req.param('status') != 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                            } 
                            
                            if(req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                                query['status'] = { "!": 'parked' }
                            }
        
                            if(!req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { status  : { contains: 'requested' } },
                                    { status  : { contains: 'accept' } }
                                ]
                            }
        
                            if(req.param('status') == 'complete'){
                                query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),timezone)).format() }
                                ////////////////////////////////
                            }
                            
                            if(req.param('status') != 'complete'){
                                Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    if(req.param('status') != 'requested'){
                                        Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                            if (err) return next(err);
                                            var _temp = { car: dailyData, length : dailyDataLength};
                                            return res.send(_temp);
                                        });
                                    } else {
                                        if(req.param('sortByRequested') == "indianSort" && !req.param('search')){
                                            delete query.or;
                                            query['status'] ='requested';
        
                                            Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyRequestedDataLength) {
                                                if(dailyRequestedDataLength > req.param('skip')) {
                                                    Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                        if (err) return next(err);
                                                        var _temp = { car: dailyData, length : dailyDataLength};
                                                        return res.send(_temp);
                                                    });
                                                } else if(dailyRequestedDataLength <= req.param('skip')) {
                                                    query['status'] = 'accept';
                                                    var skip = req.param('skip') - dailyRequestedDataLength
                                                    Dailytransactional.find({},mobileFilelds).where(query).skip(skip).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                        if (err) return next(err);
                                                        var _temp = { car: dailyData, length : dailyDataLength};
                                                        return res.send(_temp);
                                                    });
                                                }
                                            });
                                        } else {
                                           Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                if (err) return next(err);
                                                var _temp = { car: dailyData, length : dailyDataLength};
                                                return res.send(_temp);
                                            });
                                        }                                          
                                    }
                                });
                            } else {
                                Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    Mastertransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        if(req.param('skip') == 0)
                                            _temp['accountVenues'] = accountVenues.venues;
                                        return res.send(_temp);
                                    });
                                });
                            }
                    });
                }
                if (venueIDs.length == 0)
                    res.send({ notFound: 'notFound' });
            } else if (req.param('role') == 'accountadmin') {
                Account.findOne(req.param('accountID')).populate('venues',{ select : ['venueName', 'id'] }).exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    if(accountVenues.timeZone)
                        timezone = accountVenues.timeZone;
                    var query = {};
                    if(req.param('status') != 'requested'){
                        query = { "accountID": req.param('accountID'), 'status' : req.param('status')}
                    } else 
                        query = { "accountID": req.param('accountID')}


                    if(req.param('venueID') &&  req.param('venueID').length > 0)
                        query['venue'] = req.param('venueID')[0].id;

                    if(req.param('search') && req.param('status') != 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                    } 
                    
                    if(req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                        query['status'] = { "!": 'parked' }
                    }

                    if(!req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { status  : { contains: 'requested' } },
                            { status  : { contains: 'accept' } }
                        ]
                    }

                    if(req.param('status') == 'complete'){
                        query['updatedAt'] = { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"), timezone)).format() }
                        ////////////////////////////////
                    }
                    
                    if(req.param('status') != 'complete'){
                        Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                            if(req.param('status') != 'requested'){
                                Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                    if (err) return next(err);
                                    var _temp = { car: dailyData, length : dailyDataLength};
                                    return res.send(_temp);
                                });
                            } else {
                                if(req.param('sortByRequested') == "indianSort" && !req.param('search')){
                                    delete query.or;
                                    query['status'] ='requested';

                                    Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyRequestedDataLength) {
                                        if(dailyRequestedDataLength > req.param('skip')) {
                                            Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                if (err) return next(err);
                                                var _temp = { car: dailyData, length : dailyDataLength};
                                                return res.send(_temp);
                                            });
                                        } else if(dailyRequestedDataLength <= req.param('skip')) {
                                            query['status'] = 'accept';
                                            var skip = req.param('skip') - dailyRequestedDataLength
                                            Dailytransactional.find({},mobileFilelds).where(query).skip(skip).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                if (err) return next(err);
                                                var _temp = { car: dailyData, length : dailyDataLength};
                                                return res.send(_temp);
                                            });
                                        }
                                    });
                                } else {
                                    Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        return res.send(_temp);
                                    });
                                }                                          
                            }
                        });
                    } else {
                        mobileFilelds['fields']['newfeeSplitUp'] = 1;
                            Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                Mastertransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                    if (err) return next(err);
                                    var _temp = { car: dailyData, length : dailyDataLength};
                                    if(req.param('skip') == 0)
                                        _temp['accountVenues'] = accountVenues.venues;
                                    return res.send(_temp);
                                });
                            });
                    }
                });
            } else if (req.param('role') == 'admin') {
                // Dailytransactional.find().populateAll().exec(function found(err, dailyData) { //
                //     if (err) return next(err);
                    res.send({ parked: [], requested: [] });
                // });
            } else 
                return res.send();
        } else if (req.isSocket) {
            // Dailytransactional.find({}).exec(function(e, listOfDaily) {
            //     Dailytransactional.subscribe(req.socket, listOfDaily);
            //     // console.log('Dailytransactional with socket id ' + req.socket.id + ' is now subscribed');
            // });
        }
    },
    lazyloadingOnlineSync : function(req, res, next) {
        if (req.method === 'POST') {
            var mobileFilelds = {
                "fields":
                {
                    "parkingID": 1,
                    "plateNumber": 1,
                    "parkingZone": 1,
                    "color": 1,
                    "brand": 1,
                    "status": 1,
                    "modelName": 1,
                    "log": 1,
                    "loginAs": 1,
                    "free": 1,
                    "createdAt" : 1,
                    "updatedAt" : 1,
                    "venue": 1,
                    "fees": 1,
                    "validatedBy" :1,
                    "validatedAt" : 1,
                    "cashAcceptedBy" : 1,
                    "cashAcceptedAt" : 1,
                    "id": 1, 
                    'feeSplitUp' : 1,
                    'newfeeSplitUp' : 1,
                    "bill": 1,
                    "revalidatedBy" : 1,
                    "revalidatedAt" : 1,
                    "amountPaid" : 1
                }
            };
            if (req.param('role') == 'manager' || req.param('role') == 'chauffeur' || req.param('role') == 'driver') {
                var venueIDs = req.param('venueID');
                if(venueIDs.length > 0){
                    var query = {};
                    Account.findOne(req.param('accountID')).populate('venues',{ select : ['venueName', 'id'] }).exec(function found(err, accountVenues) {
                        if(err) return res.send();
                        if(accountVenues && accountVenues.timeZone)
                            timezone = accountVenues.timeZone;
                            if(req.param('status') != 'requested'){
                                query = { 'status' : req.param('status')}
                            } 
        
                            if(req.param('venueID') &&  venueIDs.length > 0)
                                query['venue'] = venueIDs[0].id
        
                            if(req.param('search') && req.param('status') != 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                            } 
                            
                            if(req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { parkingID  : { contains: req.param('search') } },
                                    { plateNumber     : { contains:  req.param('search')} },
                                    { brand  : { contains: req.param('search') } }
                                ]
                                query['status'] = { "!": 'parked' }
                            }
        
                            if(!req.param('search') && req.param('status') == 'requested'){
                                query['or'] = [
                                    { status  : { contains: 'requested' } },
                                    { status  : { contains: 'accept' } }
                                ]
                            }

                            if(req.param('status') == 'parked' || req.param('status') == 'requested' || req.param('status') == 'complete'){

                                query['updatedAt'] = { '>='  : moment.utc(momentTZ.tz((moment(req.param('lastSyncedTime'))),timezone)).format() } 
                                ////////////////////////////////
                            }
                            
                            console.log("\n\n\n\n\n\n\n\n\n\n\n\n" + JSON.stringify(query) + "\n\n\n\n\n\n\n\n\n\n\n\n")

                            if(req.param('status') != 'complete'){
                                Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    if(req.param('status') != 'requested'){
                                        Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                            if (err) return next(err);
                                            var _temp = { car: dailyData, length : dailyDataLength};
                                            return res.send(_temp);
                                        });
                                    } else {
                                        if(req.param('sortByRequested') == "indianSort" && !req.param('search')){
                                            delete query.or;
                                            query['status'] ='requested';
        
                                            Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyRequestedDataLength) {
                                                if(dailyRequestedDataLength > req.param('skip')) {
                                                    Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                        if (err) return next(err);
                                                        var _temp = { car: dailyData, length : dailyDataLength};
                                                        return res.send(_temp);
                                                    });
                                                } else if(dailyRequestedDataLength <= req.param('skip')) {
                                                    query['status'] = 'accept';
                                                    var skip = req.param('skip') - dailyRequestedDataLength
                                                    Dailytransactional.find({},mobileFilelds).where(query).skip(skip).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                        if (err) return next(err);
                                                        var _temp = { car: dailyData, length : dailyDataLength};
                                                        return res.send(_temp);
                                                    });
                                                }
                                            });
                                        } else {
                                           Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                if (err) return next(err);
                                                var _temp = { car: dailyData, length : dailyDataLength};
                                                return res.send(_temp);
                                            });
                                        }                                          
                                    }
                                });
                            } else {
                                Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                    Mastertransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        if(req.param('skip') == 0)
                                            _temp['accountVenues'] = accountVenues.venues;
                                        return res.send(_temp);
                                    });
                                });
                            }
                    });
                }
                if (venueIDs.length == 0)
                    res.send({ notFound: 'notFound' });
            } else if (req.param('role') == 'accountadmin') {
                Account.findOne(req.param('accountID')).populate('venues',{ select : ['venueName', 'id'] }).exec(function found(err, accountVenues) {
                    if (err) return next(err);
                    if (!accountVenues) {
                        return res.send({ notFound: 'notFound' });
                    }
                    if(accountVenues.timeZone)
                        timezone = accountVenues.timeZone;
                    var query = {};
                    if(req.param('status') != 'requested'){
                        query = { "accountID": req.param('accountID'), 'status' : req.param('status') }
                    } else 
                        query = { "accountID": req.param('accountID')}


                    if(req.param('venueID') &&  req.param('venueID').length > 0)
                        query['venue'] = req.param('venueID')[0].id;

                    if(req.param('search') && req.param('status') != 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                    } 
                    
                    if(req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { parkingID  : { contains: req.param('search') } },
                            { plateNumber     : { contains:  req.param('search')} },
                            { brand  : { contains: req.param('search') } }
                        ]
                        query['status'] = { "!": 'parked' }
                    }

                    if(!req.param('search') && req.param('status') == 'requested'){
                        query['or'] = [
                            { status  : { contains: 'requested' } },
                            { status  : { contains: 'accept' } }
                        ]
                    }

                    if(req.param('status') == 'parked' || req.param('status') == 'requested' || req.param('status') == 'complete'){
                        query['updatedAt'] =  { '>='  : moment.utc(momentTZ.tz((moment(req.param('lastSyncedTime'))),timezone)).format() } 
///////

                        
                        ////////////////////////////////
                    } // 1529570370519
                    
                    if(req.param('status') != 'complete'){
                        Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                            if(req.param('status') != 'requested'){
                                Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                    if (err) return next(err);
                                    var _temp = { car: dailyData, length : dailyDataLength};
                                    return res.send(_temp);
                                });
                            } else {
                                if(req.param('sortByRequested') == "indianSort" && !req.param('search')){
                                    delete query.or;
                                    query['status'] ='requested';

                                    Dailytransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyRequestedDataLength) {
                                        if(dailyRequestedDataLength > req.param('skip')) {
                                            Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                if (err) return next(err);
                                                var _temp = { car: dailyData, length : dailyDataLength};
                                                return res.send(_temp);
                                            });
                                        } else if(dailyRequestedDataLength <= req.param('skip')) {
                                            query['status'] = 'accept';
                                            var skip = req.param('skip') - dailyRequestedDataLength
                                            Dailytransactional.find({},mobileFilelds).where(query).skip(skip).limit(req.param('limit')).sort('updatedAt ASC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                                if (err) return next(err);
                                                var _temp = { car: dailyData, length : dailyDataLength};
                                                return res.send(_temp);
                                            });
                                        }
                                    });
                                } else {
                                    Dailytransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort(( req.param('status') == 'requested' ? 'updatedAt ASC' : 'updatedAt DESC' )).populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                        if (err) return next(err);
                                        var _temp = { car: dailyData, length : dailyDataLength};
                                        return res.send(_temp);
                                    });
                                }                                          
                            }
                        });
                    } else {
                        mobileFilelds['fields']['newfeeSplitUp'] = 1;
                            Mastertransactional.count(query).sort('updatedAt DESC').exec(function found(err, dailyDataLength) {
                                Mastertransactional.find({},mobileFilelds).where(query).skip(req.param('skip')).limit(req.param('limit')).sort('updatedAt DESC').populate('venue',{ select : ['venueName', 'id', 'settings'] }).exec(function found(err, dailyData) {
                                    if (err) return next(err);
                                    var _temp = { car: dailyData, length : dailyDataLength};
                                    if(req.param('skip') == 0)
                                        _temp['accountVenues'] = accountVenues.venues;
                                    return res.send(_temp);
                                });
                            });
                    }
                });
            } else if (req.param('role') == 'admin') {
                res.send({ parked: [], requested: [] });
            } else 
                return res.send();
        }
    },
    afterLazyloadingOnlineSync: function(req, res, next){
        Account.findOne(req.param('accountID')).populate('venues',{ select : ['venueName', 'id'] }).exec(function found(err, accountVenues) {
            if (err) return next(err);
            if (!accountVenues) {
                return res.send({ notFound: 'notFound' });
            }
            if(accountVenues.timeZone)
                timezone = accountVenues.timeZone;
    
            var master = {
                "accountID" : req.param('accountID'),
                "or" : [{ "status" : 'complete'}, { "status" : 'completed'}],
                'updatedAt' : { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"), timezone)).format() }, // today 
               
            }
            var daily = {
                "accountID" : req.param('accountID'), 
                "updatedAt" : { "<=" : moment.utc(momentTZ.tz((moment(req.param('lastSyncedTime'))),timezone)).format() } // lastsync
            }

            if(req.param('role') != 'accountadmin'){
                if( req.param('venueID') && req.param('venueID').length > 0){
                    master['venue'] = req.param('venueID')[0].id;
                    daily['venue'] = req.param('venueID')[0].id;
                }
            }
 // .where({ "updatedAt" : { "<=" : moment.utc(moment.tz(req.param('lastSyncedTime')),timezone).format() }})
            Mastertransactional.find({},{ 'fields' : {
                id : 1
            }}).where(master).sort('updatedAt DESC').exec(function found(err, masterData) {
                if (err) return next(err);
                Dailytransactional.find({},{ 'fields' : {
                    id : 1
                }}).where(daily).sort('updatedAt DESC').exec(function found(err, dailyData) {
                    if (err) return next(err);
                    return res.send( { 'daily' :  dailyData, 'master' : masterData});
                });
            });
        });
    },
    searchBasedonParkingID : function(req, res, next){
        try {
            var timezone = "Asia/Kolkata";
            Account.findOne(req.param('accountID')).exec(function found(err, accountVenues) {
                if(err) return res.send({ message : 'not found' });
                if(accountVenues && accountVenues.timeZone)
                    timezone = accountVenues.timeZone;
                Dailytransactional.find().where({ accountID : req.param('accountID'), parkingID : req.param('parkingID')}).sort('updatedAt DESC').populateAll().limit(1).exec(function foundCar(err, car) {
                    if(err)
                        return res.send({ message : 'not found' });
                    if (car && car.length == 0) {
                        Mastertransactional.find().where({ accountID : req.param('accountID'), parkingID : req.param('parkingID'), status : 'complete' , updatedAt : { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),timezone)).format() }}).limit(1).sort('updatedAt DESC').populateAll().exec(function found(err, masterData) {
                            if(masterData && masterData.length > 0){
                                return res.send({ message : 'ok', car : masterData });
                            } else 
                                return res.send({ message : 'not found' });
                        });
                    } else if(car.length > 0)
                        return res.send({ message : 'ok', car : car });
                    else    
                        return res.send({ message : 'not found' });
                });
            });
        } catch(err){
            return res.send({ message : 'not found' , err : err });
        }
    },
    searchBasedonCarID : function(req, res, next){
        try {
            var timezone = "Asia/Kolkata";
            Account.findOne(req.param('accountID')).exec(function found(err, accountVenues) {
                if(err) return res.send({ message : 'not found' });
                if(accountVenues && accountVenues.timeZone)
                    timezone = accountVenues.timeZone;
                Dailytransactional.find().where({ accountID : req.param('accountID'), carID : req.param('parkingID')}).sort('updatedAt DESC').populateAll().limit(1).exec(function foundCar(err, car) {
                    if(err)
                        return res.send({ message : 'not found' });
                    if (car && car.length == 0) {
                        Mastertransactional.find().where({ accountID : req.param('accountID'), carID : req.param('parkingID'), status : 'complete' , updatedAt : { '>=' : moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59"),timezone)).format() }}).limit(1).sort('updatedAt DESC').populateAll().exec(function found(err, masterData) {
                            if(masterData && masterData.length > 0){
                                return res.send({ message : 'ok', car : masterData });
                            } else 
                                return res.send({ message : 'not found' });
                        });
                    } else if(car.length > 0)
                        return res.send({ message : 'ok', car : car });
                    else    
                        return res.send({ message : 'not found' });
                });
            });
        } catch(err){
            return res.send({ message : 'not found' , err : err });
        }
    },
    getHourWiseReportforVenues : function(req, res, next){
        try {
            var fromDate = req.param('date');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');
            var query = {};
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                    
                query = { "accountID": accountID }

                if(req.param('status') == 'parked')
                    query['createdAt'] = { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+req.param('fromTime')),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+req.param('toTime')),timezone)).format() }
                else {
                    query['updatedAt'] = { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+req.param('fromTime')),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+req.param('toTime')),timezone)).format() }
                    query['status'] = req.param('status');
                }

                if (venueIDs != 'All') 
                    query['venue'] = venueIDs;

                if (req.param('customerType') !='All') 
                    query['customerType'] = req.param('customerType');


                Mastertransactional.count(query).sort('createdAt ASC').exec(function found(err, masterData) {
                    if (err) {
                        return res.send({ length : 0, data : [], chart: []});
                    }
                    if (masterData > 0) {
                        Mastertransactional.find({}, {
                            "fields":
                            {
                                "parkingID": 1,
                                "plateNumber": 1,
                                "parkingZone": 1,
                                "color": 1,
                                "brand": 1,
                                "status": 1,
                                "modelName": 1,
                                "log": 1,
                                // "changeLog": 1,
                                "scratchesSnap": 1,
                                // "loginAs": 1,
                                "remarks": 1,
                                "customerType": 1,
                                "free": 1,
                                // "documents": 1,
                                "description": 1,
                                "createdAt" : 1,
                                "updatedAt" : 1,
                                "venue": 1,
                                "fees": 1,
                                // "validatedBy" :1,
                                // "validatedAt" : 1,
                                // "cashAcceptedBy" : 1,
                                // "cashAcceptedAt" : 1,
                                "id": 1
                            }
                        }).where(query).sort('createdAt ASC').populate('venue', { select : ['venueName'] }).skip(req.param('skip')).limit(req.param('limit')).exec(function found(err, original) {
                            if (err) {
                                return res.send({ length : 0, data : [], chart: [], error : err});
                            }
                            if (original) {
                                if(req.param('skip') == 0){
                                    var dataSplitups = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10','11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
                                    var chatData = [];
                                    var subQuery = {};


                                    // subQuery = { "accountID": accountID }

                                    // if(req.param('status') == 'parked')
                                    //     subQuery['createdAt'] = { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+ req.param('fromTime')),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+ req.param('toTime')    ),timezone)).format() }
                                    // else 
                                    //     subQuery['updatedAt'] = { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+  req.param('fromTime') ),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+   req.param('toTime')  ),timezone)).format() }

                                    // if (venueIDs != 'All') 
                                    //     subQuery['venue'] = venueIDs;

                                    // if (req.param('customerType') !='All') 
                                    //     subQuery['customerType'] = req.param('customerType');

                                    // subQuery['status'] = req.param('status');

                                    Mastertransactional.find({}, {
                                        fields : {
                                            createdAt : 1,
                                            updatedAt : 1
                                        }
                                    }).where(query).sort('createdAt ASC').exec(function found(err, hourWiseCarCount) {
                                        if(err){
                                            
                                        }
                                        if(hourWiseCarCount){
                                            var groupByResult = [];
                                            var groupByResultKeys = [];
                                            function groupByCount(c){
                                                if(c < groupByResultKeys.length){
                                                    groupByResult[groupByResultKeys[c]] = {
                                                        x : groupByResultKeys[c],
                                                        y : groupByResult[groupByResultKeys[c]].length
                                                    }   
                                                    c++;
                                                    groupByCount(c);
                                                } else 
                                                    return res.send({ length : masterData, data : original, chart: groupByResult });
                                            }

                                            if(req.param('status') == 'parked'){
                                                groupByResult = _.groupBy(hourWiseCarCount, (o)=>{ return moment(o.createdAt).tz(timezone).format('HH').toString(); })
                                                groupByResultKeys = Object.keys(groupByResult);
                                                groupByCount(0);                                                
                                            } else {
                                                groupByResult = _.groupBy(hourWiseCarCount, (o)=>{ return moment(o.updatedAt).tz(timezone).format('HH').toString(); })
                                                groupByResultKeys = Object.keys(groupByResult);
                                                groupByCount(0); 
                                            }
                                        }
                                    });


                                    // getAllHoursData(0);

                                    // function getAllHoursData(hh){
                                    //     if(hh < dataSplitups.length){
                                    //         subQuery = { "accountID": accountID }

                                    //         if(req.param('status') == 'parked')
                                    //             subQuery['createdAt'] = { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+ dataSplitups[hh] + ":00"  ),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+   dataSplitups[hh] + ":59"  ),timezone)).format() }
                                    //         else 
                                    //             subQuery['updatedAt'] = { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+ dataSplitups[hh] + ":00"  ),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+   dataSplitups[hh] + ":59"  ),timezone)).format() }

                                    //         if (venueIDs != 'All') 
                                    //             subQuery['venue'] = venueIDs;

                                    //         if (req.param('customerType') !='All') 
                                    //             subQuery['customerType'] = req.param('customerType');

                                    //         subQuery['status'] = req.param('status');

                                    //         Mastertransactional.count(subQuery).sort('createdAt ASC').exec(function found(err, hourWiseCarCount) {
                                    //             if(err){
                                    //                 hh++;
                                    //                 getAllHoursData(hh);
                                    //             }
                                    //             if(hourWiseCarCount >= 0){
                                    //                 chatData.push({ x : dataSplitups[hh], y : hourWiseCarCount});
                                    //                 hh++;
                                    //                 getAllHoursData(hh);
                                    //             }
                                    //         });


                                    //     } else {
                                    //         return res.send({ length : masterData, data : original, chart: chatData });
                                    //     }
                                    // }
                                } else 
                                    return res.send({ length : masterData, data : original, chart: [] });
                            }
                        });
                    } else 
                    return res.send({ length : 0, data :[], chart: [] });
                }); 
            });        
        } catch(err){
            return res.send({ length : 0, data :[], chart: [] , error : err});
        }
    },

    downloadandSendHourWiseReportforVenues : function(req, res, next){
        try {
            var fromDate = req.param('date');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');
            var query = {};

            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if (!account) next({ message: 'account not found', status: 400 });

                account && account.timeZone
                    ? timezone = account.timeZone
                    : timezone = "Asia/Kolkata";

                var whereData;

                req.param('status') === 'parked'
                    ? whereData = 'createdAt'
                    : whereData = 'updatedAt';

                query = { "accountID": accountID }

                const qgte = moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+ req.param('fromTime')), timezone)).format();
                const qlte = moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " "+ req.param('toTime')), timezone)).format();

                if (req.param('status') === 'parked') {
                    query['createdAt'] = { '>=': qgte, '<=': qlte };
                } else {
                    query['updatedAt'] = { '>=': qgte, '<=': qlte };
                    query['status'] = req.param('status');
                }

                if (venueIDs !== 'All') 
                    query['venue'] = venueIDs;

                if (req.param('customerType') !=='All') 
                    query['customerType'] = req.param('customerType');

                Mastertransactional.count(query).sort('createdAt ASC').exec(function found(err, masterData) {
                    if (err) return res.send({ error: 'No record'});

                    if (masterData > 0) {
                        var limit = 100;
                        var numberofHydration =  masterData / limit;
                        var wb = new xl.Workbook();

                        var excellData = wb.addWorksheet('Hourly Report', {
                            pageSetup: {
                                fitToWidth: 1
                            },
                            headerFooter: {
                                oddHeader: '',
                                oddFooter: ''
                            }
                        });

                        var largeText = wb.createStyle({
                            font: {
                                name: 'Cambria',
                                size: 20
                            }
                        });

                        excellData.column(2).setWidth(25);
                        excellData.row(2).setHeight(25);
                        excellData.column(3).setWidth(25);
                        excellData.column(5).setWidth(25);  

                        runExcellFunctionforNumberofHydration(0);

                        function runExcellFunctionforNumberofHydration(h) {
                            if (h < numberofHydration) {
                                Mastertransactional.find({}, {
                                    "fields": {
                                        "parkingID": 1,
                                        "plateNumber": 1,
                                        "color": 1,
                                        "brand": 1,
                                        "log": 1,
                                        "createdAt" : 1,
                                        "updatedAt" : 1,
                                        "venue": 1,
                                        "fees": 1,
                                        'accountID': 1
                                    }
                                }).where(query).sort('createdAt ASC').skip((h * limit)).limit(limit).populate('accountID', { select : ['accountName', 'timeZone'] }).populate('venue', { select : ['venueName']}).exec(function found(err, masterData2) {
                                    if (err) next({ err, status: 500 });

                                    exportService.convertDataforExcellFormatforHourlyBasedReport(masterData2, fromDate, req.param('fromTime'), req.param('toTime'), req.param('status'), h, limit,function(data1) {
                                        exportService.exportXLSforHourlyBasedReport(data1, ((venueIDs == 'All' || venueIDs == '' || venueIDs == null) ? ''  : venueIDs), fromDate, req.param('fromTime'), req.param('toTime'), req.param('status'), excellData, h, limit, largeText, function(data) {
                                            excellData = data;
                                            h++;
                                            runExcellFunctionforNumberofHydration(h);
                                        });
                                    });
                                });
                            } else {
                                var newDate = new Date().getTime();

                                wb.write("assets/images/" + newDate + ".xlsx", function(err, stats) {
                                    if (err) next({ err, status: 500 });
                                    if (!req.param('sendEmail')) return res.send(newDate + ".xlsx");

                                    if (req.param('sendEmail')) {
                                        const pathToAttachment = path.join(process.env.SAILS_PROJECT_ROOT, 'assets', 'images', `${newDate}.xlsx`);
                                        let attachment = fs.readFileSync(pathToAttachment).toString("base64");

                                        const msg = {
                                            from: {
                                                name: 'Valeters VPMS Report',
                                                email: process.env.REPORTER_EMAIL
                                            },
                                            to: req.param('email'),
                                            bcc: process.env.BCC_EMAIL,
                                            subject: 'Hourly Report | Valeters VPMS',
                                            text: 'Please see attachment. Thank you!',
                                            html: '<strong>Please see attachment. Thank you!</strong>',
                                            attachments: [{
                                                content: attachment,
                                                filename: `${newDate}.xlsx`,
                                                disposition: 'attachment',
                                            }],
                                        };

                                        sgMail
                                            .send(msg)
                                            .then(() => res.send('mail sent'))
                                            .catch(err => next({ err, status: 500 }));
                                    }
                                });
                            }
                        }
                    } else {
                        return res.send({ error : 'No record'});
                    }
                }); 
            });        
        } catch (err) {
            return res.send({ error : 'No record'});
        }
    },
    getDeviceInformationByAccountID : function(req, res, next){
        try {
            var fromDate = req.param('date');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');
            var query = {};
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                    
                query = {"accountID":  ObjectId(accountID) };                 
                if (venueIDs != 'All') 
                    query['venue'] =  ObjectId(venueIDs);   

                var from = moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format("YYYY-MM-DD");
                var to = moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format("YYYY-MM-DD");

                query['$or'] = [
                            {
                                "createdAt" : { $gte: new Date(from) , $lte :   new Date(to)   }
                            }, {
                                "updatedAt" : { $gte: new Date(from) , $lte :   new Date(to)   }
                            }
                        ]
                // Mastertransactional.find({groupBy: ['device'], sum : ['count']}).sort('createdAt ASC').exec(function(err, result){
                //     if (err) return res.serverError(err);
                //     console.log(result);
                //     return res.send({ success : result });
                // });
            
                Mastertransactional.native(function(err,collection) {
                    collection.aggregate(
                        [
                            {
                                $match: {
                                    accountID : query.accountID,
                                    // venue : query.venue,
                                    $or : query.$or
                                }
                            },
                            {
                                $group: {
                                    _id:"$device",
                                    count: { $sum:  1 },
                                }
                            }
                        ],
                        function(err,result) {
                          if (err) return res.serverError(err);
                          console.log(result);
                          return res.send({ success : result });
                        }
                    )
                });              
            });  
        } catch(err){
            return res.send({ message : 'not found' , err : err });
        }
    },
    getDeviceInformationByAccountIDforAdmin : function(req, res, next){
        try {
            var fromDate = req.param('date');
            var venueIDs = req.param('venueID');
            var accountID = req.param('accountID');
            var query = {};
            Account.findOne(accountID).exec(function foundUsers(err, account) {
                if(account && account.timeZone)
                    timezone = account.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                    
                query = {"accountID":  accountID };                 
                if (venueIDs != 'All') 
                    query['venue'] =  venueIDs;   

                query["createdAt"] = { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD")  + " 23:59:00"),timezone)).format() }

                var errObj = {  
                    devices : {
                        Android : 0,
                        iPad : 0,
                        iPhone : 0,
                        Linux : 0,
                        Windows : 0,
                        Mac : 0
                    }
                }
                query["device"] = 'Android';
                Mastertransactional.count(query).exec(function(err, resultAndroid){
                    if (err) return res.send(errObj);
                    query["device"] = 'iPad';
                    Mastertransactional.count(query).exec(function(err, resultiPad){
                        if (err) return res.send(errObj);
                        query["device"] = 'Linux';
                        Mastertransactional.count(query).exec(function(err, resultLinux){
                            if (err) return res.send(errObj);
                            query["device"] = 'Windows';               
                            Mastertransactional.count(query).exec(function(err, resultWindows){
                                if (err) return res.send(errObj);
                                query["device"] = 'Mac';
                                Mastertransactional.count(query).exec(function(err, resultMac){
                                    if (err) return res.send(errObj);
                                    query["device"] = 'iPhone';
                                    Mastertransactional.count(query).exec(function(err, resultiPhone){
                                        if (err) return res.send(errObj);
                                        return res.send({  devices : {
                                            Android : resultAndroid,
                                            iPad : resultiPad,
                                            iPhone : resultiPhone,
                                            Linux : resultLinux,
                                            Windows : resultWindows,
                                            Mac : resultMac
                                        }});
                                    });
                                });
                            });
                        });
                    });
                });
            });  
        } catch(err){
            return res.send({ message : 'not found' , err : err });
        }
    },
    getTodayValidatedInformation : function(req, res, next){
        try {
            var fromDate = req.param('date');
            var query = {};
            Account.findOne(req.param('accountID')).exec(function found(err, accountVenues) {
                if (err) return next(err);
                if (!accountVenues) {
                    return res.send({ notFound: 'notFound' });
                }

                if(accountVenues && accountVenues.timeZone)
                    timezone = accountVenues.timeZone;

                Mastertransactional.find({}, {
                    fields : {
                        parkingID : 1,
                        // plateNumber : 1,
                        validatedAt :1, 
                        validatedBy : 1,
                        otherInfo : 1
                        // _id: 0
                    }
                }).where({ 
                    'accountID' : req.param('accountID'), 
                    'venue' : req.param('venueID'), 
                    'validatedAt': { '>=': moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 00:00"),timezone)).format(), '<=' : moment.utc(momentTZ.tz((moment(fromDate).format("YYYY-MM-DD") + " 23:59:00"),timezone)).format() },
                    'validatedBy.by' : req.param('validatedBy')
                    }).sort('updatedAt DESC').exec(function found(err, masterData) {
                        if(masterData && masterData.length > 0){
                            return res.send({ message : 'ok', car : masterData });
                        } else 
                            return res.send({ message : 'not found' }); 
                });
            });
        } catch(err){
            return res.send({ message : 'not found' , err : err });
        }
    },
    getSecureParkingUsedToken : function(req, res, next){
        try {
            Dailytransactional.find({}, {
                fields : {
                    parkingID : 1,
                    _id: 0
                }
            }).where({ 
                'accountID' : req.param('accountID')
            }).exec(function found(err, masterData) {
                return res.send({ used :  masterData}); 
            });
        } catch(err){
            return res.send({ used : [] , err : err });
        }
    },
    gettingSupervisorDashboardDatum: function(req, res, next) {
        Array.prototype.sum = function (prop) {
            var total = 0
            for ( var i = 0, _len = this.length; i < _len; i++ ) {
                if(this[i][prop])
                    total += this[i][prop]
            }
            return total;
        }

        Account.findOne(req.param('accountID')).exec(function found(err, accountVenues) {
            if (err) return next(err);
            if(accountVenues){
                if(accountVenues.timeZone)
                    timezone = accountVenues.timeZone;

                var query = {};
                query = {
                    "accountID": req.param('accountID'), 
                    "or" : [
                        {
                            'createdAt': {
                                '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                            }
                        },
                        {
                            'updatedAt': {
                                '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                            }
                        }
                    ]
                };
                  
                if(req.param('venueID'))
                    query['venue'] = req.param('venueID');

                Mastertransactional.find({}, { fields : {
                    parkingID: 1,
                    plateNumber : 1,
                    fees : 1,
                    customerType : 1,
                    amountPaid : 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1
                }}).where(query).sort('updatedAt DESC').exec(function found(err, data) {
                    if(err)
                        return res.send({});
                    // Npt paid transactions
                    var queryforNotPaid = {
                        "accountID": req.param('accountID'),
                        amountPaid: false 
                    }
                    if(req.param('venueID'))
                        queryforNotPaid['venue'] = req.param('venueID');

                    Dailytransactional.find({}, { fields : {
                        accountID: 1,
                        venue: 1,
                        _id: 0,
                        fees : 1,
                        amountPaid : 1,
                        createdAt: 1,
                        updatedAt: 1
                    }}).where(queryforNotPaid).sort('updatedAt DESC').exec(function found(err, notPaidDaily) {
                        // fees condition > 0 
                        var queryforNotPaidMaster = {
                            "accountID": req.param('accountID'),
                            "amountPaid": false,
                            "or" : [{ "status" : 'complete'}, { "status" : 'completed'}],
                            "or" : [
                                {
                                    'createdAt': {
                                        '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                                    }
                                },
                                {
                                    'updatedAt': {
                                        '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                                    }
                                }
                            ]
                        }

                        if(req.param('venueID'))
                            queryforNotPaidMaster['venue'] = req.param('venueID');

                        Mastertransactional.find({}, { fields : {
                            accountID: 1,
                            venue: 1,
                            _id: 0,
                            fees : 1,
                            amountPaid : 1,
                            createdAt: 1,
                            updatedAt: 1
                        }}).where(queryforNotPaidMaster).sort('updatedAt DESC').exec(function found(err, notPaidMaster) {
                            
                            var dailyMasterNotPaidCount = _.filter(_.merge(notPaidDaily, notPaidMaster), (t)=>{
                                return t.amountPaid == false && t.fees > 0;
                            }).length;
        

                            var paidAtBasedQuery = {
                                "accountID": req.param('accountID'),
                                "amountPaid": true,
                                'paidAt': {
                                    '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                                }                                  
                            }

                            if(req.param('venueID'))
                                paidAtBasedQuery['venue'] = req.param('venueID');

                            Mastertransactional.find({}, { fields : {
                                accountID: 1,
                                venue: 1,
                                _id: 0,
                                fees : 1,
                                amountPaid : 1,
                                createdAt: 1,
                                updatedAt: 1
                            }}).where(paidAtBasedQuery).sort('updatedAt DESC').exec(function found(err, paidAtData) {
                                var paidRawData =  _.filter(paidAtData, (t)=>{
                                    return t.fees > 0 && t.amountPaid == true;
                                });

                                return res.send({
                                    transaction : data.length,
                                    amount : paidRawData.sum('fees'), // based on paidAt fields
                                    paid : paidRawData.length,
                                    notPaid:  dailyMasterNotPaidCount,
                                    complementary: _.filter(data, (t)=>{
                                        return t.fees == 0 || t.fees == null;
                                    }).length
                                });
                            });                           
                        });
                    });                   
                });
                  
            } else 
                return res.send({});
        });
    },
    gettingTransactionTypeBasedList:  function(req, res, next) {
        Account.findOne(req.param('accountID')).exec(function found(err, accountVenues) {
            if (err) return next(err);
            if(accountVenues){
                if(accountVenues.timeZone)
                    timezone = accountVenues.timeZone;

                if(req.param('type') == 'todayProcessed' || req.param('type')  == 'complementary'){
                    var query = {};
                    query = {
                        "accountID": req.param('accountID'), 
                        "or" : [
                            {
                                'createdAt': {
                                    '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                                }
                            },
                            {
                                'updatedAt': {
                                    '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                                }
                            }
                        ]
                    };
                      
                    if(req.param('venueID'))
                        query['venue'] = req.param('venueID');

                    Mastertransactional.find({}, { fields : {
                        _id: 0,
                        parkingID: 1,
                        plateNumber : 1,
                        fees : 1,
                        customerType : 1,
                        amountPaid : 1,
                        status: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }}).where(query).sort('updatedAt DESC').exec(function found(err, data) {
                        if(err)
                            return res.send({});
                        if(req.param('type')  == 'complementary'){
                            return res.send(_.filter(data, (t)=>{
                                return t.fees == 0 || t.fees == null;
                            }));
                        } else 
                            return res.send(data);
                    });
                }
               
                if(req.param('type') == 'paid'){
                    var paidAtBasedQuery = {
                        "accountID": req.param('accountID'),
                        "amountPaid": true,
                        'paidAt': {
                            '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                        }                                  
                    }

                    if(req.param('venueID'))
                        paidAtBasedQuery['venue'] = req.param('venueID');

                    Mastertransactional.find({}, { fields : {
                        parkingID: 1,
                        plateNumber : 1,
                        _id: 0,
                        fees : 1,
                        amountPaid : 1,
                        createdAt: 1,
                        updatedAt: 1,
                        status: 1
                    }}).where(paidAtBasedQuery).sort('updatedAt DESC').exec(function found(err, paidAtData) {
                        var paidRawData =  _.filter(paidAtData, (t)=>{
                            return t.fees > 0 && t.amountPaid == true;
                        });
                        return res.send(paidRawData);
                    });

                }

                if(req.param('type')  == 'notPaid'){
                    // Npt paid transactions
                    var queryforNotPaid = {
                        "accountID": req.param('accountID'),
                        amountPaid: false 
                    }
                    if(req.param('venueID'))
                        queryforNotPaid['venue'] = req.param('venueID');

                    Dailytransactional.find({}, { fields : {
                        accountID: 1,
                        venue: 1,
                        parkingID: 1,
                        plateNumber : 1,
                        _id: 0,
                        fees : 1,
                        amountPaid : 1,
                        createdAt: 1,
                        updatedAt: 1,
                        status: 1
                    }}).where(queryforNotPaid).sort('updatedAt DESC').exec(function found(err, notPaidDaily) {
                        // fees condition > 0 
                        var queryforNotPaidMaster = {
                            "accountID": req.param('accountID'),
                            "amountPaid": false,
                            "or" : [{ "status" : 'complete'}, { "status" : 'completed'}],
                            "or" : [
                                {
                                    'createdAt': {
                                        '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                                    }
                                },
                                {
                                    'updatedAt': {
                                        '>=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 02:00"), timezone)).format()
                                    }
                                }
                            ]
                        }

                        if(req.param('venueID'))
                            queryforNotPaidMaster['venue'] = req.param('venueID');

                        Mastertransactional.find({}, { fields : {
                            accountID: 1,
                            venue: 1,
                            parkingID: 1,
                            plateNumber : 1,
                            _id: 0,
                            fees : 1,
                            amountPaid : 1,
                            createdAt: 1,
                            updatedAt: 1,
                            status: 1
                        }}).where(queryforNotPaidMaster).sort('updatedAt DESC').exec(function found(err, notPaidMaster) {
                            

                            // var completedNotPaidCount = _.filter(notPaidMaster, (t)=>{
                            //     return t.amountPaid == false && t.fees > 0;
                            // });

                            return res.send(_.filter(_.merge(notPaidDaily, notPaidMaster), (t)=>{
                                return t.amountPaid == false && t.fees > 0;
                            }));
                        });
                    });
                }
            } else 
                return res.send({});
        });
    },
};