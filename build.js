var fs = require('fs'), path = require('path');

// ./package.json as an object
var package = require('./package.json'); // package

// include original source (./src/origin-router.js) to ensure it compiles and tests pass
require(path.join(__dirname, 'src', package.name + '.js'));

// generated text for ./readme.md
var readmeMarkdown = '';

// generated source code for ./example.js
var exampleSource = '';

// ./LICENSE text
var licenseText = fs.readFileSync(path.join(__dirname, 'LICENSE'), 'utf8');

// find the longest line in the license text for pretty formatting within source code
var longestLicenseTextLine = 0;
licenseText.split('\n').forEach(
    function(line) { longestLicenseTextLine = Math.max(longestLicenseTextLine, line.length); });

// source code compatible (commented out) license
var licenseSource = '/' + Array(longestLicenseTextLine).join('*') + '\n' +
    licenseText.trim() + '\n' +
    Array(longestLicenseTextLine).join('*') + '/\n';

// ./src/origin-router.js source code
var originalSource = fs.readFileSync(path.join(__dirname, 'src', package.name + '.js'), 'utf8');

// clean up original source and embed info
originalSource = originalSource.substring( // remove tests
    0, originalSource.indexOf('{ @! tests }') - '/*'.length).trim();
originalSource = originalSource.replace('{ @! name }', package.name); // embed name
originalSource = originalSource.replace('{ @! version }', package.version); // embed version number

// ./resources/example-output.txt text
var exampleCodeText = fs.readFileSync(path.join(__dirname, 'resources', 'example-code.txt'), 'utf8');

// examples
var EXAMPLE_START_SECTION = '{ @! example code section start }';
var EXAMPLE_END_SECTION = '{ @! example code section end }';

// example source code to embed in source
var sourceExampleSource = '';

var exampleStartSectionIndex = 0,
    exampleEndSectionIndex = 0,
    firstExampleSection = true;
while (true) { // iterate over each example section
    exampleStartSectionIndex = exampleCodeText.indexOf(EXAMPLE_START_SECTION, exampleEndSectionIndex);
    if (exampleStartSectionIndex == -1) { break; }

    exampleEndSectionIndex = exampleCodeText.indexOf(EXAMPLE_END_SECTION, exampleStartSectionIndex);
    if (exampleEndSectionIndex == -1) { break; }

    var exampleSectionSource = exampleCodeText.slice(
        exampleStartSectionIndex + EXAMPLE_START_SECTION.length, exampleEndSectionIndex);

    var exampleSectionTitle; // extract example section title
    exampleSectionSource = exampleSectionSource.replace(/^\s*\[\s*(.+?)\s*\]/,
        function(match, $1) { exampleSectionTitle = $1; return ''; });

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
            Array(exampleSectionTitle.length).join('-')) +
        ');\n\n';
    exampleSource += exampleSectionSource + '\n\n';

    // add the example section source code to the readme for reference
    var readmeExampleSectionMarkdown = '\n####' + exampleSectionTitle + '\n' +
        '```javascript\n' + exampleSectionSource + '\n```\n\n';
    readmeMarkdown += readmeExampleSectionMarkdown;

    // add the example section source code to the source code for reference
    var sourceExampleSectionSource = exampleSectionSource.split('\n');
    sourceExampleSectionSource.unshift('');
    sourceExampleSectionSource.unshift('[Example: ' + exampleSectionTitle + ']');
    sourceExampleSectionSource.unshift('');
    sourceExampleSectionSource.push('');
    sourceExampleSectionSource.push('');
    sourceExampleSectionSource = sourceExampleSectionSource.join('\n * ');
    sourceExampleSource += sourceExampleSectionSource;

    firstExampleSection = false;
}

originalSource = originalSource.replace('{ @! example code }', sourceExampleSource + '\n '); // embed examples;

var source = [licenseSource, originalSource].join('\n'); // assemble source code for build

// ./origin-router.js source code
fs.writeFileSync(path.join(__dirname, package.name + '.js'), source, 'utf8'); // write
require(path.join(__dirname, package.name + '.js')); // ensure compilation

// ./builds/v.{version number}.js source code
fs.writeFileSync(path.join(__dirname, './builds/v.' + package.version + '.js'), source, 'utf8'); // write
require(path.join(__dirname, './builds/v.' + package.version + '.js')); // ensure compilation

// ./example.js source code
exampleSource = "var Router = require('./" + package.name + '.js' + "\').Router;\n\n" + exampleSource;
fs.writeFileSync(path.join(__dirname, './example.js'), exampleSource, 'utf8'); // write

// trap output of ./example.js to test for the expected output (./resources/example-output.txt)
var log = console.log;
var exampleOut = []; console.log = function() { exampleOut.push([].slice.call(arguments)); };
// ./example.js
require(path.join(__dirname, './example.js')); // run
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

// ./readme markdown
fs.writeFileSync(path.join(__dirname, './README.md'), readmeMarkdown, 'utf8'); // write