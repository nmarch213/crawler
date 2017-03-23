var credentials = require('../credentials.js');
var mongoose = require('mongoose');
const aws = require('aws-sdk');

let s3 = new aws.S3({
  mongoProd: process.env.mongo
})

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
              mongoose.connect(s3.mongoProd, options);
              break;
          default:
              throw new Error('Unknown execution environment: ' + app.get('env'));
      }

    }
}