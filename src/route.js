var assert = require('assert');
var path = require('path');

// router
var Router = function() {
    this.routes = {};
    this.routes.by = {'name': {}, 'order': []};
};

// define a route
Router.prototype.define = function(name, route, callback) {
    with (this.routes) {
        if (name != undefined && name in by.name) { // duplicate name
            throw new Error(
                "Couldn't define route '" + name + "' because another route named '" + name + "' already exists"
            );
        }

        var data = {'name': name, 'subroutes': parse.route(route), 'callback': callback};

        by.order.push(data);
        if (name != undefined) { by.name[name] = data; }
    }
};

// route a path
Router.prototype.route = function(pathname) {
    with (this.routes) {
        var subpaths = parse.path(pathname);

        // find first matching route
        var length = by.order.length;
        for (var index = 0; index < length; index++) {
            with (by.order[index]) {
                var args = match(subroutes, subpaths); // arguments
                if (args != undefined) { // match
                    // execute the route's callback
                    return callback.call(undefined, name, args);  
                }
            } 
        }
    }
};

// compose a path
Router.prototype.path = function(name, args) {
    with (this.routes) {
        if (name in by.name) { // compose path with the named route
            with (by.name[name]) { return compose(subroutes, args); }
        } else { 
            throw new Error("No route named '" + name + "' exists");
        }
    }
};

var parse = {}; // parsing

// parse route into subroutes
parse.route = function(route) {
    var last;

    route = route.trim();

    last = route.length - 1;
    if (route.charAt(last) === '/') { route = route.substring(0, last); }
    if (route.charAt(0) === '/') { route = route.substring(1); }

    var subroutes = route.split('/');
    subroutes.forEach(function(subroute, index, subroutes) { // parameters
        if (subroute.charAt(0) === ':') {
            last = subroute.length - 1;

            var wildcard = subroute.charAt(last) === '*' ? true : false;
            var name = wildcard ? subroute.substring(1, last) : subroute.substring(1);

            var marker = {'name': name}; // parameter marker

            if (wildcard && index == subroutes.length - 1) { marker.wildcard = true; } // wildcard parameter

            subroutes[index] = marker; 
        } 
    });

    return subroutes;
};

// parse path into subpaths
parse.path = function(pathname) {
    pathname = pathname.trim();

    // resolve dot directory subpaths for safety
    pathname = path.resolve('/', path.normalize(pathname)); 

    var last = pathname.length - 1;
    if (pathname.charAt(last) === '/') { pathname = pathname.substring(0, last); }
    if (pathname.charAt(0) === '/') { pathname = pathname.substring(1); }

    var subpaths = pathname.split('/');

    return subpaths;
};

// match the subroutes and subpaths
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
        // resolve wildcard parameter, store argument
        args[wildcard] = subpaths.slice(index).join('/'); 
    } else if (index != subroutes.length) { 
        return;  // no match
    }

    return args; // match
};

// compose path from subroutes
var compose = function(subroutes, args) {
    args = args || {};

    var subpaths = [];
    subroutes.forEach(function(subroute, index, route) { 
        if (typeof subroute === 'string' || subroute instanceof String) {
            subpaths.push(subroute);
        } else if (typeof subroute === 'object') { // parameter marker
            var arg = args[subroute.name];
            if (arg == undefined) { arg = ''; }

            if (subroute.wildcard) { subpaths.push(arg.charAt(0) === '/' ? arg.substring(1) : arg); } // wildcard parameter
            else { subpaths.push(arg); } // parameter
        }
    });

    var pathname = subpaths.join('/');
    if (pathname.charAt(0) !== '/') { pathname = '/' + pathname; }

    return pathname;
};

module.exports.Router = Router;

// tests

var router = new Router(); // test router

var callback = function(name, args) { return {'name': name, 'args': args}; };

// define routes
router.define('route 1', '/path/:param1/:param2/:param3*', callback); // 1st route
router.define('route 2', '/path/:param1/:param2/', callback); // 2nd route
router.define('route 3', ':param1*/:param2/path', callback); // 3rd route
router.define('route 4', '%2F+path/file.ext', callback); // 4th route

// define duplicate route name
router.define('duplicate route', '/duplicate/1', callback); 
assert.throws(function() { router.define('duplicate route', '/duplicate/2', callback); }, /duplicate[\s]route/,
    'Defining a route with a duplicate name did not fail as expected'); 

var result;

// route path with 1st route
result = router.route('/path/arg1/arg2/ /../a/r/g/3/');
assert.strictEqual(result.name, 'route 1', 'The path did not match the 1st route');
assert.strictEqual(result.args.param1, 'arg1', "The path's 1st argument to the 1st route did not match the expected value");
assert.strictEqual(result.args.param2, 'arg2', "The path's 2nd argument to the 1st route did not match the expected value");
assert.strictEqual(result.args.param3, 'a/r/g/3', "The path's 3rd argument to the 1st route did not match the expected value");

// route path with 2nd route
result = router.route('path/arg1/arg2');
assert.strictEqual(result.name, 'route 2', 'The path did not match the 2nd route');
assert.strictEqual(result.args.param1, 'arg1', "The path's 1st argument to the 2nd route did not match the expected value");
assert.strictEqual(result.args.param2, 'arg2', "The path's 2nd argument to the 2nd route did not match the expected value");

// route path with 3rd route
result = router.route('/arg1/arg2/path/');
assert.strictEqual(result.name, 'route 3', 'The path did not match the 3rd route');
assert.strictEqual(result.args.param1, 'arg1', "The path's 1st argument to the 3rd route did not match the expected value");
assert.strictEqual(result.args.param2, 'arg2', "The path's 2nd argument to the 3rd route did not match the expected value");

// route path with 4th route
result = router.route('/../%2F+path/file.ext/');
assert.strictEqual(result.name, 'route 4', 'The path did not match the 4th route');

// assemble path with 1st route
result = router.path('route 1', {'param1': 'arg1', 'param2': 'arg2', 'param3': '/a/r/g/3/'});
assert.strictEqual(result, '/path/arg1/arg2/a/r/g/3/', 'The path assembled using the 1st route did not match the expected value');

// assemble path with 2nd route
result = router.path('route 2', {'param1': 'arg1', 'param2': 'arg2'});
assert.strictEqual(result, '/path/arg1/arg2', 'The path assembled using the 2nd route did not match the expected value');

// assemble path with 3rd route
result = router.path('route 3', {'param1': 'arg1', 'param2': 'arg2'});
assert.strictEqual(result, '/arg1/arg2/path', 'The path assembled using the 3rd route did not match the expected value');

// assemble path with 4th route
result = router.path('route 4');
assert.strictEqual(result, '/%2F+path/file.ext', 'The path assembled using the 4th route did not match the expected value');

// assemble path with invalid route
assert.throws(function() { router.path('invalid route', {'param1': 'arg1', 'param2': 'arg2'}); }, /invalid[\s]route/,
    'Assembling a path with an invalid route did not fail as expected');