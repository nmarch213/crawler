var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * This is a specific keyword that has been searched for
 * @type {Schema}
 * @param {keyword} - The keyword/phrase being search
 * @param {websiteRoot} - The root website to search for (used to get localized search)
 *
 * The following parameters are Arrays because each search, these 3 variables will
 * update so you can track rankings over time
 * 
 * @param {websiteFound} - The website found during the search
 * @param {rank} - The current rank for the specific search
 * @param {date} - The date the search was made
 */
var Keyword = new Schema({
    keyword: String,
    websiteRoot: String,
    websiteFound: [],
    rank: [],
    date: []
});

module.exports = mongoose.model('Keyword', Keyword);
