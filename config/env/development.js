/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

var fs = require('fs');
module.exports = {

    /***************************************************************************
     * Set the default database connection for models in the production        *
     * environment (see config/connections.js and config/models.js )           *
     ***************************************************************************/

    models: {
        connection: 'MongodbServerDev',
        migrate: 'safe'
    },

    /***************************************************************************
     * Set the port in the production environment to 80                        *
     *************************************************************************   
     /* ssl: {
        ca: require('fs').readFileSync( 'assets/ssl-may/main.crt', 'utf8').toString(),
        key: require('fs').readFileSync('assets/ssl-may/evaletz_com.key', 'utf8').toString(),
        cert: require('fs').readFileSync('assets/ssl-may/intermediate.crt', 'utf8').toString()
    },*/
    port: 3000,
    hookTimeout: 1000000,

    /***************************************************************************
     * Set the log level in production environment to "silent"                 *
     ***************************************************************************/

    log: {
      level: "info"
    }

};
