const request = require('request');
const cheerio = require('cheerio');
const madison = require('madison');
const utf8 = require('utf8');
const base64 = require('base-64');

module.exports = {

    /**
     * @param  {string} websiteRoot - The root website, this is usesd to get the
     * 								  zipcode, and postal code for uule generation.
     * 								  
     * @return {string} uule - This is the uule to localize each search.
     */
    getLocalizedUULE: function(websiteRoot) {

        var uule;

        request(websiteRoot, function(error, response, body) {
            if (error) {
                console.log("Error: " + error);
                return;
            }
            if (response.statusCode === 200) {
                var $ = cheerio.load(body);

                var zipcode = $('span[itemprop=postalCode]').text();
                var state = $('span[itemprop=addressRegion]').text();
                uule = getWebsiteLocalizedSearchUULE(zipcode, state);
            }
        })

        return uule;
    }
}

/*
    This function provides the google localized search UULE.

    zipcode: The state zipcode
    state: The abbreviated state

    @return - This returns the string which is to be used to localized search
*/

/**
 * @param  {number} zipcode - The state zipcode
 * @param  {string} state - The abbreviated state
 * @return {string} uule - This is the uule that has been generated
 */
function getWebsiteLocalizedSearchUULE(zipcode, state) {

    var uuleRoot = 'w+CAIQICI';
    var uule;

    madison.getStateName(state, function(stateFullName) {

        var uuleStringPrior = zipcode + ',' + stateFullName + ',United States';
        var uuleSecretKey = findSecretKeyForUULE(uuleStringPrior.length);
        var bytes = utf8.encode(uuleStringPrior);
        var canonEncoded = base64.encode(bytes);

        uule = uuleRoot + uuleSecretKey + canonEncoded;
    })

    return uule;
}

/**
 * This take the str length of the canonical name and uses this website to determine key
 * https://moz.com/ugc/geolocation-the-ultimate-tip-to-emulate-local-search
 * 
 * @param  {number} strLength - This is the length of the cannonical string.
 * @return {char} secretKey - This is the key found.
 */
function findSecretKeyForUULE(strlength) {
    switch (strlength) {
        case 20:
            return 'U';
            break;
        case 21:
            return 'V';
            break;
        case 22:
            return 'W';
            break;
        case 23:
            return 'X';
            break;
        case 24:
            return 'Y';
            break;
        case 25:
            return 'Z';
            break;
        case 26:
            return 'a';
            break;
        case 27:
            return 'b';
            break;
        case 28:
            return 'c';
            break;
        case 29:
            return 'd';
            break;
        case 30:
            return 'e';
            break;
        case 31:
            return 'f';
            break;
        case 32:
            return 'g';
            break;
        case 33:
            return 'h';
            break;
        case 34:
            return 'i';
            break;
        case 35:
            return 'j';
            break;
        case 36:
            return 'k';
            break;
        case 37:
            return 'l';
            break;
        case 38:
            return 'm';
            break;
        case 39:
            return 'n';
            break;
    }
}
