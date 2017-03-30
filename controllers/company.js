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

        newCompany = {
            name: name,
            url: url
        }
        Company.create(newCompany, function(err, addedCompany) {
            if (err) {
                winston.error("Add Company Error: " + err);
                return;
            }
            
            localizeSearch.getLocalizedUULE(url, addedCompany._id);

            winston.info(addedCompany.name + " has been successfully added.");
        });

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
