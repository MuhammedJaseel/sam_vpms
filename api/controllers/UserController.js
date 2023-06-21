var mailController = require('./MailController');
module.exports = {
    userCreationFromAPICall: function(req, res, next) {

        var userObj = {
            userName: req.param('userName'),
            email: req.param('email'),
            mobile: req.param('mobile'),
            password: req.param('password'),
            companyName: req.param('companyName')

        }

        User.create(userObj).exec(function(error, userObj) {
            // User.publishCreate({
            //     id: userObj.id,
            //     userName: userObj.userName,
            //     password: userObj.password,
            //     email: userObj.email,
            //     mobile: userObj.mobile,
            //     companyName: userObj.companyName,
            //     accountID: userObj.accountID
            // });

            if (error) {
                return next(error);
            }
            res.send(userObj);
        });

    },
    registerGuest: function(req, res, next) {
        var userObj = {
            fullName: req.param('fullName'),
            userName: req.param('userName'),
            email: req.param('email'),
            mobile: req.param('mobile'),
            password: req.param('password'),
            companyName: req.param('companyName'),
            role: 'guest'
        }
        User.find().where({ or : [{ 'email' : req.param('email')},{'userName' : req.param('userName') }]}).exec(function found(err, avaliableCount) {
            if (err) return next(err);
            if (avaliableCount.length == 0) {
                User.create(userObj).exec(function(error, userObj) {
                    if (error) {
                        return next(error);
                    }
                    res.send(userObj);
                });
            } else {
                res.send({ error : "user found..."});
            }
        });
    },
    createUserWithCustomizeData: function(req, res, next) {
        if(req.param('userObject') && req.param('userObject').userName){
            User.create(req.param('userObject')).exec(function(error, userObj) {
                if (error) {
                    return res.send({ "error" : error });
                }
                res.send({ "success" : userObj });
            });
        }
    },
    accountAdminCreationFromAPICall: function(req, res, next) {

        // if (req.param('role') != 'driver') {
            var userObj = {
                fullName: req.param('fullName'),
                userName: req.param('userName'),
                email: req.param('email'),
                mobile: req.param('mobile'),
                password: req.param('password'),
                accountID: req.param('id'),
                companyName: req.param('companyName'),
                role: req.param('role'),
                licenseNumber: req.param('licenseNumber'),
                joiningDate : req.param('joiningDate'),
                documents: req.param('documents')

            };
        if(req.param('revalidate'))
            userObj['revalidate'] = req.param('revalidate')
        // } else {
        //     var userObj = {
        //         fullName: req.param('fullName'),
        //         userName: req.param('userName'),
        //         mobile: req.param('mobile'),
        //         accountID: req.param('id'),
        //         companyName: req.param('companyName'),
        //         licenseNumber: req.param('licenseNumber'),
        //         role: req.param('role')

        //     };
        // }
        // if (req.method === 'POST') {
        console.log("-------------------------------------------------------------");
        console.log("User Creation Called");
        console.log("-------------------------------------------------------------");
        User.create(userObj).exec(function(error, userObj) {
            if (error) {
                res.send(error);
            }
            console.log(userObj);
            // res.send(userObj);
            // User.publishCreate({
            //     id: userObj.id,
            //     userName: userObj.userName,
            //     password: userObj.password,
            //     email: userObj.email,
            //     mobile: userObj.mobile,
            //     companyName: userObj.companyName,
            //     accountID: userObj.accountID,
            //     role: userObj.role
            // });
            if (req.param('wanttoSendEmail') == true) {
                mailController.mailtosendfunc(req.param('email'), "Your password is " + req.param('password'));
            }
            console.log("Registered successfully....");
            res.send(userObj);
        });
        // } else if (req.isSocket) {
        //     User.watch(req.socket);
        //     console.log('User subscribed to ' + req.socket.id);
        // }
    },
    getOneUser: function(req, res, next) {
        User.findOne(req.param('id'), function foundUser(err, user) {
            if (err) return next(err);
            if (!user) return next();
            res.send({ oneUserDetails: user });
        });
    },
    getUserDetails: function(req, res, next) {
        User.findOne(req.param('id'), function foundUser(err, user) {
            if (err) return next(err);
            if (!user) return next();
            res.send(user);
        });
    },
    findAllUser: function(req, res, next) {
        var manager = [];
        var chauffeur = [];
        var accountadmin = [];
        var driver = [];
        User.findOne(req.param('userID')).populate('accountID').exec(function foundUsers(err, user) {
            if (err) return next(err);
            try{
                //console.log("----------"+JSON.stringify(user));
                User.find({ where : { accountID  : user.accountID.id }}).populate('venues', { select : ['venueName', 'id'] }).populate('accountID', { select : ['id'] }).exec(function foundUsers(err, users) {
                    if (user && user.role == "accountadmin") {
                        if (err) return next(err);
                        for (var i = 0; i < users.length; i++) {

                            if (users[i] != undefined) {
                                if (users[i].accountID != undefined) {
                                    users[i].daily = [];
                                    users[i].master = [];
                                    if (user.accountID.id == users[i].accountID.id) {

                                        if (users[i].role == 'manager') {
                                            manager.push(users[i]);
                                        }
                                        if (users[i].role == 'chauffeur') {
                                            chauffeur.push(users[i]);
                                        }
                                        if (users[i].role == 'driver') {
                                            driver.push(users[i]);
                                        }
                                    }
                                }
                            }
                        }
                        console.log('accountadminlogged logged in');
                        return res.send({ managers: manager, chauffeurs: chauffeur });
                    } // 
                    else if (user && user.role == "manager") {
                        if (err) return next(err);
                        for (var i = 0; i < users.length; i++) {
                            if (users[i] != undefined) {
                                if (users[i].accountID != undefined) {
                                    users[i].daily = [];
                                    users[i].master = [];
                                    if (user.accountID.id == users[i].accountID.id) {
                                        if (users[i].role == 'chauffeur') {
                                            chauffeur.push(users[i]);
                                        }
                                        if (users[i].role == 'driver') {
                                            driver.push(users[i]);
                                        }

                                    }
                                }
                            }
                        }
                        console.log('manager logged in');
                        return res.send({ chauffeurs: chauffeur, drivers: driver });
                    } // 
                    else if (user && user.role == "admin") {
                        if (err) return next(err);
                        for (var i = 0; i < users.length; i++) {
                            users[i].daily = [];
                            users[i].master = [];
                            if (users[i].role == 'manager') {
                                manager.push(users[i]);
                            }
                            if (users[i].role == 'chauffeur') {
                                chauffeur.push(users[i]);
                            }
                            if (users[i].role == 'accountadmin') {
                                accountadmin.push(users[i]);
                            }
                            if (users[i].role == 'driver') {
                                driver.push(users[i]);
                            }

                        }
                        console.log('AccountAdmin logged in');
                        return res.send({ managers: manager, chauffeurs: chauffeur, accountadmin: accountadmin, drivers: driver });
                    } //
                    else 
                        return res.send();
                });
            } catch(e){
                return res.send([]);
            }
        });
    },
    findAllUserforOscar: function(req, res, next) {
        var manager = [];
        var chauffeur = [];
        var accountadmin = [];
        var driver = [];
        User.findOne(req.param('userID')).populate('accountID').exec(function foundUsers(err, user) {
            if (err) return next(err);
            try{
                //console.log("----------"+JSON.stringify(user));
                User.find({ where : { accountID  : user.accountID.id }}).populate('venues', { select : ['venueName', 'id'] }).populate('accountID', { select : ['id'] }).exec(function foundUsers(err, users) {
                    if (user && user.role == "accountadmin") {
                        if (err) return next(err);
                        for (var i = 0; i < users.length; i++) {

                            if (users[i] != undefined) {
                                if (users[i].accountID != undefined) {
                                    users[i].daily = [];
                                    users[i].master = [];
                                    if (user.accountID.id == users[i].accountID.id) {

                                        if (users[i].role == 'manager') {
                                            manager.push(users[i]);
                                        }
                                        if (users[i].role == 'chauffeur') {
                                            chauffeur.push(users[i]);
                                        }
                                        if (users[i].role == 'driver') {
                                            driver.push(users[i]);
                                        }
                                    }
                                }
                            }
                        }
                        console.log('accountadminlogged logged in');
                        return res.send({ managers: manager, chauffeurs: chauffeur });
                    } // 
                    else if (user && user.role == "manager") {
                        if (err) return next(err);
                        for (var i = 0; i < users.length; i++) {
                            if (users[i] != undefined) {
                                if (users[i].accountID != undefined) {
                                    users[i].daily = [];
                                    users[i].master = [];
                                    if (user.accountID.id == users[i].accountID.id) {
                                        if (users[i].role == 'chauffeur') {
                                            chauffeur.push(users[i]);
                                        }
                                        if (users[i].role == 'driver') {
                                            driver.push(users[i]);
                                        }

                                    }
                                }
                            }
                        }
                        console.log('manager logged in');
                        return res.send({ chauffeurs: chauffeur, drivers: driver });
                    } // 
                    else if (user && user.role == "admin") {
                        if (err) return next(err);
                        for (var i = 0; i < users.length; i++) {
                            users[i].daily = [];
                            users[i].master = [];
                            if (users[i].role == 'manager') {
                                manager.push(users[i]);
                            }
                            if (users[i].role == 'chauffeur') {
                                chauffeur.push(users[i]);
                            }
                            if (users[i].role == 'accountadmin') {
                                accountadmin.push(users[i]);
                            }
                            if (users[i].role == 'driver') {
                                driver.push(users[i]);
                            }

                        }
                        console.log('AccountAdmin logged in');
                        return res.send({ managers: manager, chauffeurs: chauffeur, accountadmin: accountadmin, drivers: driver });
                    } //
                    else 
                        return res.send();
                });
            } catch(e){
                return res.send([]);
            }
        });
    },
    editUserByID: function(req, res, next) {
        var userObj = {
            fullName: req.param('fullName'),
            userName: req.param('userName'),
            email: req.param('email'),
            mobile: req.param('mobile'),
            companyName: req.param('companyName'),
            licenseNumber: req.param('licenseNumber'),
            joiningDate : req.param('joiningDate'),
            sendReport : req.param('sendReport'),
            extraOptions : req.param('extraOptions'),
        }
        if(req.param('revalidate') != undefined)
            userObj['revalidate'] = req.param('revalidate')
    
        User.findOne(req.param('id')).exec(function foundUser(err, userFound) {
            if (err) return next(err);
            User.update(req.param('id'), userObj, function userUpdated(err) {
                if (err) return next(err);
                console.log('User Profile Updated...');
                return res.send({ success: 'success' });
            });
        });
    },
    destroyUserByID: function(req, res, next) {
        User.findOne(req.param('id'), function foundUser(err, user) {
            if (err) return next(err);
            if (!user) return next('User doesn\'t exist.');
            User.destroy(req.param('id'), function userDestroyed(err, destroyObj) {
                if (err) return next(err);
                console.log('User Deleted...');
                return res.send(destroyObj);
            });
        });
    },
    userCreationAutomatically: function(req, res, next) {
        User.find(req.param('email'), function foundUsers(err, noofuser) {
            if (err) return next(err);  
            if (noofuser.length == 0) {
                var userObj = {
                    fullName: "SUPER ADMIN",
                    userName: 'superadmin',
                    email: process.env.SUPERADMIN_EMAIL,
                    mobile: '',
                    password: process.env.SUPERADMIN_PASSWORD,
                    companyName: 'Oscar Services L.L.C.',
                    role: 'admin'
                }
                User.create(userObj, function userCreated(err, user) {
                    if (err) {
                        console.log(err);
                    }
                    console.log("Initial user created successfully...");
                });
            }
        })
    },
    forgotPasswordRequest: function(req, res, next) {
        User.findOneByEmail(req.param('email')).populateAll().exec(function foundUser(err, user) {
            if (err) return next(err);
            if (!user) {
                res.send({ notValid: 'notValid' });
                return;
            }
            if (req.param('mobile') != user.mobile) {
                res.send({ notMatchingMobile: 'notMatchingMobile' });
                return;
            }
            res.send({ user: user });
        });
    },
    changePassword: function(req, res, next) {
        User.findOneByEmail(req.param('email')).populateAll().exec(function foundUser(err, user) {
            if (err) return next(err);
            if (!user) {
                res.send({ notValid: 'notValid' });
                return;
            }
            var passwordObj = {
                password: req.param('newPassword')
            };

            User.update(user.id, passwordObj, function userUpdated(err) {
                if (err) {
                    res.send({ result: false });
                    console.log("error while updating password....");
                }
                console.log('password changed successfully...');
                res.send({ result: true });
            });
        });
    },
    UploadProFile: function(req, res, next) {
        // console.log('params----' + JSON.stringify(req.param('params')));
        // console.log('file----' + JSON.stringify(req.param('file')));
        // console.log('3333----' + JSON.stringify(req.param('id')));
        // console.log('filename----' + JSON.stringify(req.param('filename')));
        var userID = req.param('id');
        if (userID === undefined || userID === null) {
            res.send({ Error: "Not valid User" });
        } 
        if (userID != undefined) {
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
                User.findOne(req.param('id'), function foundUser(err, user) {
                    if (err) return next(err);
                    if (!user) {
                        res.send({ notValid: 'notValid' });
                        return;
                    }
                    var imgObject = {
                        profileImage: filenameOriginal
                    };
                    User.update(user.id, imgObject, function userUpdated(err) {
                        if (err) {
                            res.send({ result: false });
                            console.log("error while updating Profile Image....");
                        }
                        console.log('Profile Image changed successfully...');
                        res.send({ result: true });
                    });
                });
            });
        }
    },
    tempCarUpdateFunction: function(req, res, next) {
        // Dailytransactional.find().where({ "venue" : "5a26944f3461b2571abe8da7" }).exec(function foundUser(err, data) {
        //     if (err) return next(err);
        //     if (!data) {
        //         res.send({ notValid: 'notValid' });
        //         return;
        //     }
        //     runEveryData(0);

        //     function runEveryData(d){
        //         if(d < data.length){
        //             Dailytransactional.update(data[d].id, { free : true }, function userUpdated(err) {
        //                 d++;
        //                 runEveryData(d);
        //             });
        //         } else {
                    res.send({ ok: 'already okkkkkkkkk' });
        //         }
        //     }
        // });
    },
    getRoomsList: function(req, res) {
        try{
            var room =_.filter(sails.sockets.rooms(), (sock)=>{ return sock != 'myroom'});
            res.json({
                // roomList : room,
                count : room.length
            });
        }catch(e){
            res.json({
                // roomList : [],
                count : 0
            });
        }
    }
};
