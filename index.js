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

var doc = new GoogleSpreadsheet('1zKKeYJCWZr36NMbBWKZClN1dT9iQ_GOBsogRJGNAb9k');
var sheet;

var sitemapURLs = [];
var fileLineLength = 0;


async.series([
    function setAuth(step) {
        sitemapURLs = crawler.crawlXmlSitemap('http://www.jbheatingandair.com');
        var creds = require('./5+Y6TMffS+u#hP5@.json');
        getSitemapUrlLineLength();
        doc.useServiceAccountAuth(creds, step);
    },
    function getInfoAndWorksheets(step) {
        doc.getInfo(function(err, info) {
            console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
            sheet = info.worksheets[0];
            console.log('sheet 1: ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
            step();
        });
    },
    function workingWithRows(step) {
        sheet.getRows({
            offset: 1,
            limit: fileLineLength + 1
        }, function(err, rows) {
            console.log('Read ' + rows.length + ' rows');
            var currentURLLine = 0;


            var sitemapURLSLineReader = new LineByLineReader('sitemapURLS.txt');

            sitemapURLSLineReader.on('line', function(line) {
                async.series([
                    function doGoogleStuff(step) {
                        request(line, function(error, response, body) {
                            if (error) {
                                console.log("Error: " + error);
                                return;
                            }
                            if (response.statusCode === 200) {
                                var $ = cheerio.load(body);

                                var key = $('meta[name=keywords]').attr('content');
                                keywords = key.split(',');
                                rows[currentURLLine].Keyword = keywords[0];
                            }
                        });
                        rows[currentURLLine].Page = line;
                        rows[currentURLLine].Rank = 0;
                        rows[currentURLLine].Note = 'Initial Run';
                        rows[currentURLLine].Date = moment().format('MMM Do YYYY, h:mm:ss a');
                        sitemapURLSLineReader.pause();
                        setTimeout(function() {
                            rows[currentURLLine].save();
                            currentURLLine = currentURLLine + 1;
                            step();
                        }, 1000)
                    }

                ], function(err, step) {
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
