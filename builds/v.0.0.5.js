/*****************************************************************************
The MIT License (MIT)

Copyright (c) 2014 bstow

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*****************************************************************************/

/**** origin-router.js v.0.0.5 **/

/* [Example: Setup]
 * 
 * var router = new Router();
 */

/* [Example: Routing]
 * 
 * // add routes to the router with corresponding callbacks ...
 * router.add('/dog', function() { console.log('I have a dog'); });
 * router.add('/cat', function() { console.log('I have a cat'); });
 * 
 * // route some paths ...
 * router.route('/cat'); // outputs 'I have a cat'
 * router.route('/dog'); // outputs 'I have a dog'
 * router.route('/dog/'); // outputs 'I have a dog'
 * 
 * // attempt to route paths that don't match either route ...
 * router.route('/bulldog'); // outputs nothing
 * router.route('/dog/bulldog'); // outputs nothing
 */

/* [Example: Route Parameters]
 * 
 * // add more routes using ':' to denote parameters ...
 * router.add('/dog/:color', function(event) {
 *     console.log('I have a ' + event.arguments.color + ' colored dog'); });
 * router.add('/cat/:color', function(event) {
 *     console.log('I have a ' + event.arguments.color + ' colored cat'); });
 * router.add('/:pet/homework', function(event) {
 *     console.log('My ' + event.arguments.pet + ' ate my homework'); })
 * 
 * // route some more paths that match the added routes ...
 * router.route('/dog/brown'); // outputs 'I have a brown colored dog'
 * router.route('cat/white'); // outputs 'I have a white colored cat'
 * router.route('/fish/homework'); // outputs 'My fish at my homework'
 * router.route('/dog/homework');  // outputs 'I have a homework colored dog'
 *                                 // this is routed by the dog route and not
 *                                 // the homework route because the dog route
 *                                 // was added before the homework route
 */

/* [Example: Route Wildcard Parameters]
 * 
 * // add a route with a wildcard parameter denoted by a '*' at the end ...
 * router.add('/calico/:pet/:colors*', function(event) {
 *         console.log('I have a ' +
 *             event.arguments.colors + ' ' + event.arguments.pet);
 *     });
 * 
 * // the wildcard parameter matches anything at the end of the path ...
 * router.route('/calico/cat/white/orange/gray'); // outputs
 *                                                // 'I have a white/orange/gray cat'
 */

/* [Example: Parameter Constraints]
 * 
 * // add a route with parameter constraints ...
 * router.add('/dogs/:count/:breed', // count must be more than 0
 *     {'constraints': function(args) { return parseInt(args.count) > 0; }},
 *     function(event) {
 *         console.log('I have ' +
 *             event.arguments.count + ' ' + event.arguments.breed + 's');
 *     });
 * 
 * router.route('/dogs/0/poodle'); // outputs nothing because the count is invalid
 * router.route('/dogs/2/poodle'); // outputs 'I have 2 poodles'
 * 
 * // a route's parameter constraints may be defined per parameter
 * // as either a regular expression or an array of valid strings ...
 * router.add('cats/:count/:breed',
 *     {'constraints': {'count': /(two|three)/, 'breed': ['persian', 'siamese']}},
 *     function(event) {
 *         console.log('I have ' +
 *             event.arguments.count + ' ' + event.arguments.breed + ' cats');
 *     });
 * 
 * router.route('/cats/four/siamese'); // outputs nothing because the count is invalid
 * router.route('/cats/two/bengal'); // outputs nothing because the breed is invalid
 * router.route('/cats/two/persian'); // outputs 'I have two persian cats'
 */

/* [Example: HTTP Method-Specific Routing]
 * 
 * // add routes for only certain HTTP methods ...
 * router.add('/fish', {'method': 'GET'},
 *     function() { console.log('I have a fish'); });
 * router.add('/bird', {'method': ['GET', 'POST']},
 *     function() { console.log('I have a bird'); });
 * 
 * // alternatively routes can be added for an HTTP method like so ...
 * router.add.get('/turtle', function() { console.log('I have a turtle'); });
 * router.add.post('/rabbit', function() { console.log('I have a rabbit'); });
 * 
 * // route paths with a corresponding HTTP method specified ...
 * router.route('/fish', {'method': 'GET'}); // outputs 'I have a fish'
 * router.route('/fish', {'method': 'POST'}); // outputs nothing
 * router.route('/bird', {'method': 'GET'}); // outputs 'I have a bird'
 * router.route('/bird', {'method': 'POST'}); // outputs 'I have a bird'
 * router.route('/bird', {'method': 'DELETE'}); // outputs nothing
 * 
 * // HTTP method-specific routes are still applicable when no method is specified ...
 * router.route('/fish'); // outputs 'I have a fish'
 * router.route('/bird'); // outputs 'I have a bird'
 * 
 * // alternatively a path may be routed for an HTTP method like so ...
 * router.route.get('/fish'); // outputs 'I have a fish'
 * router.route.post('/bird'); // outputs 'I have a bird'
 */

/* [Example: Reverse Routing]
 * 
 * // add a route and give it a name for future reference ...
 * router.add('/:pet/mixed/:breeds*', {'name': 'mixed breed'}, function(event) {
 *         console.log('I have a mix breed ' + event.arguments.pet +
 *             ' that is a ' + event.arguments.breeds);
 *     });
 * 
 * // alternatively the route's name can pe passed as the first argument like so...
 * router.add('pure breed', '/:pet/pure/:breed', function(event) {
 *         console.log('I have a pure breed ' + event.arguments.pet +
 *             ' that is a ' + event.arguments.breed);
 *     });
 * 
 * // generate a path using a route ...
 * var pathname = router.path('mixed breed', // use the route named 'mixed breed'
 *     {'pet': 'dog', 'breeds': 'beagle/pug/terrier'}); // route's parameter arguments
 * 
 * console.log(pathname); // outputs '/dog/mixed/beagle/pug/terrier'
 */

/* [Example: Events]
 * 
 * // know when a route routes a path by listening to the route's 'route' event ...
 * var route = router.add('/hamster/:color', {'name': 'hamster'});
 * route.on('route', function(event) {
 *     console.log('I have a ' + event.arguments.color + ' ' + this.name); });
 * 
 * router.route('/hamster/brown'); // outputs 'I have a brown hamster'
 * 
 * // know when the router is unable to find a matching route to route a path
 * // by listening to the router's 'fail' event ...
 * router.on('fail', function(event) {
 *     console.log('No route found for ' + event.pathname); });
 * 
 * router.route('/guinea/pig'); // outputs 'No route found for /guinea/pig'
 * 
 * // alternatively, know when the router successfully routes any path by listening
 * // to the router's 'success' event ...
 * router.on('success', function(event) {
 *     console.log(event.pathname + " routed by route '" + event.route.name + "'"); });
 * 
 * router.route('/hamster/gray'); // outputs 'I have a gray hamster'
 *                                // outputs "/hamster/gray routed by route 'hamster'"
 */

/* [Example: Using with a Server]
 * 
 * 
 */

(function() { 'use strict';
    var events = require('events'), path = require('path'), util = require('util');

    var http = {'methods': ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT']}; // http methods

    var argumentMaps = {};

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
        http.methods.forEach(function(method) { methods[method.toLowerCase()] = {}; });

        // setup route stores
        [routes].concat(Object.keys(methods).map(function(key) { return methods[key]; })).forEach(
            function(store) { store.by = {'name': {}, 'order': []}; } // store by name and order
        );

        http.methods.forEach(function(method) {
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
     *      [@callback] {function|undefined}                        - called upon every routing
     *          [@args] {object<string>}                            - url encoded route arguments as name value pairs
     *          this {Route}                                        - route
     *      return {Route}                                          - route
     */
    Router.prototype.add = function() {
        var args = argumentMaps.add.apply(this, arguments); // associate arguments to parameters
        var name = args.name, expression = args.expression, options = args.options, callback = args.callback;

        var routes = this.___routes, methods = routes.methods;

        var opts = options, method, constraints; // options
        if (opts != undefined) { name = name || opts.name, method = opts.method, constraints = opts.constraints; }

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
            var data = store.by.order[index], route = data.route, subroutes = data.subroutes;

            var args = match(subroutes, subpaths); // arguments
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