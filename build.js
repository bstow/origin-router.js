var fs = require('fs'), path = require('path');

require('./src/router.js'); // test source

var package = require('./package.json'); // package

// license
var license = fs.readFileSync(path.join(__dirname, 'LICENSE'), 'utf8'); 
var longestLicenseLine = 0; // comment out license
license.split('\n').forEach(function(line) { longestLicenseLine = Math.max(longestLicenseLine, line.length); });
license = '/' + Array(longestLicenseLine).join('*') + '\n' + 
    license.trim() + '\n' + 
    Array(longestLicenseLine).join('*') + '/\n'; 

var source = fs.readFileSync(path.join(__dirname, 'src/router.js'), 'utf8'); // source
source = source.substring(0, source.indexOf('/*{ @! tests }*/')).trim(); // remove tests from source

var build = [license, source].join('\n'); // assemble source for build
fs.writeFileSync(path.join(__dirname, 'router.js'), build, 'utf8'); // write build
fs.writeFileSync(path.join(__dirname, './builds/router.' + package.version + '.js'), build, 'utf8'); // write build

require('./router.js'); // test build