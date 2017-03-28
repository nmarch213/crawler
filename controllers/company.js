var Company = require('../models/company.js');
var mongoose = require('mongoose');

module.exports = {

	addNewCompany: function(name, url, keywords){
		var newCompany = {
			name: name,
			url: url,
			keywords: []
		}

		for (var i = 0; i < keywords.length; i++) {
			keywords[i]
		}
	}

}
