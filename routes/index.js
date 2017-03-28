var router = require('express').Router();
var Results = require('../models/quickResults.js');
var Company = require('../models/company.js');
var winston = require('winston');

const googleRunner = require('./../xmlcrawler/googleSpreadsheet');
const companyController = require('./../controllers/company.js');


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
    Company.find().exec(function(err, companies) {
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

router.get('/results', function(req, res) {
    Results.find().sort({ date: -1 }).exec(function(err, results) {
        if (err) {
            console.log(err);
        } else {
            res.render('index/results', { results: results });
        }
    })
})

module.exports = router;
