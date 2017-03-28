var Company = require('../models/company.js');
var mongoose = require('mongoose');
var localizeSearch = require('../ranker/localizeSearch.js');
var winston = require('winston');

module.exports = {

	/**
	 * This adds a company to the database.
	 * 
	 * @param {string} name - The company Name
	 * @param {string} url - The company url
	 */
	addNewCompany: function(name, url){
		var newCompany = {
			name: name,
			url: url,
			uule: localizeSearch.getLocalizedUULE(url)
		}

		Company.create(newCompany, function(err, addedCompany){
			if(err){
				winston.error(err);
			}
			winston.info(addedCompany.name + " has been successfully added.");
		});
	},



}
