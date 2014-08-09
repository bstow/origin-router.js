var fs = require('fs'), path = require('path');

var package = require('./package.json'); // package

require(path.join(__dirname, 'src', package.name + '.js')); // test source

// license
var license = fs.readFileSync(path.join(__dirname, 'LICENSE'), 'utf8'); 
var longestLicenseLine = 0; // comment out license
license.split('\n').forEach(function(line) { longestLicenseLine = Math.max(longestLicenseLine, line.length); });
license = '/' + Array(longestLicenseLine).join('*') + '\n' + 
    license.trim() + '\n' + 
    Array(longestLicenseLine).join('*') + '/\n'; 

var source = fs.readFileSync(path.join(__dirname, 'src', package.name + '.js'), 'utf8'); // source
source = source.substring(0, source.indexOf('{ @! tests }') - '/*'.length).trim(); // remove tests from source
source = source.replace('{ @! version }', package.version); // inject version number

var build = [license, source].join('\n'); // assemble source for build
fs.writeFileSync(path.join(__dirname, package.name + '.js'), build, 'utf8'); // write build
fs.writeFileSync(path.join(__dirname, './builds/v.' + package.version + '.js'), build, 'utf8'); // write build

require(path.join(__dirname, package.name + '.js')); // test build