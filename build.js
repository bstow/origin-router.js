var fs      = require('fs'),
    http    = require('http'),
    path    = require('path'),
    orouter;

var log; // console.log holder

// ./package.json as an object
var package = require('./package.json'); // package

// unit tests
var test = require(path.join(__dirname, 'test.js'));

// benchmarks
// trap output of ./benchmark.js
var log = console.log;
var benchmarkOut = []; console.log = function() { benchmarkOut.push([].slice.call(arguments)); };
// run ./benchmark.js
require(path.join(__dirname, './benchmark.js'));
console.log = log; // restore output

// benchmark output
var benchmarkOutput = benchmarkOut.join('\n');

// include original source (./src/router.js) to ensure it compiles
orouter = require(path.join(__dirname, './src/router.js'));
test.run(orouter); // run test against the compiled source

// generated text for ./readme.md
var readmeMarkdown = '';
// readme text for the introduction
var readmeIntroductionMarkdown = '';
// readme text for the table of contents
var readmeTOCMarkdown = '';
// links to generate and embed in markdown
var readmeMarkdownLinks = {};
// array of example sections in markdown
var readmeExampleSectionMarkdowns = [];
// readme badges
var readmeMarkdownBadges = [{
        'src':    'http://img.shields.io/travis/bstow/' + package.name + '.js.svg?style=flat-square',
        'href':   'https://travis-ci.org/bstow/'        + package.name + '.js'
    }, {
        'src':    'http://img.shields.io/npm/v/'        + package.name + '.svg?style=flat-square',
        'href':   'https://www.npmjs.org/package/'      + package.name
    }, {
        'src':    'http://img.shields.io/npm/l/'        + package.name + '.svg?style=flat-square',
        'href':   'LICENSE'
    }];

// generated source code for ./example.js
var exampleSource = '';

// ./LICENSE text
var licenseText = fs.readFileSync(path.join(__dirname, 'LICENSE'), 'utf8');

// find the longest line in the license text for pretty formatting within source code
var longestLicenseTextLine = 0;
licenseText.split('\n').forEach(
    function(line) { longestLicenseTextLine = Math.max(longestLicenseTextLine, line.length); });

// line length for generated lines in source
var sourceLineLength = Math.max(80, longestLicenseTextLine);

// source code compatible (commented out) license
var licenseSource = '/' + Array(sourceLineLength).join('*') + '\n' +
    licenseText.trim() + '\n' +
    Array(sourceLineLength).join('*') + '/\n';

// ./src/router.js source code
var originalSource = fs.readFileSync(path.join(__dirname, './src/router.js'), 'utf8');

// clean up original source and embed info
originalSource = originalSource.trim();
// source code compatible info
var infoSource = Array(sourceLineLength - 1).join('*') + '\n' +
    'Name:           ' + package.name.split('-').join(' ').split(' ').map(function(word) {
        return word.charAt(0).toUpperCase() + word.substring(1); }).join(' ') + '\n' +
    'Version:        ' + package.version + '\n' +
    'Description:    ' + package.description + '\n' +
    Array(sourceLineLength - 1).join('*');
originalSource = originalSource.replace('@![info]', infoSource); // embed info

// ./resources/example-code.txt text
var exampleCodeText     = fs.readFileSync(path.join(__dirname, 'resources', 'example-code.txt'), 'utf8');
exampleCodeText         = exampleCodeText.replace('@![main]', package.main); // embed name

var DOCUMENTATION_INTRODUCTION_MARKDOWN_START_SECTION    = '@![intro <<]';
var DOCUMENTATION_INTRODUCTION_MARKDOWN_END_SECTION      = '@![>> intro]';

var DOCUMENTATION_TOC_MARKDOWN_START_SECTION    = '@![toc <<]';
var DOCUMENTATION_TOC_MARKDOWN_END_SECTION      = '@![>> toc]';

// ./resources/documentation.md
var documentationMarkdown = fs.readFileSync(path.join(__dirname, 'resources', 'documentation.md'), 'utf8');

// extract documentation introduction
var documentationStartIntroductionMarkdownIndex = documentationMarkdown.indexOf(
                                                        DOCUMENTATION_INTRODUCTION_MARKDOWN_START_SECTION);
var documentationEndIntroductionMarkdownIndex   = documentationMarkdown.indexOf(
                                                        DOCUMENTATION_INTRODUCTION_MARKDOWN_END_SECTION);

var documentationIntroductionMarkdown = documentationMarkdown.slice(
    documentationStartIntroductionMarkdownIndex + DOCUMENTATION_INTRODUCTION_MARKDOWN_START_SECTION.length,
    documentationEndIntroductionMarkdownIndex);

documentationMarkdown = documentationMarkdown.substring(0, documentationStartIntroductionMarkdownIndex) +
    documentationMarkdown.substring(
        documentationEndIntroductionMarkdownIndex + DOCUMENTATION_INTRODUCTION_MARKDOWN_END_SECTION.length);

// extract documentation TOC
var documentationStartTOCMarkdownIndex  = documentationMarkdown.indexOf(DOCUMENTATION_TOC_MARKDOWN_START_SECTION);
var documentationEndTOCMarkdownIndex    = documentationMarkdown.indexOf(DOCUMENTATION_TOC_MARKDOWN_END_SECTION);

var documentationTOCMarkdown = documentationMarkdown.slice(
    documentationStartTOCMarkdownIndex + DOCUMENTATION_TOC_MARKDOWN_START_SECTION.length,
    documentationEndTOCMarkdownIndex);

documentationMarkdown = documentationMarkdown.substring(0, documentationStartTOCMarkdownIndex) +
    documentationMarkdown.substring(documentationEndTOCMarkdownIndex + DOCUMENTATION_TOC_MARKDOWN_END_SECTION.length);

// add documentation to readme
readmeMarkdown += "##<a name='documentation'>Router Documentation\n\n";
readmeMarkdown += '<br>\n<br>\n\n';
readmeMarkdown += documentationMarkdown;

// examples
var EXAMPLE_START_SECTION   = '@![example section <<]';
var EXAMPLE_END_SECTION     = '@![>> example section]';

var EXAMPLE_START_CLEAN   = '@![example clean <<]';
var EXAMPLE_END_CLEAN     = '@![>> example clean]';

// example source code to embed in source
var sourceExampleSource = '';

readmeTOCMarkdown += '###[Examples of Using the Router](#examples)\n';

var exampleStartSectionIndex    = 0,
    exampleEndSectionIndex      = 0,
    firstExampleSection         = true;
while (true) { // iterate over each example section
    exampleStartSectionIndex = exampleCodeText.indexOf(EXAMPLE_START_SECTION, exampleEndSectionIndex);
    if (exampleStartSectionIndex == -1) { break; }

    exampleEndSectionIndex = exampleCodeText.indexOf(EXAMPLE_END_SECTION, exampleStartSectionIndex);
    if (exampleEndSectionIndex == -1) { break; }

    var exampleSectionSource = exampleCodeText.slice(
        exampleStartSectionIndex + EXAMPLE_START_SECTION.length, exampleEndSectionIndex);

    var exampleSectionIdentifier; // extract example section identifier
    var exampleSectionTitle; // extract example section title
    exampleSectionSource = exampleSectionSource.replace(/^\s*\[\s*(.+?)\s*[:]\s*(.+?)\s*\]/,
        function(match, $1, $2) { exampleSectionIdentifier = $1, exampleSectionTitle = $2; return ''; });

    exampleSectionSource = exampleSectionSource.split('\n').map( // right trim each line of the example section
        function(line) { return line.replace(/\s*$/, ''); }).join('\n');
    exampleSectionSource = exampleSectionSource.trim();

    // add the example section source to the example source code
    exampleSource += '\n';
    exampleSource += '/**' + Array(exampleSectionTitle.length).join('*') + '***\n';
    exampleSource += ' * ' + exampleSectionTitle + ' *\n';
    exampleSource += ' **' + Array(exampleSectionTitle.length).join('*') + '***/' +
        Array(Math.max(50 - exampleSectionTitle.length, 0)).join(' ') +
        'console.log(' +
            JSON.stringify((firstExampleSection ? '' : '\n') + exampleSectionTitle + '\n' +
            Array(exampleSectionTitle.length + 1).join('-')) +
        ');\n\n';
    exampleSource += exampleSectionSource + '\n\n';

    // allow for the gerneration of example links
    readmeMarkdownLinks['example_' + exampleSectionIdentifier] = 'Example: ' + exampleSectionTitle;

    // add the example section source code to the readme for reference
    var readmeExampleSectionMarkdown = "####<a name='" + 'example_' + exampleSectionIdentifier + "'>" +
        'Example: ' + exampleSectionTitle + '\n' +
        '```javascript\n' + exampleSectionSource + '\n```';
    readmeExampleSectionMarkdowns.push(readmeExampleSectionMarkdown);

    readmeTOCMarkdown += '* [' + 'Example: ' + exampleSectionTitle + ']' +
        '(#' + 'example_' + exampleSectionIdentifier + ')' + '\n';

    // add the example section source code to the source code for reference
    var sourceExampleSectionSource = exampleSectionSource.split('\n');
    sourceExampleSectionSource.unshift('');

    var sourceExampleSectionSourceTitleLine = 'Example: ' + exampleSectionTitle;
    sourceExampleSectionSourceTitleLine = '**** ' + sourceExampleSectionSourceTitleLine + ' ' +
         Array(Math.max(sourceLineLength - sourceExampleSectionSourceTitleLine.length - 9, 0)).join('*');
    sourceExampleSectionSource.unshift(sourceExampleSectionSourceTitleLine);

    sourceExampleSectionSource.unshift('');
    sourceExampleSectionSource.push('');
    sourceExampleSectionSource.push('');
    sourceExampleSectionSource = sourceExampleSectionSource.join('\n // ');

    if (firstExampleSection) { sourceExampleSource += Array(sourceLineLength - 2).join('*') + '/'; }
    sourceExampleSource += sourceExampleSectionSource;

    firstExampleSection = false;
}
sourceExampleSource += '\n //' + Array(sourceLineLength - 4).join('*');

// prepend example sections to the readme
var readmeExamplesMarkdown = '';
readmeExamplesMarkdown += "###<a name='examples'>Examples of Using the Router\n\n";
readmeExamplesMarkdown += '<br>\n\n';
readmeExamplesMarkdown += readmeExampleSectionMarkdowns.join('\n\n<br>\n\n') + '\n\n';
readmeExamplesMarkdown += '<br>\n<br>\n\n';
readmeMarkdown = readmeExamplesMarkdown + readmeMarkdown;

originalSource = originalSource.replace('@![examples]', sourceExampleSource); // embed examples

var source = [licenseSource, originalSource].join('\n'); // assemble source code for build

// ./origin-router.js source code
fs.writeFileSync(path.join(__dirname, package.main), source, 'utf8'); // write
orouter = require(path.join(__dirname, package.main)); // ensure compilation
test.run(orouter); // run tests against the compiled source

// ./example.js source code
fs.writeFileSync(path.join(__dirname, './example.js'), exampleSource, 'utf8'); // write

// trap output of ./example.js to test for the expected output (./resources/example-output.txt)
log = console.log;
var exampleOut = []; console.log = function() { exampleOut.push([].slice.call(arguments)); };
// capture the server used in ./example.js upon creation to allow for it to be shutdown afterwards
var httpCreateServer = http.createServer;
var exampleServer;
http.createServer = function() {
    exampleServer = httpCreateServer.apply(http, arguments);
    return exampleServer;
};
var shutdownExampleServer = function() { exampleServer.close(); }
// ./example.js
require(path.join(__dirname, './example.js')); // run
shutdownExampleServer(); // shutdown the server used in ./example.js
http.createServer = httpCreateServer; // restore http create server
console.log = log; // restore output
// ./resources/example-output.txt text lines
expectedExampleOutputLines = fs.readFileSync(path.join(__dirname, './resources/example-output.txt'),
    'utf8').split('\n');
exampleOut.join('\n').split('\n').forEach(function(exampleOutputLine, lineNumber) {
    if (lineNumber >= expectedExampleOutputLines.length) {
        throw new Error('Example output was longer than expected');
    }

    if (exampleOutputLine.trim() !== expectedExampleOutputLines[lineNumber].trim()) {
        throw new Error(
            "Example output was different than expected ('" +
                exampleOutputLine + "' did not match '" + expectedExampleOutputLines[lineNumber] + "' " +
                'on line ' + (lineNumber + 1) + ")");
    };
});

// add the documentation introduction and TOC to the ./readme markdown

readmeIntroductionMarkdown = documentationIntroductionMarkdown;

documentationTOCMarkdown = '\n<br>\n\n' + '###[Router Documentation](#documentation)\n' +
    documentationTOCMarkdown;
readmeTOCMarkdown += documentationTOCMarkdown;

readmeMarkdown = (
        readmeIntroductionMarkdown + '\n\n<br>\n<br>\n\n' +
        readmeTOCMarkdown + '\n\n<br>\n<br>\n\n' +
        readmeMarkdown
    );

// embed markdown links
for (var readmeMarkdownLinkAnchor in readmeMarkdownLinks) {
    var readmeMarkdownLinkTitle = readmeMarkdownLinks[readmeMarkdownLinkAnchor];
    var readmeMarkdownLink      = '[' + readmeMarkdownLinkTitle + ']' + '(#' + readmeMarkdownLinkAnchor + ')';
    readmeMarkdown = readmeMarkdown.split('@![link ' + readmeMarkdownLinkAnchor + ']').join(readmeMarkdownLink);
}

// add build status to the ./readme markdown
var readmeMarkdownBadgeReferenceMarkdownLines = [];
readmeMarkdown = readmeMarkdownBadges.map(function(badge, index) {
        var count = index + 1;
        readmeMarkdownBadgeReferenceMarkdownLines = readmeMarkdownBadgeReferenceMarkdownLines.concat([
            '[badgeSource' + count + ']: '  + badge.src,
            '[badgeLink' + count + ']: '    + badge.href
        ]);
        return '[![Badge][badgeSource' + count + ']][badgeLink' + count + ']';
    }).join('&nbsp;\n') +
    '\n\n' +
    readmeMarkdownBadgeReferenceMarkdownLines.join('\n') +
    '\n\n<br>\n<br>\n\n' + readmeMarkdown;

// ./readme markdown
fs.writeFileSync(path.join(__dirname, './README.md'), readmeMarkdown, 'utf8'); // write