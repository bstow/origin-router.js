(function() { 'use strict';
    var events = require('events'), path = require('path'), util = require('util');

    /* 
     * Route {class} - route for http requests
     * 
     * Route.prototype.constructor 
     *      @expression {string} - route expression 
     *      @options {object} - options
     *          .name {string} - route name 
     *          .method {string} - http method 
     *
     * Route.prototype.expression {string} - route expression
     *
     * Route.prototype.name {string} - route name
     *
     * Route.prototype.method {string} - http method 
     *
     * Route route {event} - occurs upon routing
     *      on {function}
     *          @args {object} - url encoded route arguments
     *          this {Route} - route
     */
    var Route = function(expression, options) {
        events.EventEmitter.call(this);

        var name, method; // options
        if (options != undefined) { name = options.name, method = options.method; }

        // getters
        Object.defineProperty(this, 'expression', {'get': function() { return expression; },
            'enumerable': true, 'configurable': false});
        Object.defineProperty(this, 'name', {'get': function() { return name; },
            'enumerable': true, 'configurable': false});
        Object.defineProperty(this, 'method', {'get': function() { return method; },
            'enumerable': true, 'configurable': false});
    };
    util.inherits(Route, events.EventEmitter);

    /* 
     * Router {class} - router for http requests 
     *
     * Router.prototype.constructor
     */
    var Router = module.exports.Router = function() {
        var routes = this.routes = {}; // all routes regardless of method
        var methods = this.routes.methods = { // routes segregated by method
            'get': {}, 'post': {}, 'put': {}, 'delete': {}, 'head': {}, 'options': {}, 'trace': {}, 'connect': {}
        };

        // setup route stores
        [routes].concat(Object.keys(methods).map(function (key) { return methods[key]; })).forEach(
            function(store) { store.by = {'name': {}, 'order': []}; } // store by name and order
        ); 
    };

    /* 
     * Router.prototype.define {function} - define a route 
     *      @expression {string} - route expression 
     *      @options {object} - options
     *          .name {string} - route name 
     *          .method {string} - http method 
     *      return {Route} - route
     */
    Router.prototype.define = function(expression, options) {
        var routes = this.routes, methods = this.routes.methods;

        var name, method; // options
        if (options != undefined) { name = options.name, method = options.method; }

        if (name != undefined && name in routes.by.name) { // duplicate name
            throw new Error("Couldn't define route '" + name + 
                "' because another route named '" + name + "' is already defined");
        }

        if (method != undefined) { // convert method to the associated store
            var store = methods[method.toLowerCase().trim()];

            if (store == undefined) { // no associated store
                throw new Error("Couldn't define route " + (name != undefined ? "\'" + name + "\'" + ' ' : '') + 
                    "because the method '" + method + "' is not recognized");
            }

            method = store;
        }

        var route = new Route(expression, options); // create route event emitter
        var subroutes = parse.route(expression); // parse expression into subroutes

        var data = {'route': route, 'subroutes': subroutes};

        var stores = [routes].concat( // collect the applicable stores
            method != undefined ? method : Object.keys(methods).map(function (key) { return methods[key]; }));
        stores.forEach(function(store) { 
            store.by.order.push(data); // store by order
            if (name != undefined) { store.by.name[name] = data; } // store by name
        });

        return route;
    };

    /* 
     * Router.prototype.route {function} - route a method and path
     *      @method {string} - http method {string}
     *      @pathname {string} - url encoded path
     */
    Router.prototype.route = function(method, pathname) {
        var routes = this.routes, methods = this.routes.methods;

        var store;
        if (method != undefined) { // convert method to the associated store
            var store = methods[method.toLowerCase().trim()];

            if (store == undefined) { // no associated store
                throw new Error("Couldn't route '" + pathname + 
                    "' because the method '" + method + "' is not recognized");
            }
        } else { store = routes; } // all routes

        var subpaths = parse.path(pathname);

        // find first matching route
        var length = store.by.order.length;
        for (var index = 0; index < length; index++) {
            var data = store.by.order[index];
            var route = data.route, subroutes = data.subroutes, onRoute = data.onRoute;

            var args = match(subroutes, subpaths); // arguments
            if (args != undefined) { // match
                route.emit('route', args); // emit route event
                return;
            }
        }
    };

    /* 
     * Router.prototype.path {function} - compose a path
     *      @name {string} - route name
     *      @args {object} - url encoded route arguments
     *      return {string} - url encoded path 
     */
    Router.prototype.path = function(name, args) {
        var routes  = this.routes;

        if (name in routes.by.name) { // compose path with the named route
            var subroutes = routes.by.name[name].subroutes;
            return compose(subroutes, args); 
        } else { throw new Error("No route named '" + name + "' exists"); }
    };

    /* [private]
     * parse {object}
     */
    var parse = {}; // parsing

    /* [private]
     * parse.route {function} - parse an expression into subroutes
     *      @expression {string} - route expression
     *      return {array<string|object>} - parts of the route 
     *          .name {string} - route parameter name
     *          .wildcard {boolean} - true if route parameter is wildcard 
     */
    parse.route = function(expression) {
        var last;

        var names = {}; // parameter names count
        var collision; // first parameter collision name

        expression = expression.trim();

        last = expression.length - 1;
        if (expression.charAt(last) === '/') { expression = expression.substring(0, last); }
        if (expression.charAt(0) === '/') { expression = expression.substring(1); }

        var subroutes = expression.split('/');
        subroutes.forEach(function(subroute, index, subroutes) { // parameters
            if (subroute.charAt(0) === ':') {
                last = subroute.length - 1;

                var wildcard = subroute.charAt(last) === '*';
                var name = wildcard ? subroute.substring(1, last) : subroute.substring(1);

                if (name in names) { // parameter name collision
                    if (collision == undefined) { collision = name; } 
                    names[name]++; // increment parameter name count
                } else { names[name] = 1; }

                var marker = {'name': name}; // parameter marker

                if (wildcard && index == subroutes.length - 1) { marker.wildcard = true; } // wildcard parameter

                subroutes[index] = marker; 
            } 
        });

        if (collision != undefined) {
            throw new Error("Route '" + expression + "' contains " + names[collision] + " parts named '" + collision + "'");
        }

        return subroutes;
    };

    /* [private]
     * parse.path {function} - parse path into encoded subpaths
     *      @pathname {string} - url encoded path
     *      return {array<string>} - url encoded parts of the path 
     */
    parse.path = function(pathname) {
        pathname = pathname.trim();

        // resolve dot directory subpaths for security
        pathname = path.resolve('/', path.normalize(pathname)); 

        var last = pathname.length - 1;
        if (pathname.charAt(last) === '/') { pathname = pathname.substring(0, last); }
        if (pathname.charAt(0) === '/') { pathname = pathname.substring(1); }

        var subpaths = pathname.split('/');

        return subpaths;
    };

    /* [private]
     * match {function} - match subroutes and subpaths
     *      @subroutes {array<string|object>} - parts of the route 
     *          .name {string} - route parameter name
     *          .wildcard {boolean} - true if route parameter is wildcard 
     *      @subpaths {array<string>} - url encoded parts of the path
     *      return {object} - url encoded route arguments
     */
    var match = function(subroutes, subpaths) {
        var args = {};
        var wildcard;

        var index;
        var length = subpaths.length;
        for (index = 0; index < length; index++) { // traverse subpaths and subroutes
            var subroute = subroutes[index];
            var subpath = subpaths[index];

            if (subroute == undefined) { return; } // match unsuccessful
            if (typeof subroute === 'string' || subroute instanceof String) {
                if (subroute == subpath) { continue; } // continue matching 
                else { return; } // match unsuccessful
            } else if (typeof subroute === 'object') { // parameter marker
                if (subroute.wildcard) { // wildcard
                    wildcard = subroute.name; // wildcard parameter name
                    break;
                } else { // parameter
                    args[subroute.name] = subpath; // store argument
                    continue; // continue matching
                }
            } else { break; } // end matching
        }

        if (wildcard != undefined) { 
            args[wildcard] = subpaths.slice(index).join('/'); // resolve wildcard parameter, store argument
        } else if (index != subroutes.length) { return; } // no match

        return args; // match
    };

    /* [private]
    * compose {function} - compose path from subroutes
    *       @subroutes {array<string|object>} - parts of the route 
    *           .name {string} - route parameter name
    *           .wildcard {boolean} - true if route parameter is wildcard 
    *       @args {object} - url encoded route arguments
    *       return {string} - url encoded path 
    */
    var compose = function(subroutes, args) {
        args = args || {};

        var subpaths = [];
        subroutes.forEach(function(subroute, index, route) { 
            if (typeof subroute === 'string' || subroute instanceof String) {
                subpaths.push(subroute);
            } else if (typeof subroute === 'object') { // parameter marker
                var arg = args[subroute.name];
                if (arg == undefined) { arg = ''; }

                if (subroute.wildcard) { 
                    subpaths.push(arg.charAt(0) === '/' ? arg.substring(1) : arg); // wildcard parameter
                } else { subpaths.push(arg); } // parameter
            }
        });

        var pathname = subpaths.join('/');
        if (pathname.charAt(0) !== '/') { pathname = '/' + pathname; }

        return pathname;
    };
})();

(function() { // tests
    var assert = require('assert');

    var router = new module.exports.Router(); // test router

    var result;

    result = {};
    var onRoute = function(args) { result = {'name': this.name, 'args': args}; };

    // define routes
    router.define('/path/:param1/:param2/:param3*', {'name': 'route 1'}).on('route', onRoute); // 1st route
    router.define('/path/:param1/:param2/', {'name': 'route 2'}).on('route', onRoute); // 2nd route
    router.define(':param1*/:param2/path', {'name': 'route 3'}).on('route', onRoute); // 3rd route
    router.define('%2F+path/file.ext', {'name': 'route 4'}).on('route', onRoute); // 4th route
    router.define('/method/:param1', {'name': 'get route', 'method': 'GET'}).on('route', onRoute); // GET route
    router.define('/method/:param1', {'name': 'post route', 'method': 'POST'}).on('route', onRoute); // POST route

    // define invalid routes
    assert.throws(
        function() { router.define('/path/:p1/:p2/:p2/:p1/:p2', {'method': 'get'}); }, 
        function(err) { return (err instanceof Error && /\s+3\s+/.test(err.message) && /p2/.test(err.message)); },
        'Defining a route with duplicate parameters did not fail as expected');
    assert.throws(
        function() { router.define('/invalid/method/:param1', {'name': 'bAd', 'method': 'INvalid'}); },
        function(err) { return (err instanceof Error && /INvalid/.test(err.message) && /bAd/.test(err.message)); },
        'Defining a route with an invalid method did not fail as expected');
    assert.throws(
        function() { router.define('/invalid/method/:param1', {'method': 'INvalid'}); },
        function(err) { 
            return (err instanceof Error && /INvalid/.test(err.message) && /route\sbecause/.test(err.message)); 
        },
        'Defining a route with an invalid method did not fail as expected');

    // define duplicate route name
    router.define('/duplicate/1', {'name': 'duplicate route name', 'method': 'DELete'}); 
    assert.throws(
        function() { router.define('/duplicate/2', {'name': 'duplicate route name', 'method': 'PUT'}); }, 
        /duplicate[\s]route/,
        'Defining a route with a duplicate name did not fail as expected'); 

    var result;

    // route path with 1st route
    router.route('POST', '/path/arg1/arg2/ /../a/r/g/3/');
    assert.strictEqual(result.name, 'route 1', 'The path did not match the 1st route');
    assert.strictEqual(result.args.param1, 'arg1', 
        "The path's 1st argument to the 1st route did not match the expected value");
    assert.strictEqual(result.args.param2, 'arg2', 
        "The path's 2nd argument to the 1st route did not match the expected value");
    assert.strictEqual(result.args.param3, 'a/r/g/3', 
        "The path's 3rd argument to the 1st route did not match the expected value");

    // route path with 2nd route
    router.route('get', 'path/arg1/arg2');
    assert.strictEqual(result.name, 'route 2', 'The path did not match the 2nd route');
    assert.strictEqual(result.args.param1, 'arg1', 
        "The path's 1st argument to the 2nd route did not match the expected value");
    assert.strictEqual(result.args.param2, 'arg2', 
        "The path's 2nd argument to the 2nd route did not match the expected value");

    // route path with 3rd route
    router.route(undefined, '/arg1/arg2/path/');
    assert.strictEqual(result.name, 'route 3', 'The path did not match the 3rd route');
    assert.strictEqual(result.args.param1, 'arg1', 
        "The path's 1st argument to the 3rd route did not match the expected value");
    assert.strictEqual(result.args.param2, 'arg2', 
        "The path's 2nd argument to the 3rd route did not match the expected value");

    // route path with 4th route
    router.route('Delete', '/../%2F+path/file.ext/');
    assert.strictEqual(result.name, 'route 4', 'The path did not match the 4th route');

    // route path with GET route
    router.route('  GEt ', '/method/get');
    assert.strictEqual(result.name, 'get route', 'The path did not match the GET route');
    router.route(undefined, '/method/all');
    assert.strictEqual(result.name, 'get route', 'The path did not match the GET route');

    // route path with POST route
    router.route('  poSt ', '/method/post');
    assert.strictEqual(result.name, 'post route', 'The path did not match the POST route');

    // route path with invalid method
    assert.throws(
        function() { router.route('  bad METHOD ', '/bad/method/path'); },
        function(err) { 
            return (err instanceof Error && /bad\sMETHOD/.test(err.message) && /bad[\/]method[\/]path/.test(err.message)); 
        },
        'Routing a path with an invalid method did not fail as expected');

    result = '';

    // assemble path with 1st route
    result = router.path('route 1', {'param1': 'arg1', 'param2': 'arg2', 'param3': '/a/r/g/3/'});
    assert.strictEqual(result, '/path/arg1/arg2/a/r/g/3/', 
        'The path assembled using the 1st route did not match the expected value');

    // assemble path with 2nd route
    result = router.path('route 2', {'param1': 'arg1', 'param2': 'arg2'});
    assert.strictEqual(result, '/path/arg1/arg2', 
        'The path assembled using the 2nd route did not match the expected value');

    // assemble path with 3rd route
    result = router.path('route 3', {'param1': 'arg1', 'param2': 'arg2'});
    assert.strictEqual(result, '/arg1/arg2/path', 
        'The path assembled using the 3rd route did not match the expected value');

    // assemble path with 4th route
    result = router.path('route 4');
    assert.strictEqual(result, '/%2F+path/file.ext', 
        'The path assembled using the 4th route did not match the expected value');

    // assemble path with invalid route
    assert.throws(function() { router.path('invalid route', {'param1': 'arg1', 'param2': 'arg2'}); }, /invalid[\s]route/,
        'Assembling a path with an invalid route did not fail as expected');
})();