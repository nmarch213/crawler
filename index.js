var request = require('request');
var cheerio = require('cheerio');
const parser = require('xml-parser');
var URL = require('url-parse');
var GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
var fs = require('fs');

const crawler = require('./xmlcrawler/crawler');

var doc = new GoogleSpreadsheet('1NfEezqXJ_P43MiLuFEEj9BMka-yn2e-jeWpr7QV4uK0');
var sheet;

var sitemapURLs = [];
var parsedXmlString;

async.series([
        function setAuth(step) {
            sitemapURLs = crawler.crawlXmlSitemap('http://www.jbheatingandair.com');
            var creds = require('./google-gen-creds.json');
            doc.useServiceAccountAuth(creds, step);
        },

        function getInfoAndWorksheets(step) {
            doc.getInfo(function(err, info) {
                console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
                // doc.addRow(info.worksheets[1], )
                sheet = info.worksheets[1];
                console.log('sheet 1: ' + sheet);
                step();
            });
        },
        function addToRows(step) {
            sheet.getRows({
              offset: 1,
              limit: 20,
              orderby: 'col2'
            }, function(err, rows){
              console.log('Read '+ rows.length+ " rows");
              console.log(rows[0]);
            })
            step();
        }
    ],
    function(error, results) {
        console.log
    }
);




// for (var i = 0; i < sitemapURLs.length; i++) {
//   console.log('running');
//   request(sitemapURLs[i], function(error, response,body){
//     if(err){
//       console.log("Error: " + error);
//     }
//
//     // Check status code (200 is HTTP OK)
//     console.log("Status code: " + response.statusCode);
//     if(response.statusCode === 200) {
//       // Parse the document body
//       var $ = cheerio.load(body);
//       var keywords = $('strong').text();
//       googleSheet.site.push({
//         "keywords": keywords,
//         "url" : i
//       });
//
//       console.log("these are the keywords: " + $('strong').text());
//
//     }
//   });
//
// }
