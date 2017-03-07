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
                /*
                  Worksheet[0] = Main list of clients
                  Worksheet[1] = The first named client to the right of the "main" sheet.

                  Sheet has these object properties you can get info from:
                  url - the URL for the sheet
                  id - the ID of the sheet
                  title -   the title (visible on the tabs in google's interface)
                  rowCount - number of rows
                  colCount - number of columns
                 */
                sheet = info.worksheets[2];
                console.log('sheet 1: ' + sheet.title);
                step();
            });
        },
        function addToRows(step) {
          sheet.getCells({
          'min-row': 1,
          'max-row': 5,
          'return-empty': true
        }, function(err, cells) {
          var cell = cells[0];
          console.log('Cell R'+cell.row+'C'+cell.col+' = '+cells.value);

          cells[4].value = 1;
          cells[5].value = 2;
          sheet.bulkUpdateCells(cells); //async

            })
            step();
        }
    ],
    function(error, results) {
        console.log('end?');
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
