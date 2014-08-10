var fs = require('fs'), path = require('path');

var package = require('./package.json'); // package

require(path.join(__dirname, 'src', package.name + '.js')); // test source

// readme
var readme = '';

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
while (true) {
    var exampleStartIndex = source.indexOf(exampleStart);
    if (exampleStartIndex == -1) { break; }

    var exampleEndIndex = source.indexOf(exampleEnd);
    if (exampleEndIndex == -1) { break; }

    var example = source.slice(exampleStartIndex + exampleStart.length, exampleEndIndex);
    var title;
    example = example.replace(/^\s*\[\s*(.+?)\s*\]/, function(match, $1) { title = $1; return ''; }); // extract title
    example = example.trim();

    var readmeExample = '\n####' + title + '\n' + '```javascript\n' + example + '\n```\n\n';
    readme += readmeExample;

    var sourceExample = example.split('\n');
    sourceExample.unshift('');
    sourceExample.unshift((' ' + '[Example: ' + title + ']'));
    sourceExample = sourceExample.join('\n * ') + '\n ';
    
    // inject revised example into source
    source = source.slice(0, exampleStartIndex) + 
        sourceExample + 
        source.slice(exampleEndIndex + exampleEnd.length, source.length);
}

var build = [license, source].join('\n'); // assemble source for build
fs.writeFileSync(path.join(__dirname, package.name + '.js'), build, 'utf8'); // write build
fs.writeFileSync(path.join(__dirname, './builds/v.' + package.version + '.js'), build, 'utf8'); // write build

fs.writeFileSync(path.join(__dirname, 'README.md'), readme, 'utf8'); // write build

require(path.join(__dirname, package.name + '.js')); // test build