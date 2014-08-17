/**** { @! name }.js v.{ @! version } **/

/*{ @! example code start } [Setup]
var router = new Router();
{ @! example code end }*/

/*{ @! example code start } [Routing]
// add routes to the router with corresponding callbacks ...
router.add('/dog', function() { console.log('I have a dog'); });
router.add('/cat', function() { console.log('I have a cat'); });

// route some paths ...
router.route('/cat'); // outputs 'I have a cat'
router.route('/dog'); // outputs 'I have a dog'
router.route('/dog/'); // outputs 'I have a dog'

// attempt to route paths that don't match either route ...
router.route('/bulldog'); // outputs nothing
router.route('/dog/bulldog'); // outputs nothing
{ @! example code end }*/

/*{ @! example code start } [Route Parameters]
// add more routes using ':' to denote parameters ...
router.add('/dog/:color', function(event) {
    console.log('I have a ' + event.arguments.color + ' colored dog'); });
router.add('/cat/:color', function(event) {
    console.log('I have a ' + event.arguments.color + ' colored cat'); });
router.add('/:pet/homework', function(event) {
    console.log('My ' + event.arguments.pet + ' ate my homework'); })

// route some more paths that match the added routes ...
router.route('/dog/brown'); // outputs 'I have a brown colored dog'
router.route('cat/white'); // outputs 'I have a white colored cat'
router.route('/fish/homework'); // outputs 'My fish at my homework'
router.route('/dog/homework');  // outputs 'I have a homework colored dog'
                                // this is routed by the dog route and not
                                // the homework route because the dog route
                                // was added before the homework route
{ @! example code end }*/

/*{ @! example code start } [Route Wildcard Parameters]
// add a route with a wildcard parameter denoted by a '*' at the end ...
router.add('/calico/:pet/:colors*', function(event) {
        console.log('I have a ' +
            event.arguments.colors + ' ' + event.arguments.pet);
    });

// the wildcard parameter matches anything at the end of the path ...
router.route('/calico/cat/white/orange/gray'); // outputs
                                               // 'I have a white/orange/gray cat'
{ @! example code end }*/

/*{ @! example code start } [Parameter Constraints]
// add a route with parameter constraints ...
router.add('/dogs/:count/:breed', // count must be more than 0
    {'constraints': function(args) { return parseInt(args.count) > 0; }},
    function(event) {
        console.log('I have ' +
            event.arguments.count + ' ' + event.arguments.breed + 's');
    });

router.route('/dogs/0/poodle'); // outputs nothing because the count is invalid
router.route('/dogs/2/poodle'); // outputs 'I have 2 poodles'

// a route's parameter constraints may be defined per parameter
// as either a regular expression or an array of valid strings ...
router.add('cats/:count/:breed',
    {'constraints': {'count': /(two|three)/, 'breed': ['persian', 'siamese']}},
    function(event) {
        console.log('I have ' +
            event.arguments.count + ' ' + event.arguments.breed + ' cats');
    });

router.route('/cats/four/siamese'); // outputs nothing because the count is invalid
router.route('/cats/two/bengal'); // outputs nothing because the breed is invalid
router.route('/cats/two/persian'); // outputs 'I have two persian cats'
{ @! example code end }*/

/*{ @! example code start } [HTTP Method-Specific Routing]
// add routes for only certain HTTP methods ...
router.add('/fish', {'method': 'GET'},
    function() { console.log('I have a fish'); });
router.add('/bird', {'method': ['GET', 'POST']},
    function() { console.log('I have a bird'); });

// alternatively routes can be added for an HTTP method like so ...
router.add.get('/turtle', function() { console.log('I have a turtle'); });
router.add.post('/rabbit', function() { console.log('I have a rabbit'); });

// route paths with a corresponding HTTP method specified ...
router.route('/fish', {'method': 'GET'}); // outputs 'I have a fish'
router.route('/fish', {'method': 'POST'}); // outputs nothing
router.route('/bird', {'method': 'GET'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'POST'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'DELETE'}); // outputs nothing

// HTTP method-specific routes are still applicable when no method is specified ...
router.route('/fish'); // outputs 'I have a fish'
router.route('/bird'); // outputs 'I have a bird'

// alternatively a path may be routed for an HTTP method like so ...
router.route.get('/fish'); // outputs 'I have a fish'
router.route.post('/bird'); // outputs 'I have a bird'
{ @! example code end }*/

/*{ @! example code start } [Reverse Routing]
// add a route and give it a name for future reference ...
router.add('/:pet/mixed/:breeds*', {'name': 'mixed breed'}, function(event) {
        console.log('I have a mix breed ' + event.arguments.pet +
            ' that is a ' + event.arguments.breeds);
    });

// alternatively the route's name can pe passed as the first argument like so...
router.add('pure breed', '/:pet/pure/:breed', function(event) {
        console.log('I have a pure breed ' + event.arguments.pet +
            ' that is a ' + event.arguments.breed);
    });

// generate a path using a route ...
var pathname = router.path('mixed breed', // use the route named 'mixed breed'
    {'pet': 'dog', 'breeds': 'beagle/pug/terrier'}); // route's parameter arguments

console.log(pathname); // outputs '/dog/mixed/beagle/pug/terrier'
{ @! example code end }*/

/*{ @! example code start } [Events]
// know when a route routes a path by listening to the route's 'route' event ...
var route = router.add('/hamster/:color', {'name': 'hamster'});
route.on('route', function(event) {
    console.log('I have a ' + event.arguments.color + ' ' + this.name); });

router.route('/hamster/brown'); // outputs 'I have a brown hamster'

// know when the router is unable to find a matching route to route a path
// by listening to the router's 'fail' event ...
router.on('fail', function(event) {
    console.log('No route found for ' + event.pathname); });

router.route('/guinea/pig'); // outputs 'No route found for /guinea/pig'

// alternatively, know when the router successfully routes any path by listening
// to the router's 'success' event ...
router.on('success', function(event) {
    console.log(event.pathname + " routed by route '" + event.route.name + "'"); });

router.route('/hamster/gray'); // outputs 'I have a gray hamster'
                               // outputs "/hamster/gray routed by route 'hamster'"
{ @! example code end }*/

/*{ @! example code start } [Using with a Server]

{ @! example code end }*/

(function() { 'use strict';
    var events = require('events'), path = require('path'), util = require('util');

    var HTTP = {'METHODS': // http methods
        ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT']};

    var argumentMaps = {}; // argument mappings for functions with variable parameters

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
     *              [@arguments] {object<string>}                   - url encoded route arguments as name value pairs
     *              this {Route}                                    - route
     *              return {boolean}                                - true if valid, false if invalid
     *          .ignoreCase {boolean|undefined}                     - case insensitive path matching
     *
     * Route.prototype.expression {string}                          - get route expression
     *
     * Route.prototype.name {string|undefined}                      - get route name
     *
     * Route.prototype.method {string|array<string>|undefined}      - get route's applicable http method(s)
     *
     * Route.prototype.constraints {function|object<RegExp|<array<string>>|undefined} - route argument constraints
     *      [@arguments] {object<string>}                           - url encoded route arguments as name value pairs
     *      this {Route}                                            - route
     *      return {boolean}                                        - true if valid, false if invalid
     *
     * Route.prototype.ignoreCase {boolean|undefined}               - case insensitive path matching
     *
     * Route.prototype
     *      emits route {event}                                     - occurs upon routing
     *          listener {function}
     *              @event                                          - event object
     *                  .pathname <string>                          - url encoded pathname
     *                  .method <string|undefined>                  - http method
     *                  .route {Route}                              - route
     *                  .arguments {object<string>}                 - url encoded route arguments as name value pairs
     *              this {Route}                                    - route
     */
    var Route = function(expression, options) {
        events.EventEmitter.call(this);

        var self = this;

        var name, method, ignoreCase, constraints; // options
        if (options != undefined) { name = options.name, method = options.method; }

        // accessors

        Object.defineProperty(this, 'expression', {'get': function() { return expression; }, // expression getter
            'enumerable': true, 'configurable': false});

        Object.defineProperty(this, 'name', {'get': function() { return name; }, // name getter
            'enumerable': true, 'configurable': false});

        Object.defineProperty(this, 'method', {'get': function() { return method; }, // method getter
            'enumerable': true, 'configurable': false});

        Object.defineProperty(this, 'ignoreCase', {
            'get': function() { return ignoreCase; }, // ignore case getter
            'set': function(value) { ignoreCase = value; }, // ignore case setter
            'enumerable': true, 'configurable': false});
        if ('ignoreCase' in options) { this.ignoreCase = options.ignoreCase; } // set ignore case
        else { ignoreCase = false; } // default ignore case

        Object.defineProperty(this, 'constraints', {
            'get': function() { return constraints; }, // constraints getter
            'set': function(value) { // constraints setter
                if (value === undefined || value === null) { constraints = undefined; }
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
        if ('constraints' in options) { this.constraints = options.constraints; } // set constraints
    };
    util.inherits(Route, events.EventEmitter);

    /*
     * Router {prototype}                           - router for http requests
     *      inherits {EventEmitter}
     *      module.exports.Router
     *
     * Router.prototype.constructor {function}
     *
     * Router.prototype
     *      emits success {event}                   - occurs upon routing
     *          listener {function}
     *              @event                          - event object
     *                  .pathname <string>          - url encoded pathname
     *                  .method <string|undefined>  - http method
     *                  .route {Route}              - matching route
     *                  .arguments {object<string>} - url encoded route arguments as name value pairs
     *              this {Router}                   - router
     *      emits fail {event}                      - occurs upon routing when no matching route found
     *          listener {function}
     *              @event                          - event object
     *                  .pathname <string>          - url encoded pathname
     *                  .method <string|undefined>  - http method
     *              this {Router}                   - router
     */
    var Router = module.exports.Router = function() {
        events.EventEmitter.call(this);

        var self = this;

        var routes = {}; // all routes regardless of method
        Object.defineProperty(this, '___routes', {'get': function() { return routes; }, // routes getter
            'enumerable': false, 'configurable': false});

        var methods = routes.methods = {} // routes segregated by method
        HTTP.METHODS.forEach(function(method) { methods[method.toLowerCase()] = {}; });

        // setup route stores
        [routes].concat(Object.keys(methods).map(function(key) { return methods[key]; })).forEach(
            function(store) { store.by = {'name': {}, 'order': []}; } // store by name and order
        );

        HTTP.METHODS.forEach(function(method) {
            self.add[method.toLowerCase()] = function() { // http method add method
                var args = argumentMaps.add.apply(self, arguments); // associate arguments to parameters
                var name = args.name, expression = args.expression, options = args.options, callback = args.callback;

                // add method to arguments
                options = options || {}, options.method = options.method || [];
                if (util.isArray(options.method)) { options.method.unshift(method); }
                else { options.method = [options.method, method]; }

                return self.add(name, expression, options, callback);
            };

            self.route[method.toLowerCase()] = function() { // http method route method
                var args = argumentMaps.route.apply(self, arguments); // associate arguments to parameters
                var pathname = args.pathname, options = args.options, callback = args.callback;

                options = options || {}, options.method = method; // add method to arguments

                return self.route(pathname, options, callback);
            };
        });
    };
    util.inherits(Router, events.EventEmitter);

    /*
     * Router.prototype.add {function}                              - add a route
     * Router.prototype.add.get {function}                          - add a route applicable to the HTTP GET method
     * Router.prototype.add.post {function}                         - add a route applicable to the HTTP POST method
     * Router.prototype.add.put {function}                          - add a route applicable to the HTTP PUT method
     * Router.prototype.add.delete {function}                       - add a route applicable to the HTTP DELETE method
     * Router.prototype.add.head {function}                         - add a route applicable to the HTTP HEAD mthod
     * Router.prototype.add.options {function}                      - add a route applicable to the HTTP OPTIONS mthod
     * Router.prototype.add.trace {function}                        - add a route applicable to the HTTP TRACE mthod
     * Router.prototype.add.connect {function}                      - add a route applicable to the HTTP CONNECT mthod
     *      [@name] {string}                                        - route name
     *      @expression {string}                                    - route expression
     *      [@options] {object|undefined}                           - options
     *          .name {string|undefined}                            - route name
     *          .method {string|array<string>|undefined}            - route's applicable http method(s)
     *          .constraints {function|object<RegExp|<array<string>>|undefined} - route argument constraints
     *              [@arguments] {object<string>}                   - url encoded route arguments as name value pairs
     *              this {Route}                                    - route
     *              return {boolean}                                - true if valid, false if invalid
     *          .ignoreCase {boolean|undefined}                     - case insensitive path matching
     *      [@callback] {function|undefined}                        - called upon every routing
     *          [@args] {object<string>}                            - url encoded route arguments as name value pairs
     *          this {Route}                                        - route
     *      return {Route}                                          - route
     */
    Router.prototype.add = function() {
        var args = argumentMaps.add.apply(this, arguments); // associate arguments to parameters
        var name = args.name, expression = args.expression, options = args.options, callback = args.callback;

        var routes = this.___routes, methods = routes.methods;

        var method, constraints; // options
        if (options != undefined) {
            name = name || options.name, method = options.method, constraints = options.constraints;
        }

        if (name != undefined && name in routes.by.name) { // duplicate name
            throw new Error("Couldn't add route '" + name +
                "' because another route named '" + name + "' already exists");
        }

        var stores = [routes]; // applicable stores for the route

        if (method != undefined) { // collect method(s) associated store(s)
            var indeces = {}; // processed method indeces
            (util.isArray(method) ? method : [method]).forEach(function(method) {
                // prevent processing a duplicate method
                var index = method.toLowerCase().trim(); // method index
                if (index in indeces) { return; } // duplicate method
                else { indeces[index] = true; }

                var store = methods[index];

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
        // forward ignore case option to route
        if (options != undefined && 'ignoreCase' in options) { route.ignoreCase = options.ignoreCase; }

        var subroutes = parse.route(expression); // parse expression into subroutes

        var data = {'route': route, 'subroutes': subroutes};

        stores.forEach(function(store) {
            store.by.order.push(data); // store by order
            if (name != undefined) { store.by.name[name] = data; } // store by name
        });

        if (callback != undefined) { route.on('route', callback); }

        return route;
    };
    argumentMaps.add = function() { // associate arguments to parameters for add methods
        var name, expression, options, callback;

        var args = Array.prototype.slice.call(arguments);
        if (args.length >= 2) {
            if ((typeof args[1] === 'string' || args[1] instanceof String)) { name = args.shift(); }
            expression = args.shift();
            if (args.length > 0 && !(args[0] instanceof Function)) { options = args.shift(); }
            if (args.length > 0 && args[0] instanceof Function) { callback = args.shift(); }
        }
        return {'name': name, 'expression': expression, 'options': options, 'callback': callback};
    };

    /*
     * Router.prototype.route {function}            - route a path
     * Router.prototype.route.get {function}        - route a path using the HTTP GET method
     * Router.prototype.route.post {function}       - route a path using the HTTP POST method
     * Router.prototype.route.put {function}        - route a path using the HTTP PUT method
     * Router.prototype.route.delete {function}     - route a path using the HTTP DELETE method
     * Router.prototype.route.head {function}       - route a path using the HTTP HEAD mthod
     * Router.prototype.route.options {function}    - route a path using the HTTP OPTIONS mthod
     * Router.prototype.route.trace {function}      - route a path using the HTTP TRACE mthod
     * Router.prototype.route.connect {function}    - route a path using the HTTP CONNECT mthod
     *      @pathname {string}                      - url encoded path
     *      [@options] {object|undefined}           - options
     *          .method {string|undefined}          - http method
     *      [@callback] {function|undefined}        - called upon routing
     *          [@args] {object<string>}            - url encoded route arguments as name value pairs
     *          this {Route}                        - route
     *      return {Route|undefined}                - matching route or undefined if no matching route found
     */
    Router.prototype.route = function() {
        var args = argumentMaps.route.apply(this, arguments); // associate arguments to parameters
        var pathname = args.pathname, options = args.options, callback = args.callback;

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
            var data = store.by.order[index];
            var route = data.route, subroutes = data.subroutes, ignoreCase = route.ignoreCase;

            var args = match(subroutes, subpaths, ignoreCase); // arguments
            if (args != undefined) { // match
                var constraints = route.constraints; // validate constraints
                if (constraints !== undefined && validate(args, constraints) !== true) { continue; }

                if (callback != undefined) { route.once('route', callback); } // queue callback

                // emit route event on matching route
                route.emit('route', {'pathname': pathname, 'method': method, 'route': route, 'arguments': args});
                // emit success event on matching route
                this.emit('success', {'pathname': pathname, 'method': method, 'route': route, 'arguments': args});

                return route; // return matching route
            }
        }

        this.emit('fail', {'pathname': pathname, 'method': method}); // emit fail event on no matching route
        return undefined;
    }
    argumentMaps.route = function() { // associate arguments to parameters
        var pathname = arguments[0], options, callback;
        if (arguments.length === 2) {
            if (arguments[1] instanceof Function) { callback = arguments[1]; }
            else { options = arguments[1]; }
        } else if (arguments.length >= 3) { options = arguments[1], callback = arguments[2]; }
        return {'pathname': pathname, 'options': options, 'callback': callback};
    };

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

            // validate constraints
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

            // validate arguments
            subroutes.forEach(function(subroute) {
                if (typeof subroute === 'object' && !subroute.wildcard) { // non-wildcard parameter marker
                    var arg = args[subroute.name];
                    if (arg != undefined && arg.indexOf('/') !== -1) { // invalid argument for non-wildcard parameter
                        throw new Error("Couldn't generate path with route '" + name + "' because the " +
                            "'" + subroute.name + "' argument value of '" + arg + "' contains '/' " +
                            "but isn't a wildcard");
                    }
                }
            });

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
     *      @ignoreCase                             - case insensitive matching
     *      return {object}                         - url encoded route arguments as name value pairs
     */
    var match = function(subroutes, subpaths, ignoreCase) {
        var args = {};
        var wildcard;

        var index;
        var length = subpaths.length;
        for (index = 0; index < length; index++) { // traverse subpaths and subroutes
            var subroute = subroutes[index];
            var subpath = subpaths[index];

            if (subroute == undefined) { return; } // match unsuccessful
            if (typeof subroute === 'string' || subroute instanceof String) {
                if (ignoreCase) { // case insensitive match
                    if (subroute.toLowerCase() === subpath.toLowerCase()) { continue; } // continue matching
                    else { return; } // match unsuccessful
                } else { // case sensitive match
                    if (subroute === subpath) { continue; } // continue matching
                    else { return; } // match unsuccessful
                }
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
            if (typeof subroute === 'string' || subroute instanceof String) { subpaths.push(subroute); }
            else if (typeof subroute === 'object') { // parameter marker
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
     * validate {function}                          - validate arguments against constraints
     *      [@args] {object<string>|undefined}      - url encoded route arguments as name value pairs
     *      [@constraints] {function|object<RegExp|<array<string>>|undefined} - route argument constraints
     *          [@arguments] {object<string>}       - url encoded route arguments as name value pairs
     *          return {boolean}                    - true if valid, false if invalid
     *      return {boolean|string}                 - true if valid, false if invalid, constraint name if constraint \
     *                                                  in constraints map is invalid
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
    var onRoute = function(event) { result = {'name': this.name, 'args': event.arguments}; };

    // add routes

    var firstRoute = router.add('/path/:param1/:param2/:param3*', {'name': 'route 1'}, onRoute); // 1st route
    router.add('/path/:param1/:param2/', {'name': 'route 2'}).on('route', onRoute); // 2nd route
    router.add(':param1*/:param2/path', {'name': 'route 3'}).on('route', onRoute); // 3rd route
    router.add('%2F+path/file.ext', {'name': 'route 4', 'ignoreCase': true}, onRoute); // 4th route

    var constraints;
    constraints = function(args) {
        return args.param1 != 'not1' && args.param2 != 'not1' && this.expression.indexOf('constrain') != -1;
    };
    router.add('/constraint/:param1/:param2', // 1st constrained route
        {'name': 'constrained route 1', 'method': ['connect'], 'constraints': constraints}).on('route', onRoute);
    constraints = {'param1': /^(?!(?:not2)).*$/, 'param2': /^(?!(?:not2)).*$/, 'param3': /^(?!(?:not2)).*$/};
    var routeConstraint2 = router.add('/constraint/:param1/:param2', // 2nd constrained route
        {'name': 'constrained route 2', 'method': 'connect', 'constraints': constraints}).on('route', onRoute);
    routeConstraint2.constraints = constraints;
    constraints = {'param1': ['not1', 'not2'], 'param2': /^not[1-2]$/};
    router.add('/constraint/:param1/:param2', // 3rd constrained route
        {'name': 'constrained route 3', 'method': 'connect', 'constraints': constraints}).on('route', onRoute);

    router.add.get('get route', '/method/:param1', {'name': 'overridden name'}).on('route', onRoute); // GET route
    router.add('/method/:param1', {'name': 'post route', 'method': 'POST'}).on('route', onRoute); // POST route
    var routeGetPost = router.add('get/post/:param', // GET & POST route
        {'name': 'get & post route', 'method': ['POST', 'GET', 'POST', ' pOsT ']});
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
    router.add.connect('/duplicate/1', {'name': 'duplicate route name', 'method': ['options', 'DELete']});
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
    router.route('path/arg1/arg2', function(e) { callback.result = {'name': this.name, 'args': e.arguments}; });
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

    // route path with 4th route
    router.route('/../%2f+path/file.EXT/', {'method': 'Delete'});
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
    router.route.post('/method/post');
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

    // assemble path with 1st route
    assert.throws(
        function() { router.path('route 1', {'param1': 'arg1', 'param2': 'arg/2', 'param3': '/a/r/g/3/'}); },
        function(err) {
            return (err instanceof Error &&
                /route\s1/.test(err.message) && /param2/.test(err.message) && /arg\/2/.test(err.message));
        },
        'Assembling a path with the 1st route and an invalid argument did not fail as expected');

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
    router.on('fail', function(event) {
        if (event.pathname !== '/*/*/*/no/matching/route/*/*/*/' || event.method !== '  Get') { return; }
        if (this !== router) { return; }
        result = 'fail';
    });
    router.route('/*/*/*/no/matching/route/*/*/*/', {'method': '  Get'});
    assert.strictEqual(result, 'fail', "The router 'fail' event did not occur as expected");
    router.on('success', function(event) {
        if (event.pathname !== '/path/arg1/arg2/arg3' || event.method !== 'PoST') { return; }
        if (this !== router || event.route !== firstRoute || event.arguments.param1 !== 'arg1') { return; }
        result = 'success';
    });
    router.route('/path/arg1/arg2/arg3', {'method': 'PoST'});
    assert.strictEqual(result, 'success', "The router 'success' event did not occur as expected");
})();