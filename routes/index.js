var router = require('express').Router();

const googleRunner = require('./../xmlcrawler/googleSpreadsheet');


//homepage
router.get('/', function(req, res) {
      res.render('index');
})

router.post('/runGoogleAdder', function(req, res){
	var url = req.body.url;
	var keywords = req.body.key;
	googleRunner.localizedKeywordSearch(url, keywords);
	res.render('index');
})

module.exports = router;