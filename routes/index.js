var router = require('express').Router();

const googleRunner = require('./../xmlcrawler/googleSpreadsheet');


//homepage
router.get('/', function(req, res) {
      res.render('index');
})

router.post('/runGoogleAdder', function(req, res){
	var url = req.body.url;
	googleRunner.addContentToGoogleSpreadsheet(url);
	res.render('index');
})

module.exports = router;