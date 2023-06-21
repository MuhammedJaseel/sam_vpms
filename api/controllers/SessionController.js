var userController = require('./UserController');
var analysisService = require('../services/analysisService.js');
const { pull } = require('lodash');

module.exports = {
    create: function(req, res, next) {
        userController.userCreationAutomatically();
        // var uniqueID = 0;
        // var numberOfCars = 0;
        console.log(">>>> " + req.param('email'));

        function isEmail(email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
        var modalData = {};
        if(isEmail(req.param('email')))
            modalData = { 'email' : req.param('email') };
        else 
            modalData =  { 'mobile' : req.param('email') };
        // console.log(modalData)
        User.findOne(modalData).populateAll().exec(function foundUser(err, user) {
        //User.findOneByEmail(req.param('email')).populateAll().exec(function foundUser(err, user) {
            if (err) return next(err);
            if (!user) {
                res.send({ notValid: 'notValid' });
                return;
            }
            if (req.param('password') != user.password) {
                res.send({ notMatchingPassword: 'notMatchingPassword' });
                res.end();
                return;
            }
            // var currentDate = new Date();
            // var currentDatems = currentDate.getTime();
            // var carCount = 0;
            user.master = [];
            user.daily = [];
            user.excelFormatSettings = [];
            if (user.role == 'admin') {
                res.send({ user: user });
                res.end();
            } else {
                if(user.accountID){
                    if(typeof user.accountID == 'string'){
                        res.send({ notValid: 'notValid' });
                        res.end();
                    } else{
                        user.accountID.subscriptionLog = [];
                        if(user.accountID){
                            if (user.accountID.subscriptionStatus == 'active' || user.accountID.status == 'active') {
                                res.send({ user: user });
                                return;
                            } else if (user.accountID.subscriptionStatus == 'blocked' || user.accountID.status == 'blocked') {
                                res.send({ user: user, blocked: 'blocked' });
                                res.end();
                            } else {
                                res.send({ user: user ,expired: 'expired' });
                                res.end();
                            }
                        } else {
                            res.send({ notValid: 'notValid' });
                            res.end();
                        }
                    } 
                        
                } else {
                    res.send({ notValid: 'notValid' });
                    res.end();
                }
                console.log(">>>> " + JSON.stringify(user));
            }
            return;
        });


    },
    deleteSessionObject: function(req, res, next) {

    },
    insertYearMonthDAyDatesforAnalysis:function(req, res, next){
        console.log("called from api....");
        if(req.query.pwd == "123456"){
            analysisService.gettingOldDataforAnalysis(function(){
                res.send({ ok: 'ok' });
            });
        } else
            res.send({ error: 'Authentication Failed...' });
    },
    findAndReplaceTajUnknownAccoutVenueMain:function(req, res, next){
        console.log("called from api....");
        if(req.query.pwd == "123456"){
            analysisService.findAndReplaceTajUnknownAccoutVenue(function(){
                res.send({ ok: 'ok' });
            });
        } else
            res.send({ error: 'Authentication Failed...' });
    },
    loginGuest: function(req, res, next) {
        function isEmail(email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
        var modalData = {};
        if(isEmail(req.param('email')))
            modalData = { 'email' : req.param('email') };
        else 
            modalData =  { 'mobile' : req.param('email') };

        User.findOne(modalData).exec(function foundUser(err, user) {
            if (err) return next(err);
            if (!user) {
                res.send({ notValid: 'notValid' });
                return;
            }
            if (req.param('password') != user.password) {
                res.send({ notMatchingPassword: 'notMatchingPassword' });
                res.end();
                return;
            }
            Car.find().where( { "employeeID" :  user.id} ).exec(function foundUser(err, cars) {
                res.send({ user: user , cars : cars});
                res.end();
            });
            return;
        });
    },
    pushNotification: function(req, res, next) {
        const user = req.param('user')
        const token = req.param('token')

        NotificationSubscription.findOrCreate({ user, token }, { user, token }).exec(function (err, ns) {
            if (err) return res.serverError(err)
            return res.ok()
        })
    },
    pushNotificationDelete: function(req, res, next) {
        const user = req.param('user')
        const token = req.param('token')

        NotificationSubscription.destroy({ user, token}).exec(function (err) {
            if (err) return res.negotiate(err)
            return res.ok()
        })
    },
    createCarforGuest: function(req, res, next) {
        Car.find().exec(function carss(err, car) {
            Car.create({
                parkingID: "car"+ (car.length+1),
                plateNumber: req.param('plateNumber'),
                snap:  req.param('snap'),
                scratchesSnap: req.param('scratchesSnap'),
                color: req.param('color'),
                brand: req.param('brand'),
                employeeID: req.param('employeeID'),
                modelName: req.param('modelName')
            }).then(function(carObj1) {
                res.send({ success: carObj1 });
            });
        });
    },
    getParkedCarforGuest: function(req, res, next) {
        Car.find().where({ 'employeeID' : req.param('id') }).exec(function foundUser(err, cars) {
            Dailytransactional.find().where({   or : 
                _.map(cars , (o)=>{ return  {'carID' : o.parkingID } } )
            }  ).exec(function foundUser(err, carData) {
                res.send({ parkedCar : carData });
            });
        });
    },
    getScannedGuestCarformDaily: function(req, res, next) {
        var query = {};
        if(req.param('parkingID').indexOf('car') > -1)
            query = { carID : req.param('parkingID')};
        else 
            query = { parkingID : req.param('parkingID')};
        (req.param('db') == 'daily' ? Dailytransactional : Mastertransactional).find().where(query).populate('venue',{ select : ['venueName', 'id']}).limit(1).sort('createdAt DESC').exec(function foundUser(err, carData) {
            res.send({ parkedCar : carData });
        });
    },
    getAllCarforGuest: function(req, res, next) {
        Car.find().where({ 'employeeID' : req.param('id') }).exec(function foundUser(err, cars) {
            res.send({ cars : cars });
        });
    },
    usernameExists:  function(req, res, next) {
        User.find().where({ 'userName' :req.param('username') })
        .exec(function foundUser(err, user) {
            if (err) {
                return res.send({ error: err });
            }
            if (user) {
                res.send({ success : user.length })
            }
        });
    },
    emailExistsChecking:  function(req, res, next) {
        User.find().where({ 'email' :req.param('email') })
        .exec(function foundUser(err, user) {
            if (err) {
                return res.send({ error: err });
            }
            if (user) {
                res.send({ success : user.length })
            }
        });
    },
    OscarUserSessionCreate: function(req, res, next) {
        userController.userCreationAutomatically();

        function isEmail(email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
        var modalData = {};
        if(isEmail(req.param('email')))
            modalData = { 'email' : req.param('email') };
        else 
            modalData =  { 'userName' : req.param('email') };
        // console.log(modalData)
        User.findOne(modalData).populateAll().exec(function foundUser(err, user) {
        //User.findOneByEmail(req.param('email')).populateAll().exec(function foundUser(err, user) {
            if (err) return next(err);
            if (!user) {
                res.send({ notValid: 'notValid' });
                return;
            }
            if (req.param('password') != user.password) {
                res.send({ notMatchingPassword: 'notMatchingPassword' });
                res.end();
                return;
            }
            // var currentDate = new Date();
            // var currentDatems = currentDate.getTime();
            // var carCount = 0;
            user.master = [];
            user.daily = [];
            user.excelFormatSettings = [];
            // req.session.authenticated  = true;

            if (user.role == 'admin') {
                res.send({ user: user });
                res.end();
            } else {
                if(user.accountID){
                    if(typeof user.accountID == 'string'){
                        res.send({ notValid: 'notValid' });
                        res.end();
                    } else{
                        user.accountID.subscriptionLog = [];
                        if(user.accountID){
                            if (user.accountID.subscriptionStatus == 'active' || user.accountID.status == 'active') {
                                res.send({ user: user });
                                User.update(user.id, { 'status' : 'online' },function Updated(err, account) {
                                    return;
                                });
                            } else if (user.accountID.subscriptionStatus == 'blocked' || user.accountID.status == 'blocked') {
                                res.send({ user: user, blocked: 'blocked' });
                                res.end();
                            } else {
                                res.send({ user: user ,expired: 'expired' });
                                res.end();
                            }
                        } else {
                            res.send({ notValid: 'notValid' });
                            res.end();
                        }
                    } 
                        
                } else {
                    res.send({ notValid: 'notValid' });
                    res.end();
                }
                console.log(">>>> " + JSON.stringify(user));
            }
            return;
        });
    },
    SessionCreate: function(req, res, next) {
        userController.userCreationAutomatically();
        console.log("***                 *****                 ***");
        console.log(" ***               *** ***               ***");
        console.log("  ***             ***   ***             *** ");
        console.log("   ***           ***     ***           ***  ");
        console.log("    ***         ***       ***         ***   ");
        console.log("     ***       ***         ***       ***    ");
        console.log("      ***     ***           ***     ***     ");
        console.log("       ***   ***             ***   ***      ");
        console.log("        *** ***               *** ***       ");
        console.log("         *****                 *****        ");

        function isEmail(email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
        var modalData = {};
        if(isEmail(req.param('email')))
            modalData = { 'email' : req.param('email') };
        else 
            modalData =  { 'userName' : req.param('email') };
        // console.log(modalData)
        User.findOne(modalData).populateAll().exec(function foundUser(err, user) {
        //User.findOneByEmail(req.param('email')).populateAll().exec(function foundUser(err, user) {
            if (err) return next(err);
            if (!user) {
                res.send({ notValid: 'notValid' });
                return;
            }
            if (req.param('password') != user.password) {
                res.send({ notMatchingPassword: 'notMatchingPassword' });
                res.end();
                return;
            }
            // var currentDate = new Date();
            // var currentDatems = currentDate.getTime();
            // var carCount = 0;
            user.master = [];
            user.daily = [];
            user.excelFormatSettings = [];
            // req.session.authenticated  = true;

            if (user.role == 'admin') {
                res.send({ user: user });
                res.end();
            } else {
                if(user.accountID){
                    if(typeof user.accountID == 'string'){
                        res.send({ notValid: 'notValid' });
                        res.end();
                    } else{
                        user.accountID.subscriptionLog = [];
                        if(user.accountID){
                            if (user.accountID.subscriptionStatus == 'active' || user.accountID.status == 'active') {
                                res.send({ user: user });
                                User.update(user.id, { 'status' : 'online' },function Updated(err, account) {
                                    return;
                                });
                            } else if (user.accountID.subscriptionStatus == 'blocked' || user.accountID.status == 'blocked') {
                                res.send({ user: user, blocked: 'blocked' });
                                res.end();
                            } else {
                                res.send({ user: user ,expired: 'expired' });
                                res.end();
                            }
                        } else {
                            res.send({ notValid: 'notValid' });
                            res.end();
                        }
                    } 
                        
                } else {
                    res.send({ notValid: 'notValid' });
                    res.end();
                }
                console.log(">>>> " + JSON.stringify(user));
            }
            return;
        });
    },
    userStatusUpdate: function(req, res){
        User.update(req.param('id'), { 'status' : req.param('status') },function Updated(err, account) {
            return res.send();
        });
    },
    completeCarByVenueID:function(req, res, next){
        console.log("called from api....");
        if(req.query.pwd == "123456"){
        
          
        var log = [];
        var updatedLog = [];
        var newdate = new Date();
        var _analysis = []

        var mobileFilelds = {
            "fields": {
              id: 1,
              venue : 1
            }
        };

        Dailytransactional.find({},mobileFilelds).where({
            venue : req.param('venueID')
        }).exec(function found(err, _analysis) {
            if (err) return next(err);
            getAllRecords(0);
                
            function getAllRecords(r){
                if(r < _analysis.length){

                    Dailytransactional.findOne( _analysis[r].id ).populateAll().exec(function foundCar(err, car) {
                        if (err) return next(err);
                        if (!car) {
                            // ++ 
                            setTimeout(function(){
                                r++;
                                getAllRecords(r);
                            }, 1);
                    
                        }
            
                        if (car.log != undefined) {
                            for (var i = 0; i < car.log.length; i++) {
                                log.push(car.log[i]);
                            }
                        }
            
                        updatedLog = {
                            'activity': 'completed',
                            'employeeName': 'System',
                            'at': newdate,
                            'fees' : 0,
                        };
                    
                        log.push(updatedLog);
                        //console.log('updated log-----'+JSON.stringify(log));
                        var carDetails = {
                            status: 'complete',
                            log: log,
                            free : true,
                            documents : [],
                            description : ''
                        };
                        
                        Dailytransactional.destroy(car.id).exec(function destroy(err) {
                            console.log("-completed-");
                            try{
                                Mastertransactional.find().where({ "transactionID": car.id }).exec(function found(err, masterData) {
                                    if (err) {
                                        setTimeout(function(){
                                            r++;
                                            getAllRecords(r);
                                        }, 1);
                                
                                    }
                                    if(masterData && masterData.length > 0){
                                        Mastertransactional.update(masterData[0].id, carDetails, function venueUpdated(err, car) {
                                            if (err) {
                                                setTimeout(function(){
                                                    r++;
                                                    getAllRecords(r);
                                                }, 1);
                                        
                                            }
                                            console.log("-Master-accepted-");
                                            // ++
                                            setTimeout(function(){
                                                r++;
                                                getAllRecords(r);
                                            }, 1);
                                    
                                        });
                                    }
                                });
                            } catch(e){
                                // ++ 
                                setTimeout(function(){
                                    r++;
                                    getAllRecords(r);
                                }, 1);
                        
                            }
                        });
                    });
                } else {
                    console.log("\n\n\n\n\n\n\n\n\n all done \n\n\n\n\n\n\n\n\n")
                   return res.send({ car: 'success' });
                }
            }

        });

        


               
        
        
    






        } else
            res.send({ error: 'Authentication Failed...' });
    },
};
