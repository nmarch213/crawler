const Keyword = require('../models/keyword.js');
const Company = require('../models/company.js');
const winston = require('winston');
const mongoose = require('mongoose');
const Ranker = require('../ranker/ranker.js');
const request = require('request');
const moment = require('moment');
const cheerio = require('cheerio');



module.exports = {

    addNewKeyword: function(keyword, companyID, websiteRoot) {

        var keyword = {
            keyword: keyword,
            websiteRoot: websiteRoot
        }
        winston.error(companyID)
        Keyword.create(keyword, function(err, createdKeyword) {
            if (err) {
                winston.error("Error is keyword creation " + err);
            }

            Company.findOneAndUpdate({ _id: companyID }, { $push: { "keywords": createdKeyword._id } }, function(err, updatedCompany) {
                if (err) {
                    winston.error("Error is adding keyword to company: " + err);
                }
                winston.info(createdKeyword.keyword + " has been added to company " + updatedCompany.name);
            })
            winston.info(createdKeyword.keyword + " has been added.");

        })
    },

    rankCompanyKeywords: function(companyID) {
        Company.findById(companyID).populate("keywords").exec(function(err, foundCompany) {
            if (err) {
                winston.error(err);
            }

            for (var i = 0; i < foundCompany.keywords.length; i++) {
                Keyword.findById((foundCompany.keywords[i]._id), function(err, foundKeyword) {
                    var GoogleSearch = 'http://www.google.com/search?q=' + foundKeyword.keyword + '&uule=' + foundCompany.uule;
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

                            var isKeywordRanking = false;
                            var rootUrl = foundCompany.url.split('//');

                            for (var i = 0; i < googleSearchCiteResults.length; i++) {
                                if (googleSearchCiteResults[i].includes(rootUrl[1])) {
                                    var realRank = i + 1;
                                    isKeywordRanking = true;

                                    Keyword.findByIdAndUpdate({ _id: foundKeyword._id }, { $push: { rank: realRank, websiteFound: googleSearchCiteResults[i], date: moment().format('MMM Do YYYY, h:mm:ss a'), $position: 0 } }, function(err, updatedKeyword) {
                                        winston.info("Keyword: " + updatedKeyword.keyword + " was updated for the comapny: " + foundCompany.name);
                                    })


                                    console.log(foundKeyword.keyword + " ranks at " + realRank + ". The site found: " + googleSearchCiteResults[i]);
                                }
                            }
                            if (isKeywordRanking == false) {
                                var realRank = i + 1;
                                isKeywordRanking = true;

                                Keyword.findByIdAndUpdate({ _id: foundKeyword._id }, { $push: { rank: -1, websiteFound: "None", date: moment().format('MMM Do YYYY, h:mm:ss a') } }, function(err, updatedKeyword) {
                                    winston.info("Keyword: " + updatedKeyword.keyword + " was updated for the comapny: " + foundCompany.name);
                                })


                                console.log(foundKeyword.keyword + " ranks at " + realRank + ". The site found: " + googleSearchCiteResults[i]);
                            }
                        }, 5000);
                    })
                })
            }
        })
    }

}
