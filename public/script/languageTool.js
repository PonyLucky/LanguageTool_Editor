// Class LanguageTool
// Description: LanguageTool is a JavaScript class that provides a
//              language detection tool for the browser.
//              We will fetch the correction from the server and
//              return the result to the caller.

// To check a text, fetch 'IP/v2/check' with the following parameters:
// - text: the text to be checked
// - language: the language of the text
// - level: 'picky' or 'normal' (default)
// Response is a JSON object:
// {
//     "software": {
//         "name": "LanguageTool",
//         "version": "6.0-SNAPSHOT",
//         "buildDate": "2022-12-13 13:51:03 +0000",
//         "apiVersion": 1,
//         "premium": true,
//         "premiumHint": "You might be missing errors only the Premium version can find. Contact us at support<at>languagetoolplus.com.",
//         "status": ""
//     },
//     "warnings": {
//         "incompleteResults": false
//     },
//     "language": {
//         "name": "French",
//         "code": "fr",
//         "detectedLanguage": {
//             "name": "French",
//             "code": "fr",
//             "confidence": 0.594,
//             "source": "ngram"
//         }
//     },
//     "matches": [
//         {
//             "message": "Le déterminant s’accorde avec le nom ‘tests’.",
//             "shortMessage": "",
//             "replacements": [
//                 {
//                     "value": "des tests"
//                 },
//                 {
//                     "value": "un test"
//                 }
//             ],
//             "offset": 9,
//             "length": 8,
//             "context": {
//                 "text": "Ceci est un tests.",
//                 "offset": 9,
//                 "length": 8
//             },
//             "sentence": "Ceci est un tests.",
//             "type": {
//                 "typeName": "Other"
//             },
//             "rule": {
//                 "id": "D_N",
//                 "subId": "1",
//                 "sourceFile": "grammar.xml",
//                 "description": "Concordance du déterminant avec le nom",
//                 "issueType": "uncategorized",
//                 "category": {
//                     "id": "AGREEMENT",
//                     "name": "Concordances"
//                 },
//                 "isPremium": false
//             },
//             "ignoreForIncompleteSentence": true,
//             "contextForSureMatch": -1
//         }
//     ],
//     "sentenceRanges": [
//         [
//             0,
//             18
//         ]
//     ]
// }
// 
// From the response object, we need to extract :
// - matches

// To get all languages, fetch 'IP/v2/languages', response is a JSON object :
// [
//     {
//         "name": "string",
//         "code": "string",
//         "longCode": "string"
//     }
// ]


// Constructor
function LanguageTool(url) {
    this.server = url;
    this.languages = null;
}

// Get all languages
LanguageTool.prototype.getLanguages = function() {
    if (this.languages == null) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", this.server + "/v2/languages", false);
        xmlhttp.send();
        this.languages = JSON.parse(xmlhttp.responseText);
    }
    // Remove parentheses from language names and remove duplicates
    var languages = [];
    for (var i = 0; i < this.languages.length; i++) {
        var language = this.languages[i];
        var name = language.name;
        var index = name.indexOf('(');
        if (index != -1) {
            name = name.substring(0, index);
        }
        language.name = name.trim();
        
        // Check if the language name is already in the list
        var found = false;
        for (var j = 0; j < languages.length; j++) {
            if (languages[j].name == language.name) {
                found = true;
                break;
            }
        }
        if (!found) {
            languages.push(language);
        }
    }
    this.languages = languages;
    return this.languages;
}

// Check a text
LanguageTool.prototype.check = function(text, language, level) {
    var encodedText = encodeURIComponent(text);
    var encodedLanguage = encodeURIComponent(language);
    var encodedLevel = encodeURIComponent(level);
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", this.server + "/v2/check?text=" + encodedText + "&language=" + encodedLanguage + "&level=" + encodedLevel, false);
    xmlhttp.send();
    return JSON.parse(xmlhttp.responseText);
}

// Check a text asynchronously
LanguageTool.prototype.checkAsync = function(text, language, level, callback) {
    var encodedText = encodeURIComponent(text)
    var encodedLanguage = encodeURIComponent(language);
    var encodedLevel = encodeURIComponent(level);
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(JSON.parse(this.responseText));
        }
    };
    xmlhttp.open("GET", this.server + "/v2/check?text=" + encodedText + "&language=" + encodedLanguage + "&level=" + encodedLevel, true);
    xmlhttp.send();
}

// Get checks matches
LanguageTool.prototype.getChecks = function(text, language, level) {
    var response = this.check(text, language, level);
    return response.matches;
}

// Get checks matches asynchronously
LanguageTool.prototype.getChecksAsync = function(text, language, level, callback) {
    this.checkAsync(text, language, level, function(response) {
        callback(response.matches);
    });
}