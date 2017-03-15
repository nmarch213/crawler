const request = require('request');
const cheerio = require('cheerio');
const parser = require('xml-parser');
const URL = require('url-parse');
const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const fs = require('fs'),
    readline = require('readline');
const LineByLineReader = require('line-by-line'),
    sitemapURLSLineReader = new LineByLineReader('sitemapURLS.txt');
const moment = require('moment');

const crawler = require('./xmlcrawler/crawler');

//This google spreadsheet id is taken from a specific google sheet.
// example: https://docs.google.com/spreadsheets/d/1zKKeYJCWZr36NMbBWKZClN1dT9iQ_GOBsogRJGNAb9k/edit#gid=0
//                                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//This is where you get this URL link
var doc = new GoogleSpreadsheet('1zKKeYJCWZr36NMbBWKZClN1dT9iQ_GOBsogRJGNAb9k');
var sheet;

var sitemapURLs = [];
var fileLineLength = 0;

//This is an asyncrhronous series that executes each function before continuing to the next 'step'
//This is the main function of the program
async.series([
    //This sets the google authentication, crawls the Sitemap of the given URL, get the line length of sitemap
    function setGoogleAuthentication(step) {
        //calls the crawler.js
        sitemapURLs = crawler.crawlXmlSitemap('http://www.jbheatingandair.com');
        //load credentials
        var creds = require('./5+Y6TMffS+u#hP5@.json');
        //sets linelength
        getSitemapUrlLineLength();
        //google spreadsheet authentication
        doc.useServiceAccountAuth(creds, step);
    },
    //This function is the next step that loads the specific information from the google document
    function getInfoAndWorksheets(step) {
        doc.getInfo(function(err, info) {
            console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
            sheet = info.worksheets[0];
            console.log('sheet 1: ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
            step();
        });
    },
    //This does the actual work to each of the rows
    function workingWithRows(step) {
        //This uses google-spreadsheet npm to get the rows for the specific file
        //
        // NOTE: THE ROWS CANNOT BE EMPTY OR THE GOOGLE API WILL NOT PULL THEM
        //
        sheet.getRows({
            offset: 1,
            //This sets the limit 1 more than the sitemap url file length
            limit: fileLineLength + 1
        }, function(err, rows) {
            console.log('Read ' + rows.length + ' rows');
            var currentURLLine = 0;
            var sitemapURLSLineReader = new LineByLineReader('sitemapURLS.txt');
            //Reads reach of the lines of the sitemapURL file.
            sitemapURLSLineReader.on('line', function(line) {
                //another async function to ensure each step properly saves in google
                async.series([
                    function saveInformationToGoogleSpreadsheet(step) {
                        //This crawls the specific URL for the keyword, this takes the first
                        //keyword and stores it in the google sheet. 
                        //This word should be what you are looking to rank for.
                        request(line, function(error, response, body) {
                            if (error) {
                                console.log("Error: " + error);
                                return;
                            }
                            if (response.statusCode === 200) {
                                //get the html body
                                var $ = cheerio.load(body);
                                //find the meta tag -> Keyword ->content
                                //This find all the keywords
                                var key = $('meta[name=keywords]').attr('content');
                                //split the keywords by ','
                                keywords = key.split(',');
                                //add the first keyword to the google spreadsheet
                                //this should be the keyword you are specifically trying to rank for
                                rows[currentURLLine].Keyword = keywords[0];
                            }
                        });
                        //adds the URL to the 'Page' header on the google doc
                        rows[currentURLLine].Page = line;
                        //adds a dummy rank to the 'Rank' header on the google doc
                        rows[currentURLLine].Rank = 0;
                        rows[currentURLLine].Note = 'Initial Run';
                        rows[currentURLLine].Date = moment().format('MMM Do YYYY, h:mm:ss a');
                        //this pauses the file line reader to ensure all the data is read from File i/o, and HTTP request
                        sitemapURLSLineReader.pause();
                        //This is another timeout function to ensure all the data is properly loaded before saving.
                        setTimeout(function() {
                            //save the current line in google doc
                            rows[currentURLLine].save();
                            //increment line
                            currentURLLine = currentURLLine + 1;
                            step();
                        }, 1000) //this is the actually delay time on 1 second
                    }

                ], function(err, step) {
                    //This function is called to resume the file looping going to the next line.
                    sitemapURLSLineReader.resume();
                })
            })
        });
    }
]);

// /*
//   This function reads the 'sitemapURLS.txt', this also counts the line lengeth which should
//   be used to show how many rows should be selected for the google spreadsheet.
// */
function getSitemapUrlLineLength() {
    sitemapURLSLineReader.on('error', function(error) {
        if (error) {
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
