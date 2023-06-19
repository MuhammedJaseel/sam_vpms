var analysisService = require('../services/analysisService.js');
var gobalFunctionServices = require('../services/globalFunctions.js');
sails = require('sails');
var nodemailer = require('nodemailer');
var http = require('http');
const DEV = require('../../config/env/development.js');

var SecureParking = { // Complementary -  Email SMS AccountID - Configuration
    PROD : { // PROD server
        accountID : process.env.SP_ACCOUNT_ID,
        mobiles : '8904860031,9740141793,9986477877,8123363842',
        to: process.env.SOLUTIONS_EMAIL,
        bcc: process.env.BCC_EMAIL,
        otherVenues : {
            mobiles : '9597800382,9884954326,9994696656',
            to: process.env.SOLUTIONS_EMAIL,
            bcc: process.env.BCC_EMAIL,
        }
    },
    DEV : { // DEV server
        accountID : process.env.SP_ACCOUNT_ID_DEV,
        mobiles : '9597800382',
        to: process.env.SOLUTIONS_EMAIL,
        bcc: process.env.BCC_EMAIL,
        otherVenues : {
            mobiles : '9597800382,9884954326,9994696656',
            to: process.env.SOLUTIONS_EMAIL,
            bcc: process.env.BCC_EMAIL,
        }
    }
};

// var SP = (DEV.port == 2018 ? SecureParking.PROD : SecureParking.DEV);
var SP = {}; // find a sms gateway provider

var FileController = {
    uploadScratchesImages: function(req, res) {
        console.log("Received Request for Scratch Image Upload");
        if (req.isSocket) {
            // Dailytransactional.watch(req.socket);
            sails.sockets.join(req.socket,'myroom');
            // console.log('Dailytransactional subscribed to ' + req.socket.id);
        }
        if (req.method === 'POST') {
            var filenameOriginal;
            req.file('uploadFile').upload({
                saveAs: function(file, cb) {
                    cb(null, file.filename);
                    filenameOriginal = file.filename;
                },
                dirname: '../../assets/images'
            }, function whenDone(err, uploadedFiles) {
                if (err) {
                    console.log("Error in uploading Scratches Images");
                    return res.json(500, err);
                } else if (uploadedFiles.length === 0) {
                    console.log("Scratches Image Upload is 0");
                    res.send({ success: 'success' });
                    return;
                } else {
                    console.log("Scratches Image Uploaded successfully!!!");
                    console.log('uploadedFiles' + JSON.stringify(uploadedFiles));
                    res.send({ success: 'success', file: filenameOriginal });
                    return;
                }
            });
        }
    },
    uploadScratchesImages2: function(req, res) {
        console.log("Received Request for Scratch Image Upload");
        if (req.isSocket) {
            // Dailytransactional.watch(req.socket);
            sails.sockets.join(req.socket,'myroom');
            // console.log('Dailytransactional subscribed to ' + req.socket.id);
        }
        if (req.method === 'POST') {
            var filenameOriginal;
            req.file('file').upload({
                saveAs: function(file, cb) {
                    cb(null, file.filename);
                    filenameOriginal = file.filename;
                },
                dirname: '../../assets/images'
            }, function whenDone(err, uploadedFiles) {
                if (err) {
                    console.log("Error in uploading Scratches Images");
                    return res.json(500, err);
                } else if (uploadedFiles.length === 0) {
                    console.log("Scratches Image Upload is 0");
                    res.send({ success: 'success' });
                    return;
                } else {
                    console.log("Scratches Image Uploaded successfully!!!");
                    console.log('uploadedFiles' + JSON.stringify(uploadedFiles));
                    res.send({ success: 'success', file: filenameOriginal });
                    return;
                }
            });
        }
    },
    upload: function(req, res) {
        if (req.isSocket) {
            // Dailytransactional.watch(req.socket);
            sails.sockets.join(req.socket,'myroom');
            // console.log('Dailytransactional subscribed to ' + req.socket.id);
        }
        var newdate = new Date();
        var carLog = [];
        var carLogObj = {
            'activity': 'parked',
            'by': req.param('employeeID'),
            'employeeName': req.param('employeeName'),
            'at': newdate,
            'userProfile': req.param('profileImage')
        }
        var changeLog = [{
            "activity": 'parkingID',
            "changes": req.param('parkingID'),
            "at": new Date(),
            log: [{
                "activity": 'parkingID',
                "changes": req.param('parkingID'),
                "at": new Date()
            }]
        }, {
            "activity": 'plateNumber',
            "changes": req.param('plateNumber'),
            "at": new Date(),
            log: [{
                "activity": 'plateNumber',
                "changes": req.param('plateNumber'),
                "at": new Date()
            }]
        }, {
            "activity": 'parkingZone',
            "changes": req.param('parkingZone'),
            "at": new Date(),
            log: []
        }];
        if (req.param('parkingZone')) {
            changeLog[2]['log'] = [{
                "activity": 'parkingZone',
                "changes": req.param('parkingZone'),
                "at": new Date()
            }]
            if (req.param('loginUser')) {
                changeLog[2]['log'][0]['loginUser'] = {
                    "by": req.param('loginUser').id,
                    "email": req.param('loginUser').email,
                    "userName": req.param('loginUser').userName,
                    "userProfile": req.param('loginUser').userProfile
                }
            }
        }
        if (req.param('loginUser')) {
            changeLog[0]['log'][0]['loginUser'] = {
                "by": req.param('loginUser').id,
                "email": req.param('loginUser').email,
                "userName": req.param('loginUser').userName,
                "userProfile": req.param('loginUser').userProfile
            }
            changeLog[1]['log'][0]['loginUser'] = {
                "by": req.param('loginUser').id,
                "email": req.param('loginUser').email,
                "userName": req.param('loginUser').userName,
                "userProfile": req.param('loginUser').userProfile
            }
        }

        // console.log('..............' + JSON.stringify(carLogObj));
        carLog.push(carLogObj);

        var found1 = 0;
        var uniqueID = 0;
        var currentDate = new Date();
        var currentDatems = currentDate.getTime();

        if (req.method === 'POST') {
            console.log('plus button pressed........');
            var filenameOriginal;
            // var carRecordFound = false;
            req.file('uploadFile').upload({
                saveAs: function(file, cb) {
                    cb(null, file.filename);
                    filenameOriginal = file.filename;
                },
                dirname: '../../assets/images'
            }, function whenDone(err, uploadedFiles) {

                if (req.param('plateNumber') != undefined) {
                    var originalPlateNumber = req.param('plateNumber');
                    var updatedPlateNumber = originalPlateNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    if (req.param('scratchesSnap') != undefined) {
                        console.log(typeof(req.param('scratchesSnap')) + "Upload Photo 1>>> " + req.param('scratchesSnap').length);
                    }
                    var carObj = {};
                    carObj = {
                        parkingID: req.param('parkingID'),
                        plateNumber: updatedPlateNumber,
                        snap: filenameOriginal,
                        parkingZone: req.param('parkingZone'),
                        color: req.param('color'),
                        brand: req.param('brand'),
                        employeeID: req.param('employeeID'),
                        accountID: req.param('accountID'),
                        venue: req.param('venueID'),
                        arrivalTimeStamp: newdate,
                        status: 'parked',
                        log: carLog,
                        changeLog: changeLog,
                        scratchesSnap: req.param('scratchesSnap'),
                        loginAs: req.param('loginAs'),
                        remarks: req.param('remarks'),
                        modelName: req.param('modelName'),
                        carID: req.param('carID'),
                        customerType : req.param('customerType'),
                        // free :  req.param('free') ? req.param('free') : false,
                    };
                    if(req.param('free'))
                        carObj['free'] = req.param('free');
                    if (typeof(req.param('scratchesSnap')) == "string") {
                        carObj.scratchesSnap = (gobalFunctionServices.isJSON(req.param('scratchesSnap')) ? JSON.parse(req.param('scratchesSnap'))  : req.param('scratchesSnap'));
                        console.log(carObj.scratchesSnap.toString() + "<<< U P 2 carObj.scratchesSnap >>>" + carObj.scratchesSnap.length);
                    }

                    if(req.param('amountPaid')){ // Secure parking only
                        carObj['amountPaid'] = req.param('amountPaid');
                        carObj['fees'] = req.param('fees');
                    } else if(req.param('amountPaid') === false){
                        carObj['amountPaid'] = req.param('amountPaid');
                        carObj['fees'] = req.param('fees');
                    } else {
                        carObj['fees'] = (req.param('fees') ? req.param('fees') : 0);
                    }

                    if(req.param('emirates'))
                        carObj['emirates'] = req.param('emirates');

                    var carObj1 = {
                        parkingID: req.param('parkingID'),
                        plateNumber: updatedPlateNumber,
                        snap: 'noImage',
                        scratchesSnap: req.param('scratchesSnap'),
                        parkingZone: req.param('parkingZone'),
                        color: req.param('color'),
                        brand: req.param('brand'),
                        employeeID: req.param('employeeID'),
                        accountID: req.param('accountID'),
                        venue: req.param('venueID'),
                        arrivalTimeStamp: newdate,
                        status: 'parked',
                        log: carLog,
                        changeLog: changeLog,
                        loginAs: req.param('loginAs'),
                        remarks: req.param('remarks'),
                        modelName: req.param('modelName'),
                        carID: req.param('carID'),
                        customerType : req.param('customerType'),
                        // free :  req.param('free') ? req.param('free') : false,
                    }
                    if(req.param('free'))
                        carObj1['free'] = req.param('free');
                    if(req.param('emirates'))
                        carObj1['emirates'] = req.param('emirates');

                    if(req.param('amountPaid')){ // Secure parking only
                        carObj1['amountPaid'] = req.param('amountPaid');
                        carObj1['fees'] = req.param('fees');
                    } else if(req.param('amountPaid') === false){
                        carObj1['amountPaid'] = req.param('amountPaid');
                        carObj1['fees'] = req.param('fees');
                    } else {
                        carObj1['fees'] = (req.param('fees') ? req.param('fees') : 0);
                    }
                }

                if (err) {
                    console.log("No Image / Image Upload Failiure");
                    return res.json(500, err);
                } else if (uploadedFiles.length === 0) {
                    console.log("uploaded Files Length" + uploadedFiles.length);
                    // var recordProcessingCompleted = false;
                    // var recordProcessingStarted = true;
                    // var activeSubscriptionFound = false;
                    var exitBoolean = false;
                    var j = 0;
                    var foundData = false;
                    Account.findOne(req.param('accountID')).then(function found(accountData) {
                        //if (err) return next(err);
                        if (!accountData) {
                            res.send({ notValid: 'notValid' });
                            return;
                        }

                        for (j = accountData.subscriptionLog.length - 1; j >= 0; j--) {
                            if (accountData.subscriptionLog[j].subscriptionStatus != undefined) {
                                if (accountData.subscriptionLog[j].subscriptionStatus == "active") {
                                    foundData = true;
                                    console.log("Account Subscription is Active");
                                    break;
                                }
                            }
                        }
                        console.log("Record Found >> " + foundData);
                        if (foundData) { //SUBSCRIPTION STATUS ACTIVE STARTS HERE
                            console.log("Subscription Active  >> " + (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()));
                            if (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()) { //SUBSCRIPTION END DATE VALIDATION STARTS HERE

                                uniqueID = accountData.subscriptionLog[j].uniqueID;

                                Mastertransactional.count({ uniqueID : uniqueID }).exec(function countCB(err, found) { //RESPONSE FROM SERVER FOR THE SUBSCRIPTION COUNT
                                    if (err) {
                                        console.log('Error------' + err);
                                        exitBoolean = true;
                                        return next(err);
                                    }
                                    if (!found || found == 0) {
                                        console.log('No cars parked for this subscription!!!' + found);
                                    }
                                    found1 = found;
                                    if (found1 < (accountData.subscriptionLog[j].numberOfCars)) { //CAR COUNT VALIDATION STARTS HERE
                                        console.log("req.param('parkingID') in Master Transactional Store -->" + req.param('parkingID'));
                                        if (req.param('parkingID') == undefined || req.param('parkingID') == '' || req.param('plateNumber') == '' || req.param('plateNumber') == undefined) // check empty object from plus button
                                        {
                                            exitBoolean = true;
                                            res.send({ success: 'success' });
                                            return;
                                        } else if (req.param('parkingID') != undefined || req.param('parkingID') != '') {
                                            console.log('Car stored');
                                            console.log('exitBoolean' + exitBoolean);
                                            // ADD THE CAR IN THE DAILY TRANSACTION 
                                            if (!exitBoolean) {
                                                // var carObjID = 0;
                                                if(req.param('carID'))
                                                    carObj['carID'] = req.param('carID');
                                                Dailytransactional.create(carObj).then(function(carObj) {
                                                    //if (err) return next(err);
                                                    console.log("daily Transaction Creation " + JSON.stringify(carObj));

                                                    if (typeof(carObj.scratchesSnap) == "string") {
                                                        carObj.scratchesSnap = (gobalFunctionServices.isJSON(carObj.scratchesSnap) ? JSON.parse(carObj.scratchesSnap) : carObj.scratchesSnap);
                                                        console.log(carObj.scratchesSnap.toString() + "<< carObj.scratchesSnap in Publish Create 1>>" + carObj.scratchesSnap.length);
                                                    }


                                                    // var venueDetails = {};

                                                    Venue.findOne(carObj.venue).exec(function(err, venueDetails) {
                                                        if (err) {
                                                            venueDetails = {};
                                                        }

                                                        analysisService.insertDailyData(carObj.accountID, venueDetails.id, function() {});
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
                                                                changeLog: changeLog,
                                                                loginAs: req.param('loginAs'),
                                                                remarks: carObj.remarks,
                                                                modelName: carObj.modelName,
                                                                createdAt: new Date(),
                                                                carID: carObj.carID,
                                                                customerType : req.param('customerType'),
                                                                free : carObj.free,
                                                                amountPaid :carObj.amountPaid
                                                            },
                                                            id: carObj.id,
                                                            verb : 'created'
                                                        });
                                                        console.log("Venue Detail " + JSON.stringify(venueDetails));
                                                        Dailytransactional.publishCreate({
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
                                                            changeLog: changeLog,
                                                            loginAs: req.param('loginAs'),
                                                            remarks: carObj.remarks,
                                                            modelName: carObj.modelName,
                                                            createdAt: new Date(),
                                                            carID: carObj.carID,
                                                            customerType : req.param('customerType'),
                                                            free : carObj.free,
                                                            
                                                        });
                                                    });





                                                    carObj1 = {
                                                        parkingID: req.param('parkingID'),
                                                        plateNumber: updatedPlateNumber,
                                                        snap: 'noImage',
                                                        scratchesSnap: req.param('scratchesSnap'),
                                                        parkingZone: req.param('parkingZone'),
                                                        color: req.param('color'),
                                                        brand: req.param('brand'),
                                                        employeeID: req.param('employeeID'),
                                                        accountID: req.param('accountID'),
                                                        venue: req.param('venueID'),
                                                        arrivalTimeStamp: newdate,
                                                        status: 'parked',
                                                        log: carLog,
                                                        changeLog: changeLog,
                                                        loginAs: req.param('loginAs'),
                                                        remarks: req.param('remarks'),
                                                        modelName: req.param('modelName'),
                                                        carID: carObj.carID,
                                                        customerType : req.param('customerType'),
                                                        // free :  req.param('free') ? req.param('free') : false,
                                                    }
                                                    if(req.param('free'))
                                                        carObj1['free'] = req.param('free');
                                                    console.log("car id" + carObj.id);
                                                    carObj1['transactionID'] = carObj.id;
                                                    carObj1['uniqueID'] = uniqueID;
                                                    if(req.param('emirates'))
                                                        carObj1['emirates'] = req.param('emirates');

                                                    if(req.param('amountPaid')){ // Secure parking only
                                                        carObj1['amountPaid'] = req.param('amountPaid');
                                                        carObj1['fees'] = req.param('fees');
                                                    } else if(req.param('amountPaid') === false){
                                                        carObj1['amountPaid'] = req.param('amountPaid');
                                                        carObj1['fees'] = req.param('fees');
                                                    } else {
                                                        carObj1['fees'] = (req.param('fees') ? req.param('fees') : 0);
                                                    } 
                                                    
                                                    if (!exitBoolean) {
                                                        Mastertransactional.create(carObj1).then(function(carObj1) {
                                                            console.log("Master created ---" + carObj1.transactionID);
                                                            exitBoolean = true;
                                                            if ((found1 + 1) == accountData.subscriptionLog[j].numberOfCars) {
                                                                console.log('Maximum car reached for the subscription');
                                                                //CHANGE STATUS OF THE SUBSCRIPTION TO EXPIRED
                                                                FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);

                                                            } // found +1 if close
                                                            res.send({ success: "success" , id: carObj.id, venue : req.param('venueID')});
                                                        });
                                                    }

                                                });
                                            }

                                        } // else if for record insert                                                      
                                    } //CAR COUNT VALIDATION ELSE LOOP HERE
                                    else {

                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                        //console.log('Car Count Else Loop');
                                    }

                                }); // MASTER DATA COUNT FUNCTION ENDS HERE                                     
                            } // SUBSCRIPTION END DATE VALIDATION ELSE LOOP
                            else {
                                FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                            } //SUBSCRIPTION END DATE VALIDATION ENDS LOOP                                                  
                        } // SUBSCRIPTION IN LOOP IS NOT ACTIVE                                                 
                        else {
                            console.log("Account Active Subscription Not Found ")
                            res.send({ success: "subscription expired" });
                        }

                    }); // account find close



                } else {
                    //  handle uploaded file

                    // var recordProcessingCompleted = false;
                    // var recordProcessingStarted = true;
                    // var activeSubscriptionFound = false;
                    // var exitBoolean = false;
                    // var j = 0;
                    // var foundData = false;
                    Account.findOne(req.param('accountID')).then(function found(accountData) {
                        //if (err) return next(err);
                        if (!accountData) {
                            res.send({ notValid: 'notValid' });
                            return;
                        }

                        for (j = 0; j < accountData.subscriptionLog.length; j++) {

                            if (accountData.subscriptionLog[j].subscriptionStatus != undefined) {
                                if (accountData.subscriptionLog[j].subscriptionStatus == "active") {
                                    foundData = true;
                                    break;
                                }
                            }
                        }

                        if (foundData) { //SUBSCRIPTION STATUS ACTIVE STARTS HERE
                            if (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()) { //SUBSCRIPTION END DATE VALIDATION STARTS HERE

                                uniqueID = accountData.subscriptionLog[j].uniqueID;

                                Mastertransactional.count({ uniqueID : uniqueID }).exec(function countCB(err, found) { //RESPONSE FROM SERVER FOR THE SUBSCRIPTION COUNT
                                    if (err) {
                                        console.log('Error------' + err);
                                        exitBoolean = true;
                                        return next(err);
                                    }
                                    if (!found || found == 0) {
                                        //console.log('No cars parked for this subscription!!!'+found);
                                    }
                                    found1 = found;
                                    if (found1 < (accountData.subscriptionLog[j].numberOfCars)) { //CAR COUNT VALIDATION STARTS HERE
                                        // activeSubscriptionFound = true;
                                        if (req.param('parkingID') == undefined || req.param('parkingID') == '' || req.param('plateNumber') == '' || req.param('plateNumber') == undefined) // check empty object from plus button
                                        {
                                            exitBoolean = true;
                                            res.send({ success: 'success' });
                                            return;
                                        } else if (req.param('parkingID') != undefined || req.param('parkingID') != '') {
                                            console.log('Car stored');
                                            console.log('exitBoolean' + exitBoolean);
                                            // ADD THE CAR IN THE DAILY TRANSACTION 
                                            if (!exitBoolean) {
                                                // var carObjID = 0;

                                                console.log("Problem 3");

                                                if (typeof(carObj.scratchesSnap) == "string") {
                                                    carObj.scratchesSnap = (gobalFunctionServices.isJSON(carObj.scratchesSnap) ? JSON.parse(carObj.scratchesSnap) : carObj.scratchesSnap);
                                                    console.log(carObj.scratchesSnap.toString() + "<< carObj.scratchesSnap in Publish Create 3>>" + carObj.scratchesSnap.length);
                                                }
                                                if(req.param('carID'))
                                                    carObj['carID'] = req.param('carID')

                                                Dailytransactional.create(carObj).then(function(carObj) {
                                                    //if (err) return next(err);
                                                    console.log("daily" + JSON.stringify(carObj));
                                                    // carObjID = carObj.id;
                                                    // var venueDetails = {};

                                                    Venue.findOne(carObj.venue).exec(function(err, venueDetails) {
                                                        if (err) {
                                                            venueDetails = {};
                                                        }

                                                        analysisService.insertDailyData(carObj.accountID, venueDetails.id, function() {});

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
                                                                changeLog: changeLog,
                                                                loginAs: req.param('loginAs'),
                                                                remarks: carObj.remarks,
                                                                modelName: carObj.modelName,
                                                                createdAt: new Date(),
                                                                carID : carObj.carID,
                                                                customerType : req.param('customerType'),
                                                                free : carObj.free,
                                                                amountPaid :carObj.amountPaid
                                                            },
                                                            id: carObj.id,
                                                            verb : 'created'
                                                        });

                                                        console.log("Venue Detail" + JSON.stringify(venueDetails));
                                                        Dailytransactional.publishCreate({
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
                                                            changeLog: changeLog,
                                                            loginAs: req.param('loginAs'),
                                                            remarks: carObj.remarks,
                                                            modelName: carObj.modelName,
                                                            createdAt: new Date(),
                                                            carID : carObj.carID,
                                                            customerType : req.param('customerType'),
                                                            free : carObj.free
                                                        });

                                                    });

                                                    carObj1 = {
                                                        parkingID: req.param('parkingID'),
                                                        plateNumber: updatedPlateNumber,
                                                        snap: 'noImage',
                                                        scratchesSnap: req.param('scratchesSnap'),
                                                        parkingZone: req.param('parkingZone'),
                                                        color: req.param('color'),
                                                        brand: req.param('brand'),
                                                        employeeID: req.param('employeeID'),
                                                        accountID: req.param('accountID'),
                                                        venue: req.param('venueID'),
                                                        arrivalTimeStamp: newdate,
                                                        status: 'parked',
                                                        log: carLog,
                                                        changeLog: changeLog,
                                                        loginAs: req.param('loginAs'),
                                                        remarks: req.param('remarks'),
                                                        modelName: req.param('modelName'),
                                                        carID: req.param('carID'),
                                                        customerType : req.param('customerType'),
                                                        // free :  req.param('free') ? req.param('free') : false,
                                                    }
                                                    if(req.param('free'))
                                                        carObj1['free'] = req.param('free');

                                                    carObj1['transactionID'] = carObj.id;
                                                    carObj1['snap'] = filenameOriginal;
                                                    if(req.param('carID'))
                                                        carObj1['carID'] = req.param('carID')

                                                    if(req.param('emirates'))
                                                        carObj1['emirates'] = req.param('emirates');
                                                    
                                                    if(req.param('amountPaid')){ // Secure parking only
                                                        carObj1['amountPaid'] = req.param('amountPaid');
                                                        carObj1['fees'] = req.param('fees');
                                                    } else if(req.param('amountPaid') === false){
                                                        carObj1['amountPaid'] = req.param('amountPaid');
                                                        carObj1['fees'] = req.param('fees');
                                                    } else {
                                                        carObj1['fees'] = (req.param('fees') ? req.param('fees') : 0);
                                                    }
                                                    if (!exitBoolean) {
                                                        Mastertransactional.create(carObj1).then(function(carObj1) {
                                                            console.log("Master created ---" + carObj1.transactionID);
                                                            exitBoolean = true;
                                                            if ((found1 + 1) == accountData.subscriptionLog[j].numberOfCars) {
                                                                console.log('Maximum car reached for the subscription');
                                                                //CHANGE STATUS OF THE SUBSCRIPTION TO EXPIRED
                                                                FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);

                                                            } // found +1 if close
                                                            res.send({ success: "success" , id: carObj.id, venue : req.param('venueID')});
                                                        });
                                                    }

                                                });
                                            }

                                        } // else if for record insert                                                      
                                    } //CAR COUNT VALIDATION ELSE LOOP HERE
                                    else {

                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                        //console.log('Car Count Else Loop');
                                    }

                                }); // MASTER DATA COUNT FUNCTION ENDS HERE                                     
                            } // SUBSCRIPTION END DATE VALIDATION ELSE LOOP
                            else {
                                FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                            } //SUBSCRIPTION END DATE VALIDATION ENDS LOOP                                                  
                        } // SUBSCRIPTION IN LOOP IS NOT ACTIVE                                                 
                        else {
                            res.send({ success: "error" });
                        }
                    }); // account find close
                }
            });
        }
    },
    upload2: function(req, res) { // edit car details
        if (req.isSocket) {
            // Dailytransactional.watch(req.socket);
            sails.sockets.join(req.socket,'myroom');
            // console.log('Dailytransactional subscribed to ' + req.socket.id);
        } else {
            var newdate = new Date();
            var carLog = [];
            var newLogs = [],
                temp = {};
            var needtoPushObj = {};
            var needtoWiteChanges = ['parkingID', 'plateNumber', 'parkingZone'];

            function checkActivityExists(tempLog, changesLog, needtoPushObj, callBack) {
                checkActivityisExists(0);

                function checkActivityisExists(r) {
                    if (r < tempLog.length) {
                        if (tempLog[r].activity == changesLog) {
                            tempLog[r] = needtoPushObj;
                            callBack(tempLog);
                        } else {
                            r++;
                            checkActivityisExists(r);
                        }
                    } else {
                        tempLog.push(needtoPushObj);
                        callBack(tempLog);
                    }
                }
            }

            Dailytransactional.findOne(req.param('id')).exec(function(err, carDataFound) {
                if(err) return res.send();
                if (carDataFound) {
                    if((req.param('amountPaid') == 'true' || req.param('amountPaid') == true) && carDataFound.amountPaid == false){ 
                        if(carDataFound.fees > 0){
                            analysisService.insertDailyFeesData(carDataFound.accountID, carDataFound.venue, carDataFound.fees,  ()=>{});
                        }
                    }

                    if (carDataFound.changeLog == null) {
                        newLogs = [];
                        carDataFound.changeLog = [];
                    } else if (carDataFound.changeLog.length)
                        newLogs = carDataFound.changeLog;
                }
                wirteLogs(0);

                function wirteLogs(logs) {
                    if (logs < needtoWiteChanges.length) {
                        console.log("\n\n\n\n\n\n" + needtoWiteChanges[logs] + "======" + carDataFound[needtoWiteChanges[logs]] + "----" + req.param(needtoWiteChanges[logs]) + "\n\n\n\n\n\n")
                        if ((carDataFound[needtoWiteChanges[logs]] == null && req.param(needtoWiteChanges[logs]) != null) || (carDataFound[needtoWiteChanges[logs]] == '' && req.param(needtoWiteChanges[logs]) != '') || (carDataFound[needtoWiteChanges[logs]] == undefined && req.param(needtoWiteChanges[logs]) != undefined)) {
                            console.log("entedred into one" + newLogs)
                            needtoPushObj = {
                                "activity": needtoWiteChanges[logs],
                                "changes": req.param(needtoWiteChanges[logs]),
                                "at": new Date(),
                                log: [{
                                    "activity": needtoWiteChanges[logs],
                                    "changes": req.param(needtoWiteChanges[logs]),
                                    "at": new Date()
                                }]
                            }
                            if (req.param('loginUser')) {
                                needtoPushObj['log'][0]['loginUser'] = {
                                    "by": req.param('loginUser').id,
                                    "email": req.param('loginUser').email,
                                    "userName": req.param('loginUser').userName,
                                    "userProfile": req.param('loginUser').userProfile
                                }
                            }
                            checkActivityExists(newLogs, needtoWiteChanges[logs], needtoPushObj, function(tempLog) {
                                newLogs = tempLog;
                                logs++;
                                wirteLogs(logs);
                            })
                            console.log("entedred into one after" + newLogs)
                        } else if (((carDataFound[needtoWiteChanges[logs]] != null && req.param(needtoWiteChanges[logs]) != null) || (carDataFound[needtoWiteChanges[logs]] != undefined && req.param(needtoWiteChanges[logs]) != undefined) || (carDataFound[needtoWiteChanges[logs]] != '' && req.param(needtoWiteChanges[logs]) != ''))) {
                             //(carDataFound[needtoWiteChanges[logs]] != req.param(needtoWiteChanges[logs])) {
                            console.log("entedred into 2 before" + newLogs)
                            getInnerLogs(0);

                            function getInnerLogs(innerLogs) {
                                if (innerLogs < carDataFound.changeLog.length) {
                                    if (carDataFound.changeLog[innerLogs].activity == needtoWiteChanges[logs]) {
                                        console.log("entedred -----" + carDataFound.changeLog[innerLogs].activity + "----" + needtoWiteChanges[logs])
                                        if (carDataFound.changeLog[innerLogs].changes.indexOf(' to ') > -1 && carDataFound[needtoWiteChanges[logs]] != req.param(needtoWiteChanges[logs])) {
                                            needtoPushObj = {
                                                "activity": needtoWiteChanges[logs],
                                                "changes": carDataFound.changeLog[innerLogs].changes + ', ' + carDataFound.changeLog[innerLogs].changes.substr(carDataFound.changeLog[innerLogs].changes.lastIndexOf(" to ") + 1).slice(3) + " to " + req.param(needtoWiteChanges[logs]),
                                                "at": new Date(),
                                                log: (carDataFound.changeLog[innerLogs].log || [])
                                            }
                                            temp = {
                                                "activity": needtoWiteChanges[logs],
                                                "at": new Date(),
                                                'changes': carDataFound[needtoWiteChanges[logs]] + ' to ' + req.param(needtoWiteChanges[logs])
                                            }
                                            if (req.param('loginUser')) {
                                                temp['loginUser'] = {
                                                    "by": req.param('loginUser').id,
                                                    "email": req.param('loginUser').email,
                                                    "userName": req.param('loginUser').userName,
                                                    "userProfile": req.param('loginUser').userProfile
                                                }
                                            }
                                            needtoPushObj['log'].push(temp);
                                            checkActivityExists(newLogs, needtoWiteChanges[logs], needtoPushObj, function(tempLog) {
                                                newLogs = tempLog;
                                                logs++;
                                                wirteLogs(logs);
                                            })
                                        } else if (carDataFound.changeLog[innerLogs].changes.indexOf(' to ') == -1 && carDataFound[needtoWiteChanges[logs]] != req.param(needtoWiteChanges[logs])) {
                                            needtoPushObj = {
                                                "activity": needtoWiteChanges[logs],
                                                "changes": carDataFound[needtoWiteChanges[logs]] + ' to ' + req.param(needtoWiteChanges[logs]),
                                                "at": new Date(),
                                                log: (carDataFound.changeLog[innerLogs].log || [])
                                            }
                                            temp = {
                                                "activity": needtoWiteChanges[logs],
                                                "at": new Date(),
                                                'changes': carDataFound[needtoWiteChanges[logs]] + ' to ' + req.param(needtoWiteChanges[logs])
                                            }
                                            if (req.param('loginUser')) {
                                                temp['loginUser'] = {
                                                    "by": req.param('loginUser').id,
                                                    "email": req.param('loginUser').email,
                                                    "userName": req.param('loginUser').userName,
                                                    "userProfile": req.param('loginUser').userProfile
                                                }
                                            }
                                            needtoPushObj['log'].push(temp);
                                            checkActivityExists(newLogs, needtoWiteChanges[logs], needtoPushObj, function(tempLog) {
                                                newLogs = tempLog;
                                                logs++;
                                                wirteLogs(logs);
                                            })
                                        } else {
                                            needtoPushObj = carDataFound.changeLog[innerLogs];
                                            checkActivityExists(newLogs, needtoWiteChanges[logs], needtoPushObj, function(tempLog) {
                                                newLogs = tempLog;
                                                logs++;
                                                wirteLogs(logs);
                                            })
                                        }
                                    } else {
                                        console.log("else  -----" + carDataFound.changeLog[innerLogs].activity + "----" + needtoWiteChanges[logs])
                                        innerLogs++;
                                        getInnerLogs(innerLogs);
                                    }
                                } else {
                                    logs++;
                                    wirteLogs(logs);
                                }
                            }
                            
                        } else {
                            logs++;
                            wirteLogs(logs);
                        }
                    } else {
                        var carLogObj = {
                            'activity': 'parked',
                            'by': req.param('employeeID'),
                            'employeeName': req.param('employeeName'),
                            'at': carDataFound.createdAt,
                            'userProfile': req.param('profileImage')
                        }
                        carLog.push(carLogObj);
                        uploadCarFunc();
                    }
                }
            });
        }

        function uploadCarFunc() {
            var found1 = 0;
            var uniqueID = 0;
            var currentDate = new Date();
            var currentDatems = currentDate.getTime();
            Dailytransactional.findOne(req.param('id')).exec(function(err, carDataFound) {
                if (req.method === 'POST') {
                    // console.log('plus button pressed........');
                    var filenameOriginal;
                    // var carRecordFound = false;
                    req.file('uploadFile').upload({
                        saveAs: function(file, cb) {
                            cb(null, file.filename);
                            filenameOriginal = file.filename;
                        },
                        dirname: '../../assets/images'
                    }, function whenDone(err, uploadedFiles) {
                        if (req.param('plateNumber') != undefined) {
                            var originalPlateNumber = req.param('plateNumber');
                            var updatedPlateNumber = originalPlateNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                            if (req.param('scratchesSnap') != undefined) {
                                // console.log(typeof(req.param('scratchesSnap')) + "Upload Photo 1>>> " + req.param('scratchesSnap').length);
                            }
                            var carObj = {};
                            carObj = {
                                parkingID: req.param('parkingID'),
                                plateNumber: updatedPlateNumber,
                                // snap: filenameOriginal,
                                parkingZone: req.param('parkingZone'),
                                color: req.param('color'),
                                brand: req.param('brand'),
                                employeeID: req.param('employeeID'),
                                accountID: req.param('accountID'),
                                venue: req.param('venueID'),
                                arrivalTimeStamp: newdate,
                                status: 'parked',
                                log: carLog,
                                changeLog: newLogs,
                                scratchesSnap: req.param('scratchesSnap'),
                                loginAs: req.param('loginAs'),
                                remarks: req.param('remarks'),
                                modelName: req.param('modelName'),
                                customerType : req.param('customerType'),
                                // carID : req.param('carID'),
                                // free :  req.param('free'),
                                documents :  req.param('documents'),
                                description :  req.param('description'),
                            };
                            if (filenameOriginal != null) {
                                carObj['snap'] = filenameOriginal;
                            }
                            if (typeof(req.param('scratchesSnap')) == "string") {
                                carObj.scratchesSnap = (gobalFunctionServices.isJSON(req.param('scratchesSnap')) ? JSON.parse(req.param('scratchesSnap'))  : req.param('scratchesSnap'));
                                // console.log(carObj.scratchesSnap.toString() + "<<< U P 2 carObj.scratchesSnap >>>" + carObj.scratchesSnap.length);
                            }
    
                             //////////////////////////
                            if(req.param('amountPaid')){ // Secure parking only
                                carObj['amountPaid'] = req.param('amountPaid');
                                if(req.param('fees'))
                                    carObj['fees'] = req.param('fees');
                            } else if(req.param('amountPaid') === false){
                                carObj['amountPaid'] = req.param('amountPaid');
                                if(req.param('fees'))
                                    carObj['fees'] = req.param('fees');
                            }
    
                            if((req.param('amountPaid') == 'true' || req.param('amountPaid') == true) && carDataFound.amountPaid == false){ 
                                carObj['paidAt'] = new Date();
                            }

                            if(req.param('ownerMobileNumber')){
                                carObj['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                            }

                            if(req.param('otherInfo')){
                                carObj['otherInfo'] = req.param('otherInfo') 
                            }
    
                             //////////////////////// 
                            var carObj1 = {
                                parkingID: req.param('parkingID'),
                                plateNumber: updatedPlateNumber,
                                snap: 'noImage',
                                scratchesSnap: req.param('scratchesSnap'),
                                parkingZone: req.param('parkingZone'),
                                color: req.param('color'),
                                brand: req.param('brand'),
                                employeeID: req.param('employeeID'),
                                accountID: req.param('accountID'),
                                venue: req.param('venueID'),
                                arrivalTimeStamp: newdate,
                                status: 'parked',
                                log: carLog,
                                changeLog: newLogs,
                                loginAs: req.param('loginAs'),
                                remarks: req.param('remarks'),
                                modelName: req.param('modelName'),
                                customerType : req.param('customerType'),
                                // carID : req.param('carID'),
                                // free :  req.param('free'),
                                documents :  req.param('documents'),
                                description :  req.param('description'),
                            }
                            if(req.param('otherInfo')){
                                carObj1['otherInfo'] = req.param('otherInfo') 
                            }
                             //////////////////////////
                            if(req.param('amountPaid')){ // Secure parking only
                                carObj1['amountPaid'] = req.param('amountPaid');
                                if(req.param('fees'))
                                    carObj1['fees'] = req.param('fees');
                            } else if(req.param('amountPaid') === false){
                                carObj1['amountPaid'] = req.param('amountPaid');
                                if(req.param('fees'))
                                    carObj1['fees'] = req.param('fees');
                            }

                            if((req.param('amountPaid') == 'true' || req.param('amountPaid') == true) && carDataFound.amountPaid == false){ 
                                carObj1['paidAt'] = new Date();
                            }

                            if(req.param('ownerMobileNumber')){
                                carObj1['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                            }
    
                        }
    
                        if (err) {
                            // console.log("No Image / Image Upload Failiure");
                            return res.json(500, err);
                        } else if (uploadedFiles.length === 0) {
                            // console.log("uploaded Files Length" + uploadedFiles.length);
                            // var recordProcessingCompleted = false;
                            // var recordProcessingStarted = true;
                            // var activeSubscriptionFound = false;
                            var exitBoolean = false;
                            var j = 0;
                            var foundData = false;
                            Account.findOne(req.param('accountID')).then(function found(accountData) {
                                //if (err) return next(err);
                                if (!accountData) {
                                    res.send({ notValid: 'notValid' });
                                    return;
                                }
    
                                for (j = accountData.subscriptionLog.length - 1; j >= 0; j--) {
                                    if (accountData.subscriptionLog[j].subscriptionStatus != undefined) {
                                        if (accountData.subscriptionLog[j].subscriptionStatus == "active") {
                                            foundData = true;
                                            // console.log("Account Subscription is Active");
                                            break;
                                        }
                                    }
                                }
                                // console.log("Record Found >> " + foundData);
                                if (foundData) { //SUBSCRIPTION STATUS ACTIVE STARTS HERE
                                    // console.log("Subscription Active  >> " + (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()));
                                    if (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()) { //SUBSCRIPTION END DATE VALIDATION STARTS HERE
    
                                        uniqueID = accountData.subscriptionLog[j].uniqueID;
    
                                        Mastertransactional.count({ uniqueID: uniqueID }).exec(function countCB(err, found) { //RESPONSE FROM SERVER FOR THE SUBSCRIPTION COUNT
                                            if (err) {
                                                // console.log('Error------' + err);
                                                exitBoolean = true;
                                                return next(err);
                                            }
                                            if (!found || found == 0) {
                                                // console.log('No cars parked for this subscription!!!' + found);
                                            }
                                            found1 = found;
                                            if (found1 < (accountData.subscriptionLog[j].numberOfCars)) { //CAR COUNT VALIDATION STARTS HERE
                                                // activeSubscriptionFound = true;
                                                // console.log("req.param('parkingID') in Master Transactional Store -->" + req.param('parkingID'));
                                                if (req.param('parkingID') == undefined || req.param('parkingID') == '' || req.param('plateNumber') == '' || req.param('plateNumber') == undefined) // check empty object from plus button
                                                {
                                                    exitBoolean = true;
                                                    res.send({ success: 'success' });
                                                    return;
                                                } else if (req.param('parkingID') != undefined || req.param('parkingID') != '') {
                                                    // console.log('Car stored');
                                                    // console.log('exitBoolean' + exitBoolean);
                                                    // ADD THE CAR IN THE DAILY TRANSACTION 
                                                    if (!exitBoolean) {
                                                        // var carObjID = 0;
                                                        Dailytransactional.update(req.param('id'), carObj).exec(function(err, carObj) {
                                                            //if (err) return next(err);
                                                            // console.log("daily Transaction Creation " + JSON.stringify(carObj));
                                                            // carObjID = carObj[0].id;
    
                                                            if (typeof(carObj[0].scratchesSnap) == "string") {
                                                                carObj[0].scratchesSnap = (gobalFunctionServices.isJSON(carObj[0].scratchesSnap) ? JSON.parse(carObj[0].scratchesSnap) : carObj[0].scratchesSnap ) ;
                                                                // console.log(carObj[0].scratchesSnap.toString() + "<< carObj[0].scratchesSnap in Publish Create 1>>" + carObj[0].scratchesSnap.length);
                                                            }
    
    
                                                            // var venueDetails = {};
                                                            if(carObj[0].accountID == SP.accountID){
                                                                if(carObj[0].fees == 0 ){
                                                                    var transporter = nodemailer.createTransport("SMTP", {
                                                                        host: process.env.NODEMAILER_HOST,
                                                                        port: process.env.NODEMAILER_PORT,
                                                                        auth: {
                                                                            user: process.env.NODEMAILER_USER,
                                                                            pass: process.env.NODEMAILER_PASS
                                                                        },
                                                                        });
    
                                                                        var attaches = [];
                                                                        _.filter(carObj[0].scratchesSnap,(a)=>{ 
                                                                            if(a){
                                                                                attaches.push({
                                                                                filename: a,
                                                                                filePath: "assets/images/" + a,
                                                                                cid: 'newDate-'+a 
                                                                            })  
                                                                            return a; 
                                                                            } else 
                                                                            return a; 
                                                                        });
                                                                        var dear = '';
                                                                        if(carObj[0].venue == "5b45c11ca23561f14ad08a6f")
                                                                            dear = 'Guru Prasad,';
                                                                        else 
                                                                            dear = 'Sir/Madam,';

                                                                        var mailOptions = {
                                                                            from: process.env.ALERTS_EMAIL,
                                                                            to: SP.to,
                                                                            subject: "EValetz Alert - Free Transaction",
                                                                            bcc: SP.bcc,
                                                                            html : '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="https://evaletz.com:2018/images/temp-home.JPG"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;">Dear Mr. ' + dear + '</p><p style="margin: 1em 0px;"> Guest type has been modified for below transaction: </p><p style="margin: 1em 0px;margin-top: 10px;">Ticket Number: ' +  carObj[0].parkingID.toUpperCase() +'</p><p style="margin: 1em 0px;">Plate Number: ' + carObj[0].plateNumber.toUpperCase()+'</p><p style="margin: 1em 0px;">Guest Type: ' + carObj[0].customerType + '</p><p style="margin: 1em 0px;margin-top: 10px;">Hence, <b>NO PARKING FEE.</b></p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a></span>&nbsp;and we will be happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>EValetz Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/EValetzMobileApp/" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://plus.google.com/u/0/116399189801627499126?hl=en" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://twitter.com/EvaletzApp" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://evaletz.com/" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>',
                                                                            attachments: attaches
                                                                        }

                                                                        if(carObj[0].venue == "5b45c11ca23561f14ad08a6f"){
                                                                            mailOptions['to'] =  SP.to;
                                                                            mailOptions['bcc'] =  SP.bcc;                                                                            
                                                                        } else {
                                                                            mailOptions['to'] =  SP.otherVenues['to'];
                                                                            mailOptions['bcc'] =  SP.otherVenues['bcc']; 
                                                                        }

                                                                        transporter.sendMail(mailOptions, function (err, response) {
                                                                        if (err) {
                                                                            console.log('email failed..........' + JSON.stringify(err));
                                                                        }
                                                                        if (response) {
                                                                            console.log('email success..........' + JSON.stringify(response));
                                                                        }
                                                                        });

                                                                        var mobileforSP =''
                                                                            if(carObj[0].venue == "5b45c11ca23561f14ad08a6f"){
                                                                                mobileforSP =   SP.mobiles;                                         
                                                                            } else {
                                                                                mobileforSP =   SP.otherVenues.mobiles;   
                                                                            } 
                                                                    
                                                                    var message = "Alert: NO PARKING FEE for Ticket No: "+ carObj[0].parkingID.toUpperCase() +" Plate No: "+ carObj[0].plateNumber.toUpperCase()+" Guest Type: " + carObj[0].customerType;
                                                                    var post_req = http.request("http://dlsonline.in/httpapi/httpapi?token=" + process.env.DLS_SMS_TOKEN + "&sender=EVALET&number=" + mobileforSP +"&route=2&type=Text-1&sms=" + message, function(res) {
                                                                        console.log('Response: ' + res);
                                                                    });
                                                                    post_req.end();
                                                                }
                                                            }
    
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
                                                                        loginAs: req.param('loginAs'),
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
                                                                        fees : carObj[0].fees, 
                                                                        validatedBy : carObj[0].validatedBy,
                                                                        validatedAt : carObj[0].validatedAt, 
                                                                        cashAcceptedBy : carObj[0].cashAcceptedBy, 
                                                                        cashAcceptedAt : carObj[0].cashAcceptedAt,
                                                                        amountPaid :carObj[0].amountPaid
                                                                    },
                                                                    id: carObj[0].id,
                                                                    verb : 'updated'
                                                                });
    
                                                                // console.log("Venue Detail " + JSON.stringify(venueDetails));
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
                                                                    loginAs: req.param('loginAs'),
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
                                                                    fees : carObj[0].fees, 
                                                                    validatedBy : carObj[0].validatedBy,
                                                                    validatedAt : carObj[0].validatedAt, 
                                                                    cashAcceptedBy : carObj[0].cashAcceptedBy, 
                                                                    cashAcceptedAt : carObj[0].cashAcceptedAt
    
                                                                });
    
                                                            });
    
    
    
    
    
                                                            carObj1 = {
                                                                    parkingID: req.param('parkingID'),
                                                                    plateNumber: updatedPlateNumber,
                                                                    // snap: 'noImage',
                                                                    snap: carObj[0].snap,
                                                                    scratchesSnap: req.param('scratchesSnap'),
                                                                    parkingZone: req.param('parkingZone'),
                                                                    color: req.param('color'),
                                                                    brand: req.param('brand'),
                                                                    employeeID: req.param('employeeID'),
                                                                    accountID: req.param('accountID'),
                                                                    venue: req.param('venueID'),
                                                                    arrivalTimeStamp: newdate,
                                                                    status: 'parked',
                                                                    log: carLog,
                                                                    changeLog: newLogs,
                                                                    loginAs: req.param('loginAs'),
                                                                    remarks: req.param('remarks'),
                                                                    modelName: req.param('modelName'),
                                                                    customerType : req.param('customerType'),
                                                                    // carID : req.param('carID'),
                                                                    // free :  req.param('free'),
                                                                    documents :  req.param('documents'),
                                                                    description :  req.param('description'),
                                                                }
                                                                // console.log("car id" + carObj[0].id);
                                                            carObj1['transactionID'] = carObj[0].id;
                                                            carObj1['uniqueID'] = uniqueID;
                                                                
                                                            if(req.param('otherInfo')){
                                                                carObj1['otherInfo'] = req.param('otherInfo') 
                                                            }
                                                            if(req.param('amountPaid')){ // Secure parking only
                                                                carObj1['amountPaid'] = req.param('amountPaid');
                                                                if(req.param('fees'))
                                                                    carObj1['fees'] = req.param('fees');
                                                            } else if(req.param('amountPaid') === false){
                                                                carObj1['amountPaid'] = req.param('amountPaid');
                                                                if(req.param('fees'))
                                                                    carObj1['fees'] = req.param('fees');
                                                            }
                                                            
                                                            if((req.param('amountPaid') == 'true' || req.param('amountPaid') == true) && carDataFound.amountPaid == false){ 
                                                                carObj1['paidAt'] = new Date();
                                                            }

                                                            if(req.param('ownerMobileNumber')){
                                                                carObj1['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                                                            }

                                                            if (!exitBoolean) {
                                                                Mastertransactional.update({ "transactionID": req.param('id') }, carObj1).exec(function(err, carObj1) {
                                                                    carObj1 = carObj1[0];
                                                                    // console.log("Master created ---" + carObj1.transactionID);
                                                                    exitBoolean = true;
                                                                    if ((found1 + 1) == accountData.subscriptionLog[j].numberOfCars) {
                                                                        // console.log('Maximum car reached for the subscription');
                                                                        //CHANGE STATUS OF THE SUBSCRIPTION TO EXPIRED
                                                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
    
                                                                    } // found +1 if close
                                                                    res.send({ success: "success" , id: carObj[0].id, venue : req.param('venueID')});
                                                                });
                                                            }
    
                                                        });
                                                    }
    
                                                } // else if for record insert                                                      
                                            } //CAR COUNT VALIDATION ELSE LOOP HERE
                                            else {
    
                                                FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                                //console.log('Car Count Else Loop');
                                            }
    
                                        }); // MASTER DATA COUNT FUNCTION ENDS HERE                                     
                                    } // SUBSCRIPTION END DATE VALIDATION ELSE LOOP
                                    else {
                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                    } //SUBSCRIPTION END DATE VALIDATION ENDS LOOP                                                  
                                } // SUBSCRIPTION IN LOOP IS NOT ACTIVE                                                 
                                else {
                                    console.log("Account Active Subscription Not Found ")
                                    res.send({ success: "subscription expired" });
                                }
    
                            }); // account find close
    
    
    
                        } else {
                            //  handle uploaded file
    
                            // var recordProcessingCompleted = false;
                            // var recordProcessingStarted = true;
                            // var activeSubscriptionFound = false;
                            // var exitBoolean = false;
                            // var j = 0;
                            // var foundData = false;
                            Account.findOne(req.param('accountID')).then(function found(accountData) {
                                //if (err) return next(err);
                                if (!accountData) {
                                    res.send({ notValid: 'notValid' });
                                    return;
                                }
    
                                for (j = 0; j < accountData.subscriptionLog.length; j++) {
    
                                    if (accountData.subscriptionLog[j].subscriptionStatus != undefined) {
                                        if (accountData.subscriptionLog[j].subscriptionStatus == "active") {
                                            foundData = true;
                                            break;
                                        }
                                    }
                                }
    
                                if (foundData) { //SUBSCRIPTION STATUS ACTIVE STARTS HERE
                                    if (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()) { //SUBSCRIPTION END DATE VALIDATION STARTS HERE
    
                                        uniqueID = accountData.subscriptionLog[j].uniqueID;
    
                                        Mastertransactional.count({ uniqueID: uniqueID }).exec(function countCB(err, found) { //RESPONSE FROM SERVER FOR THE SUBSCRIPTION COUNT
                                            if (err) {
                                                // console.log('Error------' + err);
                                                exitBoolean = true;
                                                return next(err);
                                            }
                                            if (!found || found == 0) {
                                                //console.log('No cars parked for this subscription!!!'+found);
                                            }
                                            found1 = found;
                                            if (found1 < (accountData.subscriptionLog[j].numberOfCars)) { //CAR COUNT VALIDATION STARTS HERE
                                                // activeSubscriptionFound = true;
                                                if (req.param('parkingID') == undefined || req.param('parkingID') == '' || req.param('plateNumber') == '' || req.param('plateNumber') == undefined) // check empty object from plus button
                                                {
                                                    exitBoolean = true;
                                                    res.send({ success: 'success' });
                                                    return;
                                                } else if (req.param('parkingID') != undefined || req.param('parkingID') != '') {
                                                    // console.log('Car stored');
                                                    // console.log('exitBoolean' + exitBoolean);
                                                    // ADD THE CAR IN THE DAILY TRANSACTION 
                                                    if (!exitBoolean) {
                                                        // var carObjID = 0;
    
                                                        // console.log("Problem 3");
    
                                                        if (typeof(carObj.scratchesSnap) == "string") {
                                                            carObj.scratchesSnap = (gobalFunctionServices.isJSON(carObj.scratchesSnap) ?  JSON.parse(carObj.scratchesSnap) : carObj.scratchesSnap);
                                                            // console.log(carObj.scratchesSnap.toString() + "<< carObj.scratchesSnap in Publish Create 3>>" + carObj.scratchesSnap.length);
                                                        }
    
                                                        Dailytransactional.update(req.param('id'), carObj).exec(function(err, carObj) {
                                                            carObj = carObj[0];
                                                            //if (err) return next(err);
                                                            // console.log("daily" + JSON.stringify(carObj));
                                                            // carObjID = carObj.id;
                                                            // var venueDetails = {};
    
                                                            Venue.findOne(carObj.venue).exec(function(err, venueDetails) {
                                                                if (err) {
                                                                    venueDetails = {};
                                                                }
    
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
                                                                        changeLog: carObj.changeLog,
                                                                        loginAs: req.param('loginAs'),
                                                                        editCar: true,
                                                                        remarks: carObj.remarks,
                                                                        modelName: carObj.modelName,
                                                                        createdAt: carObj.createdAt,
                                                                        carID : carObj.carID,
                                                                        customerType: carObj.customerType,
                                                                        free :  carObj.free,
                                                                        documents :  carObj.documents,
                                                                        description :  carObj.description,
                                                                        updatedAt: carObj.updatedAt,
                                                                        fees : carObj[0].fees, 
                                                                        validatedBy : carObj[0].validatedBy,
                                                                        validatedAt : carObj[0].validatedAt, 
                                                                        cashAcceptedBy : carObj[0].cashAcceptedBy, 
                                                                        cashAcceptedAt : carObj[0].cashAcceptedAt,
                                                                        amountPaid :carObj[0].amountPaid
                                                                    },
                                                                    id:  carObj.id,
                                                                    verb : 'updated'
                                                                });
    
                                                                // console.log("Venue Detail" + JSON.stringify(venueDetails));
                                                                Dailytransactional.publishUpdate(carObj.id, {
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
                                                                    changeLog: carObj.changeLog,
                                                                    loginAs: req.param('loginAs'),
                                                                    editCar: true,
                                                                    remarks: carObj.remarks,
                                                                    modelName: carObj.modelName,
                                                                    createdAt: carObj.createdAt,
                                                                    carID : carObj.carID,
                                                                    customerType: carObj.customerType,
                                                                    free :  carObj.free,
                                                                    documents :  carObj.documents,
                                                                    description :  carObj.description,
                                                                    updatedAt: carObj.updatedAt,
                                                                    fees : carObj[0].fees, 
                                                                    validatedBy : carObj[0].validatedBy,
                                                                    validatedAt : carObj[0].validatedAt, 
                                                                    cashAcceptedBy : carObj[0].cashAcceptedBy, 
                                                                    cashAcceptedAt : carObj[0].cashAcceptedAt
                                                                });
    
                                                            });
    
                                                            carObj1 = {
                                                                parkingID: req.param('parkingID'),
                                                                plateNumber: updatedPlateNumber,
                                                                // snap: 'noImage',
                                                                snap: carObj.snap,
                                                                scratchesSnap: req.param('scratchesSnap'),
                                                                parkingZone: req.param('parkingZone'),
                                                                color: req.param('color'),
                                                                brand: req.param('brand'),
                                                                employeeID: req.param('employeeID'),
                                                                accountID: req.param('accountID'),
                                                                venue: req.param('venueID'),
                                                                arrivalTimeStamp: newdate,
                                                                status: 'parked',
                                                                log: carLog,
                                                                loginAs: req.param('loginAs'),
                                                                remarks: req.param('remarks'),
                                                                modelName: req.param('modelName'),
                                                                customerType : req.param('customerType'),
                                                                // carID : req.param('carID'),
                                                                free :  req.param('free'),
                                                                documents :  req.param('documents'),
                                                                description :  req.param('description'),
                                                            }
    
                                                            carObj1['transactionID'] = carObj.id;
                                                            carObj1['snap'] = filenameOriginal;
    
                                                            if(req.param('amountPaid')){ // Secure parking only
                                                                carObj1['amountPaid'] = req.param('amountPaid');
                                                                if(req.param('fees'))
                                                                    carObj1['fees'] = req.param('fees');
                                                            } else if(req.param('amountPaid') === false){
                                                                carObj1['amountPaid'] = req.param('amountPaid');
                                                                if(req.param('fees'))
                                                                    carObj1['fees'] = req.param('fees');
                                                            }
                                                            
                                                            if((req.param('amountPaid') == 'true' || req.param('amountPaid') == true) && carDataFound.amountPaid == false){ 
                                                                carObj1['paidAt'] = new Date();
                                                            }
                                                            if(req.param('ownerMobileNumber')){
                                                                carObj1['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                                                            }

                                                            if(req.param('otherInfo')){
                                                                carObj1['otherInfo'] = req.param('otherInfo') 
                                                            }

                                                            if (!exitBoolean) {
                                                                Mastertransactional.update({ "transactionID": req.param('id') }, carObj1).exec(function(err, carObj1) {
                                                                    carObj1 = carObj1[0]
                                                                        // console.log("Master created ---" + carObj1.transactionID);
                                                                    exitBoolean = true;
                                                                    if ((found1 + 1) == accountData.subscriptionLog[j].numberOfCars) {
                                                                        // console.log('Maximum car reached for the subscription');
                                                                        //CHANGE STATUS OF THE SUBSCRIPTION TO EXPIRED
                                                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
    
                                                                    } // found +1 if close
                                                                    res.send({ success: "success" , id: carObj.id, venue : req.param('venueID')});
                                                                });
                                                            }
    
                                                        });
                                                    }
    
                                                } // else if for record insert                                                      
                                            } //CAR COUNT VALIDATION ELSE LOOP HERE
                                            else {
    
                                                FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                                //console.log('Car Count Else Loop');
                                            }
    
                                        }); // MASTER DATA COUNT FUNCTION ENDS HERE                                     
                                    } // SUBSCRIPTION END DATE VALIDATION ELSE LOOP
                                    else {
                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                    } //SUBSCRIPTION END DATE VALIDATION ENDS LOOP                                                  
                                } // SUBSCRIPTION IN LOOP IS NOT ACTIVE                                                 
                                else {
                                    res.send({ success: "error" });
                                }
                            }); // account find close
                        }
                    });
                }
            });
        }
    },
    validatorFlowEditCar: function(req, res) {
        var carObj = {
            cashierName : req.param('cashierName'),
            fees : req.param('fees'),
            amountPaid : req.param('amountPaid'),
            free  : req.param('free'),
            documents : req.param('documents'),
            description : req.param('description'),
        };
        Dailytransactional.update(req.param('id'), carObj).exec(function(err, carObj) {
            // var venueDetails = {};
            Venue.findOne(carObj[0].venue).exec(function(err, venueDetails) {
                if (err) {
                    venueDetails = {};
                }
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
                    createdAt: new Date(),
                    carID : carObj[0].carID,
                    free :  carObj[0].free,
                    documents :  carObj[0].documents,
                    description :  carObj[0].description,
                    updatedAt : carObj[0].updatedAt,
                    customerType : carObj[0].customerType,
                    cashierName : req.param('cashierName'),
                    fees : req.param('fees'),
                    amountPaid : req.param('amountPaid'),
                });
            });
            var carObj1 = {
                cashierName : req.param('cashierName'),
                fees : req.param('fees'),
                amountPaid : req.param('amountPaid'),
                free  : req.param('free'),
                documents : req.param('documents'),
                description : req.param('description')
            }
            carObj1['transactionID'] = carObj[0].id;
            Mastertransactional.update({ "transactionID": req.param('id') }, carObj1).exec(function(err, carObj1) {
                res.send({ success: "success" });
            });
        });
    },    
    subscriptionExpire: function(accountID, subscriptionLog, i) {
        var array = [];
        array = subscriptionLog;
        var subscriptionWantStatus = subscriptionLog[i];
        subscriptionWantStatus.subscriptionStatus = "Expired";
        array.splice(i, 1, subscriptionWantStatus);
        array.join();
        // var sLog = {
        //     subscriptionLog: array
        // };
        // Account.update(accountID, sLog, function venueUpdated(err, car) {
        console.log("-Updated log- expired");

        // });
    },
    uploadForOscar: function(req, res) { // check and add parkingID

        var device = 'Unknown';

        if(!!req.headers['user-agent'].match(/iPhone/)){
            device = 'iPhone';
        } else if(!!req.headers['user-agent'].match(/iPad/)){
            device = 'iPad';
        } else if(!!req.headers['user-agent'].match(/Android/)){
            device = 'Android';
        } else if(!!req.headers['user-agent'].match(/Linux/)){
            device = 'Linux';
        } else if(!!req.headers['user-agent'].match(/Windows/)){
            device = 'Windows';
        } else if(!!req.headers['user-agent'].match(/Mac/)){
            device = 'Mac';
        }

        if (req.method === 'POST') {
            Dailytransactional.find().where({ 'parkingID' : req.param('parkingID') }).exec(function found(err, carIsAvailable) {
                if (carIsAvailable.length == 0) {
                    var newdate = new Date();
                    var carLog = [];
                    var carLogObj = {
                        'activity': 'parked',
                        'by': req.param('employeeID'),
                        'employeeName': req.param('employeeName'),
                        'at': newdate,
                        'userProfile': req.param('profileImage')
                    }
                    var changeLog = [{
                        "activity": 'parkingID',
                        "changes": req.param('parkingID'),
                        "at": new Date(),
                        log: [{
                            "activity": 'parkingID',
                            "changes": req.param('parkingID'),
                            "at": new Date()
                        }]
                    }, {
                        "activity": 'plateNumber',
                        "changes": req.param('plateNumber'),
                        "at": new Date(),
                        log: [{
                            "activity": 'plateNumber',
                            "changes": req.param('plateNumber'),
                            "at": new Date()
                        }]
                    }, {
                        "activity": 'parkingZone',
                        "changes": req.param('parkingZone'),
                        "at": new Date(),
                        log: []
                    }]
                    if (req.param('parkingZone')) {
                        changeLog[2]['log'] = [{
                            "activity": 'parkingZone',
                            "changes": req.param('parkingZone'),
                            "at": new Date()
                        }]
                        if (req.param('loginUser')) {
                            changeLog[2]['log'][0]['loginUser'] = {
                                "by": req.param('loginUser').id,
                                "email": req.param('loginUser').email,
                                "userName": req.param('loginUser').userName,
                                "userProfile": req.param('loginUser').userProfile
                            }
                        }
                    }
                    if (req.param('loginUser')) {
                        changeLog[0]['log'][0]['loginUser'] = {
                            "by": req.param('loginUser').id,
                            "email": req.param('loginUser').email,
                            "userName": req.param('loginUser').userName,
                            "userProfile": req.param('loginUser').userProfile
                        }
                        changeLog[1]['log'][0]['loginUser'] = {
                            "by": req.param('loginUser').id,
                            "email": req.param('loginUser').email,
                            "userName": req.param('loginUser').userName,
                            "userProfile": req.param('loginUser').userProfile
                        }
                    }
            
                    // console.log('..............' + JSON.stringify(carLogObj));
                    carLog.push(carLogObj);
            
                    var found1 = 0;
                    var uniqueID = 0;
                    var currentDate = new Date();
                    var currentDatems = currentDate.getTime();
            
                    console.log('plus button pressed........');
                    var filenameOriginal;
                    // var carRecordFound = false;
                    req.file('uploadFile').upload({
                        saveAs: function(file, cb) {
                            cb(null, file.filename);
                            filenameOriginal = file.filename;
                        },
                        dirname: '../../assets/images'
                    }, function whenDone(err, uploadedFiles) {

                        if (req.param('plateNumber') != undefined) {
                            var originalPlateNumber = req.param('plateNumber');
                            var updatedPlateNumber = originalPlateNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                            if (req.param('scratchesSnap') != undefined) {
                                console.log(typeof(req.param('scratchesSnap')) + "Upload Photo 1>>> " + req.param('scratchesSnap').length);
                            }
                            var carObj = {};
                            carObj = {
                                parkingID: req.param('parkingID'),
                                plateNumber: updatedPlateNumber,
                                snap: filenameOriginal,
                                parkingZone: req.param('parkingZone'),
                                color: req.param('color'),
                                brand: req.param('brand'),
                                employeeID: req.param('employeeID'),
                                accountID: req.param('accountID'),
                                venue: req.param('venueID'),
                                arrivalTimeStamp: newdate,
                                status: 'parked',
                                log: carLog,
                                changeLog: changeLog,
                                scratchesSnap: req.param('scratchesSnap'),
                                loginAs: req.param('loginAs'),
                                remarks: req.param('remarks'),
                                modelName: req.param('modelName'),
                                carID: req.param('carID'),
                                customerType : req.param('customerType'),
                                // free :  req.param('free') ? req.param('free') : false, 
                                otherInfo : req.param('otherInfo'),
                                device: device
                            };
                            if(req.param('free'))
                                carObj['free'] = req.param('free');
                            if (typeof(req.param('scratchesSnap')) == "string") {
                                carObj.scratchesSnap = (gobalFunctionServices.isJSON(req.param('scratchesSnap')) ?  JSON.parse(req.param('scratchesSnap'))  : req.param('scratchesSnap'));
                                console.log(carObj.scratchesSnap.toString() + "<<< U P 2 carObj.scratchesSnap >>>" + carObj.scratchesSnap.length);
                            }

                            if(req.param('amountPaid')){ // Secure parking only
                                carObj['amountPaid'] = req.param('amountPaid');
                                carObj['fees'] = req.param('fees');
                            } else if(req.param('amountPaid') === false){
                                carObj['amountPaid'] = req.param('amountPaid');
                                carObj['fees'] = req.param('fees');
                            } else {
                                carObj['fees'] = (req.param('fees') ? req.param('fees') : 0);
                            }

                            if(req.param('ownerMobileNumber')){
                                carObj['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                            }

                            if(req.param('emirates'))
                                carObj['emirates'] = req.param('emirates');

                            var carObj1 = {
                                parkingID: req.param('parkingID'),
                                plateNumber: updatedPlateNumber,
                                snap: 'noImage',
                                scratchesSnap: req.param('scratchesSnap'),
                                parkingZone: req.param('parkingZone'),
                                color: req.param('color'),
                                brand: req.param('brand'),
                                employeeID: req.param('employeeID'),
                                accountID: req.param('accountID'),
                                venue: req.param('venueID'),
                                arrivalTimeStamp: newdate,
                                status: 'parked',
                                log: carLog,
                                changeLog: changeLog,
                                loginAs: req.param('loginAs'),
                                remarks: req.param('remarks'),
                                modelName: req.param('modelName'),
                                carID: req.param('carID'),
                                customerType : req.param('customerType'),
                                // free :  req.param('free') ? req.param('free') : false,
                                otherInfo : req.param('otherInfo'),
                                device: device
                            }
                            if(req.param('free'))
                                carObj1['free'] = req.param('free');
                            if(req.param('emirates'))
                                carObj1['emirates'] = req.param('emirates');

                            if(req.param('amountPaid')){ // Secure parking only
                                carObj1['amountPaid'] = req.param('amountPaid');
                                carObj1['fees'] = req.param('fees');
                            } else if(req.param('amountPaid') === false){
                                carObj1['amountPaid'] = req.param('amountPaid');
                                carObj1['fees'] = req.param('fees');
                            } else {
                                carObj1['fees'] = (req.param('fees') ? req.param('fees') : 0);
                            }

                            if(req.param('ownerMobileNumber')){
                                carObj1['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                            }

                        }

                        if (err) {
                            console.log("No Image / Image Upload Failiure");
                            return res.json(500, err);
                        } else if (uploadedFiles.length === 0) {
                            console.log("uploaded Files Length" + uploadedFiles.length);
                            // var recordProcessingCompleted = false;
                            // var recordProcessingStarted = true;
                            // var activeSubscriptionFound = false;
                            var exitBoolean = false;
                            var j = 0;
                            var foundData = false;
                            Account.findOne(req.param('accountID')).then(function found(accountData) {
                                //if (err) return next(err);
                                if (!accountData) {
                                    res.send({ notValid: 'notValid' });
                                    return;
                                }

                                for (j = accountData.subscriptionLog.length - 1; j >= 0; j--) {
                                    if (accountData.subscriptionLog[j].subscriptionStatus != undefined) {
                                        if (accountData.subscriptionLog[j].subscriptionStatus == "active") {
                                            foundData = true;
                                            console.log("Account Subscription is Active");
                                            break;
                                        }
                                    }
                                }
                                console.log("Record Found >> " + foundData);
                                if (foundData) { //SUBSCRIPTION STATUS ACTIVE STARTS HERE
                                    console.log("Subscription Active  >> " + (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()));
                                    if (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()) { //SUBSCRIPTION END DATE VALIDATION STARTS HERE

                                        uniqueID = accountData.subscriptionLog[j].uniqueID;

                                        Mastertransactional.count({ uniqueID : uniqueID }).exec(function countCB(err, found) { //RESPONSE FROM SERVER FOR THE SUBSCRIPTION COUNT
                                            if (err) {
                                                console.log('Error------' + err);
                                                exitBoolean = true;
                                                return next(err);
                                            }
                                            if (!found || found == 0) {
                                                console.log('No cars parked for this subscription!!!' + found);
                                            }
                                            console.log("-----------------" + found)
                                            found1 = found;
                                            if (found1 < (accountData.subscriptionLog[j].numberOfCars)) { //CAR COUNT VALIDATION STARTS HERE
                                                // activeSubscriptionFound = true;
                                                console.log("req.param('parkingID') in Master Transactional Store -->" + req.param('parkingID'));
                                                if (req.param('parkingID') == undefined || req.param('parkingID') == '' || req.param('plateNumber') == '' || req.param('plateNumber') == undefined) // check empty object from plus button
                                                {
                                                    exitBoolean = true;
                                                    res.send({ success: 'success' });
                                                    return;
                                                } else if (req.param('parkingID') != undefined || req.param('parkingID') != '') {
                                                    console.log('Car stored');
                                                    console.log('exitBoolean' + exitBoolean);
                                                    // ADD THE CAR IN THE DAILY TRANSACTION 
                                                    if (!exitBoolean) {
                                                        // var carObjID = 0;
                                                        if(req.param('carID'))
                                                            carObj['carID'] = req.param('carID');
                                                        
                                                        if(req.param('amountPaid') == true || req.param('amountPaid') == "true")
                                                            carObj['paidAt'] = new Date();
                                                        
                                                        //
                                                        if(req.param('ownerMobileNumber')){
                                                            carObj['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                                                        }

                                                        Dailytransactional.create(carObj).then(function(carObj) {
                                                            //if (err) return next(err);
                                                            console.log("daily Transaction Creation " + JSON.stringify(carObj));
                                                            // carObjID = carObj.id;

                                                            if (typeof(carObj.scratchesSnap) == "string") {
                                                                carObj.scratchesSnap = ( gobalFunctionServices.isJSON(carObj.scratchesSnap) ? JSON.parse(carObj.scratchesSnap)  : carObj.scratchesSnap );
                                                                console.log(carObj.scratchesSnap.toString() + "<< carObj.scratchesSnap in Publish Create 1>>" + carObj.scratchesSnap.length);
                                                            }

                                                            

                                                            // var venueDetails = {};

                                                            Venue.findOne(carObj.venue).exec(function(err, venueDetails) {
                                                                if (err) {
                                                                    venueDetails = {};
                                                                }
                                                                analysisService.insertDailyData(carObj.accountID, carObj.venue, function() {
                                                                    /// if amount paid true
                                                                    if(carObj.amountPaid == true || carObj.amountPaid  == "true"){ 
                                                                        if(carObj.fees > 0)
                                                                            analysisService.insertDailyFeesData(carObj.accountID, carObj.venue, carObj.fees,  ()=>{});
                                                                    }
                                                                });
                                                                if(carObj.accountID == SP.accountID){
                                                                    console.log("entered \n\n\n\n\n\n\n" + carObj.fees )
                                                                    if(carObj.fees == 0 ){
                                                                        console.log("11111111111 \n\n\n\n\n\n\n")
                                                                        var transporter = nodemailer.createTransport("SMTP", {
                                                                            host: process.env.NODEMAILER_HOST,
                                                                            port: process.env.NODEMAILER_PORT,
                                                                            auth: {
                                                                                user: process.env.NODEMAILER_USER,
                                                                                pass: process.env.NODEMAILER_PASS
                                                                            },
                                                                            });
                                                                            
                                                                            var attaches = [];
                                                                            _.filter(carObj.scratchesSnap,(a)=>{ 
                                                                                if(a){
                                                                                    attaches.push({
                                                                                    filename: a,
                                                                                    filePath: "assets/images/" + a,
                                                                                    cid: 'newDate-'+a 
                                                                                })  
                                                                                return a; 
                                                                                } else 
                                                                                return a; 
                                                                            });

                                                                            if(carObj.venue == "5b45c11ca23561f14ad08a6f")
                                                                                dear = 'Guru Prasad,';
                                                                            else 
                                                                                dear = 'Sir/Madam,';

                                                                            var mailOptions = {
                                                                                from: process.env.ALERTS_EMAIL,
                                                                                to: SP.to,
                                                                                subject: "EValetz Alert - Free Transaction",
                                                                                bcc: SP.bcc,
                                                                                html : '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="https://evaletz.com:2018/images/temp-home.JPG"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;">Dear Mr. ' + dear + '</p><p style="margin: 1em 0px;"> Guest type has been modified for below transaction: </p><p style="margin: 1em 0px;margin-top: 10px;">Ticket Number: ' +  carObj.parkingID.toUpperCase() +'</p><p style="margin: 1em 0px;">Plate Number: ' + carObj.plateNumber.toUpperCase()+'</p><p style="margin: 1em 0px;">Guest Type: ' + carObj.customerType + '</p><p style="margin: 1em 0px;margin-top: 10px;">Hence, <b>NO PARKING FEE.</b></p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a></span>&nbsp;and we will be happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>EValetz Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/EValetzMobileApp/" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://plus.google.com/u/0/116399189801627499126?hl=en" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://twitter.com/EvaletzApp" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://evaletz.com/" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>',
                                                                                attachments : attaches
                                                                            }

                                                                            if(carObj.venue == "5b45c11ca23561f14ad08a6f"){
                                                                                mailOptions['to'] =  SP.to;
                                                                                mailOptions['bcc'] =  SP.bcc;                                                                            
                                                                            } else {
                                                                                mailOptions['to'] =  SP.otherVenues['to'];
                                                                                mailOptions['bcc'] =  SP.otherVenues['bcc']; 
                                                                            }

                                                                            transporter.sendMail(mailOptions, function (err, response) {
                                                                            if (err) {
                                                                                console.log('email failed..........' + JSON.stringify(err));
                                                                            }
                                                                            if (response) {
                                                                                console.log('email success..........' + JSON.stringify(response));
                                                                            }
                                                                            });

                                                                            var mobileforSP =''
                                                                            if(carObj.venue == "5b45c11ca23561f14ad08a6f"){
                                                                                mobileforSP =   SP.mobiles;                                         
                                                                            } else {
                                                                                mobileforSP =   SP.otherVenues.mobiles;   
                                                                            }  
                                                                        
                                                                        var message = "Alert: NO PARKING FEE for Ticket No: "+ carObj.parkingID.toUpperCase() +" Plate No: "+ carObj.plateNumber.toUpperCase()+" Guest Type: " + carObj.customerType;
                                                                        var post_req = http.request("http://dlsonline.in/httpapi/httpapi?token=" + process.env.DLS_SMS_TOKEN + "&sender=EVALET&number=" + mobileforSP + "&route=2&type=Text-1&sms=" + message, function(res) {
                                                                            console.log('Response: ' + res);
                                                                        });
                                                                        post_req.end();
                                                                    }
                                                                }                                                                

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
                                                                        changeLog: changeLog,
                                                                        loginAs: req.param('loginAs'),
                                                                        remarks: carObj.remarks,
                                                                        modelName: carObj.modelName,
                                                                        createdAt: new Date(),
                                                                        carID: carObj.carID,
                                                                        customerType : req.param('customerType'),
                                                                        free : carObj.free,
                                                                        amountPaid :carObj.amountPaid,
                                                                        fees: carObj.fees
                                                                    },
                                                                    id: carObj.id,
                                                                    verb : 'created'
                                                                });
                                                                console.log("Venue Detail " + JSON.stringify(venueDetails));
                                                                Dailytransactional.publishCreate({
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
                                                                    changeLog: changeLog,
                                                                    loginAs: req.param('loginAs'),
                                                                    remarks: carObj.remarks,
                                                                    modelName: carObj.modelName,
                                                                    createdAt: new Date(),
                                                                    carID: carObj.carID,
                                                                    customerType : req.param('customerType'),
                                                                    free : carObj.free,
                                                                    fees: carObj.fees
                                                                    
                                                                });
                                                            });





                                                            carObj1 = {
                                                                parkingID: req.param('parkingID'),
                                                                plateNumber: updatedPlateNumber,
                                                                snap: 'noImage',
                                                                scratchesSnap: req.param('scratchesSnap'),
                                                                parkingZone: req.param('parkingZone'),
                                                                color: req.param('color'),
                                                                brand: req.param('brand'),
                                                                employeeID: req.param('employeeID'),
                                                                accountID: req.param('accountID'),
                                                                venue: req.param('venueID'),
                                                                arrivalTimeStamp: newdate,
                                                                status: 'parked',
                                                                log: carLog,
                                                                changeLog: changeLog,
                                                                loginAs: req.param('loginAs'),
                                                                remarks: req.param('remarks'),
                                                                modelName: req.param('modelName'),
                                                                carID: carObj.carID,
                                                                customerType : req.param('customerType'),
                                                                // free :  req.param('free') ? req.param('free') : false,
                                                                otherInfo : req.param('otherInfo'),
                                                                device: device
                                                            }
                                                            if(req.param('free'))
                                                                carObj1['free'] = req.param('free');
                                                            console.log("car id" + carObj.id);
                                                            carObj1['transactionID'] = carObj.id;
                                                            carObj1['uniqueID'] = uniqueID;
                                                            if(req.param('emirates'))
                                                                carObj1['emirates'] = req.param('emirates');

                                                            if(req.param('amountPaid')){ // Secure parking only
                                                                carObj1['amountPaid'] = req.param('amountPaid');
                                                                carObj1['fees'] = req.param('fees');
                                                            } else if(req.param('amountPaid') === false){
                                                                carObj1['amountPaid'] = req.param('amountPaid');
                                                                carObj1['fees'] = req.param('fees');
                                                            } else {
                                                                carObj1['fees'] = (req.param('fees') ? req.param('fees') : 0);
                                                            }

                                                            if(req.param('amountPaid') == true || req.param('amountPaid') == "true")
                                                                carObj1['paidAt'] = new Date();

                                                            if(req.param('ownerMobileNumber')){
                                                                carObj1['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                                                            }

                                                            if (!exitBoolean) {
                                                                Mastertransactional.create(carObj1).then(function(carObj1) {
                                                                    console.log("Master created ---" + carObj1.transactionID);
                                                                    exitBoolean = true;
                                                                    if ((found1 + 1) == accountData.subscriptionLog[j].numberOfCars) {
                                                                        console.log('Maximum car reached for the subscription');
                                                                        //CHANGE STATUS OF THE SUBSCRIPTION TO EXPIRED
                                                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);

                                                                    } // found +1 if close
                                                                    res.send({ success: "success" , id: carObj.id, venue : req.param('venueID')});
                                                                });
                                                            }

                                                        });
                                                    }

                                                } // else if for record insert                                                      
                                            } //CAR COUNT VALIDATION ELSE LOOP HERE
                                            else {

                                                FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                                console.log('Car Count Else Loop');
                                            }

                                        }); // MASTER DATA COUNT FUNCTION ENDS HERE                                     
                                    } // SUBSCRIPTION END DATE VALIDATION ELSE LOOP
                                    else {
                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                    } //SUBSCRIPTION END DATE VALIDATION ENDS LOOP                                                  
                                } // SUBSCRIPTION IN LOOP IS NOT ACTIVE                                                 
                                else {
                                    console.log("Account Active Subscription Not Found ")
                                    res.send({ success: "subscription expired" });
                                }

                            }); // account find close



                        } else {
                            //  handle uploaded file

                            // var recordProcessingCompleted = false;
                            // var recordProcessingStarted = true;
                            // var activeSubscriptionFound = false;
                            // var exitBoolean = false;
                            // var j = 0;
                            // var foundData = false;
                            Account.findOne(req.param('accountID')).then(function found(accountData) {
                                //if (err) return next(err);
                                if (!accountData) {
                                    res.send({ notValid: 'notValid' });
                                    return;
                                }

                                for (j = 0; j < accountData.subscriptionLog.length; j++) {

                                    if (accountData.subscriptionLog[j].subscriptionStatus != undefined) {
                                        if (accountData.subscriptionLog[j].subscriptionStatus == "active") {
                                            foundData = true;
                                            break;
                                        }
                                    }
                                }

                                if (foundData) { //SUBSCRIPTION STATUS ACTIVE STARTS HERE
                                    if (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()) { //SUBSCRIPTION END DATE VALIDATION STARTS HERE

                                        uniqueID = accountData.subscriptionLog[j].uniqueID;

                                        Mastertransactional.count({ uniqueID : uniqueID }).exec(function countCB(err, found) { //RESPONSE FROM SERVER FOR THE SUBSCRIPTION COUNT
                                            if (err) {
                                                console.log('Error------' + err);
                                                exitBoolean = true;
                                                return next(err);
                                            }
                                            if (!found || found == 0) {
                                                //console.log('No cars parked for this subscription!!!'+found);
                                            }
                                            found1 = found;
                                            if (found1 < (accountData.subscriptionLog[j].numberOfCars)) { //CAR COUNT VALIDATION STARTS HERE
                                                // activeSubscriptionFound = true;
                                                if (req.param('parkingID') == undefined || req.param('parkingID') == '' || req.param('plateNumber') == '' || req.param('plateNumber') == undefined) // check empty object from plus button
                                                {
                                                    exitBoolean = true;
                                                    res.send({ success: 'success' });
                                                    return;
                                                } else if (req.param('parkingID') != undefined || req.param('parkingID') != '') {
                                                    console.log('Car stored');
                                                    console.log('exitBoolean' + exitBoolean);
                                                    // ADD THE CAR IN THE DAILY TRANSACTION 
                                                    if (!exitBoolean) {
                                                        // var carObjID = 0;

                                                        console.log("Problem 3");

                                                        if (typeof(carObj.scratchesSnap) == "string") {
                                                            carObj.scratchesSnap = ( gobalFunctionServices.isJSON(carObj.scratchesSnap) ?  JSON.parse(carObj.scratchesSnap)  : carObj.scratchesSnap);
                                                            console.log(carObj.scratchesSnap.toString() + "<< carObj.scratchesSnap in Publish Create 3>>" + carObj.scratchesSnap.length);
                                                        }
                                                        if(req.param('carID'))
                                                            carObj['carID'] = req.param('carID')
                                                        
                                                        if(req.param('amountPaid') == true || req.param('amountPaid') == "true")
                                                            carObj['paidAt'] = new Date();
                                                        
                                                        if(req.param('ownerMobileNumber')){
                                                            carObj['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                                                        }

                                                        Dailytransactional.create(carObj).then(function(carObj) {
                                                            //if (err) return next(err);
                                                            console.log("daily" + JSON.stringify(carObj));
                                                            // carObjID = carObj.id;
                                                            // var venueDetails = {};

                                                            Venue.findOne(carObj.venue).exec(function(err, venueDetails) {
                                                                if (err) {
                                                                    venueDetails = {};
                                                                }
                                                                analysisService.insertDailyData(carObj.accountID, venueDetails.id, function() {
                                                                    /// if amount paid true
                                                                    if(carObj.amountPaid == true || carObj.amountPaid  == "true") {
                                                                        if(carObj.fees > 0)
                                                                            analysisService.insertDailyFeesData(carObj.accountID, carObj.venue, carObj.fees,  ()=>{});
                                                                    }
                                                                });

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
                                                                        changeLog: changeLog,
                                                                        loginAs: req.param('loginAs'),
                                                                        remarks: carObj.remarks,
                                                                        modelName: carObj.modelName,
                                                                        createdAt: new Date(),
                                                                        carID : carObj.carID,
                                                                        customerType : req.param('customerType'),
                                                                        free : carObj.free,
                                                                        amountPaid :carObj.amountPaid,
                                                                        fees: carObj.fees
                                                                    },
                                                                    id: carObj.id,
                                                                    verb : 'created'
                                                                });

                                                                console.log("Venue Detail" + JSON.stringify(venueDetails));
                                                                Dailytransactional.publishCreate({
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
                                                                    changeLog: changeLog,
                                                                    loginAs: req.param('loginAs'),
                                                                    remarks: carObj.remarks,
                                                                    modelName: carObj.modelName,
                                                                    createdAt: new Date(),
                                                                    carID : carObj.carID,
                                                                    customerType : req.param('customerType'),
                                                                    free : carObj.free,
                                                                    fees: carObj.fees
                                                                });

                                                            });

                                                            carObj1 = {
                                                                parkingID: req.param('parkingID'),
                                                                plateNumber: updatedPlateNumber,
                                                                snap: 'noImage',
                                                                scratchesSnap: req.param('scratchesSnap'),
                                                                parkingZone: req.param('parkingZone'),
                                                                color: req.param('color'),
                                                                brand: req.param('brand'),
                                                                employeeID: req.param('employeeID'),
                                                                accountID: req.param('accountID'),
                                                                venue: req.param('venueID'),
                                                                arrivalTimeStamp: newdate,
                                                                status: 'parked',
                                                                log: carLog,
                                                                changeLog: changeLog,
                                                                loginAs: req.param('loginAs'),
                                                                remarks: req.param('remarks'),
                                                                modelName: req.param('modelName'),
                                                                carID: req.param('carID'),
                                                                customerType : req.param('customerType'),
                                                                // free :  req.param('free') ? req.param('free') : false,
                                                                otherInfo : req.param('otherInfo'),
                                                                device: device
                                                            }
                                                            if(req.param('free'))
                                                                carObj1['free'] = req.param('free');

                                                            carObj1['transactionID'] = carObj.id;
                                                            carObj1['snap'] = filenameOriginal;
                                                            if(req.param('carID'))
                                                                carObj1['carID'] = req.param('carID')

                                                            if(req.param('emirates'))
                                                                carObj1['emirates'] = req.param('emirates');
                                                            
                                                            if(req.param('amountPaid')){ // Secure parking only
                                                                carObj1['amountPaid'] = req.param('amountPaid');
                                                                carObj1['fees'] = req.param('fees');
                                                            } else if(req.param('amountPaid') === false){
                                                                carObj1['amountPaid'] = req.param('amountPaid');
                                                                carObj1['fees'] = req.param('fees');
                                                            } else {
                                                                carObj1['fees'] = (req.param('fees') ? req.param('fees') : 0);
                                                            }

                                                            if(req.param('amountPaid') == true || req.param('amountPaid') == "true")
                                                                carObj1['paidAt'] = new Date();

                                                            if(req.param('ownerMobileNumber')){
                                                                carObj1['ownerMobileNumber'] = req.param('ownerMobileNumber') 
                                                            }

                                                            if (!exitBoolean) {
                                                                Mastertransactional.create(carObj1).then(function(carObj1) {
                                                                    console.log("Master created ---" + carObj1.transactionID);
                                                                    exitBoolean = true;
                                                                    if ((found1 + 1) == accountData.subscriptionLog[j].numberOfCars) {
                                                                        console.log('Maximum car reached for the subscription');
                                                                        //CHANGE STATUS OF THE SUBSCRIPTION TO EXPIRED
                                                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);

                                                                    } // found +1 if close
                                                                    res.send({ success: "success" , id: carObj.id, venue : req.param('venueID')});
                                                                });
                                                            }

                                                        });
                                                    }

                                                } // else if for record insert                                                      
                                            } //CAR COUNT VALIDATION ELSE LOOP HERE
                                            else {

                                                FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                                //console.log('Car Count Else Loop');
                                            }

                                        }); // MASTER DATA COUNT FUNCTION ENDS HERE                                     
                                    } // SUBSCRIPTION END DATE VALIDATION ELSE LOOP
                                    else {
                                        FileController.subscriptionExpire(req.param('accountID'), accountData.subscriptionLog, j);
                                    } //SUBSCRIPTION END DATE VALIDATION ENDS LOOP                                                  
                                } // SUBSCRIPTION IN LOOP IS NOT ACTIVE                                                 
                                else {
                                    console.log("error else called...");
                                    res.send({ success: "error" });
                                }
                            }); // account find close
                        }
                    });
                } else {
                    console.log("Final else called...");
                    return res.end();
                }
            });
        } else if (req.isSocket) {
            // Dailytransactional.watch(req.socket);
            sails.sockets.join(req.socket,'myroom');
            // console.log('Dailytransactional subscribed to ' + req.socket.id);
        }
    },
    updateBillNumertoTransaction : function(req, res){
        if (req.method === 'POST') {
            if(req.param('modalName') == 'master'){
                Mastertransactional.update(req.param('id'), { bill  : req.param('bill')}).exec(function(err, carObj1) {
                    if (err) return next(err);
                    res.end();
                });
            } else if(req.param('modalName') == 'both'){
                Dailytransactional.update(req.param('id'), { bill  : req.param('bill') }).exec(function(err, carObj) {
                    if (err) return next(err);
                    Mastertransactional.update({ "transactionID": req.param('id') }, { bill  : req.param('bill')}).exec(function(err, carObj1) {
                        if (err) return next(err);
                        res.end();
                    });
                });
                  // if (typeof(carObj[0].scratchesSnap) == "string") {
                    //     carObj[0].scratchesSnap = JSON.parse(carObj[0].scratchesSnap);
                    // }
                    // Venue.findOne(carObj[0].venue).exec(function(err, venueDetails) {
                    //     if (err) {
                    //         venueDetails = {};
                    //     }
                    //     Dailytransactional.publishUpdate(carObj[0].id, {
                    //         id: carObj[0].id,
                    //         parkingID: carObj[0].parkingID,
                    //         plateNumber: carObj[0].plateNumber,
                    //         snap: carObj[0].snap,
                    //         scratchesSnap: carObj[0].scratchesSnap,
                    //         parkingZone: carObj[0].parkingZone,
                    //         color: carObj[0].color,
                    //         brand: carObj[0].brand,
                    //         employeeID: carObj[0].employeeID,
                    //         accountID: carObj[0].accountID,
                    //         venue: venueDetails,
                    //         status: carObj[0].status,
                    //         log: carObj[0].log,
                    //         changeLog: carObj[0].changeLog,
                    //         loginAs:  carObj[0].loginAs,
                    //         editCar: true,
                    //         remarks: carObj[0].remarks,
                    //         modelName: carObj[0].modelName,
                    //         createdAt: carObj[0].createdAt,
                    //         carID : carObj[0].carID,
                    //         free :  carObj[0].free,
                    //         documents :  carObj[0].documents,
                    //         description :  carObj[0].description,
                    //         updatedAt : carObj[0].updatedAt,
                    //         customerType : carObj[0].customerType,
                    //         fees : carObj[0].fees, 
                    //         validatedBy : carObj[0].validatedBy,
                    //         validatedAt : carObj[0].validatedAt, 
                    //         cashAcceptedBy : carObj[0].cashAcceptedBy, 
                    //         cashAcceptedAt : carObj[0].cashAcceptedAt,
                    //         bill  : carObj[0].bill
                    //     });
                    // });
            }
        } else if (req.isSocket) {
            // Dailytransactional.watch(req.socket);
            sails.sockets.join(req.socket,'myroom');
        }
    },
    updateBillNumerforPOSPrint : function(req, res){
        if (req.method === 'POST') {
            Venue.findOne({ id : req.param('venue')}).exec(function found(err, masterData) {
                if(err){
                    return res.send({ print : 'none' });
                }
                if(masterData){
                    if(!masterData.billNumberUsed)
                        masterData.billNumberUsed = 0;
                    
                    if(masterData && masterData.defaultValues && !masterData.defaultValues.free){
                        Venue.update(req.param('venue'), { 'billNumberUsed' : ( masterData.billNumberUsed + 1) }, function venueUpdated(err, venueData) {
                            if (err) return next(err);
                            var input =  masterData.billNumberUsed + 1;
                            var pad = 0; 
                            var len = 4;
                            var billll = masterData.billNumberUsed + 1;
                            input = input.toString();
                            if (input.length >= len) 
                                console.log(input);
                            else {
                                pad = (pad || 0).toString();
                                billll = new Array(1 + len - input.length).join(pad) + input;
                                // console.log(data.newBillNumber);
                            }
                            billll =  (venueData.short ? venueData.short : '') + billll;
                            Dailytransactional.update(req.param('id'), { bill  : billll }).exec(function(err, carObjD) {
                                Mastertransactional.update({ "transactionID": req.param('id') }, { bill  : billll}).exec(function(err, carObj1M) {
                                    if (err) return next(err);
                                    if(carObjD.length > 0)
                                        carObjD[0]['venue'] = masterData;
                                    return res.send({ print : 'ok', data :carObjD });
                                });
                            });
                        });
                    } else {
                        return res.send({ print : 'none' });
                    }
                }
                
            });

        } 
    },
    testQueryWorksFine : function(req, res){
        // Dailytransactional.find().where( { id : "5a5348042e84e20a4fb558da"}).populate('accountID', { select: ["subscriptionID",
        // // "defaultVenue",
        // // "accountName",
        // // "status",
        // // "accountID",
        // // "createdAt",
        // // "updatedAt",
        // "id"]}).populate('venue').populate('employeeID').exec(function foundUsers(err, accountsData) {
        //     console.log(JSON.stringify(err));
        //     console.log(JSON.stringify(accountsData))
        // })
        // console.log("=============================")
        // Dailytransactional.find(
        //     {},
        //     {fields: { parkingID: 1}}
        // ).sort({}).exec(function foundUsers(err, accountsData) {
        //         console.log(JSON.stringify(err));
        //         console.log(JSON.stringify(accountsData))
        //     })

        // https://github.com/balderdashy/waterline/issues/1098
    },
    postSMS : function(req, res){
        if (req.method === 'POST') {
            var post_req = http.request("http://dlsonline.in/httpapi/httpapi?token=" + process.env.DLS_SMS_TOKEN + "&sender=EVALET&number=" + req.param('mobile')+ "&route=2&type=Text-1&sms=" + req.param('message'), function(res1) {
                console.log('Response: ' + res1);
                res.send();
            });
            post_req.end();

        } 
    },
};

module.exports = FileController;
