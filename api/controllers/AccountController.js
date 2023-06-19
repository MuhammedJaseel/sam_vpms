var _ = require("lodash");
var uuid = require('uuid');
var nodemailer = require("nodemailer");
module.exports = {
    accountCreation: function(req, res, next) {
        console.log("Account creation Called");
        // if (req.method === 'POST') {
        console.log("-----------------------------------------------------------------");
        console.log("Account creation Called");
        console.log("-----------------------------------------------------------------");
        var subscriptionDuration = 0;
        Subscription.findOne(req.param('subscriptionID')).exec(function foundUsers(err, data) {
            if (err) return next(err);
            subscriptionDuration = data.duration;
            console.log('days--' + subscriptionDuration);
            var newdate = new Date();
            var newdate_in_ms = newdate.getTime();
            var durationMS = (subscriptionDuration * 24 * 60 * 60 * 1000);
            var enddate_in_ms;
            var end_date;
            var uniqueID = uuid.v4();

            enddate_in_ms = newdate_in_ms + durationMS;
            end_date = new Date(enddate_in_ms);
            var extraFields = {
                uniqueID: uniqueID,
                subscriptionStatus: 'active',
                subscriptionStartDate: newdate,
                subscriptionEndDate: end_date,
                paymentID: req.param('paymentID'),
                paymentDescription: req.param('paymentDescription'),
                paymentType: req.param('paymentType'),
                amount: req.param('amount'),
                bank: req.param('bank')
            };


            var assign = _.assign({}, data, extraFields);
            var array = [];
            array.push(assign);

            var accountObj = {
                accountName: req.param('accountName'),
                subscriptionID: req.param('subscriptionID'),
                status: req.param('subscriptionStatus'),
                subscriptionLog: array,
                region : req.param('region'),
                timeZone : req.param('timeZone')
            }
            Account.create(accountObj).exec(function(error, accountObj) {
                if (error) { console.log(error); }
                console.log(accountObj);
                // Account.publishCreate({
                //     id: accountObj.id,
                //     accountName: accountObj.accountName,
                //     subscriptionID: accountObj.subscriptionID,
                //     status: accountObj.status,
                //     subscriptionLog: accountObj.subscriptionLog
                // });
                res.send(accountObj);
            });
        });
        // } else if (req.isSocket) {
        //     Account.watch(req.socket);
        //     console.log('Account subscribed to ' + req.socket.id);
        // } else {
        //     console.log("Account Creation within Else");
        // }
    },


    accountSubscriptionCreation: function(req, res, next) {
        // if (req.method === 'POST') {
        // console.log("-----------------------------------------------------------------");
        // console.log("Account Subscription creation Called");
        // console.log("-----------------------------------------------------------------");
        var subscriptionDuration = 0;
        console.log(req.param('subscriptionID'));
        console.log(req.param('id'));
        Subscription.findOne(req.param('subscriptionID')).exec(function foundUsers(err, data) {
            if (!data) return next('data doesn\'t exist.');
            subscriptionDuration = data.duration;
            console.log('days--' + subscriptionDuration);
            var subscriptionLogArray = [];
            var newdate = new Date();
            var newdate_in_ms = newdate.getTime();
            var durationMS = (subscriptionDuration * 24 * 60 * 60 * 1000);
            var enddate_in_ms;
            var end_date;
            enddate_in_ms = newdate_in_ms + durationMS;
            end_date = new Date(enddate_in_ms);
            var uniqueID = uuid.v4();

            var extraFields = {
                uniqueID: uniqueID,
                subscriptionStatus: 'active',
                subscriptionStartDate: newdate,
                subscriptionEndDate: end_date,
                paymentID: req.param('paymentID'),
                paymentDescription: req.param('paymentDescription'),
                paymentType: req.param('paymentType'),
                amount: req.param('amount'),
                bank: req.param('bank')
            };
            
            var assign = _.assign({}, data, extraFields);
            Account.findOne(req.param('id')).exec(function foundUser(err, subscription) {
                if (err) return next(err);
                if (!subscription) return next('subscription doesn\'t exist.');
                if (subscription.subscriptionLog !== undefined) {
                    for (var i = 0; i < subscription.subscriptionLog.length; i++) {
                        subscriptionLogArray.push(subscription.subscriptionLog[i]);
                    }
                }
                subscriptionLogArray.push(assign);
                var accountObj = {
                    subscriptionLog: subscriptionLogArray
                };
                Account.update(subscription.id, accountObj, function Updated(err, acc) {
                    res.send(acc);
                });
            });
        });
    },

    runEveryDay: function(req, res) {
        var newdate = new Date();
        var newdatems = newdate.getTime();
        var end;
        var endsdate;

        Account.find().populateAll().exec(function foundUsersexp(err, account) {
            if (err) return next(err);
            var lengthOfAccount = account.length;
            console.log('Account Expiry Checking....');
            for (var k = 0; k < lengthOfAccount; k++) {
                end = new Date(account[k].subscriptionEndDate);
                endsdate = end.getTime();
                if (account[k].subscriptionStatus === "active" || account[k].status === "active") {
                    if (newdatems >= endsdate) {
                        var accountObjs = {
                            status: 'expired'
                        };
                        Account.update(account[k].id, accountObjs, function accountUpdated(err) {});
                    }
                }
            }

        });

    },
    editAccount: function(req, res, next) {
        var accountObj = {
            accountName: req.param('accountName'),
            subscriptionID: req.param('subscriptionID'),
            paymentID: req.param('paymentID'),
            subscriptionStatus: req.param('subscriptionStatus'),
            subscriptionStartDate: req.param('subscriptionStartDate'),
            subscriptionEndDate: req.param('subscriptionEndDate')
        };
        // console.log("call from android.... account editing.");
        Account.findOne(req.param('id')).exec(function foundUser(err, subscription) {
            if (err) return next(err);
            if (!subscription) return next('subscription doesn\'t exist.');
            Account.update(subscription.id, accountObj, function Updated(err) {
                console.log('Updated');
                res.send({ success: 'success' });
            });

        });
    },
    deleteAccount: function(req, res, next) {
        // if (req.method === 'POST') {
        console.log("call from android.... account delete.");
        Account.findOne(req.param('id')).exec(function foundUser(err, accountObj) {
            if (err) return next(err);
            if (!accountObj) return next('Account doesn\'t exist.');

            Account.destroy(accountObj.id, function Destroyed(err, destroyObj) {
                if (err) return next(err);
                console.log('deleted...');
                res.send(destroyObj);
                // Account.publishDestroy(destroyObj[0].id);
            });
        });
        // } else if (req.isSocket) {
        //     Account.find({}).exec(function(e, list) {
        //         Account.subscribe(req.socket, list);
        //         console.log(req.socket.id);
        //     });
        // }

    },
    allowBarCodeAccesstoThisAccount: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                barCodeAccess: req.param('barCodeAccess'),
            };
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            // Account.find({}).exec(function(e, listOfDaily) {
            //     Account.subscribe(req.socket, listOfDaily);
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    allowCameraAccesstoThisAccount: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                cameraAccess: req.param('cameraAccess'),
                readPlateNumber: req.param('readPlateNumber')
            }
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            // Account.find({}).exec(function(e, listOfDaily) {
            //     Account.subscribe(req.socket, listOfDaily);
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    allowCEDAccesstoThisAccount: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                CEDAccess: req.param('CEDAccess'),
            };
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            // Account.find({}).exec(function(e, listOfDaily) {
            //     Account.subscribe(req.socket, listOfDaily);
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    allowMarkImageAccesstoThisAccount: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                markImage: req.param('markImage'),
            }
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            // Account.find({}).exec(function(e, listOfDaily) {
            //     Account.subscribe(req.socket, listOfDaily);
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    allowFingerPrintAccesstoThisAccount: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                fingerPrint: req.param('fingerPrint'),
            }
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            // Account.find({}).exec(function(e, listOfDaily) {
            //     Account.subscribe(req.socket, listOfDaily);
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    allowPushNotificationAccesstoThisAccount: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                pushNotification: req.param('pushNotification'),
            }
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            // Account.find({}).exec(function(e, listOfDaily) {
            //     Account.subscribe(req.socket, listOfDaily);
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    allowReadPlateNumberThisAccount: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                readPlateNumber: req.param('readPlateNumber'),
            }
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            // Account.find({}).exec(function(e, listOfDaily) {
            //     Account.subscribe(req.socket, listOfDaily);
            // });
            sails.sockets.join(req.socket,'myroom');
        }
    },
    allowvibrateAccesstoThisAccount: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                vibrate: req.param('vibrate'),
            }
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    // account[0].editAccountSettings = true;
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            // Account.find({}).exec(function(e, listOfDaily) {
            //     Account.subscribe(req.socket, listOfDaily);
            // });
            sails.sockets.join(req.socket,'myroom');
            // console.log(sails.sockets.rooms())
            // console.log(sails.sockets.subscribers())
            // console.log(JSON.stringify(sails.sockets.rooms()))
            // console.log(JSON.stringify(sails.sockets.socketRooms(req.socket)))
            // for (r in sails.sockets.rooms()) {
            //     console.log(sails.rooms[r]);
               
            //   }
            // sails.sockets.join(req, 'myroom');
            // sails.sockets.broadcast("myroom", "account", {someData: "can also be just string instead of obj, i prefer objects..."});

        }
    },
    sendReview: function(req, res, next) {

        var sendReview = {
            rate: req.param('rate')
        };
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
            subject: req.param('accountName') + ' has rated ' + req.param('rate') + " Evaletz App",
            text: "\n Email: " + req.param('email') + "\n Hotel name: " + req.param('accountName')
        };

        transporter.sendMail(mailOptions, function(err, response) {
            if (err) {
                console.log('email failed..........' + JSON.stringify(err));
                res.send(err);
            }
            Account.findOne(req.param('accountId')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('accountId'), sendReview, function Updated(err) {
                    if (err) return next(err);
                    res.send({ success: 'success' });
                });
            });
        });
    },
    EvaletzCardExistsInDaily: function(req, res, next) {
        // console.log(req.param('parkingID'))
        Dailytransactional.find().where({ parkingID: req.param('parkingID') }).exec(function foundUsers(err, instance) {
            // console.log(JSON.stringify(instance));
            if (err) {
                console.log('err');
                return res.send({
                    notValid: "error"
                });
            }
            var data;
            if (instance.length === 0){
                data = false;}
            else
                data = true;
            res.send(data);
        });
    },
    scannedQRcodeGuestCarisAlreadyParked: function(req, res, next) {
        Dailytransactional.find().where({ carID: req.param('carID') }).exec(function foundUsers(err, instance) {
            if (err) {
                console.log('err');
                return res.send({
                    notValid: "error"
                });
            }
            var data;
            if (instance.length === 0){
                data = false;}
            else
                data = true;
            res.send(data);
        });
    },
    plateNumberExistsInDaily: function(req, res, next) {
        // console.log(req.param('parkingID'))
        Dailytransactional.find().where({ plateNumber: req.param('plateNumber') }).exec(function foundUsers(err, instance) {
            // console.log(JSON.stringify(instance));
            if (err) {
                console.log('err');
                return res.send({
                    notValid: "error"
                });
            }
            var data;
            if (instance.length === 0)
                data = false;
            else
                data = true;
            res.send(data);
        });
    },
    updateAccountUserTypes: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                customerTypes: req.param('customerTypes'),
            };
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            Account.find({}).exec(function(e, listOfDaily) {
                Account.subscribe(req.socket, listOfDaily);
                // console.log('socket id ' + req.socket.id + ' is now subscribed to accepted car');
            });
        }
    },
    updateAccountUserTypesForTVC: function(req, res, next) {
        if (req.method === 'POST') {
            var accountObj = {
                otherInfo: req.param('otherInfo'),
            };
            Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
                if (err) return next(err);
                Account.update(req.param('id'), accountObj, function Updated(err, account) {
                    if (err) return next(err);
                    delete account[0].excelFormatSettings;
                    delete account[0].subscriptionLog;
                    Account.publishUpdate(req.param('id'), account[0]);
                    res.send();
                });
            });
        } else if (req.isSocket) {
            Account.find({}).exec(function(e, listOfDaily) {
                Account.subscribe(req.socket, listOfDaily);
                // console.log('socket id ' + req.socket.id + ' is now subscribed to accepted car');
            });
        }
    },
    sendReviewByGuest: function(req, res, next) {
        var sendReview = {
            rate: req.param('rate')
        };
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
            subject: req.param('email') + ' has rated ' + req.param('rate') + " Evaletz Guest App",
            text: "\n Email: " + req.param('email')
        };

        transporter.sendMail(mailOptions, function(err, response) {
            if (err) {
                console.log('email failed..........' + JSON.stringify(err));
                res.send(err);
            }
            User.findOne(req.param('id')).exec(function foundUser(err, userFound) {
                if (err) return next(err);
                User.update(req.param('id'), sendReview, function Updated(err) {
                    if (err) return next(err);
                    res.send({ success: 'success' });
                });
            })
        });
    },
    gettingAccountExcelSettings: function(req, res, next) {
        Account.findOne(req.param('id')).exec(function foundUser(err, accountObj) {
            if (err) return next(err);
            if (!accountObj) return next('Account doesn\'t exist.');
            res.send({ settings : accountObj.excelFormatSettings});
        });
    },
    updateExcelAccountSettings: function(req, res, next) {
        Account.findOne(req.param('id')).exec(function foundUser(err, accountfound) {
            if (err) return next(err);
            Account.update(req.param('id'), { 'excelFormatSettings' : req.param('excelFormatSettings')},function Updated(err, account) {
                if (err) return next(err);
                res.send({ success : 'success'});
            });
        });
    },
    getAccountSubscriptionLogs: function(req, res, next) {
        Account.find({ "id": req.param('accountID') }, {
            fields: {
                subscriptionLog : 1
            }}).sort().exec(function found(err, accountData) {
            if (err) return res.send([]);
            if(accountData.length > 0){
                return res.send(accountData[0].subscriptionLog);
            }else 
                return res.send([]);
        });
    },
    getRawAccountNameandID: function(req, res, next) {
        Account.find({}, {
            fields : {
                accountName : 1,
                id : 1,
                venues: 1,
                timeZone: 1
            }
        }).populate('venues', { select : ['venueName', 'id']}).exec(function foundUser(err, accountsfound) {
            if (err) return next(err);
            return res.send(accountsfound);
        });
    },
};

