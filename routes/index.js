var router = require('express').Router();
var Results = require('../models/quickResults.js');

const googleRunner = require('./../xmlcrawler/googleSpreadsheet');


//homepage
router.get('/', function(req, res) {
      res.render('index');
})

router.post('/runGoogleAdder', function(req, res){
	var url = req.body.url;
	var keywords = req.body.keywords;
	googleRunner.localizedKeywordSearch(url, keywords);
	res.redirect('/results');
});

router.get('/results', function(req, res){
	Results.find().sort({created: 1}).exec(function(err, results){
		if(err){
			console.log(err);
		}else{
			res.render('index/results', {results:results});
		}
	})
})

module.exports = router;