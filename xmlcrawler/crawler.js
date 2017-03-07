const parser = require('xml-parser');
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');

module.exports = {

  crawlXmlSitemap: function(websiteRoot){

    var sitemapURLs = [];

    //This is the website XML sitemap you will be crawling
    var sitemapUrl = websiteRoot + "/sitemap.xml";
    console.log("Currently Crawling: " + sitemapUrl);
    request(sitemapUrl, function(error, response, body) {
       if(error) {
         console.log("Error: " + error);
         return;
       }
       // Check status code (200 is HTTP OK)
       console.log("Status code: " + response.statusCode);
       if(response.statusCode === 200) {
         // Parse the document body
         var $ = cheerio.load(body,{
           xmlmode: true
         });
         //Parses the website and puts it into a string
         parsedXmlString = $(body).text();

         //This creates an array of individual strings that are from the xml file
         var arrayOfParsedXml = parsedXmlString.split(" ");
         var urls = [];

         //regular expression to find a URl
         var expression = '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})';
         var regex = new RegExp(expression);

         //Loops through the array of strings that were split, and looks to
         //find the URL's using the REGEX above.
        fs.truncate('./sitemapURLS.txt', 0, function(){console.log('Rewriting Sitemaps!')})
         for (var i = 0; i < arrayOfParsedXml.length; i++) {
           //Loop through the array of strings lookign to see if there is a URl
           if(arrayOfParsedXml[i].match(regex)){
             //If a URl is found, add it to the final URLS list
             urls.push(arrayOfParsedXml[i]);
             fs.appendFile("./sitemapURLS.txt", arrayOfParsedXml[i], function(err) {
                if (err) {
                    return console.log(err)
                }
            });
           };

         }

       }
    });

  }


}