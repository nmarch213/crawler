const mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var Results = new Schema({
	websiteRoot: String,
	rank: Number,
	websiteFound: String,
	keyword: String,
	dateFound: String
});

module.exports = mongoose.model('Results', Results);