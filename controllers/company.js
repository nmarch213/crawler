var Company = require('../models/company.js');
var mongoose = require('mongoose');
var localizeSearch = require('../ranker/localizeSearch.js');
var winston = require('winston');
var async = require('async');

module.exports = {

    /**
     * This adds a company to the database.
     * 
     * @param {string} name - The company Name
     * @param {string} url - The company url
     */
    addNewCompany: function(name, url) {
    	var newCompany;
        var uule = 'test 2';

        async.series([
            function getLocalizedUULE(step) {
                uule = localizeSearch.getLocalizedUULE(url);
                setTimeout(function() {
                	winston.info("here is the uule " + uule);
                    step();
                }, 5000);
            },

            function setNewCompany(step) {
                newCompany = {
                    name: name,
                    url: url,
                    uule: uule
                }
                winston.info("here is the uule " + uule);
                step();
            }
        ], function(err, results) {
            Company.create(newCompany, function(err, addedCompany) {
                if (err) {
                    winston.error("Add Company Error: " + err);
                    return;
                }
                winston.info("here is the uule " + uule);
                winston.info(addedCompany.name + " has been successfully added.");
            });
        })

        // var uule = localizeSearch.getLocalizedUULE(url);

        // setTimeout(function() {
        //     var newCompany = {
        //         name: name,
        //         url: url,
        //         uule: uule
        //     }

        //     Company.create(newCompany, function(err, addedCompany) {
        //         if (err) {
        //             winston.error("Add Company Error: " + err);
        //             return;
        //         }
        //         winston.info("here is the uule " + uule);
        //         winston.info(addedCompany.name + " has been successfully added.");
        //     });
        // }, 5000)

    },

    /**
     * This finds a specific company's information given the ID
     * 
     * @param  {string} companyID - The mongodb generated ID
     * @return {object} foundCompany - The specific company found 
     */
    getCompany: function(companyID) {
        Company.find({ companyID }).populate("keywords").exec(function(err, foundCompany) {
            if (err) {
                winston.error("Get Company error: " + err);
                return;
            }
            winston.info(foundCompany + " has been found.");
            return foundCompany;
        })
    }


}
