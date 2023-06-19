var express = require('express');
var app = express();
var path = require('path');
var nodemailer = require('nodemailer');
var fs = require("fs");
var dateFormat = require('dateformat');
var _ = require('lodash');
var moment = require('moment-timezone');
var timezone = "Asia/Kolkata";
var momentDateformat = 'DD/MM/YYYY HH:mm';

module.exports = {
    insertDailyData: function(accountID, venueID, done) {
        Account.findOne(accountID).exec(function foundUsers(err, account) {
            if(account && account.timeZone)
                timezone = account.timeZone;
            else 
                timezone = "Asia/Kolkata";

            function checkYearMonthVenueExists(){
                Yearmonthvenuetransactional.find().where({ "accountID": accountID, "venueID": venueID,  'year': moment.tz(timezone).format('YYYY'), 'month' : moment.tz(timezone).format('MM') }).exec(function found(err, masterData) { 
                    if(masterData.length > 0){
                        Yearmonthvenuetransactional.update(masterData[0].id, { total : (masterData[0].total + 1)
                        }, function updated(err, car) {
                            console.log("-Year Updated-");
                            done();
                        });
                    }else {
                        Yearmonthvenuetransactional.create({ "accountID": accountID, "venueID": venueID,'year': moment.tz(timezone).format('YYYY'), 'month' : moment.tz(timezone).format('MM'), total : 1 }).then(function(carObj) {
                            console.log("-Year Created-");
                            done();
                        });
                    }
                });
            }

            function venueWiseDataInsert(){
                Totalvenuetransactional.find().where({ "accountID": accountID,  "venueID": venueID,'date': moment.tz(timezone).format('YYYY-MM-DD')}).exec(function found(err, masterData) { 
                    if(masterData.length > 0){
                        Totalvenuetransactional.update(masterData[0].id, { total : (masterData[0].total + 1)
                        }, function updated(err, car) {
                            console.log("-Today Updated-");
                            checkYearMonthVenueExists();
                        });
                    }else {
                        Totalvenuetransactional.create({ accountID : accountID,  "venueID": venueID, date : moment.tz(timezone).format('YYYY-MM-DD'), total : 1}).then(function(carObj) {
                            console.log("-Today Created-");
                            checkYearMonthVenueExists();
                        });
                    }
                });
            }
                
            function checkYearMonthExists(){
                Yearmonthtransactional.find().where({ "accountID": accountID, 'year': moment.tz(timezone).format('YYYY'), 'month' : moment.tz(timezone).format('MM') }).exec(function found(err, masterData) { 
                    if(masterData.length > 0){
                        Yearmonthtransactional.update(masterData[0].id, { total : (masterData[0].total + 1)
                        }, function updated(err, car) {
                            console.log("-Year Updated-");
                            // done();
                            venueWiseDataInsert();
                        });
                    }else {
                        Yearmonthtransactional.create({ "accountID": accountID, 'year': moment.tz(timezone).format('YYYY'), 'month' : moment.tz(timezone).format('MM'), total : 1 }).then(function(carObj) {
                            console.log("-Year Created-");
                            // done();
                            venueWiseDataInsert();
                        });
                    }
                });
            }

            Totaltransactional.find().where({ "accountID": accountID, 'date': moment.tz(timezone).format('YYYY-MM-DD')}).exec(function found(err, masterData) { 
                if(masterData.length > 0){
                    Totaltransactional.update(masterData[0].id, { total : (masterData[0].total + 1)
                    }, function updated(err, car) {
                        console.log("-Today Updated-");
                        checkYearMonthExists();
                    });
                }else {
                    Totaltransactional.create({ accountID : accountID, date : moment.tz(timezone).format('YYYY-MM-DD'), total : 1}).then(function(carObj) {
                        console.log("-Today Created-");
                        checkYearMonthExists();
                    });
                }
            });
        });
    },
    insertDailyFeesData : function(accountID, venueID, fees, done) {
        Account.findOne(accountID).exec(function foundUsers(err, account) {
            if(account && account.timeZone)
                timezone = account.timeZone;
            else 
                timezone = "Asia/Kolkata";

            function checkYearMonthVenueExists(){
                Yearmonthvenuetransactional.find().where({ "accountID": accountID, "venueID": venueID,  'year': moment.tz(timezone).format('YYYY'), 'month' : moment.tz(timezone).format('MM') }).exec(function found(err, masterData) { 
                    if(masterData.length > 0){
                        Yearmonthvenuetransactional.update(masterData[0].id, { fees : (masterData[0].fees ? (masterData[0].fees + fees) : fees)
                        }, function updated(err, car) {
                            console.log("-Year Updated-");
                            done();
                        });
                    }else {
                        Yearmonthvenuetransactional.create({ "accountID": accountID, "venueID": venueID,'year': moment.tz(timezone).format('YYYY'), 'month' : moment.tz(timezone).format('MM'), fees : fees }).then(function(carObj) {
                            console.log("-Year Created-");
                            done();
                        });
                    }
                });
            }

            function venueWiseDataInsert(){
                Totalvenuetransactional.find().where({ "accountID": accountID,  "venueID": venueID,'date': moment.tz(timezone).format('YYYY-MM-DD')}).exec(function found(err, masterData) { 
                    if(masterData.length > 0){
                        Totalvenuetransactional.update(masterData[0].id, { fees : (masterData[0].fees ? (masterData[0].fees + fees) : fees)
                        }, function updated(err, car) {
                            console.log("-Today Updated-");
                            checkYearMonthVenueExists();
                        });
                    }else {
                        Totalvenuetransactional.create({ accountID : accountID,  "venueID": venueID, date : moment.tz(timezone).format('YYYY-MM-DD')
                        , fees : fees}).then(function(carObj) {
                            console.log("-Today Created-");
                            checkYearMonthVenueExists();
                        });
                    }
                });
            }
            function checkYearMonthExists(){
                Yearmonthtransactional.find().where({ "accountID": accountID, 'year': moment.tz(timezone).format('YYYY')
                , 'month' : moment.tz(timezone).format('MM') }).exec(function found(err, masterData) { 
                    if(masterData.length > 0){
                        Yearmonthtransactional.update(masterData[0].id, { fees : (masterData[0].fees ? (masterData[0].fees + fees) : fees)
                        }, function updated(err, car) {
                            console.log("-Year Updated-");
                            // done();
                            venueWiseDataInsert();
                        });
                    }else {
                        Yearmonthtransactional.create({ "accountID": accountID, 'year': moment.tz(timezone).format('YYYY'), 'month' : moment.tz(timezone).format('MM'), fees : fees }).then(function(carObj) {
                            console.log("-Year Created-");
                            // done();
                            venueWiseDataInsert();
                        });
                    }
                });
            }

            Totaltransactional.find().where({ "accountID": accountID, 'date': moment.tz(timezone).format('YYYY-MM-DD')}).exec(function found(err, masterData) { 
                if(masterData.length > 0){
                    Totaltransactional.update(masterData[0].id, { fees : (masterData[0].fees ? (masterData[0].fees + fees) : fees)
                    }, function updated(err, car) {
                        console.log("-Today Updated-");
                        checkYearMonthExists();
                    });
                }else {
                    Totaltransactional.create({ accountID : accountID, date : moment.tz(timezone).format('YYYY-MM-DD'), fees : fees}).then(function(carObj) {
                        console.log("-Today Created-");
                        checkYearMonthExists();
                    });
                }
            });
        });
    },
    gettingOldDataforAnalysis: function(done) {
        Mastertransactional.find().populate('account').exec(function found(err, _analysis) {
            if (err) {
                console.log(err);
            }
            if (_analysis) {
                getAllRecords(0);
                function getAllRecords(r){
                    if(r < _analysis.length){
                        // console.log("called .....");
                        if(_analysis[r].accountID && _analysis[r].accountID.id !== "58ec7fa9903f5b7d059c9573"){
                            if(_analysis[r].accountID && _analysis[r].accountID.timeZone)
                                timezone = _analysis[r].accountID.timeZone;
                            else 
                                timezone = "Asia/Kolkata";
                            function checkYearMonthExists(){
                                Yearmonthtransactional.find().where({ "accountID": _analysis[r].accountID.id, 'year': moment.tz(_analysis[r].createdAt, timezone).format('YYYY'), 'month' : moment.tz(_analysis[r].createdAt, timezone).format('MM') }).exec(function found(err, masterData) { 
                                    if(masterData.length > 0){
                                        Yearmonthtransactional.update(masterData[0].id, { total : (masterData[0].total + 1)
                                        }, function updated(err, car) {
                                            console.log("-Year Updated-");
                                            setTimeout(function(){
                                                r++;
                                                getAllRecords(r);
                                            }, 100);
                                        });
                                    }else {
                                        Yearmonthtransactional.create({ "accountID": _analysis[r].accountID.id, 'year': moment(_analysis[r].createdAt).format('YYYY'), 'month' : moment(_analysis[r].createdAt).format('MM'), total : 1 }).then(function(carObj) {
                                            console.log("-Year Created-");
                                            setTimeout(function(){
                                                r++;
                                                getAllRecords(r);
                                            }, 100);
                                        });
                                    }
                                });
                            }
                            Totaltransactional.find().where({ "accountID": _analysis[r].accountID.id, 'date':  moment.tz(_analysis[r].createdAt, timezone).format('YYYY-MM-DD')  }).exec(function found(err, masterData) { 
                                if(masterData.length > 0){
                                    Totaltransactional.update(masterData[0].id, { total : (masterData[0].total + 1)
                                    }, function updated(err, car) {
                                        console.log("-Today Updated-");
                                        checkYearMonthExists();
                                    });
                                }else {
                                    Totaltransactional.create({ accountID : _analysis[r].accountID.id, date : moment.tz(_analysis[r].createdAt, timezone).format('YYYY-MM-DD'),  total : 1
                                     }).then(function(carObj) {
                                        console.log("-Today Created-");
                                        checkYearMonthExists();
                                    });
                                }
                            });
                        }else {
                            setTimeout(function(){
                                r++;
                                getAllRecords(r);
                            }, 100);
                        }
                        
                    }else {
                        console.log("\n\n\n\n\n\n\n\n\n all done \n\n\n\n\n\n\n\n\n");
                        done();
                    }
                }
            }
        });
    },
    findAndReplaceTajUnknownAccoutVenue: function(done) {
        Mastertransactional.find().where({ "accountID": null, "venue": "58917ca29f053c6e06670453"}).exec(function found(err, _analysis) {
            if (err) {
                console.log(err);
            }
            if (_analysis) {
                getAllRecords(0);
                
                function getAllRecords(r){
                    if(r < _analysis.length){
                        Mastertransactional.update(_analysis[r].id, { accountID : "58917b6b9f053c6e06670451"
                        }, function updated(err, car) {
                            console.log("-Updated-");
                            setTimeout(function(){
                                r++;
                                getAllRecords(r);
                            }, 100);
                        });
                    } else {
                        console.log("\n\n\n\n\n\n\n\n\n all done \n\n\n\n\n\n\n\n\n")
                        done();
                    }
                }
            }
        });
    },
};