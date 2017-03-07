var request = require('request');
var cheerio = require('cheerio');
const parser = require('xml-parser');
var URL = require('url-parse');
var GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
var fs = require('fs');
var LineByLineReader = require('line-by-line'),
    lr = new LineByLineReader('sitemapURLS.txt');

const crawler = require('./xmlcrawler/crawler');

var doc = new GoogleSpreadsheet('1NfEezqXJ_P43MiLuFEEj9BMka-yn2e-jeWpr7QV4uK0');
var sheet;

var sitemapURLs = [];
var parsedXmlString;
var currentCellLocation = 0;
var fileLineLength = 0;

readSitemapURLS();
getKeywordsFromURL("http://www.jbheatingandair.com/heating-repairs/");

async.series([
        function setAuth(step) {
            sitemapURLs = crawler.crawlXmlSitemap('http://www.jbheatingandair.com');
            var creds = require('./google-gen-creds.json');
            doc.useServiceAccountAuth(creds, step);
        },

        function getInfoAndWorksheets(step) {
            doc.getInfo(function(err, info) {
                console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
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
                'max-row': 100,
                'return-empty': true
            }, function(err, cells) {
                var cell = cells[0];
                console.log('Cell R' + cell.row + 'C' + cell.col + ' = ' + cells.value);

                cells[4].value = 1;
                cells[5].value = 2;
                sheet.bulkUpdateCells(cells); //async

            })
            step();
        }
    ],
    function(error, results) {}
);


function manipulateCell(row, sheet) {
    sheet.getCells({
        'min-row': 1,
        'max-row': 100,
        'return-empty': true
    }, function(err, cells) {
        var cell = cells[0];
        console.log('Cell R' + cell.row + 'C' + cell.col + ' = ' + cells.value);

        cells[4].value = 1;
        cells[5].value = 2;
        sheet.bulkUpdateCells(cells); //async

    });
}

/*
  Given A URL, this function creates a file 'keyword.txt', which is an array of
  keywords taken from anything with-in a <strong> on a given page.

  These keywords will be used to add the keywords to the Google Spreadsheet to track
  the ranking of a specific keyword on a page.
*/
function getKeywordsFromURL(URL) {

    //looking through the url for strong tag, which are idealy the keyword
    request(URL, function(error, response, body) {
        if (error) {
            console.log("Error: " + error);
            return;
        }
        if (response.statusCode === 200) {
            var $ = cheerio.load(body);
            //This jquery call iterates through each strong tag within the given URL, finding
            //the keywords for the specific URL
            fs.truncate('./keyword.txt', 0, function() {
                console.log("Rewriting keyword file");
                $('strong').each(function(idx, el) {
                    //Iterate through the strong tags, and write to 'keyword.txt'
                    fs.appendFile("./keyword.txt", $(el).text() + '\n', function(err) {
                        if (err) {
                            return console.log(err)
                        }
                    });
                });
            })
        }
    });
}

/*
  This function reads the 'sitemapURLS.txt', this also counts the line lengeth which should
  be used to show how many rows should be selected for the google spreadsheet.
*/
function readSitemapURLS() {
    lr.on('line', function(line) {
            fileLineLength++;
            // console.log("this is the line: " + line);
        })
        .on('end', function() {
            console.log("URLS in Sitemap: " + fileLineLength);
        });
}