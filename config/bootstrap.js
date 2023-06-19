/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */
 var http = require( 'http' );
 var fs=require('fs');
module.exports.bootstrap = function(cb) {

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)

 /* var serverOptions = {
        key: fs.readFileSync('assets/ssls/evaletz.key'),
		cert: fs.readFileSync('assets/ssls/b6f1f1b27a63831d.crt'),
		ca: fs.readFileSync('assets/ssls/gd_bundle-g2-g1.crt')
    }*/

  // if(sails.config.environment === "production") {
        // http.createServer(sails.hooks.http.app ).listen( 1338 );        
//         var https = require('https');
// var fs = require('fs');
// var options = {
//   key: fs.readFileSync('assets/ssl-may/evaletz_com.key'),
//           cert: fs.readFileSync('assets/ssl-may/main.crt'),
//           ca: fs.readFileSync('assets/ssl-may/intermediate.crt')
// };
// https.createServer(options, function (req, res) {
//   res.writeHead(200);
//   res.end("hello world\n");
// }).listen(2000);
  //   }
  cb();
};
