var _ = require('lodash');
var mailController = require('./MailController');

module.exports = {
    addVenueFromAPICall: function(req, res, next) {
        var venueObj = {
            venueName: req.param('venueName')
        }
        console.log("call from android.....");
        Venue.create(venueObj).exec(function(error, venues) {
            if (error) { console.log("error while creating Venue..." + error); }
            console.log(venues);
        });

    },

    addAccountVenueFromAPICall: function(req, res, next) {
        // var currentDate = new Date();
        // var currentDatems = currentDate.getTime();
        // var found = 0;
        // var activeSubscriptionFound = false;
        // var exitBoolean = false;
        // var foundData = false;
        // var j = 0;
        var venueObj = {
            account: req.param('accountID'),
            venueName: req.param('venueName'),
            short: req.param('short'),
            parkingZones: req.param('parkingZones'), 
            logo : req.param('logo'), 
            automaticTokenGeneration : req.param('automaticTokenGeneration'),
            printToken :  req.param('printToken'),
            amount :  req.param('amount'),
            VAT :  req.param('VAT'),
            defaultValues :req.param('defaultValues'),
            paymentMode :req.param('paymentMode'),
            twoLevelValidation :req.param('twoLevelValidation'),
            cashierValidateOption :req.param('cashierValidateOption'),
            VATType : req.param('VATType')
        }
        if(req.param('settings'))
            venueObj['settings'] = req.param('settings');
        // console.log(JSON.stringify(req.param('parkingZones')))
        Venue.create(venueObj).exec(function(error, venueCreatedObj) {
            if (error) { console.log("error while creating Venue..." + error); }
            console.log(venueCreatedObj);
            console.log("Venue added successfully...");
            res.send({ success: "success", venue: venueCreatedObj });
        });
        /*Account.findOne(req.param('accountID')).populateAll().exec(function foundVenues(err, accountData) {
            if (err) return next(err);
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

            if (foundData) {
                if (currentDatems <= (accountData.subscriptionLog[j].subscriptionEndDate).getTime()) { //SUBSCRIPTION END DATE VALIDATION STARTS HERE
                    found = accountData.venues.length;
                    console.log('venues length------' + found + '----------venues ------' + accountData.subscriptionLog[j].numberOfVenues);

                    if (!found || found == 0) {
                        console.log('No subscription!!!' + found);
                    }
                    if (found != undefined) {
                        if (!exitBoolean) {
                            console.log('There are ' + found + '  records founded ');
                            if (found < (accountData.subscriptionLog[j].numberOfVenues)) { //CAR COUNT VALIDATION STARTS HERE
                                activeSubscriptionFound = true;
                                console.log(new Date() + "active condition--------" + activeSubscriptionFound);
                                console.log('entered into less than venues');

                                if (req.param('venueName') != undefined || req.param('venueName') != '') {
                                    console.log('stored');
                                    // ADD THE CAR IN THE DAILY TRANSACTION   
                                    var venueObj = {
                                        account: req.param('accountID'),
                                        venueName: req.param('venueName')
                                    }
                                    Venue.create(venueObj).exec(function(error, venueCreatedObj) {
                                        if (error) { console.log("error while creating Venue..." + error); }
                                        console.log(venueCreatedObj);
                                        console.log("Venue added successfully...");
                                        exitBoolean = true;
                                        res.send({ success: "success", venue: venueCreatedObj });
                                    });

                                }
                            } else {
                                res.send({ success: "error" });
                            }
                        } //exitboolean
                    }
                } else {
                    res.send({ success: "error" });
                }
            } else {
                res.send({ success: "error" });
            }
        }); // account find close
        */

    },
    removeVenueFromAPICall: function(req, res, next) {
        var venueID = req.param('venueID');
        console.log("call from android.....destroy Venue");
        Venue.findOne({ id: venueID }).exec(function findIt(err, foundData) {
            Mastertransactional.find().where({ "venue": foundData.id}).exec(function found(err, _analysis) {
                if (_analysis) {
                    // console.log(_.map(_analysis, 'id') + "================1")
                    Mastertransactional.destroy({
                        id: _.map(_analysis, 'id')
                        }).exec(function (err){   
                        Dailytransactional.find().where({ "venue": foundData.id}).exec(function found(err, _analysis1) {
                            if (_analysis1) {
                                // console.log(_.map(_analysis1, 'id') + "================ 222")
                                Dailytransactional.destroy({
                                id: _.map(_analysis1, 'id')
                                }).exec(function (err){
                                
                                    Totalvenuetransactional.find().where({ "venueID": foundData.id}).exec(function found(err, _analysis2) {
                                        if (_analysis2) {
                                            // console.log(_.map(_analysis2, 'id') + "================ 333")
                                            Totalvenuetransactional.destroy({
                                            id: _.map(_analysis2, 'id')
                                            }).exec(function (err){
                                        
                                                Yearmonthvenuetransactional.find().where({ "venueID": foundData.id}).exec(function found(err, _analysis3) {
                                                    if (_analysis3) {
                                                        // console.log(_.map(_analysis3, 'id') + "================ 4444")
                                                        Yearmonthvenuetransactional.destroy({
                                                        id: _.map(_analysis3, 'id')
                                                        }).exec(function (err){
                                                        
                                                            Venue.find().where({ "id": foundData.id}).populate('users').exec(function found(err, _users) {
                                                                // console.log("===========" + _users)
                                                                if (_users.length > 0 && _users[0].users) {
                                                                    // console.log(_.map(_users[0].users, 'id') + "================ 55555")
                                                                    User.destroy({
                                                                        id: _.map(_.filter(_users[0].users, (u)=>{ return (u.role != 'accountadmin')}), 'id')
                                                                    }).exec(function (err){
                                                                    
                                                                        Venue.destroy({ id: foundData.id }).exec(function destroyVenue(err) {
                                                                            //Venue.publishDestroy(foundData.id,{venueName:foundData.venueName, venueID:foundData.venueID});
                                                                            console.log("-deleted-");
                                                                            res.send({ success: 'success' });
                                                                        });
                                                                        
                                                                    });
                                                                }
                                                            });
                                                            
                                                        });
                                                    }
                                                });
                                                
                                            });
                                        }
                                    });


                                });
                            }
                        });
                    });
                }
            });
        });
    },
    assignVenueToAccountFromAPICall: function(req, res, next) {
        var venueID = req.param('venueID');
        var accountID = req.param('accountID');
        console.log("call from android.....Assign Venue To Account");
        Venue.findOne({ id: venueID }).exec(function findVenue(err, foundData) {
            if (err) return next(err);
            var venueObj = {
                account: accountID
            }
            Venue.update(foundData.id, venueObj, function venueUpdated(err) {
                if (err) return next(err);
                console.log("-Updated-");
            });
        });
    },
    assignVenueToUserFromAPICall: function(req, res, next) {
        var venueIDs = req.param('venueIDs');
        console.log("--" + venueIDs);
        User.findOne({ id: req.param('userID') }).exec(function findUser(err, foundData) {
            if (err) return next(err);
            var venueIDsObj = {
                venues: venueIDs
            }
            if(foundData){
                User.update(foundData.id, venueIDsObj, function venueUpdated(err) {
                    if (err) return next(err);
                    console.log("-Updated-" + venueIDsObj);
                    res.send({ success: 'success' });
                });
            }
        });

    },
    assignDefaultVenueToUserFromAPICall: function(req, res, next) {
        var userObj = {
            fullName: req.param('fullName'),
            userName: req.param('userName'),
            email: req.param('email'),
            mobile: req.param('mobile'),
            password: req.param('password'),
            accountID: req.param('id'),
            companyName: req.param('companyName'),
            role: req.param('role'),
            venues: req.param('defaultVenue'),
            licenseNumber: req.param('licenseNumber'),
            joiningDate : req.param('joiningDate'),
            documents: req.param('documents')
        }
        if(req.param('revalidate'))
            userObj['revalidate'] = req.param('revalidate');
        // console.log("-------------------------------------------------------------");
        // console.log("User via Default Venue Creation Called");
        // console.log("-------------------------------------------------------------");
        if(req.param('userName') &&  req.param('id')){ // accountID and username is there
            User.create(userObj).exec(function(error, userObj) {
                if (error) {
                    res.send(error);
                }
                res.send(userObj);
                if (req.param('wanttoSendEmail') == true) {
                    mailController.mailtosendfunc(req.param('email'), "Your password is " + req.param('password'));
                }
                console.log("Registered successfully....");
            });
        } else 
            res.send({error : ''});
    },
    getActiveAccountVenue: function(req, res, next) {
        var uniqueID = 0;
        // var currentDate = new Date();
        // var currentDatems = currentDate.getTime();

        console.log("----------------------------------------------------");
        console.log("----------------Venue Check Active Called------------" + req.param('accountID'));
        console.log("----------------------------------------------------");
        var i = 0;
        Account.findOne('555f449c37bd35a7244ad185').populateAll().exec(function found(err, accountData) {
            if (err) return next(err);
            if (!accountData) {
                res.send({ notValid: 'notValid' });
                return;
            }


            getActiveVenues(i);

            function getActiveVenues(i) {
                if (i < accountData.subscriptionLog.length) {
                    //
                    if (accountData.subscriptionLog[i].subscriptionStatus == undefined) { //SUBSCRIPTION STATUS UNDEFINED STGRTS HERE                                     
                        console.log(i + '--Subscription is undefined');
                        i++;
                        getActiveVenues(i);
                    } else if (accountData.subscriptionLog[i].subscriptionStatus == 'active') { //SUBSCRIPTION STATUS ACTIVE STARTS HERE
                        uniqueID = accountData.subscriptionLog[i].uniqueID;
                        Venue.find().where({ uniqueID: uniqueID }).exec(function findVenue(err, foundData) {
                            if (err) return next(err);
                            if (!foundData) {
                                res.send({ notValid: 'notValid' });
                                return;
                            }

                            console.log('Active Venues:---' + JSON.stringify(foundData));

                            res.send({ activeVenues: foundData });
                            return;
                        });
                    } else {
                        i++;
                        getActiveVenues(i);
                    }
                }

            }
            getActiveVenues(0);


        });

    },
    addAccountDefaultVenueFromAPICall: function(req, res, next) {
        var venueIDObj = {
            defaultVenue: req.param('venueID')
        }
        Account.findOne(req.param('accountID')).exec(function foundUser(err, accountFound) {
            if (err) return next(err);
            Account.update(req.param('accountID'), venueIDObj, function venueUpdated(err) {
                if (err) return next(err);
                console.log("-Updated-" + venueIDObj);
                res.send({ success: 'success' });
            });
        });
    },
    editVenueNameFromAPICall: function(req, res, next) {
        var obj = { 
                venueName: req.param('venueName'), 
                short : req.param('short'), 
                parkingZones : req.param('parkingZones'), 
                automaticTokenGeneration: req.param('automaticTokenGeneration'),  
                printToken: req.param('printToken'),
                amount : req.param('amount'),
                VAT : req.param('VAT'),
                defaultValues :req.param('defaultValues'),
                paymentMode :req.param('paymentMode'),
                twoLevelValidation :req.param('twoLevelValidation'),
                cashierValidateOption :req.param('cashierValidateOption'),
                VATType : req.param('VATType')
        }
        if(req.param('settings'))
            obj['settings'] = req.param('settings');
        if(req.param('logo'))
            obj['logo'] = req.param('logo');
        Venue.findOne(req.param('venueID')).exec(function foundUser(err, venueFound) {
            if (err) return next(err);
            Venue.update({ id: req.param('venueID') }, obj).exec(function updateVenueName(err, venueUpdated) {
                if (err) return next(err);
                console.log("-updated-");
                try {
                    sails.sockets.broadcast('myroom','refreshDB', {
                        message: 'socket event update!', 
                        id: venueUpdated[0].account,
                        verb : 'venueDB'
                    });
                } catch(e){

                }
                res.send({ success: venueUpdated });
            });
        });
    },
    findVenues: function(req, res, next) {
        Venue.find().populateAll().exec(function foundUsers(err, venues) {
            if (err) return next(err);
            if (!venues) {
                return res.send({ notValid: "notValid" });
            }
            console.log('all  called....');
            res.send({ success: venues });
        });
    },
    findAccount: function(req, res, next) {
        Account.find().populateAll().exec(function foundAccount(err, accounts) {
            if (err) return next(err);
            if (!accounts) {
                return res.send({ notValid: "notValid" });
            }
            res.send({ success: accounts });
        });
    },
    findSubscription: function(req, res, next) {
        Subscription.find().populateAll().exec(function foundSubscription(err, subscriptions) {
            if (err) return next(err);
            if (!subscriptions) {
                return res.send({ notValid: "notValid" });
            }
            res.send({ success: subscriptions });
        });
    },


    UploadVenueLogo: function(req, res, next) {
        var filenameOriginal;
        req.file('file').upload({
            saveAs: function(file, cb) {
                cb(null, file.filename);
                filenameOriginal = file.filename;
            },
            dirname: '../../assets/images'
        }, function whenDone(err, uploadedFiles) {
            console.log('uploded file ' + JSON.stringify(uploadedFiles));
            if (err) {
                console.log('error' + err);
            }
            res.send({ filenameOriginal : filenameOriginal});
        });
    },

};
