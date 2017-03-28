const request = require('request');
const cheerio = require('cheerio');


/*
    This function creates a custom google search then crawls the specific google search, only
    for the first 10 results. If ranking below 10, considered not to be ranking.

    uule - This is used to localize your searches.
    query - This is intended to be the google search query, usually the keyword.
    websiteRoot - The website URL you are looking to see if the keyword ranks.

    @return - If the websiteRoot is find in the results, return the rank.
              If no rank is found return 99
*/
function customGoogleSearch(uule, query, websiteRoot) {

    rootUrl = websiteRoot.split('//');
    var rank = 99;

    var GoogleSearch = 'http://www.google.com/search?q=' + query + '&uule=' + uule;

    request(GoogleSearch, function(error, response, body) {
        console.log("Running google search at: " + GoogleSearch);
        if (error) {
            console.log(error);
        }
        var $ = cheerio.load(body);


        var googleSearchCiteResults = [];
        $('cite').each(function(i, elem) {
            googleSearchCiteResults[i] = $(this).text();
        })

        setTimeout(function() {
            for (var i = 0; i < googleSearchCiteResults.length; i++) {
                if (googleSearchCiteResults[i].includes(rootUrl[1])) {
                    var realRank = i + 1;

                    var newResult = ({
                        websiteRoot: websiteRoot,
                        rank: realRank,
                        websiteFound: googleSearchCiteResults[i],
                        keyword: query,
                        dateFound: moment().format('MMM Do YYYY, h:mm:ss a')
                    });
                    console.log(newResult);
                    Results.create(newResult, function(err, newResultAdded) {
                        if (err) {
                            console.log(err);
                        }

                        console.log("New Result Added Successfully");
                    });

                    console.log(query + " ranks at " + realRank + ". The site found: " + googleSearchCiteResults[i]);
                }
            }
        }, 5000);

    })
}
