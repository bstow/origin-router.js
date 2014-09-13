/*
 * run {function}                   - run the unit tests
 *      module.exports.run
 *      @orouter {module}           - router module to unit test
 *      return {undefined}
 */
var run = function(orouter) { 'use strict'; // run tests
    var assert  = require('assert'),
        http    = require('http'),
        url     = require('url');

    var router = new orouter.Router(); // test router

    var result,
        request;

    result      = {};
    var onRoute = function(event) { result = {'name': this.name, 'args': event.arguments, 'data': event.data}; };

    // add routes
    // 1.                   //  "' path '" ...
    var firstRoute = router.add("/%27 path%20'/:param1/:param2/:param3*",               // 1st route
        {'name': 'route 1', 'encoded': true}, onRoute);
    // 2.
    router.add("/' path '/:param1/:param2/", {'name': 'route 2'}).on('route', onRoute); // 2nd route
    // 3.
    router.add(':param1*/:param2/path', {'name': 'route 3'}).on('route', onRoute);      // 3rd route
    // 4.                                      '/ path' ...
    var fourthRoute = new orouter.Route('%2F%20path/file.ext',                   // 4th route
        {'name': 'route 4', 'method': ['delete ', 'Get'], 'ignoreCase': true, 'encoded': true});
    assert.strictEqual(router.add(fourthRoute, onRoute), fourthRoute);
    // 5.
    router.add('/', {'name': 'route 5'}, onRoute);                                      // 5th route

    // add constrained routes
    var constraints;
    // 1.
    constraints = function(args) {
        return args.param1 != 'not 1' && args.param2 != 'not 1' && this.expression.indexOf('constrain') != -1;
    };
    router.add('/constraint/:param1/:param2',                           // 1st constrained route
        {'name': 'constrained route 1', 'method': ['connect'], 'constraints': constraints}).on('route', onRoute);
    // 2.
    constraints = {'param1': /^(?!(?:not\s2)).*$/, 'param2': /^(?!(?:not\s2)).*$/, 'param3': /^(?!(?:not\s2)).*$/};
    var routeConstraint2 = router.add('/constraint/:param1/:param2',    // 2nd constrained route
        {'name': 'constrained route 2', 'method': 'connect', 'constraints': constraints}).on('route', onRoute);
    // 3.
    constraints = {'param1': ['not 1', 'not 2'], 'param2': /^not\s[1-2]$/};
    router.add('/constraint/:param1/:param2',                           // 3rd constrained route
        {'name': 'constrained route 3', 'method': 'connect', 'constraints': constraints}).on('route', onRoute);
    // 4.
    constraints = {
        'param1': function(arg) { return arg === 'arg 1' && this.name === 'constrained route 4'; },
        'param2': ['arg 2'],
        'param3': ['arg 3', 'arg 4', 'arg 5']};
    router.addPost('constraint/:param1/:param2/:param3*',               // 4th constrainted route
        {'name': 'constrained route 4', 'constraints': constraints}).on('route', onRoute);
    // 5.
    constraints = {
        'param1': /arg\s1/,
        'param3': /arg\s[3-6]/};
    router.addPost('constraint/:param1/:param2/:param3*',               // 5th constrainted route
        {'name': 'constrained route 5', 'constraints': constraints}).on('route', onRoute);

    // add method-specific routes
    // GET.
    router.addGet('get route', '/method/:param1', {'name': 'overridden name'}).on('route', onRoute);    // GET route
    // POST.
    router.add('/method/:param1', {'name': 'post route', 'method': 'POST'}).on('route', onRoute);       // POST route
    var routeGetPost = router.add('get/post/:param', // GET & POST route
        {'name': 'get & post route', 'method': ['POST', 'GET', 'POST', ' pOsT ']});
    routeGetPost.on('route', onRoute);

    // add invalid routes
    // 1.
    assert.throws(
        function()    { router.add('/path/:p1/:p2/:p2/:p1/:p2', {'method': 'get'}); },
        function(err) { return (err instanceof Error && /\s+3\s+/.test(err.message) && /p2/.test(err.message)); },
        'Defining a route with duplicate parameters did not fail as expected');
    // 2.
    assert.throws(
        function()    { router.add('/invalid/method/:param1', {'name': 'bAd', 'method': ['GET', 'INvalid']}); },
        function(err) { return (err instanceof Error && /INvalid/.test(err.message) && /bAd/.test(err.message)); },
        'Defining a route with an invalid method did not fail as expected');
    // 3.
    assert.throws(
        function()    { router.add('/invalid/method/:param1', {'method': 'INvalid'}); },
        function(err) {
            return (err instanceof Error && /INvalid/.test(err.message) && /route\sbecause/.test(err.message));
        },
        'Defining a route with an invalid method did not fail as expected');
    // 4.
    assert.throws(
        function() { router.add('/invalid/constraints/:p1', {'name': 'bad constraints', 'constraints': 'invalid'}); },
        function(err) {
            return (err instanceof Error &&
                /bad\sconstraints/.test(err.message) && /contraints\sare\sinvalid/.test(err.message));
        },
        'Defining a route with invalid constraints did not fail as expected');
    // 5.
    assert.throws(
        function() {
            router.add('/invalid/constraint/:param1',
                {'name': 'bad constraint', 'constraints': {'p1': /v1/, 'param1': 'value1'}});
        },
        function(err) {
            return (err instanceof Error && /bad\sconstraint/.test(err.message) &&
                /param1/.test(err.message) && /regular\sexpression/.test(err.message));
        },
        'Defining a route with an invalid constraint did not fail as expected');
    // 6.
    assert.throws(
        function() {
            router.add('/invalid/constraint/:param1',
                {'name': 'bad constraint', 'constraints': {'p1': /v1/, 'param1': ['value1', 1, '1']}});
        },
        function(err) {
            return (err instanceof Error && /bad\sconstraint/.test(err.message) &&
                /param1/.test(err.message) && /regular\sexpression/.test(err.message));
        },
        'Defining a route with an invalid constraint did not fail as expected');
    // 7.
    assert.throws(
        function() {
            router.addGet(new orouter.Route('/no/add/get/route/object',
                {'name': 'cant method add route object'}));
        },
        function(err) {
            return (err instanceof Error && /addGet/.test(err.message));
        },
        'Adding a route instance with an HTTP method-specific add method did not fail as expected');

    // add duplicate route name
    // 1.
    router.addConnect('/duplicate/1', {'name': 'duplicate route name', 'method': ['options', 'DELete']});
    // 2.
    assert.throws(
        function() { router.add('/duplicate/2', {'name': 'duplicate route name', 'method': 'PUT'}); },
        /duplicate[\s]route/,
        'Defining a route with a duplicate name did not fail as expected');
    // 3.
    assert.throws(
        function() {
            router.add(new orouter.Route('/duplicate/3',
                {'name': 'duplicate route name', 'method': ['options', 'GET']}));
        },
        /duplicate[\s]route/,
        'Defining a route with a duplicate name did not fail as expected');

    // get routes
    var result = router.getRoute('route 1');
    assert.strictEqual(result, firstRoute, 'The returned route did not match the 1st route');

    // route path with 1st route
    router.route("/'%20path%20%27/%20arg 1/%27arg2%27/ /./../a/r/g%20/3/", {'method': 'POST', 'data': '1st data'});
    assert.strictEqual(result.name, 'route 1', 'The path did not match the 1st route');
    assert.strictEqual(result.args.param1, ' arg 1',
        "The path's 1st argument to the 1st route did not match the expected value");
    assert.strictEqual(result.args.param2, "'arg2'",
        "The path's 2nd argument to the 1st route did not match the expected value");
    assert.deepEqual(result.args.param3, [' ', '.', '..', 'a', 'r', 'g ', '3'],
        "The path's 3rd argument to the 1st route did not match the expected value");
    assert.strictEqual(result.data, '1st data', 'The route data received did not match the route data submitted');

    // route paths with 2nd route
    var callback = {'result': {}};
    router.route("%27 path%20'/arg1/arg2",
        function(e) { callback.result = {'name': this.name, 'args': e.arguments}; });
    assert.strictEqual(callback.result.name, 'route 2', 'The path did not match the 2nd route');
    assert.strictEqual(callback.result.args.param1, 'arg1',
        "The path's 1st argument to the 2nd route did not match the expected value");
    router.route('path/arg1/arg2', {'method': 'get'},
        function(event) { callback.result = {'name': this.name, 'args': event.arguments}; });
    assert.strictEqual(result.name, 'route 2', 'The path did not match the 2nd route');
    assert.strictEqual(callback.result.name, 'route 2', 'The path did not match the 2nd route');
    assert.strictEqual(result.args.param1, 'arg1',
        "The path's 1st argument to the 2nd route did not match the expected value");
    assert.strictEqual(callback.result.args.param1, 'arg1',
        "The path's 1st argument to the 2nd route did not match the expected value");
    assert.strictEqual(result.args.param2, 'arg2',
        "The path's 2nd argument to the 2nd route did not match the expected value");
    assert.strictEqual(callback.result.args.param2, 'arg2',
        "The path's 2nd argument to the 2nd route did not match the expected value");

    // route path with 3rd route
    router.route('/arg1/arg2/path/');
    assert.strictEqual(result.name, 'route 3', 'The path did not match the 3rd route');
    assert.strictEqual(result.args.param1, 'arg1',
        "The path's 1st argument to the 3rd route did not match the expected value");
    assert.strictEqual(result.args.param2, 'arg2',
        "The path's 2nd argument to the 3rd route did not match the expected value");
    router.route(url.parse('http://host.domain:3000/arg1/arg2/path/'));
    assert.strictEqual(result.name, 'route 3', 'The path did not match the 3rd route');
    request = new http.IncomingMessage();
    request.url = 'http://host.domain:3000/arg1/arg2/path/';
    router.route(request);
    assert.strictEqual(result.name, 'route 3', 'The path did not match the 3rd route');

    // route path with 4th route
    router.route('/%2f%20path/file.EXT/', {'method': 'Delete'});
    assert.strictEqual(result.name, 'route 4', 'The path did not match the 4th route');

    // route path with 5th route
    router.route('/', {'method': 'GET'});
    assert.strictEqual(result.name, 'route 5', 'The path did not match the 5th route');
    router.route('', {'method': 'POST'});
    assert.strictEqual(result.name, 'route 5', 'The path did not match the 5th route');

    // route paths with constrained routes
    // 1.
    router.route('/constraint/1/1', {'method': 'connect'});
    assert.strictEqual(result.name, 'constrained route 1', 'The path did not match the 1st constrained route');
    // 2.
    router.route('/constraint/1/not%201', {'method': 'connect'});
    assert.strictEqual(result.name, 'constrained route 2', 'The path did not match the 2nd constrained route');
    // 3.
    router.route('/constraint/not%202/not 1', {'method': 'connect'});
    assert.strictEqual(result.name, 'constrained route 3', 'The path did not match the 3rd constrained route');
    // 4.
    router.routePost('/constraint/arg%201/arg 2/arg 3/arg 5');
    assert.strictEqual(result.name, 'constrained route 4', 'The path did not match the 4th constrained route');
    // 5.
    router.routePost('/constraint/arg%201/arg 2/arg 3/arg 5/arg 6');
    assert.strictEqual(result.name, 'constrained route 5', 'The path did not match the 5th constrained route');

    // route path with GET route
    router.route('/method/get', {'method': '  GEt '});
    assert.strictEqual(result.name, 'get route', 'The path did not match the GET route');
    router.route('method/all');
    assert.strictEqual(result.name, 'get route', 'The path did not match the GET route');

    // route path with POST route
    router.routePost('/method/post');
    assert.strictEqual(result.name, 'post route', 'The path did not match the POST route');
    request = new http.IncomingMessage();
    request.url = '/method/post';
    request.method = 'POST';
    router.route(request);
    assert.strictEqual(result.name, 'post route', 'The path did not match the POST route');

    // route path with GET & POST route
    assert.strictEqual(routeGetPost, router.route('/get/post/method', {'method': 'GEt'}),
        'The path did not match the GET & POST route');
    assert.strictEqual(result.name, 'get & post route', 'The path did not match the GET & POST route');
    assert.strictEqual(routeGetPost, router.route('/get/post/method', {'method': 'POST '}),
        'The path did not match the GET & POST route');
    assert.strictEqual(result.name, 'get & post route', 'The path did not match the GET & POST route');
    assert.strictEqual(undefined, router.route('/get/post/method', {'method': 'connect '}),
        'The path matched a route');

    // route path with invalid method
    assert.throws(
        function()    { router.route('/bad/method/path', {'method': '  bad METHOD '}); },
        function(err) {
            return (err instanceof Error &&
                /bad\sMETHOD/.test(err.message) && /bad[\/]method[\/]path/.test(err.message));
        },
        'Routing a path with an invalid method did not fail as expected');

    result = '';

    // generate path with 1st route
    // 1.
    result = router.path('route 1', {'param1': 'arg/1', 'param2': 'arg2', 'param3': '/a/r/g/3/'});
    assert.strictEqual(result, "/%27 path%20'/arg%2F1/arg2/%2Fa%2Fr%2Fg%2F3%2F",
        'The path generated using the 1st route did not match the expected value');
    // 1.
    eval('result = ' + firstRoute.pathSourceCode);
    result = result({'param1': 'arg/1', 'param2': 'arg2', 'param3': '/a/r/g/3/'});
    assert.strictEqual(result, "/%27 path%20'/arg%2F1/arg2/%2Fa%2Fr%2Fg%2F3%2F",
        'The path generated using the 1st route did not match the expected value');
    // 1.
    result = router.path('route 1', {'param1': 'arg/1', 'param2': 'arg2', 'param3': ['arg ', 3]});
    assert.strictEqual(result, "/%27 path%20'/arg%2F1/arg2/arg%20/3",
        'The path generated using the 1st route did not match the expected value');
    // 1.
    eval('result = ' + router.pathSourceCode('route 1'));
    result = result({'param1': 'arg/1', 'param2': 'arg2', 'param3': ['arg ', 3]});
    assert.strictEqual(result, "/%27 path%20'/arg%2F1/arg2/arg%20/3",
        'The path generated using the 1st route did not match the expected value');

    // generate path with 2nd route
    // 2.
    result = router.path('route 2', {'param1': 'arg1', 'param2': 'arg2'});
    assert.strictEqual(result, '/' + encodeURIComponent("' path '") + '/arg1/arg2',
        'The path generated using the 2nd route did not match the expected value');
    // 2.
    eval('result = ' + router.pathSourceCode('route 2'));
    result = result({'param1': 'arg1', 'param2': 'arg2'});
    assert.strictEqual(result, '/' + encodeURIComponent("' path '") + '/arg1/arg2',
        'The path generated using the 2nd route did not match the expected value');

    // generate path with 3rd route
    // 3.
    result = router.path('route 3', {'param1': 'arg 1', 'param2': 'arg 2'});
    assert.strictEqual(result, '/arg%201/arg%202/path',
        'The path generated using the 3rd route did not match the expected value');
    // 3.
    eval('result = ' + router.pathSourceCode('route 3'));
    result = result({'param1': 'arg 1', 'param2': 'arg 2'});
    assert.strictEqual(result, '/arg%201/arg%202/path',
        'The path generated using the 3rd route did not match the expected value');

    // generate path with 4th route
    // 4.
    result = fourthRoute.path();
    assert.strictEqual(result, '/%2F%20path/file.ext',
        'The path generated using the 4th route did not match the expected value');
    // 4.
    eval('result = ' + router.pathSourceCode('route 4'));
    result = result();
    assert.strictEqual(result, '/%2F%20path/file.ext',
        'The path generated using the 4th route did not match the expected value');

    // generate path with constrained routes
    // 1.
    assert.throws(
        function() { router.path('constrained route 1', {'param1': 'not 1', 'param2': '1'}); },
        function(err) {
            return (err instanceof Error &&
                /constrained\sroute\s1/.test(err.message) && /one\sor\smore/.test(err.message));
        },
        'Generating a path with the 1st constrained route and an invalid argument did not fail as expected');
    // 2.
    assert.throws(
        function() { router.path('constrained route 2', {'param1': 'not 2', 'param2': '2'}); },
        function(err) {
            return (err instanceof Error &&
                /constrained\sroute\s2/.test(err.message) && /param1/.test(err.message) && /not\s2/.test(err.message));
        },
        'Generating a path with the 2nd constrained route and an invalid argument did not fail as expected');
    // 3.
    result = router.path('constrained route 3', {'param1': 'not 1', 'param2': 'not 2'});
    assert.strictEqual(result, '/constraint/not%201/not%202',
        'The path generated using the 3rd constrained route did not match the expected value');
    // 3.
    result = router.path('constrained route 3', {'param2': 'not 2'});
    assert.strictEqual(result, '/constraint//not%202',
        'The path generated using the 3rd constrained route did not match the expected value');
    // 4.
    result = router.path('constrained route 4', {'param1': 'arg 1', 'param2': 'arg 2', 'param3': 'arg 3'});
    assert.strictEqual(result, '/constraint/arg%201/arg%202/arg%203',
        'The path generated using the 4th constrained route did not match the expected value');
    // 4.
    result = router.path('constrained route 4', {'param1': 'arg 1', 'param2': 'arg 2', 'param3': ['arg 3', 'arg 4']});
    assert.strictEqual(result, '/constraint/arg%201/arg%202/arg%203/arg%204',
        'The path generated using the 4th constrained route did not match the expected value');
    // 4.
    result = router.path('constrained route 4', {'param1': 'arg 1', 'param2': 'arg 2', 'param3': ['arg 3', 'arg 4']});
    assert.strictEqual(result, '/constraint/arg%201/arg%202/arg%203/arg%204',
        'The path generated using the 4th constrained route did not match the expected value');
    // 4.
    assert.throws(
        function() {
            router.path('constrained route 4', {'param1': 'arg 1', 'param2': 'arg 2', 'param3': ['arg 3', 'arg 7']});
        },
        function(err) {
            return (err instanceof Error &&
                /constrained\sroute\s4/.test(err.message) && /param3/.test(err.message) && /arg\s7/.test(err.message));
        },
        'Generating a path with the 2nd constrained route and an invalid argument did not fail as expected');

    // generate path with invalid route
    assert.throws(function() { router.path('invalid route', {'param1': 'arg1', 'param2': 'arg2'}); },
        /invalid[\s]route/, 'Generating a path with an invalid route did not fail as expected');

    result = '';

    // router events
    // on 'add'
    router.once('add', function(event) {
        if (event.route.name !== 'added-route') { return; }
        if (this !== router) { return; }
        result = 'add';
    });
    router.add('/added/route', {'name': 'added-route', 'method': 'Options'});
    assert.strictEqual(result, 'add', "The router 'add' event did not occur as expected");
    // on 'fail'
    router.once('fail', function(event) {
        if (event.pathname !== '/*/*/*/no/matching/route/*/*/*/' || event.method !== '  Get') { return; }
        if (event.data !== 'pass-to-listener')                                                { return; }
        if (this !== router)                                                                  { return; }
        result = 'fail';
    });
    router.route('/*/*/*/no/matching/route/*/*/*/', {'method': '  Get', 'data': 'pass-to-listener'});
    assert.strictEqual(result, 'fail', "The router 'fail' event did not occur as expected");
    // on 'success'
    router.once('success', function(event) {
        if (event.pathname !== '/%27%20path%20%27/arg1/arg2/arg3' || event.method !== 'PoST')   { return; }
        if (event.data.info !== 'pass-to-listener')                                             { return; }
        if (this !== router || event.route !== firstRoute || event.arguments.param1 !== 'arg1') { return; }
        result = 'success';
    });
    router.route('/%27%20path%20%27/arg1/arg2/arg3', {'method': 'PoST', 'data': {'info': 'pass-to-listener'}});
    assert.strictEqual(result, 'success', "The router 'success' event did not occur as expected");

    // basejoin
    // 1.
    result = orouter.basejoin('../base/path/a/b/c/d/e/f/..',
        '..', ['..', undefined, '.', 'X', '..', 'rel'], 0, undefined, '.', 1, 2, 3, '..', 'pa/th');
    assert.strictEqual(result, '../base/path/a/b/c/d/e/rel/0/1/2/pa/th',
        "The basejoin function did not return the expected result");
    // 2.
    result = orouter.basejoin();
    assert.strictEqual(result, undefined, "The basejoin function did not return the expected result");
    // 3.
    result = orouter.basejoin(undefined, 'a', 'b', 'c');
    assert.strictEqual(result, undefined, "The basejoin function did not return the expected result");

};
module.exports.run = run;

// run the tests on the original source
var orouter = require('../src/origin-router.js');
run(orouter);