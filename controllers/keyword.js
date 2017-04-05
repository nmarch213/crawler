const Keyword = require('../models/keyword.js');
const Company = require('../models/company.js');
const winston = require('winston');
const mongoose = require('mongoose');



module.exports = {

	addNewKeyword: function(keyword, companyID, websiteRoot){

		var keyword = {
			keyword: keyword,
			websiteRoot: websiteRoot
		}

		Keyword.create(keyword, function(err, createdKeyword){
			if(err){
				winston.error("Error is keyword creation " + err);
			}

			Company.findOneAndUpdate(companyID, {$push: {"keywords" : createdKeyword._id}}, function(err, updatedCompany){
				if(err){
					winston.error("Error is adding keyword to company: " + err);
				}
				winston.info(createdKeyword.keyword + " has been added to company " + updatedCompany.name);
			})
			winston.info(createdKeyword.keyword + " has been added.");

		})
	}

}