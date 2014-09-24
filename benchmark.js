/*******************************************************************************
Description:    Benchmarking script
*******************************************************************************/

var orouter = require('./src/router.js');

var TOTAL_ROUTES        = 25,
    TOTAL_URL_PATHS     = 100000;

var MAX_SUBROUTES       = 5,
    MAX_SUBPATHS        = MAX_SUBROUTES;

var PARTS               = ['dog', 'cat', 'fish', 'bird'],
    PARAMETER_SYMBOL    = ':',
    TRAILING_SYMBOLS    = ['', '/', '/?'],
    DELINEATOR          = '/';

// router
var router = new orouter.Router();

var successCount    = 0,
    failCount       = 0;

router.on('success', function() { successCount++; });
router.on('fail',    function() { failCount++; });

// routes
for (var i = 0; i < TOTAL_ROUTES; i++) {
    var numSubroutes        = Math.max(1, Math.round(Math.random() * MAX_SUBROUTES));
    var leadingSlash        = Math.random() < .5 ? DELINEATOR : '';
    var trailingSymbol      = TRAILING_SYMBOLS[Math.floor(Math.random() * TRAILING_SYMBOLS.length)];

    var subroutes = [];
    for (var j = 0; j < numSubroutes; j++) {
        var isParameter = Math.random() < .5;
        var casingFunc  = 'to' + (Math.random() < .5 ? 'Lower' : 'Upper') + 'Case';
        subroutes.push(
                (isParameter ? PARAMETER_SYMBOL : '') +
                PARTS[Math.floor(Math.random() * PARTS.length)][casingFunc]() +
                (isParameter ? j : '')
            );
    }

    var expression =
        leadingSlash +
        subroutes.join(DELINEATOR) +
        trailingSymbol;

    var ignoreCase  = Math.random() < .5;
    var method      = Math.random() < .5 ? 'GET' : 'POST';

    router.add(expression, {
            'ignoreCase':   ignoreCase,
            'method':       method
        });
}

// requests
var requests = [];
for (var i = 0; i < TOTAL_URL_PATHS; i++) {
    var numSubpaths         = Math.max(1, Math.round(Math.random() * MAX_SUBPATHS));
    var leadingSlash        = Math.random() < .5 ? DELINEATOR : '';
    var trailingSlash       = Math.random() < .5 ? DELINEATOR : '';

    var subpaths = [];
    for (var j = 0; j < numSubpaths; j++) {
        var casingFunc = 'to' + (Math.random() < .5 ? 'Lower' : 'Upper') + 'Case';
        subpaths.push(
                PARTS[Math.floor(Math.random() * PARTS.length)][casingFunc]()
            );
    }

    var path =
        leadingSlash +
        subpaths.join(DELINEATOR) +
        trailingSlash;

    var method = Math.random() < .5 ? 'GET' : 'POST';

    requests.push({
            'path':   path,
            'method': method
        });
}

console.log('Running Benchmarks ...\n');

// benchmarks
var startTime = Date.now();
var requestsLength = requests.length;
for (var i = 0; i < requestsLength; i++) {
    var request = requests[i];
    router.route(request.path, {'method': request.method});
}
var endTime = Date.now();

// report
console.log('# Routes:                    ' + TOTAL_ROUTES);
console.log('# Requests:                  ' + TOTAL_URL_PATHS);
console.log('% Hit:                       ' + (Math.round(successCount / requestsLength * 100)).toFixed(0) + '%');
console.log('% Miss:                      ' + (Math.round(failCount / requestsLength * 100)).toFixed(0) + '%');
console.log('Avg. Route Time / Request:   ' + (((endTime - startTime) / requestsLength) / 1000).toFixed(8) + 's');
console.log('# Routed Requests / Second:  ' + ((1000 / ((endTime - startTime) / requestsLength))).toFixed(0));



