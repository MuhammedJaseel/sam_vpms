// var express = require('express');
var nodeExcel = require('excel-export');
// var app = express();
var path = require('path');
var nodemailer = require('nodemailer');
var fs = require("fs");
var dateFormat = require('dateformat');
var xl = require('excel4node');
var moment = require('moment-timezone');
var timezone = "Asia/Kolkata";
var momentDateformat = 'DD/MM/YYYY HH:mm';
var _ = require("lodash");
var exportService = require('../api/services/exportService.js');

const ENV = require('./env/development.js');

// sails = require('sails');
// setTimeout(function(){
//    console.log(sails.getBaseUrl().substring(sails.getBaseUrl().length - 4, sails.getBaseUrl().length))
//    console.log(sails.getBaseUrl())
// }, 10000);

module.exports.cron = {
  sendExpiryAlertforUsers: {
    schedule: '00 59 23 * * *', //'00 00 22 * * *', //'*/20 * * * * *', // 00 00 22 * * *
    onTick: function () {
      console.log("Daily Cron Running...");
      Account.find().populate('users').exec(function foundUsers(err, accountsData) {
        if (err) {
          console.log(err);
        }
        if (accountsData) {
          console.log('account Details====' + JSON.stringify(accountsData.length));
          accountFun(0);

          function accountFun(i) {
            if (i < accountsData.length) {
              console.log('account name ====' + JSON.stringify(accountsData[i].accountName));
              if (accountsData[i].status == 'active') {
                if (accountsData[i].subscriptionLog.length > 0) {
                  console.log('subscription Checking');
                  accountsData[i].subscriptionLog[accountsData[i].subscriptionLog.length - 1].subscriptionEndDate;
                  if ((new Date((accountsData[i].subscriptionLog[accountsData[i].subscriptionLog.length - 1].subscriptionEndDate.getFullYear()) + '/' + (accountsData[i].subscriptionLog[accountsData[i].subscriptionLog.length - 1].subscriptionEndDate.getMonth() + 1) + '/' + (accountsData[i].subscriptionLog[accountsData[i].subscriptionLog.length - 1].subscriptionEndDate.getDate())).getTime()) == (new Date((new Date().getFullYear()) + '/' + (new Date().getMonth() + 1) + '/' + (new Date().getDate())).getTime())) {
                    console.log('subscription expired found...');
                    usersFun(0);

                    function usersFun(j) {
                      if (j < accountsData[i].users.length) {
                        console.log('Finding users for email sending to account admin ...');
                        if (accountsData[i].users[j].role == 'accountadmin') {
                          console.log('Found account admin ...' + accountsData[i].users[j].email);
                          accountsData[i].status = 'expired';
                          accountsData[i].subscriptionLog[accountsData[i].subscriptionLog.length - 1].subscriptionStatus = 'expired';

                          Account.update(accountsData[i].id, {
                            'subscriptionLog': accountsData[i].subscriptionLog
                          }, function updated(err, accountLog) {
                            console.log("-Updated log- expired");

                            var transporter = nodemailer.createTransport("SMTP", {
                              host: process.env.NODEMAILER_HOST,
                              port: process.env.NODEMAILER_PORT,
                              auth: {
                                user: process.env.NODEMAILER_USER,
                                pass: process.env.NODEMAILER_PASS
                              },
                            });

                            var mailContentForExpiry = '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="https://evaletz.com:2018/images/temp-home.JPG"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;">Dear Mr. ' + (accountsData[i].users[j].fullName.replace(/([a-z])([A-Z])/g, "$1 $2").substring(0, 1).toUpperCase() + accountsData[i].users[j].fullName.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(1)) + '</p><p style="margin: 1em 0px;margin-top: 10px;">Greetings!</p><p style="margin: 1em 0px;"> Your subscription has been expired today. Kindly contact <a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a>.</p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a></span>&nbsp;and we will be more than happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>EValetz Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/EValetzMobileApp/" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://plus.google.com/u/0/116399189801627499126?hl=en" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://twitter.com/EvaletzApp" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://evaletz.com/" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>';

                            var mailOptions = {
                              from: process.env.INFO_EMAIL,
                              to: accountsData[i].users[j].email,
                              bcc: process.env.BCC_EMAIL,
                              subject: 'EValetz - Expiry alert',
                              html: mailContentForExpiry,
                            }

                            transporter.sendMail(mailOptions, function (err2, response) {
                              if (err) {
                                console.log('email failed..........' + JSON.stringify(err2));
                                console.log("next account");
                                i++;
                                accountFun(i);
                              }
                              if (response) {
                                console.log('mail send success');
                                console.log("next account");
                                i++;
                                accountFun(i);
                              }
                            });
                          });
                        } else {
                          j++;
                          usersFun(j);
                        }
                      } else {
                        i++;
                        accountFun(i);
                      }
                    } // user find function ends here...
                  } else {
                    i++;
                    accountFun(i);
                  }
                }
              } else {
                i++;
                accountFun(i);
              }
            } else {
              // accountFun end here
              console.log('All account has been checked successfully....')
            }
          }
        }
      });
    },
    start: true, // Start task immediately
    timezone: 'Asia/Kolkata', // Custom timezone
    context: undefined // Custom context for onTick callback
  },
  dailyReportGeneratorforDiffTimeZone: {
    schedule: '00 */30 * * * *',
    onTick: function () {
      console.log("30 mins Cron Running...");
      var format = 'YYYY-MM-DD HH:mm';

      var transporter = nodemailer.createTransport("SMTP", {
        host: process.env.NODEMAILER_HOST,
        port: process.env.NODEMAILER_PORT,
        auth: {
          user: process.env.NODEMAILER_USER,
          pass: process.env.NODEMAILER_PASS
        },
      });

      var mailOptions = {
        from: process.env.CRON_EMAIL,
        to: process.env.SUPERADMIN_EMAIL,
        subject: "New instance checking cron running",
      }
      if(ENV.port == 2018){
        /*transporter.sendMail(mailOptions, function (err, response) {
          if (err) {
            console.log('email failed..........' + JSON.stringify(err));
          }
          if (response) {
            console.log('email success..........' + JSON.stringify(response));
          }
        });*/
      }      

      accountAdminCron();

      function accountAdminCron(){
        var mailContentForReport = '';
        var Email, fullname = '';
        var d = new Date();
        var n = new Date();
        d.setHours(23);
        d.setMinutes(59);
        d.setSeconds(00);
        n.setHours(23);
        n.setMinutes(59);
        n.setSeconds(00);

        Account.find().populate('users').exec(function foundUsers(err, accountsData) {
          if (err) {
            console.log(err);
          }
          if (accountsData) {
            // console.log(accountsData.length);
            accountFun(0);

            function accountFun(i) {
              if (i < accountsData.length) {

                if (accountsData[i] && accountsData[i].timeZone)
                  timezone = accountsData[i].timeZone;
                else
                  timezone = "Asia/Kolkata";

                if(accountsData[i].id == '5b45bb80a23561f14ad08a2f'){ // Secure parking only
                  var time = moment(moment.utc().tz(timezone).format(format), format),
                  beforeTime = moment(moment.utc().tz(timezone).format("YYYY-MM-DD") + ' 01:59', format),
                  afterTime = moment(moment.utc().tz(timezone).format("YYYY-MM-DD") + ' 02:30', format);
                } else if(accountsData[i].id != '5b45bb80a23561f14ad08a2f'){
                  var time = moment(moment.utc().tz(timezone).format(format), format),
                  beforeTime = moment(moment.utc().tz(timezone).subtract(1, 'days').format("YYYY-MM-DD") + ' 23:59', format),
                  afterTime = moment(moment.utc().tz(timezone).format("YYYY-MM-DD") + ' 00:30', format);
                }

                

                if (time.isBetween(beforeTime, afterTime)) {
                  var query = {};
                  if(accountsData[i].id == '5b45bb80a23561f14ad08a2f'){ // Secure parking only
                    query = {
                      "accountID": accountsData[i].id, 
                      "or" : [
                        {
                          'createdAt': {
                            '>=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 02:00"), timezone)).format(),
                            '<=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 01:59:00"), timezone)).format()
                          }
                        },
                        {
                          'updatedAt': {
                            '>=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 02:00"), timezone)).format(),
                            '<=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 01:59:00"), timezone)).format()
                          }
                        }
                      ]
                    };
                  }
                  else if(accountsData[i].id != '5b45bb80a23561f14ad08a2f'){
                    query = {
                      "accountID": accountsData[i].id, 
                      "or" : [
                        {
                          'createdAt': {
                            '>=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 00:00"), timezone)).format(),
                            '<=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59:00"), timezone)).format()
                          }
                        },
                        {
                          'updatedAt': {
                            '>=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 00:00"), timezone)).format(),
                            '<=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59:00"), timezone)).format()
                          }
                        }
                      ]
                      // 'createdAt': {
                      //   '>': moment(moment.utc().tz(timezone).subtract(1, 'days')).format('YYYY-MM-DD') // because cron run 00:00 / gettigng one day before
                      // }
                    };
                  }
                  
                  Mastertransactional.count(query).sort('createdAt ASC').exec(function found(err, countData) {
                    if(err){
                      i++;
                      accountFun(i); // Not zone timezone reached 12'o clock
                    }
                    if(countData > 0){
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
                                  exportService.convertDataforExcellFormatforDynamicLargeData(masterData, '', '',  (accountsData[i].excelFormatSettings || []), h, limit,function(masterData) {
                                      exportService.exportXLSforDynamicLargeData(masterData, '', '', '', (accountsData[i].excelFormatSettings || []), excellData, h, limit, largeText, function(data) {
                                          excellData = data;
                                          h++;
                                          runExcellFunctionforNumberofHydration(h);
                                      });
                                  });
                                  //////////////////////////////////
                              });
                          } else {
                              // final wb xls file 
                              var newDate = new Date().getTime();
                              wb.write("assets/images/" + newDate + ".xlsx", function(err, stats) {
                                  console.log('Excel.xlsx written and has the following stats');
                                  usersFun(0);

                                  function usersFun(j) {
                                    if (j < accountsData[i].users.length) {
                                      if (accountsData[i].users[j].role == 'accountadmin') {
                                        Email = JSON.stringify(accountsData[i].users[j].email); // JSON.stringify(accountsData[i].users[j].email); "aravinth.b@infonion.com"; //
                                        fullname = (accountsData[i].users[j].fullName ? accountsData[i].users[j].fullName : accountsData[i].users[j].userName);
                                        var transporter = nodemailer.createTransport("SMTP", {
                                          host: process.env.NODEMAILER_HOST,
                                          port: process.env.NODEMAILER_PORT,
                                          auth: {
                                            user: process.env.NODEMAILER_USER,
                                            pass: process.env.NODEMAILER_PASS
                                          },
                                        });
                                        mailContentForReport = '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="https://evaletz.com:2018/images/temp-home.JPG"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;">Dear Mr. ' + fullname + '</p><p style="margin: 1em 0px;margin-top: 10px;">Greetings!</p><p style="margin: 1em 0px;"> Please find attached valet parking status report ' + (new Date().getDate() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getFullYear()) + '. We would encourage you to use our Evaletz application to generate weekly/monthly reports. </p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a></span>&nbsp;and we will be more than happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>EValetz Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/EValetzMobileApp/" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://plus.google.com/u/0/116399189801627499126?hl=en" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://twitter.com/EvaletzApp" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://evaletz.com/" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>';
        
                                        var mailOptions = {
                                          from: process.env.REPORTER_EMAIL,
                                          to: Email,
                                          bcc: process.env.BCC_EMAIL,
                                          subject: 'EValetz - Status report for ' + new Date().getDate() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getFullYear(),
                                          html: mailContentForReport,
                                          attachments: [{
                                            filename: newDate + ".xlsx",
                                            filePath: "assets/images/" + newDate + ".xlsx",
                                            cid: 'newDate'
                                          }]
                                        }
        
                                        transporter.sendMail(mailOptions, function (err, response) {
                                          Email = '';
                                          fullname = '';
                                          if (err) {
                                            console.log('email failed..........' + JSON.stringify(err));
                                            console.log("next account")
                                            j++; // for all account admins finding 
                                            usersFun(j);
                                          }
                                          if (response) {
                                            console.log('mail send success');
                                            // i++;
                                            // accountFun(i);
                                            j++; // for all account admins finding 
                                            usersFun(j);
                                          }
                                          // fs.unlinkSync("assets/images/" + excellFileName);
                                        });
                                      } else {
                                        j++;
                                        usersFun(j);
                                      }
                                    } else {
                                      i++;
                                      accountFun(i);
                                    }
                                  }
                              });
                          }
                      }
                    } else {
                      i++;
                      accountFun(i);
                    }
                  });
                } else {
                  i++;
                  accountFun(i); // Not zone timezone reached 12'o clock
                }
              } else {
                console.log('accounts final for account admin\n\n\n\n\n\n\n\n\n');
                otherUserCron();
              }
            }
          }
        });
      }

      function otherUserCron(){
        var format = 'YYYY-MM-DD HH:mm';
        var mailContentForReport = '';
        var Email, fullname = '';
        var d = new Date();
        var n = new Date();
        d.setHours(23);
        d.setMinutes(59);
        d.setSeconds(00);
        n.setHours(23);
        n.setMinutes(59);
        n.setSeconds(00);
        
        var reportGeneratedAccountVenue = [];

        Account.find().populate('users').exec(function foundUsers(err, accountsData) {
          if (err) {
            console.log(err);
          }
          if (accountsData) {
            // console.log(accountsData.length);
            accountFunforOtherUser(0);

            function accountFunforOtherUser(i) {
              if (i < accountsData.length) {
                if (accountsData[i] && accountsData[i].timeZone)
                  timezone = accountsData[i].timeZone;
                else
                  timezone = "Asia/Kolkata";

                if(accountsData[i].id == '5b45bb80a23561f14ad08a2f'){ // Secure parking only
                  var time = moment(moment.utc().tz(timezone).format(format), format),
                  beforeTime = moment(moment.utc().tz(timezone).format("YYYY-MM-DD") + ' 01:59', format),
                  afterTime = moment(moment.utc().tz(timezone).format("YYYY-MM-DD") + ' 02:30', format);
                } else {
                    var time = moment(moment.utc().tz(timezone).format(format), format),
                    beforeTime = moment(moment.utc().tz(timezone).subtract(1, 'days').format("YYYY-MM-DD") + ' 23:59', format),
                    afterTime = moment(moment.utc().tz(timezone).format("YYYY-MM-DD") + ' 00:30', format);
                }
              
                if (time.isBetween(beforeTime, afterTime)) {          
                  usersFunforOtherUser(0);

                  function usersFunforOtherUser(j) {
                    if (j < accountsData[i].users.length) {
                      if ((accountsData[i].users[j].role == 'accountinguser' ||  accountsData[i].users[j].role == 'chauffeur' || accountsData[i].users[j].role == 'validator') && accountsData[i].users[j].sendReport) {
                        // Check eamil not found
                        if(accountsData[i].users[j].email != '' || accountsData[i].users[j].email != null || accountsData[i].users[j].email != undefined){
                          Email = JSON.stringify(accountsData[i].users[j].email); // JSON.stringify(accountsData[i].users[j].email); "aravinth.b@infonion.com"; //
                          fullname = (accountsData[i].users[j].fullName ? accountsData[i].users[j].fullName : accountsData[i].users[j].userName);

                          User.find().where({ id : accountsData[i].users[j].id }).populate('venues', { select : ['venueName', 'id'] }).exec(function found(err, usersDetails) {
                            if(usersDetails.length > 0){
                              usersDetails = usersDetails[0];
                              if(usersDetails.venues.length > 0){
                                var foundObjVenueData = _.filter(reportGeneratedAccountVenue, (obj)=>{
                                  return (obj.accountID  && obj.venueID  && obj.accountID == accountsData[i].id && obj.venueID == usersDetails.venues[0].id);
                                });

                                if(foundObjVenueData.length > 0)
                                  sendEmailforThisUser(foundObjVenueData[0].file);                        
                                else 
                                  generateReportandSendEmail();

                                function generateReportandSendEmail(){
                                  if(accountsData[i].id == '5b45bb80a23561f14ad08a2f'){ // Secure parking only
                                    var otherUserQuery = {
                                      "accountID": accountsData[i].id, 
                                      "venue" : usersDetails.venues[0].id, ///
                                      "or" : [
                                        {
                                          'createdAt': {
                                            '>=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 02:00"), timezone)).format(),
                                            '<=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 01:59:00"), timezone)).format()
                                          }
                                        },
                                        {
                                          'updatedAt': {
                                            '>=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 02:00"), timezone)).format(),
                                            '<=': moment.utc(moment.tz((moment.tz(timezone).format('YYYY-MM-DD') + " 01:59:00"), timezone)).format()
                                          }
                                        }
                                      ]
                                    }                                    
                                  } else {
                                    var otherUserQuery = {
                                      "accountID": accountsData[i].id, 
                                      "venue" : usersDetails.venues[0].id, ///
                                      "or" : [
                                        {
                                          'createdAt': {
                                            '>=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 00:00"), timezone)).format(),
                                            '<=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59:00"), timezone)).format()
                                          }
                                        },
                                        {
                                          'updatedAt': {
                                            '>=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 00:00"), timezone)).format(),
                                            '<=': moment.utc(moment.tz((moment.tz(timezone).subtract(1, 'days').format('YYYY-MM-DD') + " 23:59:00"), timezone)).format()
                                          }
                                        }
                                      ]
                                    }
                                  }
                                  

                                  Mastertransactional.find().where(otherUserQuery).populate('venue', { select : ['venueName', 'id'] }).populate('accountID', { select : ['accountName', 'timeZone', 'id'] }).exec(function found(err, _report) {
                                    if (err) {
                                      console.log(err);
                                      console.log("next user");
                                      j++;
                                      usersFunforOtherUser(j);
                                    }
                                    if (_report.length > 0) {
                                      exportService.convertDataforExcellFormatforDynamic(_report, '', '', (accountsData[i].excelFormatSettings || []), function (_report) {
                                        exportService.exportXLSforDynamic(_report, usersDetails.venues[0].venueName, '', '', (accountsData[i].excelFormatSettings || []), function (excellFileName) {
                                          reportGeneratedAccountVenue.push({    
                                            "accountID": accountsData[i].id, 
                                            "venueID" : usersDetails.venues[0].id,
                                            "file": excellFileName
                                          });                                  
                                          sendEmailforThisUser(excellFileName);
                                        });
                                      });
                                    } else {
                                      j++;
                                      usersFunforOtherUser(j);
                                    }
                                  });
                                }
                                
                                function sendEmailforThisUser(excellFileName){
                                  var transporter = nodemailer.createTransport("SMTP", {
                                    host: process.env.NODEMAILER_HOST,
                                    port: process.env.NODEMAILER_PORT,
                                    auth: {
                                      user: process.env.NODEMAILER_USER,
                                      pass: process.env.NODEMAILER_PASS
                                    },
                                  });
                                  mailContentForReport = '<body> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(214,214,213);border: 0;border-collapse: collapse;border-spacing: 0;" bgcolor="#d6d6d5"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 700.0px;"> <tbody> <tr> <td style="background-color: rgb(255,255,255);" align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="font-size: 0;"><img id="6755009000000625003_imgsrc_url_0" width="100%" style="border: none;clear: both;display: block;height: auto;max-width: 100.0%;outline: none;text-decoration: none;width: 100.0%;" alt="" src="https://evaletz.com:2018/images/temp-home.JPG"> <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;max-width: 702.0px;"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgb(255,255,255);border: 0;border-collapse: collapse;border-spacing: 0;margin: auto;" bgcolor="#ffffff"> <tbody> <tr> <td align="center"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="center" style="background-color: rgb(255,255,255);"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 20px;">&nbsp; <br></td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td align="left" style="padding: 0 14.0px 0 14.0px;"> <table border="0" cellpadding="0" cellspacing="0" style="border: 0;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 336.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> </td></tr></tbody> </table> </td></tr><tr> <td> <table border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;" width="100%"> <tbody> <tr> <td style="font-size: 0.0px;line-height: 0.0px;padding-bottom: 9.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p style="margin: 1em 0px;margin-top: 0px;">Dear Mr. ' + fullname + '</p><p style="margin: 1em 0px;margin-top: 10px;">Greetings!</p><p style="margin: 1em 0px;"> Please find attached valet parking status report ' + (new Date().getDate() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getFullYear()) + '. We would encourage you to use our Evaletz application to generate weekly/monthly reports. </p></td></tr></tbody> </table> </td></tr></tbody> </table> <table border="0" cellpadding="0" cellspacing="0" align="left" style="border: 0;border-collapse: collapse;border-spacing: 0;max-width: 100%;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="border: none;border-collapse: collapse;border-spacing: 0;table-layout: fixed;"> <tbody> <tr> <td style="color: rgb(113,113,114);font-family: ClanPro-Book , HelveticaNeue-Light , "Helvetica Neue Light" , Helvetica , Arial , sans-serif;font-size: 16.0px;line-height: 28.0px;"> <p> If you have any questions, write to us at&nbsp; <span style="color: rgb(14, 96, 196);" data-mce-style="color: #0e60c4;"><a title="Email Support" href="mailto:support@evaletz.com" target="_blank" style="color: #0e60c4;text-decoration: underline;" data-mce-style="color: #0e60c4;">support@evaletz.com</a></span>&nbsp;and we will be more than happy to help. </p><p style="margin: 1em 0px;">Sincerely, <br>EValetz Team</p></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="padding: 0 14.0px 0 14.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;max-width: 672.0px;"> <tbody> <tr> <td style="padding-left: 12.0px;padding-right: 12.0px;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none;border-collapse: collapse;border-spacing: 0;"> <tbody> <tr> <td style="background: rgb(191,191,191);font-size: 0.0px;line-height: 0.0px;">&nbsp; <br></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <br><table align="center" bgcolor="#333333" border="0" cellpadding="0" cellspacing="0" width="100%" data-thumb="http://fourdinos.com/demo/oxy/thumb/footer.jpg" data-module="Footer" data-bgcolor="Main BG" class="currentTable"> <tbody> <tr> <td align="center"> <table align="center" bgcolor="#1C252E" border="0" cellpadding="0" cellspacing="0" class="display-width" width="680" data-bgcolor="Footer Section BG"> <tbody> <tr> <td height="60"></td></tr><tr> <td align="center" style="padding:0 30px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="display-width" width="600"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/EValetzMobileApp/" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/fb.png" alt="64x64x2" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://plus.google.com/u/0/116399189801627499126?hl=en" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/gp.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://twitter.com/EvaletzApp" style="color:#444444; text-decoration:none;" data-color="Address" target="_new"> <img src="https://evaletz.com:2018/images/tw.png" alt="64x64x3" class="footer" width="64" style="border:0; margin:0; padding:0; width:70%; display:block; border-radius:3px;"> </a> </td><td width="15">&nbsp;</td><td align="left"> <a href="https://evaletz.com/" style="color:#444444; text-decoration:none;" target="_new" data-color="Address"> <img src="https://evaletz.com:2018/images/evz-newlogo.png" width="45" height="45" style="border-radius: 3px;"> </a> </td></tr></tbody> </table> </td></tr><tr> <td height="30" style="border-bottom:1px solid #eeeeee;" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="35%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center " border="0 " cellspacing="0 " cellpadding="0 " class="display-width " style="width:auto !important; "> <tbody> <tr> <td align="left " class="Heading txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:18px; font-weight:600; line-height:24px; letter-spacing:1px; " data-color="Footer Heading " data-size="Footer Heading " data-min="12 " data-max="38 "> Address </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Adambakkam,</a> </td></tr><tr> <td height="10 "></td></tr><tr> <td align="left " class="MsoNormal txt-center " style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:15px; line-height:24px; letter-spacing:1px; "> <a style="color:#ffffff; text-decoration:none; " data-color="website " data-size="website " data-min="12 " data-max="34 ">Chennai.</a> </td></tr><tr> <td height="10 "></td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="43"></td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="27%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="Heading txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Email </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:vasanthakumar.n@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">vasanthakumar.n@evaletz.com</a> </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:24px; letter-spacing:1px;"> <a href="mailto:shravan@evaletz.com" style="color:#ffffff; text-decoration:none;" data-color="website" data-size="website" data-min="12" data-max="34">shravan@evaletz.com</a> </td></tr></tbody> </table> </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="30" width="1"></td></tr></tbody> </table> <table align="right" border="0" cellpadding="0" cellspacing="0" class="display-width" width="26%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center"> <table align="center" border="0" cellspacing="0" cellpadding="0" class="display-width" style="width:auto !important;"> <tbody> <tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-weight:600; font-size:18px; line-height:24px; letter-spacing:1px;" data-color="Footer Heading" data-size="Footer Heading" data-min="12" data-max="38"> Phone </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34"> +91-9884954326 </td></tr><tr> <td height="10"></td></tr><tr> <td align="left" class="MsoNormal txt-center" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; text-transform:uppercase; font-size:14px; line-height:24px; letter-spacing:1px;" data-color="Ph.No" data-size="Ph.No" data-min="12" data-max="34">+91-9994696656 </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td style="border-bottom:1px solid #eeeeee;" height="30" data-border-bottom-color="Footer Border"></td></tr><tr> <td height="30"></td></tr><tr> <td contenteditable="false" class="editable"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="43%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width:auto;"> <tbody> <tr> <td align="center" class="" style="color:#ffffff; font-family:Segoe UI, Arial, Verdana, Trebuchet MS, sans-serif; font-size:14px; line-height:20px; letter-spacing:1px;"> 2016 &copy; All rights reserved </td></tr></tbody> </table> <table align="left" border="0" cellpadding="0" cellspacing="0" class="display-width" width="1" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"> <tbody> <tr> <td height="20" width="1"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr><tr> <td height="60"></td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> </td></tr></tbody> </table> <style type="text/css"> #content{overflow: hidden; height: 0; line-height: 1.2em; width: auto;}#more:focus + div{height: auto;}</style></body>';
            
                                  var mailOptions = {
                                    from: process.env.REPORTER_EMAIL,
                                    to: Email,
                                    bcc: process.env.BCC_EMAIL,
                                    subject: 'EValetz - Status report for ' + new Date().getDate() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getFullYear(),
                                    html: mailContentForReport,
                                    attachments: [{
                                      filename: excellFileName,
                                      filePath: "assets/images/" + excellFileName,
                                      cid: 'newDate'
                                    }]
                                  }

                                  transporter.sendMail(mailOptions, function (err, response) {
                                    Email = '';
                                    fullname = '';
                                    if (err) {
                                      console.log('email failed..........' + JSON.stringify(err));
                                      console.log("next user")
                                      setTimeout(() => {
                                        j++; 
                                        usersFunforOtherUser(j);
                                      }, 1);
                                    }
                                    if (response) {
                                      console.log('mail send success');
                                      // i++;
                                      // accountFun(i);
                                      setTimeout(() => {
                                        j++; 
                                        usersFunforOtherUser(j);
                                      }, 1);
                                    }
                                    // fs.unlinkSync("assets/images/" + excellFileName);
                                  });
                                }
                              } else {
                                j++;
                                usersFunforOtherUser(j);
                              }
                            }else {
                              j++;
                              usersFunforOtherUser(j);
                            }                        
                          });
                        } else { //Check eamil not found else 
                          j++;
                          usersFunforOtherUser(j);
                        }
                        // 
                      } else {
                        j++;
                        usersFunforOtherUser(j);
                      }
                    } else {
                      i++;
                      accountFunforOtherUser(i);
                    }
                  }
                } else {
                  i++;
                  accountFunforOtherUser(i); // Not zone timezone reached 12'o clock
                }
              } else {
                reportGeneratedAccountVenue = [];
                console.log('accounts final  for other account users\n\n\n\n\n\n\n\n\n');
                return;
              }
            }
          }
        });
      }
    },
    start: true, // Start task immediately
    timezone: 'Asia/Kolkata', // Custom timezone
    context: undefined // Custom context for onTick callback
  },
}
  // dailyReportforOtherUsers: {
  //   schedule: '00 */30 * * * *',
  //   onTick: function () {
  //     console.log("30 - 2 mins Cron Running...");
      
  //   },
  //   start: true, // Start task immediately
  //   timezone: 'Asia/Kolkata', // Custom timezone
  //   context: undefined // Custom context for onTick callback
  // },
 // testCron: {
  //     schedule: '*/20 * * * * *', //'00 00 22 * * *', //'*/20 * * * * *', // 00 00 22 * * *
  //     onTick: function() {
  //         console.log("Daily Cron Running...");
  //         // Totaltransactional.create({ accountID : '591e9aa7efa3abea71206a64', date : new Date() }).then(function(carObj) {

  //         // });
  //         // Totaltransactional.findOrCreate({ accountID : '591e9aa7efa3abea71206a64' , date : new Date()}, { accountID : '591e9aa7efa3abea71206a64' , date : new Date()} ).exec(function createFindCB(error, createdOrFoundRecords){
  //         //     console.log('What\'s cookin\' '+JSON.stringify(createdOrFoundRecords)+'?');
  //         //   });
  //         //   Totaltransactional.find().where({ "accountID": '591e9aa7efa3abea71206a64', 'date': { '>': moment().format('YYYY-MM-DD') } }).exec(function found(err, masterData) {

  //         //     console.log('What\'s cookin\' '+JSON.stringify(masterData)+'?' + moment().format('YYYY-MM-DD'));

  //         //   })

  //         // Totaltransactional.find().where({ "accountID": '591e9aa7efa3abea71206a64', 'date': moment().add(-1,'days').format('YYYY-MM-DD')  }).exec(function found(err, masterData) { 
  //         //     if(masterData.length > 0){
  //         //         Totaltransactional.update(masterData[0].id, { total : (masterData[0].total + 1)
  //         //         }, function updated(err, car) {
  //         //             console.log("-Today Updated-");
  //         //             // checkYearMonthExists();
  //         //         });
  //         //     }else {
  //         //         Totaltransactional.create({ accountID : '591e9aa7efa3abea71206a64', date : moment().add(-1,'days').format('YYYY-MM-DD')
  //         //          }).then(function(carObj) {
  //         //             console.log("-Today Created-");
  //         //             // checkYearMonthExists();
  //         //         });
  //         //     }
  //         // });
  //     },
  //     start: true, // Start task immediately
  //     timezone: 'Asia/Kolkata', // Custom timezone
  //     context: undefined // Custom context for onTick callback
  // }
  // testCron: {
  //     schedule: '*   * * * * *', //'00 00 22 * * *', //'*/20 * * * * *', // 00 00 22 * * *
  //     onTick: function() {
  //         console.log("Running..." + sails.config.ip + ":"+ sails.config.port);

  //     },
  //     start: true, // Start task immediately
  //     timezone: 'Asia/Kolkata', // Custom timezone
  //     context: undefined // Custom context for onTick callback
  // }
