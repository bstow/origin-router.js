(function() { 'use strict';
    var path = require('path');

    /* router class */
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

    /* define a route
     * @method - http method {string}
     * @name - route name {string}
     * @route - route expression {string}
     * @func - function to execute upon routing {
     *      function(
     *          @name - route name {string}
     *          @args - route arguments {object}
     *      )} */
    Router.prototype.define = function(method, name, expression, func) {
        var routes = this.routes, methods = this.routes.methods;

        if (name != undefined && name in routes.by.name) { // duplicate name
            throw new Error("Couldn't define route '" + name + 
                "' because another route named '" + name + "' is already defined");
        }

        if (method != undefined) { // convert method to the associated store
            var store = methods[method.toLowerCase().trim()];

            if (store == undefined) { // no associated store
                throw new Error("Couldn't define route '" + name + 
                    "' because the method '" + method + "' is not recognized");
            }

            method = store;
        }

        var data = {'name': name, 'subroutes': parse.route(expression), 'func': func};

        var stores = [routes].concat( // collect the applicable stores
            method != undefined ? method : Object.keys(methods).map(function (key) { return methods[key]; }));
        stores.forEach(function(store) { 
            store.by.order.push(data); // store by order
            if (name != undefined) { store.by.name[name] = data; } // store by name
        });
    };

    /* route a path
     * @method - http method {string}
     * @pathname - path {string}
     * return result of the route's function {?} */
    Router.prototype.route = function(method, pathname) {
        var routes = this.routes, methods = this.routes.methods;

        var store;
        if (method != undefined) { // convert method to the associated store
            var store = methods[method.toLowerCase().trim()];

            if (store == undefined) { // no associated store
                throw new Error("Couldn't define route '" + name + 
                    "' because the method '" + method + "' is not recognized");
            }
        } else { store = routes; } // all routes

        var subpaths = parse.path(pathname);

        // find first matching route
        var length = store.by.order.length;
        for (var index = 0; index < length; index++) {
            var data = store.by.order[index];
            var name = data.name, subroutes = data.subroutes, func = data.func;

            var args = match(subroutes, subpaths); // arguments
            if (args != undefined) { // match
                return func.call(undefined, name, args); // execute the route's function
            }
        }
    };

    /* compose a path
     * @name - route name {string}
     * @args - route arguments {object}
     * return path */
    Router.prototype.path = function(name, args) {
        var routes  = this.routes;

        if (name in routes.by.name) { // compose path with the named route
            var subroutes = routes.by.name[name].subroutes;
            return compose(subroutes, args); 
        } else { throw new Error("No route named '" + name + "' exists"); }
    };

    var parse = {}; // parsing

    /* parse an expression into subroutes
     * @expression - route expression {string}
     * return array of objects describing each part of the route {array} */
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

    /* parse path into subpaths
     * @pathname - path {string}
     * return array of strings representing each part of the path {array} */
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

    /* match subroutes and subpaths
     * @subroutes - array of objects describing each part of the route {array}
     * @subpaths - array of strings representing each part of the path {array}
     * return route arguments as an object of name value pairs {object} */
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

    /* compose path from subroutes
    * @subroutes - array of objects describing each part of the route {array}
    * @args - route arguments to apply {object}
    * return path {string} */
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

    var func = function(name, args) { return {'name': name, 'args': args}; };

    // define routes
    router.define(undefined, 'route 1', '/path/:param1/:param2/:param3*', func); // 1st route
    router.define(undefined, 'route 2', '/path/:param1/:param2/', func); // 2nd route
    router.define(undefined, 'route 3', ':param1*/:param2/path', func); // 3rd route
    router.define(undefined, 'route 4', '%2F+path/file.ext', func); // 4th route
    router.define('GET', 'get route', '/method/:param1', func); // GET route
    router.define('POST', 'post route', '/method/:param1', func); // POST route

    // define invalid routes
    assert.throws(
        function() { router.define('get', 'duplicate route parameter', '/path/:p1/:p2/:p2/:p1/:p2'); }, 
        function(err) { return (err instanceof Error && /\s+3\s+/.test(err.message) && /p2/.test(err.message)); },
        'Defining a route with duplicate parameters did not fail as expected');
    assert.throws(function() { router.define('INvalid MEthod', 'bAd method', '/invalid/method/:param1'); },
        function(err) { return (err instanceof Error && /INvalid/.test(err.message) && /bAd/.test(err.message)); },
        'Defining a route with an invalid method did not fail as expected');

    // define duplicate route name
    router.define('DELete', 'duplicate route name', '/duplicate/1', func); 
    assert.throws(function() { router.define('PUT', 'duplicate route name', '/duplicate/2', func); }, 
        /duplicate[\s]route/,
        'Defining a route with a duplicate name did not fail as expected'); 

    var result;

    // route path with 1st route
    result = router.route('POST', '/path/arg1/arg2/ /../a/r/g/3/');
    assert.strictEqual(result.name, 'route 1', 'The path did not match the 1st route');
    assert.strictEqual(result.args.param1, 'arg1', 
        "The path's 1st argument to the 1st route did not match the expected value");
    assert.strictEqual(result.args.param2, 'arg2', 
        "The path's 2nd argument to the 1st route did not match the expected value");
    assert.strictEqual(result.args.param3, 'a/r/g/3', 
        "The path's 3rd argument to the 1st route did not match the expected value");

    // route path with 2nd route
    result = router.route('get', 'path/arg1/arg2');
    assert.strictEqual(result.name, 'route 2', 'The path did not match the 2nd route');
    assert.strictEqual(result.args.param1, 'arg1', 
        "The path's 1st argument to the 2nd route did not match the expected value");
    assert.strictEqual(result.args.param2, 'arg2', 
        "The path's 2nd argument to the 2nd route did not match the expected value");

    // route path with 3rd route
    result = router.route(undefined, '/arg1/arg2/path/');
    assert.strictEqual(result.name, 'route 3', 'The path did not match the 3rd route');
    assert.strictEqual(result.args.param1, 'arg1', 
        "The path's 1st argument to the 3rd route did not match the expected value");
    assert.strictEqual(result.args.param2, 'arg2', 
        "The path's 2nd argument to the 3rd route did not match the expected value");

    // route path with 4th route
    result = router.route('Delete', '/../%2F+path/file.ext/');
    assert.strictEqual(result.name, 'route 4', 'The path did not match the 4th route');

    // route path with GET route
    result = router.route('  GEt ', '/method/get');
    assert.strictEqual(result.name, 'get route', 'The path did not match the GET route');
    result = router.route(undefined, '/method/all');
    assert.strictEqual(result.name, 'get route', 'The path did not match the GET route');

    // route path with POST route
    result = router.route('  poSt ', '/method/post');
    assert.strictEqual(result.name, 'post route', 'The path did not match the POST route');

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