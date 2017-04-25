var router = require('express').Router();
var Results = require('../models/quickResults.js');
var Company = require('../models/company.js');
var Keyword = require('../models/keyword.js');
var winston = require('winston');
var helpers = require('handlebars-helpers')();

const googleRunner = require('./../xmlcrawler/googleSpreadsheet');
const companyController = require('./../controllers/company.js');
const keywordController = require('./../controllers/keyword.js');


//homepage
router.get('/', function(req, res) {
    res.render('index');
})

router.post('/runGoogleAdder', function(req, res) {
    var url = req.body.url;
    var keywords = req.body.keywords;
    googleRunner.localizedKeywordSearch(url, keywords);
    res.redirect('/results');
});

router.post('/test', function(req, res) {
    var url = req.body.url;
    var company = req.body.company;
    companyController.addNewCompany(company, url);
    res.redirect('/company');
})

router.get('/company', function(req, res) {
    Company.find().populate('keywords').exec(function(err, companies) {
        if (err) {
            winston.error("Company Find Error: " + err);
        } else {
            res.render('company/index', { companies: companies })
        }
    })
})

router.get('/company/new', function(req, res) {
    res.render('company/new');
})

router.post('/company/:id/keywordSearch', function(req, res){
    keywordController.rankCompanyKeywords(req.params.id);
    res.redirect('/company/'+req.params.id);
})

router.get('/company/:id', function(req, res) {
    Company.findById(req.params.id).populate('keywords').exec(function(err, foundCompany) {
        var keywordLength = foundCompany.keywords.length;
        var lastSearch = foundCompany.keywords[keywordLength -1];
        res.render('company/show', { company: foundCompany, lastSearch: lastSearch, helpers: helpers })
    })
})


router.get('/results', function(req, res) {
    Results.find().sort({ date: -1 }).exec(function(err, results) {
        if (err) {
            console.log(err);
        } else {
            res.render('index/results', { results: results });
        }
    })
})

router.post('/keyword/:id/new', function(req, res) {
    var keyword = req.body.keyword;
    var companyID = req.params.id;
    var websiteRoot = req.body.websiteRoot;

    keywordController.addNewKeyword(keyword, companyID, websiteRoot);

    res.redirect('/company/' + companyID);
})

router.post('/keyword/:id/delete', function(req, res){
    Keyword.findByIdAndRemove(req.params.id, function(err, removedKeyword){
        winston.info(removedKeyword.keyword + " has been removed.");
    })

    res.redirect('/company');
})

module.exports = router;
