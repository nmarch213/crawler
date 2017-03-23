const request = require('request');
const cheerio = require('cheerio');
const parser = require('xml-parser');
const URL = require('url-parse');
const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const fs = require('fs'),
    readline = require('readline');
const LineByLineReader = require('line-by-line');
const moment = require('moment');
const googleScrape = require('google-search-scraper');
const madison = require('madison');
const utf8 = require('utf8');
const base64 = require('base-64');

const crawler = require('./crawler');

//db
var Results = require('../models/quickResults.js');
var mongoose = require('mongoose');

//This google spreadsheet id is taken from a specific google sheet.
// example: https://docs.google.com/spreadsheets/d/1zKKeYJCWZr36NMbBWKZClN1dT9iQ_GOBsogRJGNAb9k/edit#gid=0
//                                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//This is where you get this URL link
var doc = new GoogleSpreadsheet('1zKKeYJCWZr36NMbBWKZClN1dT9iQ_GOBsogRJGNAb9k');
var sheet;
var fileLineLength = 0;


module.exports = {

    localizedKeywordSearch: function(websiteRoot, keywords) {

        var uule;

        async.series([
            // function setGoogleAuthentication(step) {
            //     //load credentials
            //     var creds = require('./../gcredentials.json');
            //     //google spreadsheet authentication
            //     doc.useServiceAccountAuth(creds, step);
            // },
            // function getInfoAndWorksheets(step) {
            //     doc.getInfo(function(err, info) {
            //         //console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
            //         sheet = info.worksheets[0];
            //         //console.log('sheet 1: ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
            //         step();
            //     });
            // },
            function getLocalizedUULE(step) {
                request(websiteRoot, function(error, response, body) {
                    if (error) {
                        console.log("Error: " + error);
                        return;
                    }
                    if (response.statusCode === 200) {
                        var $ = cheerio.load(body);

                        var zipcode = $('span[itemprop=postalCode]').text();
                        var state = $('span[itemprop=addressRegion]').text();
                        uule = getWebsiteLocalizedSearchUULE(zipcode, state);
                        setTimeout(function() {
                            step();
                        }, 1000);
                    }
                })
            },
            function findKeyword(step) {

                var keywordArray = keywords.split(', ');
                console.log("Keyword Search for " + websiteRoot + " has begun.")

                for (var i = 0; i < keywordArray.length; i++) {
                    //console.log("this should be the search: " + keywordArray[i])

                    customGoogleSearch(uule, keywordArray[i], websiteRoot);

                    setTimeout(function() {
                    }, 5000);
                }
                step();
            }
        ], function(error, results) {
            if (error) {
                console.log(error);
            }
            console.log("Keyword Search Complete!");
        });
    },

    addContentToGoogleSpreadsheet: function(websiteRoot) {


        //This is an asyncrhronous series that executes each function before continuing to the next 'step'
        //This is the main function of the program
        async.series([
            //This sets the google authentication, crawls the Sitemap of the given URL, get the line length of sitemap
            function setGoogleAuthentication(step) {

                console.log("this is the website " + websiteRoot)
                    //calls the crawler.js
                crawler.crawlXmlSitemap(websiteRoot);
                //load credentials
                var creds = require('./../gcredentials.json');
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
                    var sitemapURLSLineReader = new LineByLineReader('./sitemapURLS.txt', { skipEmptyLines: true });
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
                                        var key = $('title').text();
                                        console.log(key);
                                        if (key) {
                                            console.log(key)
                                                //split the keywords by ','
                                            keywords = key.split('|');
                                        }
                                        var zipcode = $('span[itemprop=postalCode]').text();
                                        var state = $('span[itemprop=addressRegion]').text();
                                        //This is finding the location for the google search, this is found using this tooL:
                                        //https://moz.com/ugc/geolocation-the-ultimate-tip-to-emulate-local-search
                                        //This explains how this uule is formed.
                                        // madison.getStateName(state, function(stateFullName) {
                                        //      var uuleRoot = 'w+CAIQICI';
                                        //         var uuleStringPrior = zipcode + ',' + stateFullName + ',United States';
                                        //         var uuleSecretKey = findSecretKeyForUULE(uuleStringPrior.length);
                                        //         var bytes = utf8.encode(uuleStringPrior);
                                        //         var canonEncoded = base64.encode(bytes);

                                        //         var uule = uuleRoot + uuleSecretKey + canonEncoded;
                                        //     });
                                        rows[currentURLLine].uule = getWebsiteLocalizedSearchUULE(zipcode, state);

                                        //add the first keyword to the google spreadsheet
                                        //this should be the keyword you are specifically trying to rank for
                                        if (keywords) {
                                            rows[currentURLLine].Keyword = keywords[0];
                                        }
                                        rows[currentURLLine].Zipcode = zipcode;

                                        var options = {
                                            query: keywords[0],
                                            limit: 10
                                        }
                                        var googleScapeCounter = 0;

                                        googleScrape.search(options, function(err, url) {
                                            googleScapeCounter++;
                                            if (err) {
                                                console.log(err);
                                            }
                                            if (url) {
                                                if (url.includes(websiteRoot)) {
                                                    console.log('THIS WAS FOUND');
                                                    rows[currentURLLine].Rank = googleScapeCounter;
                                                }
                                            }
                                        })

                                    }
                                });
                                //adds the URL to the 'Page' header on the google doc
                                rows[currentURLLine].Page = line;
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
                                    }, 10000 * Math.random(1, 100)) //this is the actually delay time on 1 second
                            }

                        ], function(err, step) {
                            //This function is called to resume the file looping going to the next line.
                            sitemapURLSLineReader.resume();
                        })
                    })
                });
            }
        ], function(err, results) {
            if (err) {
                console.log(err);
            }
            console.log("Google Sheet done!");
        });
    }

}

/*
  This function reads the 'sitemapURLS.txt', this also counts the line lengeth which should
  be used to show how many rows should be selected for the google spreadsheet.
*/
function getSitemapUrlLineLength() {
    var sitemapURLSLineReader = new LineByLineReader('./sitemapURLS.txt');
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


/*
    This function finds the ranking of a specific keyword, and search for the URL

    keywordURL: 
*/
function findKeywordRanking(keywordURL, keyword) {
    var keywordRank = 0;
    var finalRank = 99;
    var options = {
        query: keyword,
        limit: 10
    };

    googleScrape.search(options, function(err, url) {
        keywordRank++;

        if (url) {
            if (url.includes(keywordURL)) {
                console.log("KEYWORD FOUND at " + keywordRank);
                finalRank = keywordRank;
                return finalRank;
            } else {

            }
        }
    })
    return finalRank;
}

/*
    This take the str length of the canonical name and uses this website to determine key
    https://moz.com/ugc/geolocation-the-ultimate-tip-to-emulate-local-search
    strLength: This is the stringlength of the canonical name, used as the secret key
*/
function findSecretKeyForUULE(strlength) {
    switch (strlength) {
        case 20:
            return 'U';
            break;
        case 21:
            return 'V';
            break;
        case 22:
            return 'W';
            break;
        case 23:
            return 'X';
            break;
        case 24:
            return 'Y';
            break;
        case 25:
            return 'Z';
            break;
        case 26:
            return 'a';
            break;
        case 27:
            return 'b';
            break;
        case 28:
            return 'c';
            break;
        case 29:
            return 'd';
            break;
        case 30:
            return 'e';
            break;
        case 31:
            return 'f';
            break;
        case 32:
            return 'g';
            break;
        case 33:
            return 'h';
            break;
        case 34:
            return 'i';
            break;
        case 35:
            return 'j';
            break;
        case 36:
            return 'k';
            break;
        case 37:
            return 'l';
            break;
        case 38:
            return 'm';
            break;
        case 39:
            return 'n';
            break;
    }
}

/*
    This function provides the google localized search UULE.

    zipcode: The state zipcode
    state: The abbreviated state

    @return - This returns the string which is to be used to localized search
*/

function getWebsiteLocalizedSearchUULE(zipcode, state) {

    var uuleRoot = 'w+CAIQICI';
    var uule;

    madison.getStateName(state, function(stateFullName) {

        var uuleStringPrior = zipcode + ',' + stateFullName + ',United States';
        var uuleSecretKey = findSecretKeyForUULE(uuleStringPrior.length);
        var bytes = utf8.encode(uuleStringPrior);
        var canonEncoded = base64.encode(bytes);

        uule = uuleRoot + uuleSecretKey + canonEncoded;
    })

    return uule;
}
/*
    This function creates a custom google search then crawls the specific google search, only
    for the first 10 results. If ranking below 10, considered not to be ranking.

    uule - This is used to localize your searches.
    query - This is intended to be the google search query, usually the keyword.
    websiteRoot - The website URL you are looking to see if the keyword ranks.

    @return - If the websiteRoot is find in the results, return the rank.
              If no rank is found return 99
*/
function customGoogleSearch(uule, query, websiteRoot) {

    rootUrl = websiteRoot.split('//');
    var rank = 99;

    var GoogleSearch = 'http://www.google.com/search?q=' + query + '&uule=' + uule;

    request(GoogleSearch, function(error, response, body) {
        console.log("Running google search at: " + GoogleSearch);
        if (error) {
            console.log(error);
        }
        var $ = cheerio.load(body);


        var googleSearchCiteResults = [];
        $('cite').each(function(i, elem) {
            googleSearchCiteResults[i] = $(this).text();
        })

        setTimeout(function() {
            for (var i = 0; i < googleSearchCiteResults.length; i++) {
                if (googleSearchCiteResults[i].includes(rootUrl[1])) {
                    var realRank = i + 1;

                    var newResult = ({
                        websiteRoot: websiteRoot,
                        rank: realRank,
                        websiteFound: googleSearchCiteResults[i],
                        keyword: query,
                        dateFound: moment().format('MMM Do YYYY, h:mm:ss a')
                    });
                    console.log(newResult);
                    Results.create(newResult, function(err, newResultAdded) {
                        if (err) {
                            console.log(err);
                        }

                        console.log("New Result Added Successfully");
                    });

                    console.log(query + " ranks at " + realRank + ". The site found: " + googleSearchCiteResults[i]);
                }
            }
        }, 5000);

    })
}
