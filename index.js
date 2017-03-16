var express = require('express');
var bodyParser = require("body-parser");


var app = express();

//Routes
var indexRoutes = require('./routes/index.js');

// set up handlebars view engine
var handlebars = require('express-handlebars')
  .create({ defaultLayout:'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({extended: true}));

app.set('port', process.env.PORT || 3000);

//index routes
app.use(indexRoutes);

app.listen(app.get('port'), function(){
  console.log( 'SEOCrawl Live ' +
    app.get('port') + '; press Ctrl-C to terminate.' );
});