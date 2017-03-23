//var credentials = require('../credentials.js');
var mongoose = require('mongoose');
const aws = require('aws-sdk');

var s3 = new aws.S3({
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
              mongoose.connect('mongodb://admin:admin@ds137370.mlab.com:37370/crawlquick', options);
              break;
          case 'production':
              mongoose.connect('mongodb://admin:admin@ds137370.mlab.com:37370/crawlquick', options);
              break;
          default:
              throw new Error('Unknown execution environment: ' + app.get('env'));
      }

    }
}