var credentials = require('../credentials.js');
var mongoose = require('mongoose');

module.exports = {

    populateDBSettings: function(app) {
      var options = {
          server: {
             socketOptions: { keepAlive: 1 }
          }
      };
      switch(app.get('env')){
          case 'development':
              mongoose.connect(credentials.mongo.development.connectionString, options);
              break;
          case 'production':
              mongoose.connect(credentials.mongo.production.connectionString, options);
              break;
          default:
              throw new Error('Unknown execution environment: ' + app.get('env'));
      }

    }
}