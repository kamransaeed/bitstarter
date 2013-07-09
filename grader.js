#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = 'index.html';
var CHECKSFILE_DEFAULT = 'checks.json';
var URL_DEFAULT = 'http://shielded-atoll-7227.herokuapp.com/';

var assertFileExists = function(inFile) {
    var instr = inFile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting!", instr);
	process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlFile) {
    return cheerio.load(fs.readFileSync(htmlFile));
};

var cheerioHtmlData = function(htmlData) {
    return cheerio.load(htmlData);
};

var loadChecks = function(checksFile) {
    return JSON.parse(fs.readFileSync(checksFile));
};

var checkCheerioData = function($, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out  
};

var checkHtmlFile = function(htmlfile, checksfile) {
    return checkCheerioData(cheerioHtmlFile(htmlfile), checksfile);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var printJsonData = function(jsonData) {
    console.log(JSON.stringify(jsonData, null, 4));
};

var checkUrl = function(url, checksfile) {
    rest.get(url).on('complete', function(response) {
	if(response instanceof Error) {
	    console.log('Did not get response');
	    process.exit(1);
	} else {
	    var json = checkCheerioData(cheerioHtmlData(response), checksfile);
	    printJsonData(json);
	}});
};
    
if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Path to remote resource')
        .parse(process.argv);

    if(program.url){
	checkUrl(program.url, program.checks);
    } else {
	var checkJson = checkHtmlFile(program.file, program.checks);
	printJsonData(checkJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
