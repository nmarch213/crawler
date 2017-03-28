const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * This is the company object that will be stored in the database
 * @type {Schema}
 * @param {name} - Name of the company
 * @param {url} - Root Url of the company
 * @param {keywords} - These are the keywords that have been searched for using this tool.
 */

var Company = new Schema({
    name: String,
    url: String,
    keywords: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Keyword"
    }]
});

module.exports = mongoose.model('Company', Company);
