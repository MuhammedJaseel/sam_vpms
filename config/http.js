/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Only applies to HTTP requests (not WebSockets)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.http.html
 */

const logger = require('../logger');

module.exports.http = {

    /****************************************************************************
     *                                                                           *
     * Express middleware to use for every Sails request. To add custom          *
     * middleware to the mix, add a function to the middleware config object and *
     * add its key to the "order" array. The $custom key is reserved for         *
     * backwards-compatibility with Sails v0.9.x apps that use the               *
     * `customMiddleware` config option.                                         *
     *                                                                           *
     ****************************************************************************/

    middleware: {


    /***************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP request. (the Sails *
     * router is invoked by the "router" middleware below.)                     *
     *                                                                          *
     ***************************************************************************/

        logErrors: function(err, req, res, next) {
            err.method = req.method;
            err.url = req.url;
            err.params = req.params;
            err.query = req.query;
            err.body = req.body;

            logger.error(err);
            res.send(err.status);
        },

        order: [
            'startRequestTimer',
            'cookieParser',
            //   'session',
            'myRequestLogger',
            'bodyParser',
            'handleBodyParserError',
            'compress',
            'methodOverride',
            'poweredBy',
            '$custom',
            'router',
            'www',
            'favicon',
            'logErrors',
            '404',
            '500'
        ],

    /****************************************************************************
     *                                                                           *
     * Example custom middleware; logs each request to the console.              *
     *                                                                           *
     ****************************************************************************/

    myRequestLogger: function (req, res, next) {
        // console.log( JSON.stringify(sails.sockets.rooms()))
        // for(r in sails.sockets.rooms()){
        //     console.log(sails.sockets.rooms()[r])
        // }
        
        // var isIpad = !!req.headers['user-agent'].match(/iPhone/);
        // console.log("iPhone :: " + isIpad);
        // var isAndroid = !!req.headers['user-agent'].match(/Android/);
        // console.log("Android :: " +isAndroid);
        // var isLinux = !!req.headers['user-agent'].match(/Linux/);
        // console.log("Linux :: " + isLinux);
        // var isWindows = !!req.headers['user-agent'].match(/Windows/);
        // console.log("Windows :: " + isWindows);
        // var isMac = !!req.headers['user-agent'].match(/Mac/);
        // console.log("Mac :: " + isMac);

        console.log("Requested :: ", req.method, req.url, "  @ " + console.log('User-Agent: ' + req.headers['user-agent'] +  new Date() ));

        if(req.url == '/user' || req.url == '/mastertransactional' || req.url =='/dailytransactional' || req.url =='/account')
            return res.status(404).send("Evaletz can't allow unauthorized user for this action.");
        else 
            return next();
    },

    poweredBy:  function (req, res, next) {
    // or uncomment if you want to replace with your own
    // res.set('X-Powered-By', "Evaletz - A valet parking Company");
    return next();
    },


    /***************************************************************************
     *                                                                          *
     * The body parser that will handle incoming multipart HTTP requests. By    *
     * default as of v0.10, Sails uses                                          *
     * [skipper](http://github.com/balderdashy/skipper). See                    *
     * http://www.senchalabs.org/connect/multipart.html for other options.      *
     *                                                                          *
     ***************************************************************************/

    // bodyParser: require('skipper')

    // },
    // ssl: {
    //     key: fs.readFileSync('assets/ssls/evaletz.key'),
    //     cert: fs.readFileSync('assets/ssls/6dcb491f14f815e7.crt'),
    //     ca: fs.readFileSync('assets/ssls/gd_bundle-g2-g1.crt')
    // },
    // serverOptions: {
    //     key: fs.readFileSync('assets/ssl-may/evaletz_com.key'),
    //     cert: fs.readFileSync('assets/ssl-may/main.crt'),
    //     ca: fs.readFileSync('assets/ssl-may/intermediate.crt'),
    //     // ca: [fs.readFileSync('assets/ssl-may/g1.crt'), fs.readFileSync('assets/ssl-may/g2.crt'),fs.readFileSync('assets/ssl-may/g3.crt')]
    // },
    // serverOptions: {
    //     key: fs.readFileSync('assets/infonionssl/infonion.com.key'),
    //     cert: fs.readFileSync('assets/infonionssl/main.crt'),
    //     ca: fs.readFileSync('assets/infonionssl/intermediate.crt'),
    //     // ca: [fs.readFileSync('assets/ssls/ssl-config1.ca1'), fs.readFileSync('assets/ssls/ssl-config2.ca2'),fs.readFileSync('assets/ssls/ssl-config3.ca3')]
    // },
    /***************************************************************************
     *                                                                          *
     * The number of seconds to cache flat files on disk being served by        *
     * Express static middleware (by default, these files are in `.tmp/public`) *
     *                                                                          *
     * The HTTP static cache is only active in a 'production' environment,      *
     * since that's the only time Express will cache flat-files.                *
     *                                                                          *
     ***************************************************************************/

    cache: 31557600000
    }
};
