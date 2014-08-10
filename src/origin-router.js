/**** { @! name }.js v.{ @! version } **/

/*{ @! example code start } [Setup]
var router = new Router();
{ @! example code end }*/

/*{ @! example code start } [Basic Routing]
// add routes to the router ...

router.add('/dog', function() { console.log('I have a dog!'); });
router.add('/cat', function() { console.log('I have a cat!'); });

// route some paths ...

router.route('/cat'); // outputs 'I am a cat!'
router.route('/dog'); // outputs 'I am a dog!'
router.route('/poodle'); // outputs nothing
router.route('/dog/poodle'); // outputs nothing
{ @! example code end }*/

/*{ @! example code start } [Basic Variables]
// add more routes using ':' to denote variables ...

router.add('/dog/:color', 
    function(args) { console.log('I have a ' + args.color + ' colored dog!'); });
router.add('/cat/:color', 
    function(args) { console.log('I have a ' + args.color + ' colored cat!'); });
router.add('/:pet/homework', 
    function(args) { console.log('My ' + args.pet + ' ate my homework!'); })

// route some more paths ...

router.route('/dog/brown'); // outputs 'I have a brown colored dog!'
router.route('/cat/white'); // outputs 'I have a white colored cat!'
router.route('/fish/homework'); // outputs 'My fish at my homework!'
router.route('/dog/homework');  // outputs 'I have a homework colored dog!' 
                                // this is routed by the dog route and not 
                                // the homework route because the dog route 
                                // was added before the homework route
{ @! example code end }*/

/*{ @! example code start } [Wildcard Path Variables]
// add a route with a wildcardcard path variable 
// denoted by a '*' at the end ...

router.add('/calico/:pet/:colors*', 
    function(args) { console.log("I have a " + args.colors + ' ' + args.pet '!'); });

router.route('/calico/cat/white/orange/gray'); // outputs 'I have a white/orange/gray cat!'
{ @! example code end }*/

/*{ @! example code start } [Reverse Routing]
// add a named route ...

router.add('/:pet/mixed/:breeds*', {'name': 'mixed breed'}, 
    function(args) { console.log('I have a mixed breed ' + args.pet + ' that is part ' + args.breeds + '!'); });

// generate a path using the named route ...

var path = router.path('mixed breed',                   // path is '/dog/mixed/beagle/bulldog/boxer'           
    {'pet': 'dog', 'breeds': 'beagle/bulldog/boxer'});  // and matches the 'mixed breed' route

                                                                                          
router.route(path); // outputs 'I have a mixed breed dog that is part beagle/bulldog/boxer!'
{ @! example code end }*/

(function() { 'use strict';
    var events = require('events'), path = require('path'), util = require('util');

    /* 
     * Route {prototype}                                            - route for http requests
     *      inherits {EventEmitter}
     * 
     * Route.prototype.constructor {function}
     *      @expression {string}                                    - route expression 
     *      [@options] {object|undefined}                           - options
     *          .name {string|undefined}                            - route name 
     *          .method {string|array<string>|undefined}            - route's applicable http method(s)
     *          .constraints {function|object<RegExp|array<string>>|undefined} - route argument constraints
     *              [@args] {object<string>}                        - url encoded route arguments as name value pairs
     *              this {Route}                                    - route
     *              return {boolean}                                - true if valid, false if invalid
     *
     * Route.prototype.expression {string}                          - get route expression
     *
     * Route.prototype.name {string|undefined}                      - get route name
     *
     * Route.prototype.method {string|array<string>|undefined}      - get route's applicable http method(s)
     *
     * Route.prototype.constraints {function|object<RegExp|<array<string>>|undefined} - route argument constraints
     *      [@args] {object<string>}                                - url encoded route arguments as name value pairs
     *      this {Route}                                            - route
     *      return {boolean}                                        - true if valid, false if invalid
     *
     * Route.prototype 
     *      emits route {event}                                     - occurs upon routing
     *          listener {function}
     *              [@args] {object<string>}                        - url encoded route arguments as name value pairs
     *              this {Route}                                    - route
     */
    var Route = function(expression, options) {
        events.EventEmitter.call(this);

        var self = this;

        var name, method, constraints; // options
        if (options != undefined) { name = options.name, method = options.method, constraints = options.constraints; }

        // accessors
        Object.defineProperty(this, 'expression', {'get': function() { return expression; }, // expression getter
            'enumerable': true, 'configurable': false});
        Object.defineProperty(this, 'name', {'get': function() { return name; }, // name getter
            'enumerable': true, 'configurable': false});
        Object.defineProperty(this, 'method', {'get': function() { return method; }, // method getter
            'enumerable': true, 'configurable': false});
        Object.defineProperty(this, 'constraints', {
            'get': function() { return constraints; },  // constraints getter
            'set': function(value) { // constraints setter
                if (value === undefined || value === null) {}
                else if (value instanceof Function) { // constraint function
                    constraints = function() { return value.apply(self, arguments); }
                } else if (value === Object(value)) { // constraints map
                    for (var key in value) {
                        var constraint = value[key];

                        var valid;
                        if (constraint instanceof RegExp) { valid = true; }
                        else if (util.isArray(constraint)) {
                            valid = constraint.length !== 0 && constraint.every(
                                function(str) { return typeof str === 'string' || str instanceof String; });
                        } else { valid = false; }

                        if (!valid) {
                            throw new Error("Couldn't set constraints for route " + 
                                (this.name != undefined ? "\'" + this.name + "\'" + ' ' : '') + 
                                "because the contraint '" + key + "' was not a " + 
                                'regular expression or an array of strings'); 
                        }
                    }
                    constraints = value;
                } else { 
                    throw new Error("Couldn't set constraints for route " + 
                        (this.name != undefined ? "\'" + this.name + "\'" + ' ' : '') + 
                        'because the contraints are invalid'); 
                }
            },
            'enumerable': true, 'configurable': false});
        this.constraints = constraints; // validate constraints
    };
    util.inherits(Route, events.EventEmitter);

    /*
     * Router {prototype}                       - router for http requests 
     *      inherits {EventEmitter}
     *      module.exports.Router
     *
     * Router.prototype.constructor {function}
     *
     * Router.prototype 
     *      emits success {event}               - occurs upon routing
     *          listener {function}
     *              @route {Route}              - matching route
     *              [@args] {object<string>}    - url encoded route arguments as name value pairs
     *              this {Router}               - router
     *      emits fail {event}                  - occurs upon routing when no matching route found
     *          listener {function}
     *              this {Router}               - router
     */
    var Router = module.exports.Router = function() {
        events.EventEmitter.call(this);

        var routes = {}; // all routes regardless of method
        Object.defineProperty(this, '___routes', {'get': function() { return routes; }, // routes getter
            'enumerable': false, 'configurable': false});

        var methods = routes.methods = { // routes segregated by method
            'get': {}, 'post': {}, 'put': {}, 'delete': {}, 'head': {}, 'options': {}, 'trace': {}, 'connect': {}
        };

        // setup route stores
        [routes].concat(Object.keys(methods).map(function(key) { return methods[key]; })).forEach(
            function(store) { store.by = {'name': {}, 'order': []}; } // store by name and order
        ); 
    };
    util.inherits(Router, events.EventEmitter);

    /* 
     * Router.prototype.add {function}                              - add a route 
     *      @expression {string}                                    - route expression 
     *      [@options] {object|undefined}                           - options
     *          .name {string|undefined}                            - route name
     *          .method {string|array<string>|undefined}            - route's applicable http method(s)
     *          .constraints {function|object<RegExp|<array<string>>|undefined} - route argument constraints
     *              [@args] {object<string>}                        - url encoded route arguments as name value pairs
     *              this {Route}                                    - route
     *              return {boolean}                                - true if valid, false if invalid
     *      [@callback] {function|undefined}                        - called upon every routing
     *          [@args] {object<string>}                            - url encoded route arguments as name value pairs
     *          this {Route}                                        - route
     *      return {Route}                                          - route
     */
    Router.prototype.add = function() {
        // associate arguments to parameters
        var expression = arguments[0], options, callback;
        if (arguments.length === 2) {
            if (arguments[1] instanceof Function) { callback = arguments[1]; }
            else { options = arguments[1]; }
        } else if (arguments.length >= 3) { options = arguments[1], callback = arguments[2]; }

        var routes = this.___routes, methods = routes.methods;

        var name, method, constraints; // options
        if (options != undefined) { name = options.name, method = options.method, constraints = options.constraints; }

        if (name != undefined && name in routes.by.name) { // duplicate name
            throw new Error("Couldn't add route '" + name + 
                "' because another route named '" + name + "' already exists");
        }

        var stores = [routes]; // applicable stores for the route

        if (method != undefined) { // collect method(s) associated store(s)
            (util.isArray(method) ? method : [method]).forEach(function(method) {
                var store = methods[method.toLowerCase().trim()];

                if (store == undefined) { // no associated store
                    throw new Error("Couldn't add route " + (name != undefined ? "\'" + name + "\'" + ' ' : '') + 
                        "because the method '" + method + "' is not recognized");
                }

                stores.push(store);
            });
        } else { stores = stores.concat( // collect all method stores
            Object.keys(methods).map(function(key) { return methods[key]; })); }

        var route = new Route(expression, // route event emitter
            {'name': name, 'method': method, 'constraints': constraints});
        var subroutes = parse.route(expression); // parse expression into subroutes

        var data = {'route': route, 'subroutes': subroutes};

        stores.forEach(function(store) { 
            store.by.order.push(data); // store by order
            if (name != undefined) { store.by.name[name] = data; } // store by name
        });

        if (callback != undefined) { route.on('route', callback); }

        return route;
    };

    /* 
     * Router.prototype.route {function}        - route a path
     *      @pathname {string}                  - url encoded path
     *      [@options] {object|undefined}       - options
     *          .method {string|undefined}      - http method 
     *      [@callback] {function|undefined}    - called upon routing
     *          [@args] {object<string>}        - url encoded route arguments as name value pairs
     *          this {Route}                    - route
     *      return {Route|undefined}            - matching route or undefined if no matching route found
     */
    Router.prototype.route = function() {
        // associate arguments to parameters
        var pathname = arguments[0], options, callback;
        if (arguments.length === 2) {
            if (arguments[1] instanceof Function) { callback = arguments[1]; }
            else { options = arguments[1]; }
        } else if (arguments.length >= 3) { options = arguments[1], callback = arguments[2]; }

        var method; // options
        if (options != undefined) { method = options.method; }

        var routes = this.___routes, methods = routes.methods;

        var store;
        if (method != undefined) { // convert method to the associated store
            var store = methods[method.toLowerCase().trim()];

            if (store == undefined) { // no associated store
                throw new Error("Couldn't route '" + pathname + 
                    "' because the method '" + method + "' is not recognized");
            }
        } else { store = routes; } // all routes

        var subpaths = parse.path(pathname);

        // find matching route
        var length = store.by.order.length;
        for (var index = 0; index < length; index++) {
            var data = store.by.order[index], route = data.route, subroutes = data.subroutes;

            var args = match(subroutes, subpaths); // arguments
            if (args != undefined) { // match
                var constraints = route.constraints; // validate constraints
                if (constraints !== undefined && validate(args, constraints) !== true) { continue; }

                if (callback != undefined) { route.once('route', callback); } // queue callback

                route.emit('route', args); // emit route event on matching route
                this.emit('success', route, args); // emit success event on matching route
                return route; // return matching route
            }
        }

        this.emit('fail'); // emit fail event on no matching route
        return undefined;
    }

    /* 
     * Router.prototype.path {function} - generate a path
     *      @name {string}              - route name
     *      [@args] {object|undefined}  - url encoded route arguments as name value pairs
     *      return {string}             - url encoded path 
     */
    Router.prototype.path = function(name, args) {
        args = args || {};

        var routes = this.___routes;

        if (name in routes.by.name) { // compose path with the named route
            var data = routes.by.name[name], route = data.route, subroutes = data.subroutes;

            // validate
            var constraints = route.constraints;
            var valid = validate(args, constraints);
            if (valid !== true) { // invalid
                if (typeof valid === 'string' || valid instanceof String) { // invalid parameter constraint
                    var key = valid, value = args[key];
                    throw new Error("Couldn't generate path with route '" + name + "' because the " + 
                        "'" + key + "' argument value of '" + value + "' is invalid " + 
                        "according to the route's constraints");
                } else { // invalid constraints
                    throw new Error("Couldn't generate path with route '" + name + "' because " + 
                        "one or more of the arguments are invalid according to the route's constraints");
                }
            }

            return compose(subroutes, args); 
        } else { 
            throw new Error(
                "Couldn't generate path with route '" + name + "' because no route named '" + name + "' exists"); 
        }
    };

    /* 
     * parse {object}
     */
    var parse = {}; // parsing

    /*
     * parse.route {function}                       - parse an expression into subroutes
     *      @expression {string}                    - route expression
     *      return {array<object|string>}           - parts of the route 
     *          [...]
     *              .name {string}                  - route parameter name
     *              .wildcard {boolean|undefined}   - true if route parameter is wildcard 
     */
    parse.route = function(expression) {
        var last;

        var names = {}; // parameter name counts
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

    /* 
     * parse.path {function}        - parse path into encoded subpaths
     *      @pathname {string}      - url encoded path
     *      return {array<string>}  - url encoded parts of the path 
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

    /* 
     * match {function}                             - match subroutes and subpaths
     *      @subroutes {array<object|string>}       - parts of the route 
     *          [...]
     *              .name {string}                  - route parameter name
     *              .wildcard {boolean|undefined}   - true if route parameter is wildcard 
     *      @subpaths {array<string>}               - url encoded parts of the path
     *      return {object}                         - url encoded route arguments as name value pairs
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

    /* 
    * compose {function}                            - compose path from subroutes
    *       @subroutes {array<object|string>}       - parts of the route 
    *           [...]
    *               .name {string}                  - route parameter name
    *               .wildcard {boolean|undefined}   - true if route parameter is wildcard 
    *       [@args] {object|undefined}              - url encoded route arguments as name value pairs
    *       return {string}                         - url encoded path 
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

    /*
     * validate {function}                      - validate arguments against constraints
     *      [@args] {object<string>|undefined}  - url encoded route arguments as name value pairs
     *      [@constraints] {function|object<RegExp|<array<string>>|undefined} - route argument constraints
     *              [@args] {object<string>}    - url encoded route arguments as name value pairs
     *              return {boolean}            - true if valid, false if invalid
     *      return {boolean|string}             - true if valid, false if invalid, constraint name if constraint \
     *                                              in constraints map is invalid
     */
    var validate = function(args, constraints) {
        args = args || {};

        if (constraints != undefined) {
            if (constraints instanceof Function) { // validate arguments against constraint function
                return constraints.call(undefined, args) ? true : false; // validate
            } else { // validate arguments against constraints map
                for (var name in constraints) { // iterate parameter names within constraints
                    if (!(name in args)) { continue; } // no argument to validate

                    var arg = args[name], constraint = constraints[name];
                    if ( // validate argument against parameter constraint 
                        (constraint instanceof RegExp && !constraint.test(arg)) || // regex constraint
                        (util.isArray(constraint) && constraint.indexOf(arg) == -1) // array of strings constraint
                    ) { return name; } // invalid
                }
                return true; // valid
            }
        } else { return true; } // valid
    };
})();

/*{ @! tests }*/
(function() { // tests
    var assert = require('assert');

    var router = new module.exports.Router(); // test router

    var result;

    result = {};
    var onRoute = function(args) { result = {'name': this.name, 'args': args}; };

    // add routes

    var firstRoute = router.add('/path/:param1/:param2/:param3*', {'name': 'route 1'}, onRoute); // 1st route
    router.add('/path/:param1/:param2/', {'name': 'route 2'}).on('route', onRoute); // 2nd route
    router.add(':param1*/:param2/path', {'name': 'route 3'}).on('route', onRoute); // 3rd route
    router.add('%2F+path/file.ext', {'name': 'route 4'}, onRoute); // 4th route

    var constraints;
    constraints = function(args) { 
        return args.param1 != 'not1' && args.param2 != 'not1' && this.expression.indexOf('constrain') != -1; 
    };
    router.add('/constraint/:param1/:param2', // 1st constrained route 
        {'name': 'constrained route 1', 'method': 'connect', 'constraints': constraints}).on('route', onRoute);
    constraints = {'param1': /^(?!(?:not2)).*$/, 'param2': /^(?!(?:not2)).*$/, 'param3': /^(?!(?:not2)).*$/};
    var routeConstraint2 = router.add('/constraint/:param1/:param2', // 2nd constrained route 
        {'name': 'constrained route 2', 'method': 'connect', 'constraints': constraints}).on('route', onRoute);
    routeConstraint2.constraints = constraints;
    constraints = {'param1': ['not1', 'not2'], 'param2': /^not[1-2]$/};
    router.add('/constraint/:param1/:param2', // 3rd constrained route 
        {'name': 'constrained route 3', 'method': 'connect', 'constraints': constraints}).on('route', onRoute);

    router.add('/method/:param1', {'name': 'get route', 'method': 'GET'}).on('route', onRoute); // GET route
    router.add('/method/:param1', {'name': 'post route', 'method': 'POST'}).on('route', onRoute); // POST route
    var routeGetPost = router.add('get/post/:param', // GET & POST route
        {'name': 'get & post route', 'method': ['POST', 'GET']}); 
    routeGetPost.on('route', onRoute);

    // add invalid routes
    assert.throws(
        function() { router.add('/path/:p1/:p2/:p2/:p1/:p2', {'method': 'get'}); }, 
        function(err) { return (err instanceof Error && /\s+3\s+/.test(err.message) && /p2/.test(err.message)); },
        'Defining a route with duplicate parameters did not fail as expected');
    assert.throws(
        function() { router.add('/invalid/method/:param1', {'name': 'bAd', 'method': ['GET', 'INvalid']}); },
        function(err) { return (err instanceof Error && /INvalid/.test(err.message) && /bAd/.test(err.message)); },
        'Defining a route with an invalid method did not fail as expected');
    assert.throws(
        function() { router.add('/invalid/method/:param1', {'method': 'INvalid'}); },
        function(err) { 
            return (err instanceof Error && /INvalid/.test(err.message) && /route\sbecause/.test(err.message)); 
        },
        'Defining a route with an invalid method did not fail as expected');
    assert.throws(
        function() { router.add('/invalid/constraints/:p1', {'name': 'bad constraints', 'constraints': 'invalid'}); },
        function(err) { 
            return (err instanceof Error && 
                /bad\sconstraints/.test(err.message) && /contraints\sare\sinvalid/.test(err.message)); 
        },
        'Defining a route with invalid constraints did not fail as expected');
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

    // add duplicate route name
    router.add('/duplicate/1', {'name': 'duplicate route name', 'method': ['CONNECT', 'DELete']}); 
    assert.throws(
        function() { router.add('/duplicate/2', {'name': 'duplicate route name', 'method': 'PUT'}); }, 
        /duplicate[\s]route/,
        'Defining a route with a duplicate name did not fail as expected'); 

    // route path with 1st route
    router.route('/path/arg1/arg2/ /../a/r/g/3/', {'method': 'POST'});
    assert.strictEqual(result.name, 'route 1', 'The path did not match the 1st route');
    assert.strictEqual(result.args.param1, 'arg1', 
        "The path's 1st argument to the 1st route did not match the expected value");
    assert.strictEqual(result.args.param2, 'arg2', 
        "The path's 2nd argument to the 1st route did not match the expected value");
    assert.strictEqual(result.args.param3, 'a/r/g/3', 
        "The path's 3rd argument to the 1st route did not match the expected value");

    // route paths with 2nd route
    var callback = {'result': {}};
    router.route('path/arg1/arg2', function(args) { callback.result = {'name': this.name, 'args': args}; });
    assert.strictEqual(callback.result.name, 'route 2', 'The path did not match the 2nd route');
    assert.strictEqual(callback.result.args.param1, 'arg1', 
        "The path's 1st argument to the 2nd route did not match the expected value");
    router.route('path/arg1/arg2', {'method': 'get'}, 
        function(args) { callback.result = {'name': this.name, 'args': args}; });
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

    // route path with 4th route
    router.route('/../%2F+path/file.ext/', {'method': 'Delete'});
    assert.strictEqual(result.name, 'route 4', 'The path did not match the 4th route');

    // route paths with constrained routes
    router.route('/constraint/1/1', {'method': 'connect'});
    assert.strictEqual(result.name, 'constrained route 1', 'The path did not match the 1st constrained route');
    router.route('/constraint/1/not1', {'method': 'connect'});
    assert.strictEqual(result.name, 'constrained route 2', 'The path did not match the 2nd constrained route');
    router.route('/constraint/not2/not1', {'method': 'connect'});
    assert.strictEqual(result.name, 'constrained route 3', 'The path did not match the 3rd constrained route');

    // route path with GET route
    router.route('/method/get', {'method': '  GEt '});
    assert.strictEqual(result.name, 'get route', 'The path did not match the GET route');
    router.route('/method/all');
    assert.strictEqual(result.name, 'get route', 'The path did not match the GET route');

    // route path with POST route
    router.route('/method/post', {'method': '  poSt '});
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
        function() { router.route('/bad/method/path', {'method': '  bad METHOD '}); },
        function(err) { 
            return (err instanceof Error && 
                /bad\sMETHOD/.test(err.message) && /bad[\/]method[\/]path/.test(err.message)); 
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

    // assemble path with constrained routes
    assert.throws(
        function() { router.path('constrained route 1', {'param1': 'not1', 'param2': '1'}); },
        function(err) { 
            return (err instanceof Error && 
                /constrained\sroute\s1/.test(err.message) && /one\sor\smore/.test(err.message)); 
        },
        'Assembling a path with the 1st constrained route and an invalid argument did not fail as expected');
    assert.throws(
        function() { router.path('constrained route 2', {'param1': 'not2', 'param2': '2'}); },
        function(err) { 
            return (err instanceof Error && 
                /constrained\sroute\s2/.test(err.message) && /param1/.test(err.message) && /not2/.test(err.message)); 
        },
        'Assembling a path with the 2nd constrained route and an invalid argument did not fail as expected');
    result = router.path('constrained route 3', {'param1': 'not1', 'param2': 'not2'});
    assert.strictEqual(result, '/constraint/not1/not2',
        'The path assembled using the 3rd constrained route did not match the expected value');
    result = router.path('constrained route 3', {'param2': 'not2'});
    assert.strictEqual(result, '/constraint//not2',
        'The path assembled using the 3rd constrained route did not match the expected value');

    // assemble path with invalid route
    assert.throws(function() { router.path('invalid route', {'param1': 'arg1', 'param2': 'arg2'}); }, /invalid[\s]route/,
        'Assembling a path with an invalid route did not fail as expected');

    result = '';

    // router events
    router.on('fail', function() { if (this === router) { result = 'fail'; } });
    router.route('/*/*/*/no/matching/route/*/*/*/');
    assert.strictEqual(result, 'fail', "The router 'fail' event did not occur as expected");
    router.on('success', function(route, args) {
        if (this === router && route === firstRoute && args.param1 === 'arg1') { result = 'success'; }
    });
    router.route('/path/arg1/arg2/arg3', {'method': 'POST'});
    assert.strictEqual(result, 'success', "The router 'success' event did not occur as expected");
})();