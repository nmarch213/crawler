var request = require('request');
var cheerio = require('cheerio');
const parser = require('xml-parser');
var URL = require('url-parse');
var GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
var fs = require('fs'),
    readline = require('readline');
var LineByLineReader = require('line-by-line'),
    sitemapURLSLineReader = new LineByLineReader('sitemapURLS.txt');
keywordLineReader = new LineByLineReader('keyword.txt');

var rd = readline.createInterface({
    input: fs.createReadStream('sitemapURLS.txt')
});

const crawler = require('./xmlcrawler/crawler');

var doc = new GoogleSpreadsheet('1NfEezqXJ_P43MiLuFEEj9BMka-yn2e-jeWpr7QV4uK0');
var sheet;

var sitemapURLs = [];
var parsedXmlString;
var currentCellLocation = 0;
var fileLineLength = 0;

async.series([
        function setAuth(step) {
            sitemapURLs = crawler.crawlXmlSitemap('http://www.jbheatingandair.com');
            var creds = require('./google-gen-creds.json');
            getSitemapUrlLineLength();
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
            addToGoogleWorksheet("http://www.jbheatingandair.com/heating-repairs/", step);
        }
    ],
    function(error, results) {}
);

/*
  This function will modify the cells of a given row which is determined by the Sitemap URL link,
  this will also add the keyword specific to the URL and add it to the google spreadsheet.

  row - this will be the offset determined by which URL we are currently finding the keyword for
  sheet - This is just passing the given sheet, may not be needed but added for refactoring if needed
  numberOfRows - This will be determined by the line length of the 'URLSitemaps.txt'
*/
function manipulateCell(row, numberOfRows, URL) {
    sheet.getCells({
        'min-row': row,
        'max-row': row + 1, //just in case
        'return-empty': true
    }, function(err, cells) {
        //var cell = cells[0];

        var keyword = [];
        keywordLineReader = new LineByLineReader('keyword.txt');
        keywordLineReader.on('line', function(line) {
            console.log("this is a line" + line);
            keyword.push(line);
        });

        console.log(cells[0].row + " " + cells[0].col);
        console.log(cells[1].row + " " + cells[1].col);

        //edit the page
        cells[0].value = URL;
        //edit the keyphrases
        cells[1].value = keyword[0];
        //edit the rank
        cells[2].value = 'not checked';
        //edit the Notes
        cells[3].value = 'n/a';

        //go to the next row
        //NOTE: IF THE COLUMNS INCREASES THIS NEEDS TO BE ALTERED
        //NOTE: IF THE COLUMNS INCREASES THIS NEEDS TO BE ALTERED
        //NOTE: IF THE COLUMNS INCREASES THIS NEEDS TO BE ALTERED
        //NOTE: IF THE COLUMNS INCREASES THIS NEEDS TO BE ALTERED
        //NOTE: IF THE COLUMNS INCREASES THIS NEEDS TO BE ALTERED
        //NOTE: IF THE COLUMNS INCREASES THIS NEEDS TO BE ALTERED
        //i = i + 3;

        sheet.bulkUpdateCells(cells, function(err){
          if(err){
            console.log(err);
          }
        }); //async

    });
}

/*
  Given A URL, this function creates a file 'keyword.txt', which is an array of
  keywords taken from anything with-in a <strong> on a given page.

  These keywords will be used to add the keywords to the Google Spreadsheet to track
  the ranking of a specific keyword on a page.
*/
function getKeywordsFromURL(URL, step) {

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
                console.log("ending keywords")
                step();
            });
        }
    });
}

/*
  This function reads the 'sitemapURLS.txt', this also counts the line lengeth which should
  be used to show how many rows should be selected for the google spreadsheet.
*/
function getSitemapUrlLineLength() {
  console.log("this is running again!");
    sitemapURLSLineReader.on('error', function(error){
      if(error){
        console.log(error);
      }
    })
    sitemapURLSLineReader.on('line', function(line) {
            fileLineLength++;

            //console.log("this is the line: " + line);
        })
        sitemapURLSLineReader.on('end', function() {
            console.log("URLS in Sitemap: " + fileLineLength);
        });
}

/*
  This function will loop through each of the 'sitemapURLS.txt'
    Generate the specific keywords for index'd sitemapURL
    Add the 'URL' to the google worksheet
    Add the 'keywords' to the google worksheet
    Set the 'rank' to unchecked
    Set the 'notes' to n/a
*/

function addToGoogleWorksheet(URL) {
    console.log("adding to google worksheet")
    var currentURLLine = 0;
    var row = 1;

    async.series([
        function keywordTime(step) {
            console.log("running keywords");
            getKeywordsFromURL(URL, step);
        },
        function runGoogleStuff(step) {
            console.log("running google")
            urlReader = new LineByLineReader('sitemapURLS.txt');
           //getSitemapUrlLineLength();
                //iterates through the enitre 'sitemapURLS.txt'
            urlReader.on('error', function(error){
              if(error){
                console.log(error);
              }
            })
            urlReader.on('line', function(line) {
                //counts which line we are on
                currentURLLine++;
                //row is total rows / 4, since there are 4 columns
                row = row + 1;
                console.log("current row: " + row);
                manipulateCell(row, fileLineLength, line);
            })
            urlReader.on('end', function(step){
            })
            step();
        }
    ], function(error, endstep){
      if(error){
        console.log(error);
        console.log(endstep);
      }
    })
}
