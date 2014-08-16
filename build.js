var fs = require('fs'), path = require('path');

var package = require('./package.json'); // package

require(path.join(__dirname, 'src', package.name + '.js')); // test source

// readme
var readme = '';

// examples
var examples = '';

// license
var license = fs.readFileSync(path.join(__dirname, 'LICENSE'), 'utf8');
var longestLicenseLine = 0; // comment out license
license.split('\n').forEach(function(line) { longestLicenseLine = Math.max(longestLicenseLine, line.length); });
license = '/' + Array(longestLicenseLine).join('*') + '\n' +
    license.trim() + '\n' +
    Array(longestLicenseLine).join('*') + '/\n';

// source
var source = fs.readFileSync(path.join(__dirname, 'src', package.name + '.js'), 'utf8'); // source
source = source.substring(0, source.indexOf('{ @! tests }') - '/*'.length).trim(); // remove tests from source
source = source.replace('{ @! name }', package.name); // inject name
source = source.replace('{ @! version }', package.version); // inject version number

// examples
var exampleStart = '{ @! example code start }';
var exampleEnd = '{ @! example code end }';
var firstExample = true;
while (true) {
    var exampleStartIndex = source.indexOf(exampleStart);
    if (exampleStartIndex == -1) { break; }

    var exampleEndIndex = source.indexOf(exampleEnd);
    if (exampleEndIndex == -1) { break; }

    var example = source.slice(exampleStartIndex + exampleStart.length, exampleEndIndex);
    var title;
    example = example.replace(/^\s*\[\s*(.+?)\s*\]/, function(match, $1) { title = $1; return ''; }); // extract title
    // right trim each line
    example = example.split('\n').map(function(line) { return line.replace(/\s*$/, ''); }).join('\n');
    example = example.trim();

    // add the example source to the examples executable
    examples += '\n';
    examples += '/**' + Array(title.length).join('*') + '***\n';
    examples += ' * ' + title + ' *\n';
    examples += ' **' + Array(title.length).join('*') + '***/' + Array(Math.max(50 - title.length, 0)).join(' ') +
        'console.log(' +
            JSON.stringify((firstExample ? '' : '\n') + title + '\n' + Array(title.length).join('-')) +
        ');\n\n';
    examples += example + '\n\n';

    // add the example source to the readme as an example for reference
    var readmeExample = '\n####' + title + '\n' + '```javascript\n' + example + '\n```\n\n';
    readme += readmeExample;

    // add the example to the source code as an example for reference
    var sourceExample = example.split('\n');
    sourceExample.unshift('');
    sourceExample.unshift((' ' + '[Example: ' + title + ']'));
    sourceExample = sourceExample.join('\n * ') + '\n ';

    // inject revised example into source
    source = source.slice(0, exampleStartIndex) +
        sourceExample +
        source.slice(exampleEndIndex + exampleEnd.length, source.length);

    firstExample = false;
}

var build = [license, source].join('\n'); // assemble source for build

// executable
fs.writeFileSync(path.join(__dirname, package.name + '.js'), build, 'utf8'); // write executable
require(path.join(__dirname, package.name + '.js')); // test executable

// versioned executable
fs.writeFileSync(path.join(__dirname, './builds/v.' + package.version + '.js'), build, // write versioned executable
    'utf8');
require(path.join(__dirname, './builds/v.' + package.version + '.js')); // test versioned executable

// examples executable
examples = "var Router = require('./" + package.name + '.js' + "\').Router;\n\n" + examples;
fs.writeFileSync(path.join(__dirname, './example.js'), examples, 'utf8'); // write example
// trap output of example to test for the expected outcome
var log = console.log;
var exampleOutputs = []; console.log = function() { exampleOutputs.push([].slice.call(arguments)); };
require(path.join(__dirname, './example.js')); // test example
console.log = log; // restore output
expectedExampleOutputLines = fs.readFileSync(path.join(__dirname, './resources/example-output.txt'),
    'utf8').split('\n');
exampleOutputs.join('\n').split('\n').forEach(function(exampleOutputLine, lineNumber) {
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

// readme
fs.writeFileSync(path.join(__dirname, './README.md'), readme, 'utf8'); // write readme