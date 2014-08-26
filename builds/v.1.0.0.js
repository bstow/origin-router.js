/*******************************************************************************
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
*******************************************************************************/

/*******************************************************************************
Name:           Origin Router
Version:        1.0.0
Description:    A node.js module for routing HTTP requests
*******************************************************************************/

/*******************************************************************************
 * //// Example: Setting Up the Router /////////////////////////////////////////
 * 
 * // require the router module
 * var orouter = require('./origin-router.js');
 * 
 * // instantiate a new router
 * var router = new orouter.Router();
 * 
 * 
 * //// Example: Routing URL Paths /////////////////////////////////////////////
 * 
 * // add routes to the router with corresponding callbacks ...
 * router.add('/dog', function() { console.log('I have a dog'); });
 * router.add('/cat', function() { console.log('I have a cat'); });
 * 
 * // route some URL paths ...
 * router.route('/cat'); // outputs 'I have a cat'
 * router.route('/dog'); // outputs 'I have a dog'
 * 
 * // attempt to route URL paths that don't match either route ...
 * router.route('/bulldog'); // outputs nothing
 * router.route('/dog/bulldog'); // outputs nothing
 * 
 * 
 * //// Example: Routes with Parameters ////////////////////////////////////////
 * 
 * // add some more routes that use ':' to denote parameters ...
 * router.add('/dog/:color', function(event) {
 *     console.log('I have a ' + event.arguments.color + ' dog'); });
 * router.add('/cat/:color', function(event) {
 *     console.log('I have a ' + event.arguments.color + ' cat'); });
 * router.add('/:pet/homework', function(event) {
 *     console.log('My ' + event.arguments.pet + ' ate my homework'); })
 * 
 * // route some more URL paths that match the added routes ...
 * router.route('/dog/brown'); // outputs 'I have a brown dog'
 * router.route('cat/white'); // outputs 'I have a white cat'
 * router.route('/fish/homework'); // outputs 'My fish at my homework'
 * router.route('/dog/homework');  // outputs 'I have a homework dog'
 *                                 // this is routed by the dog color route and not
 *                                 // the homework route only because the dog color
 *                                 // route was added before the homework route
 * 
 * 
 * //// Example: Routes with Wildcard Parameters ///////////////////////////////
 * 
 * // add a route with a wildcard parameter denoted by a '*' at the end ...
 * router.add('/calico/:pet/:colors*', function(event) {
 *         console.log('I have a ' +
 *             event.arguments.colors.join(',') + ' ' + event.arguments.pet);
 *     });
 * 
 * // the wildcard parameter matches anything at the end of the URL path
 * // and translates the argument to an array of subpaths ...
 * router.route('/calico/cat/white/orange/gray'); // outputs
 *                                                // 'I have a white,orange,gray cat'
 * 
 * 
 * //// Example: Applying Constraints to Route Parameters //////////////////////
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
 * // as either a function, regular expression or an array of valid strings ...
 * router.add('cats/:count/:breed',
 *     {'constraints': {'count': /(two|three)/, 'breed': ['persian', 'siamese']}},
 *     function(event) {
 *         console.log('I have ' +
 *             event.arguments.count + ' ' + event.arguments.breed + ' cats');
 *     });
 * 
 * router.route('/cats/four/siamese'); // outputs nothing because the count is invalid
 * router.route('/cats/two/maltese'); // outputs nothing because the breed is invalid
 * router.route('/cats/two/persian'); // outputs 'I have two persian cats'
 * 
 * 
 * //// Example: HTTP Method-Specific Routing //////////////////////////////////
 * 
 * // add routes that apply to only certain HTTP methods ...
 * router.add('/fish', {'method': 'GET'},
 *     function() { console.log('I have a fish'); });
 * router.add('/bird', {'method': ['GET', 'POST']},
 *     function() { console.log('I have a bird'); });
 * 
 * // alternatively routes can be applied for an HTTP method like so ...
 * router.add.get('/turtle', function() { console.log('I have a turtle'); });
 * router.add.post('/rabbit', function() { console.log('I have a rabbit'); });
 * 
 * // route URL paths with a corresponding HTTP method specified ...
 * router.route('/fish', {'method': 'GET'}); // outputs 'I have a fish'
 * router.route('/fish', {'method': 'POST'}); // outputs nothing
 * router.route('/bird', {'method': 'GET'}); // outputs 'I have a bird'
 * router.route('/bird', {'method': 'POST'}); // outputs 'I have a bird'
 * router.route('/bird', {'method': 'DELETE'}); // outputs nothing
 * 
 * // alternatively a URL path may be routed for an HTTP method like so ...
 * router.route.get('/fish'); // outputs 'I have a fish'
 * router.route.post('/bird'); // outputs 'I have a bird'
 * 
 * // HTTP method-specific routes are still applicable when no method is specified ...
 * router.route('/fish'); // outputs 'I have a fish'
 * router.route('/bird'); // outputs 'I have a bird'
 * 
 * 
 * //// Example: Generating URL Paths using Routes /////////////////////////////
 * 
 * // add a route and give it a name for future reference ...
 * router.add('/:pet/mixed/:breeds*', {'name': 'mixed breed'}, function(event) {
 *         console.log('I have a mixed breed ' + event.arguments.pet +
 *             ' that is a ' + event.arguments.breeds.join(','));
 *     });
 * 
 * // alternatively the route's name can pe passed as the first argument like so...
 * router.add('pure breed', '/:pet/pure/:breed', function(event) {
 *         console.log('I have a pure breed ' + event.arguments.pet +
 *             ' that is a ' + event.arguments.breed);
 *     });
 * 
 * // generate a URL path using a route ...
 * var pathname = router.path('mixed breed', // use the route named 'mixed breed'
 *     {'pet': 'dog', 'breeds': ['beagle', 'pug', 'terrier']}); // parameter arguments
 * 
 * console.log(pathname); // outputs '/dog/mixed/beagle/pug/terrier'
 * 
 * 
 * //// Example: Router and Route Events and Data //////////////////////////////
 * 
 * // know when a route routes a URL path by listening to
 * // the route's 'route' event ...
 * var route = router.add('/hamster/:color', {'name': 'hamster'});
 * route.on('route', function(event) {
 *     console.log('I have a ' + event.arguments.color + ' ' + this.name); });
 * 
 * router.route('/hamster/brown'); // outputs 'I have a brown hamster'
 * 
 * // know when the router is unable to find a matching route to route a URL path
 * // by listening to the router's 'fail' event ...
 * router.once('fail', function(event) {
 *     console.log('What is a ' + event.pathname.replace('/', '-') + '?'); });
 * 
 * router.route('guinea/pig'); // outputs 'What is a guinea-pig?'
 * 
 * // alternatively, know when the router successfully routes any URL path by
 * // listening to the router's 'success' event ...
 * router.once('success', function(event) {
 *     console.log('My ' + event.route.name + ' is ' + event.arguments.color); });
 * 
 * router.route('/hamster/yellow'); // outputs 'I have a yellow hamster'
 *                                  // outputs 'My hamster is yellow'
 * 
 * // additionally when routing a URL path, arbitrary data can be attached
 * // by setting the data object which then will be accessible by any of the
 * // triggered listeners ...
 * router.add('mouse', '/mouse/:color', function(event) {
 *     console.log(event.data + ' has a ' + event.arguments.color + ' mouse'); });
 * router.route('/mouse/white', {'data': 'John'}); // outputs 'John has a white mouse'
 * 
 * 
 * //// Example: About URL Encoding ////////////////////////////////////////////
 * 
 * // by default, routes should be defined without any URL encoding...
 * router.add('/pet name/:name', {'constraints': {'name': ['Pete', 'Mary Jo', 'Al']}},
 *     function(event) { console.log("My pet's name is " + event.arguments.name); });
 * 
 * // when routing a URL path, the path should be in its original URL encoded form ...
 * router.route('/pet%20name/Pete'); // outputs "My pet's name is Pete"
 * 
 * // route arguments are URL decoded ...
 * router.route('/pet%20name/Mary%20Jo'); // outputs "My pet's name is Mary Jo"
 * 
 * // in some cases, a route may need to be defined with URL encoding ...
 * router.add('/%3adogs%2fcats/:actions*', // 1st subpath is ':dogs/cats' URL encoded
 *     {'encoded': true}, // indicate that the route is URL encoded
 *     function(event) {
 *         console.log('Dogs and cats ' +
 *             event.arguments.actions.join(' and '));
 *     });
 * 
 * router.route('/%3Adogs%2Fcats/run/jump'); // outputs 'Dogs and cats run and jump'
 * 
 * // when generating a URL path from a route, any passed route parameter arguments
 * // shouldn't contain URL encoding ...
 * router.add('/pet toys/:pet/:toys*', {'name': 'toys'});
 * pathname = router.path('toys',
 *     {'pet': 'bengal cat', 'toys': ['ball of yarn', 'catnip']});
 * // the generated URL path is URL encoded ...
 * console.log(pathname); // ouputs '/pet%20toys/bengal%20cat/ball%20of%20yarn/catnip'
 * 
 * 
 * //// Example: Using with an HTTP Server /////////////////////////////////////
 * 
 * 
 * 
 * 
 ******************************************************************************/

(function() { 'use strict';
    var events = require('events'),
        util = require('util');

    var HTTP = {'METHODS': // http methods
        ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT']};

    var argumentMaps = {}; // argument mappings for functions with variable parameters

    /*
     * Route {prototype}                                            - route for http requests
     *      inherits {EventEmitter}
     *      module.exports.Route
     *
     * Route.prototype.constructor {function}
     *      @expression {string}                                    - route expression
     *      [@options] {object|undefined}                           - options
     *          .name {string|undefined}                            - route name
     *          .method {string|array<string>|undefined}            - route's applicable http method(s)
     *          .constraints {function|object<function|RegExp|array<string>>|undefined} - route argument constraints
     *              [@arguments] {object<string|array<string>>}     - route arguments as name value pairs
     *              this {Route}                                    - route
     *              return {boolean}                                - true if valid, false if invalid
     *          .encoded {boolean|undefined}                        - url encoded route expression indicator
     *          .ignoreCase {boolean|undefined}                     - case insensitive path matching
     *
     * Route.prototype.expression {string}                          - get route expression
     *
     * Route.prototype.name {string|undefined}                      - get route name
     *
     * Route.prototype.method {string|array<string>|undefined}      - get route's applicable http method(s)
     *
     * Route.prototype.constraints {function|object<function|RegExp|<array<string>>|undefined} - route argument \
     *                                                                                              constraints
     *      [@arguments] {object<string|array<string>>}             - route arguments as name value pairs
     *      this {Route}                                            - route
     *      return {boolean}                                        - true if valid, false if invalid
     *
     * Route.prototype.encoded {boolean|undefined}                  - get url encoded route expression indicator
     *
     * Route.prototype.ignoreCase {boolean|undefined}               - case insensitive path matching
     *
     * Route.prototype
     *      emits route {event}                                     - occurs upon routing
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .pathname {string}                          - url encoded pathname
     *                  .method {string|undefined}                  - http method
     *                  .route {Route}                              - route
     *                  .arguments {object<string|array<string>>}   - route arguments as name value pairs
     *                  .data {*|undefined}                         - data
     *              this {Route}                                    - route
     */
    var Route = module.exports.Route = function(expression, options) {
        events.EventEmitter.call(this);

        var self = this;

        var name, method, constraints, encoded, ignoreCase; // options
        if (options != undefined) {
            name = options.name;
            method = options.method;
        }

        // accessors

        Object.defineProperty(this, 'expression', {'get': function() { return expression; }, // expression getter
            'enumerable': true, 'configurable': false});

        Object.defineProperty(this, 'name', {'get': function() { return name; }, // name getter
            'enumerable': true, 'configurable': false});

        if (util.isArray(method)) { Object.freeze(method); }
        Object.defineProperty(this, 'method', {'get': function() { return method; }, // method getter
            'enumerable': true, 'configurable': false});

        Object.defineProperty(this, 'encoded', {
            'get': function() { return encoded; }, // encoded getter
            'enumerable': true, 'configurable': false});
        if ('encoded' in options) { encoded = options.encoded; } // set encoded
        else { encoded = false; } // default encoded

        Object.defineProperty(this, 'ignoreCase', {
            'get': function() { return ignoreCase; }, // ignore case getter
            'set': function(value) { ignoreCase = value; }, // ignore case setter
            'enumerable': true, 'configurable': false});
        if ('ignoreCase' in options) { ignoreCase = options.ignoreCase; } // set ignore case
        else { ignoreCase = false; } // default ignore case

        if ('constraints' in options) {
            constraints = options.constraints;

            if (constraints === undefined || constraints === null) { constraints = undefined; }
            else if (constraints instanceof Function) { // constraint function
                constraints = (function(constraints) {
                    return function() { return constraints.apply(self, arguments); }; })(constraints);
            } else if (constraints === Object(constraints)) { // constraints map
                for (var key in constraints) {
                    var constraint = constraints[key];

                    var valid;
                    if (constraint instanceof Function) {
                        constraints[key] = (function(constraint) {
                            return function() { return constraint.apply(self, arguments); }; })(constraint);
                        valid = true;
                    } else if (constraint instanceof RegExp) { valid = true; }
                    else if (util.isArray(constraint)) {
                        valid = constraint.length !== 0 && constraint.every(
                            function(str) { return typeof str === 'string' || str instanceof String; });
                    } else { valid = false; }

                    if (!valid) {
                        throw new Error("Couldn't set constraints for route " +
                            (this.name != undefined ? "\'" + this.name + "\'" + ' ' : '') +
                            "because the contraint '" + key + "' was not a " +
                            'function, regular expression or an array of strings');
                    }

                    try { Object.freeze(constraint); } catch (err) {}
                }
            } else {
                throw new Error("Couldn't set constraints for route " +
                    (this.name != undefined ? "\'" + this.name + "\'" + ' ' : '') +
                    'because the contraints are invalid');
            }

            try { Object.freeze(constraints); } catch (err) {}
        }
        Object.defineProperty(this, 'constraints', {
            'get': function() { return constraints; }, // constraints getter
            'enumerable': true, 'configurable': false});
    };
    util.inherits(Route, events.EventEmitter);

    /*
     * Router {prototype}                                           - router for http requests
     *      inherits {EventEmitter}
     *      module.exports.Router
     *
     * Router.prototype.constructor {function}
     *
     * Router.prototype
     *      emits add {event}                                       - occurs upon adding a route
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .route {Route}                              - added route
     *              this {Router}                                   - router
     *      emits success {event}                                   - occurs upon routing
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .pathname <string>                          - url encoded pathname
     *                  .method <string|undefined>                  - http method
     *                  .route {Route}                              - matching route
     *                  .arguments {object<string|array<string>>}   - route arguments as name value pairs
     *                  .data {*|undefined}                         - data
     *              this {Router}                                   - router
     *      emits fail {event}                                      - occurs upon routing when no matching route found
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .pathname <string>                          - url encoded pathname
     *                  .method <string|undefined>                  - http method
     *                  .data {*|undefined}                         - data
     *              this {Router}                                   - router
     */
    var Router = module.exports.Router = function() {
        events.EventEmitter.call(this);

        var self = this;

        var routes = {}; // all routes regardless of method
        Object.defineProperty(this, '__routes__', {'get': function() { return routes; }, // routes getter
            'enumerable': false, 'configurable': false});

        var methods = routes.methods = {} // routes segregated by method
        HTTP.METHODS.forEach(function(method) { methods[method.toLowerCase()] = {}; });

        // setup route stores
        [routes].concat(Object.keys(methods).map(function(key) { return methods[key]; })).forEach(
            function(stores) { stores.by = {'name': {}, 'order': []}; } // store by name and order
        );

        HTTP.METHODS.forEach(function(method) {
            self.add[method.toLowerCase()] = function() { // http method add method
                var args = argumentMaps.add.apply(self, arguments); // associate arguments to parameters
                var name = args.name,
                    expression = args.expression,
                    options = args.options,
                    callback = args.callback;

                // add method to arguments
                options = options || {}, options.method = options.method || [];
                if (util.isArray(options.method)) { options.method.unshift(method); }
                else { options.method = [options.method, method]; }

                return self.add(name, expression, options, callback);
            };

            self.route[method.toLowerCase()] = function() { // http method route method
                var args = argumentMaps.route.apply(self, arguments); // associate arguments to parameters
                var pathname = args.pathname,
                    options = args.options,
                    callback = args.callback;

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
     * Router.prototype.add.head {function}                         - add a route applicable to the HTTP HEAD method
     * Router.prototype.add.options {function}                      - add a route applicable to the HTTP OPTIONS method
     * Router.prototype.add.trace {function}                        - add a route applicable to the HTTP TRACE method
     * Router.prototype.add.connect {function}                      - add a route applicable to the HTTP CONNECT method
     *      [@name] {string}                                        - route name
     *      @expression {string}                                    - route expression
     *      [@options] {object|undefined}                           - options
     *          .name {string|undefined}                            - route name
     *          .method {string|array<string>|undefined}            - route's applicable http method(s)
     *          .constraints {function|object<function|RegExp|<array<string>>|undefined} - route argument constraints
     *              [@arguments] {object<string|array<string>>}     - route arguments as name value pairs
     *              this {Route}                                    - route
     *              return {boolean}                                - true if valid, false if invalid
     *          .encoded {boolean|undefined}                        - url encoded route expression indicator
     *          .ignoreCase {boolean|undefined}                     - case insensitive path matching
     *      [@callback] {function|undefined}                        - called upon every routing
     *          @event {object}                                     - event object
     *              .pathname {string}                              - url encoded pathname
     *              .method {string|undefined}                      - http method
     *              .route {Route}                                  - route
     *              .arguments {object<string|array<string>>}       - route arguments as name value pairs
     *              .data {*|undefined}                             - data
     *          this {Route}                                        - route
     *      return {Route}                                          - route
     */
    Router.prototype.add = function() {
        var args = argumentMaps.add.apply(this, arguments); // associate arguments to parameters
        var name = args.name,
            expression = args.expression,
            options = args.options,
            callback = args.callback;

        var routes = this.__routes__,
            methods = routes.methods;

        var method, constraints; // options
        if (options != undefined) {
            name = name || options.name;
            method = options.method;
            constraints = options.constraints;
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

        var routeOptions = {'name': name, 'method': method, 'constraints': constraints}; // route options
        if (options != undefined) { // optional route options
            // forward encoded option to route
            if ('encoded' in options) { routeOptions.encoded = options.encoded; }
            // forward ignore case option to route
            if ('ignoreCase' in options) { routeOptions.ignoreCase = options.ignoreCase; }
        }
        var route = new Route(expression, routeOptions), // route event emitter
            encoded = route.encoded;

        var subroutes = parse.route(expression, encoded); // parse expression into subroutes

        var data = {'route': route, 'subroutes': subroutes};

        stores.forEach(function(store) {
            store.by.order.push(data); // store by order
            if (name != undefined) { store.by.name[name] = data; } // store by name
        });

        if (callback != undefined) { route.on('route', callback); }

        // emit add event upon adding route
        this.emit('add', {'route': route});

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
     * Router.prototype.route {function}                    - route a path
     * Router.prototype.route.get {function}                - route a path using the HTTP GET method
     * Router.prototype.route.post {function}               - route a path using the HTTP POST method
     * Router.prototype.route.put {function}                - route a path using the HTTP PUT method
     * Router.prototype.route.delete {function}             - route a path using the HTTP DELETE method
     * Router.prototype.route.head {function}               - route a path using the HTTP HEAD method
     * Router.prototype.route.options {function}            - route a path using the HTTP OPTIONS method
     * Router.prototype.route.trace {function}              - route a path using the HTTP TRACE method
     * Router.prototype.route.connect {function}            - route a path using the HTTP CONNECT method
     *      @pathname {string}                              - url encoded path
     *      [@options] {object|undefined}                   - options
     *          .method {string|undefined}                  - http method
     *          .data {*|undefined}                         - data
     *      [@callback] {function|undefined}                - called upon routing
     *          @event {object}                             - event object
     *              .pathname {string}                      - url encoded pathname
     *              .method {string|undefined}              - http method
     *              .route {Route}                          - matching route
     *              .arguments {object<string|array<string>>} - matching route arguments as name value pairs
     *              .data {*|undefined}                     - data
     *          this {Route}                                - matching route
     *          return {Route|undefined}                    - matching route or undefined if no matching route found
     */
    Router.prototype.route = function() {
        var args = argumentMaps.route.apply(this, arguments); // associate arguments to parameters
        var pathname = args.pathname,
            options = args.options,
            callback = args.callback;

        var method, data; // options
        if (options != undefined) {
            method = options.method;
            data = options.data;
        }

        var routes = this.__routes__,
            methods = routes.methods;

        var stores;
        if (method != undefined) { // convert method to the associated store
            var stores = methods[method.toLowerCase().trim()];

            if (stores == undefined) { // no associated stores
                throw new Error("Couldn't route '" + pathname +
                    "' because the method '" + method + "' is not recognized");
            }
        } else { stores = routes; } // all routes

        var subpaths = parse.path(pathname);

        // find matching route
        var length = stores.by.order.length;
        for (var index = 0; index < length; index++) {
            var store = stores.by.order[index];
            var route = store.route,
                subroutes = store.subroutes,
                ignoreCase = route.ignoreCase;

            var args = match(subroutes, subpaths, ignoreCase); // arguments
            if (args != undefined) { // match
                var constraints = route.constraints; // validate constraints
                if (constraints !== undefined && validate(args, constraints) !== true) { continue; }

                if (callback != undefined) { route.once('route', callback); } // queue callback

                route.emit('route', // emit route event from matching route upon matching route
                    {'pathname': pathname, 'method': method, 'route': route, 'arguments': args, 'data': data});
                this.emit('success', // emit success event upon mathing route
                    {'pathname': pathname, 'method': method, 'route': route, 'arguments': args, 'data': data});

                return route; // return matching route
            }
        }

        this.emit('fail', // emit fail event upon no matching route
            {'pathname': pathname, 'method': method, 'data': data});
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
     * Router.prototype.path {function}                 - generate a path
     *      @name {string}                              - route name
     *      [@arguments] {object<string|array<string>>} - route arguments as name value pairs
     *      return {string}                             - url encoded path
     */
    Router.prototype.path = function(name, args) {
        args = args || {};

        var routes = this.__routes__;

        if (name in routes.by.name) { // compose path with the named route
            var data = routes.by.name[name],
                route = data.route,
                subroutes = data.subroutes;

            // validate constraints
            var constraints = route.constraints;
            var valid = validate(args, constraints);
            if (valid !== true) { // invalid
                if (typeof valid !== 'boolean' && !(valid instanceof Boolean)) { // invalid parameter constraint
                    var key = Object.keys(valid)[0],
                        value = valid[key];
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

    /* RoutePathPart {prototype}                        - route path part
     *
     * RoutePathPart.prototype.constructor {function}
     *      @raw {string}                               - raw value
     *      [@encoded] {string}                         - url encoded value
     *
     * RoutePathPart.prototype.raw {string}             - get raw value
     *
     * RoutePathPart.prototype.encoded {string}         - get encoded value
     */
    var RoutePathPart = function(raw, encoded) {
        if (encoded == undefined) { encoded = encodeURIComponent(raw); }

        // accessors

        Object.defineProperty(this, 'raw', {'get': function() { return raw; }, // raw value getter
            'enumerable': true, 'configurable': false});

        Object.defineProperty(this, 'encoded', {'get': function() { return encoded; }, // encoded value getter
            'enumerable': true, 'configurable': false});
    };

    /* RouteParameterPart {prototype}                       - route parameter part
     *
     * RouteParameterPart.prototype.constructor {function}
     *      @name {string}                                  - name
     *
     * RouteParameterPart.prototype.name {string}           - get name
     */
    var RouteParameterPart = function(name) {
        // accessors

        Object.defineProperty(this, 'name', {'get': function() { return name; }, // name getter
            'enumerable': true, 'configurable': false});
    };

    /* RouteWildcardParameterPart {prototype}                       - route wildcard parameter part
     *      inherits {RouteParameterPart}
     *
     * RouteWildcardParameterPart.prototype.constructor {function}
     *      @name {string}                                          - name
     */
    var RouteWildcardParameterPart = function(name) {
        RouteParameterPart.call(this, name);
    };
    util.inherits(RouteWildcardParameterPart, RouteParameterPart);

    /*
     * parse {object}
     */
    var parse = {}; // parsing

    /*
     * parse.route {function}                                   - parse an expression into subroutes
     *      @expression {string}                                - route expression
     *      [@decode] {boolean|undefined}                       - url decode expression subroutes
     *      return {array<RoutePathPart|RouteParameterPart>}    - parts of the route
     */
    parse.route = function(expression, decode) {
        var last, // last character
            collision; // first parameter collision name;

        var names = {}; // parameter name counts

        expression = expression.trim();

        last = expression.length - 1;
        if (expression.charAt(last) === '/') { expression = expression.substring(0, last); }
        if (expression.charAt(0) === '/') { expression = expression.substring(1); }

        var subroutes = expression.split('/');
        subroutes.forEach(function(subroute, index, subroutes) { // parameters
            var part;
            if (subroute.charAt(0) === ':') { // parameter
                last = subroute.length - 1;

                var wildcard = subroute.charAt(last) === '*';
                var name = wildcard ? subroute.substring(1, last) : subroute.substring(1);

                if (name in names) { // parameter name collision
                    if (collision == undefined) { collision = name; }
                    names[name]++; // increment parameter name count
                } else { names[name] = 1; }

                if (wildcard && index == subroutes.length - 1) { part = new RouteWildcardParameterPart(name); }
                else { part = new RouteParameterPart(name); }
            } else { // path part
                if (decode) { part = new RoutePathPart(decodeURIComponent(subroute), subroute); }
                else { part = new RoutePathPart(subroute); }
            }

            subroutes[index] = part;
        });

        if (collision != undefined) {
            throw new Error("Route '" + expression + "' contains " + names[collision] + " parts named '" + collision + "'");
        }

        return subroutes;
    };

    /*
     * parse.path {function}        - parse url encoded path into subpaths
     *      @pathname {string}      - url encoded path
     *      return {array<string>}  - parts of the path
     */
    parse.path = function(pathname) {
        pathname = pathname.trim();

        var last = pathname.length - 1;
        if (pathname.charAt(last) === '/') { pathname = pathname.substring(0, last); }
        if (pathname.charAt(0) === '/') { pathname = pathname.substring(1); }

        var subpaths = [];
        pathname.split('/').forEach(function(subpath) { subpaths.push(decodeURIComponent(subpath)); });

        return subpaths;
    };

    /*
     * match {function}                                             - match subroutes and subpaths
     *      @subroutes {array<RoutePathPart|RouteParameterPart>}    - parts of the route
     *      @subpaths {array<string>}                               - url decoded parts of the path
     *      [@ignoreCase {boolean|undefined}]                       - case insensitive matching
     *      return {object<string|array<string>>}                   - route arguments as name value pairs
     */
    var match = function(subroutes, subpaths, ignoreCase) {
        var args = {};

        var wildcard;
        var index, length = subpaths.length;
        for (index = 0; index < length; index++) { // traverse subpaths and subroutes
            var subroute = subroutes[index],
                subpath = subpaths[index];

            if (subroute == undefined) { return; } // match unsuccessful
            else if (subroute instanceof RoutePathPart) { // path part
                if (ignoreCase) { // case insensitive match
                    if (subroute.raw.toLowerCase() === subpath.toLowerCase()) { continue; } // continue matching
                    else { return; } // match unsuccessful
                } else { // case sensitive match
                    if (subroute.raw === subpath) { continue; } // continue matching
                    else { return; } // match unsuccessful
                }
            } else if (subroute instanceof RouteParameterPart) { // parameter
                if (subroute instanceof RouteWildcardParameterPart) { // wildcard parameter
                    wildcard = subroute.name; // wildcard parameter name
                    break; // end matching
                } else { // paramter
                    args[subroute.name] = decodeURIComponent(subpath); // store argument
                    continue; // continue matching
                }
            } else { break; } // end matching
        }

        if (wildcard != undefined) { // resolve wildcard parameter, store argument
            args[wildcard] = subpaths.slice(index).map(function(subpath) { return decodeURIComponent(subpath); });
        } else if (index != subroutes.length) { return; } // no match

        return args; // match
    };

    /*
    * compose {function}                                            - compose path from subroutes
    *       @subroutes {array<RoutePathPart|RouteParameterPart>}    - parts of the route
    *       [@arguments] {object<string|array<string>>}             - route arguments as name value pairs
    *       return {string}                                         - url encoded path
    *
    *       throws error {RouteParameterValueInvalidCharacterError} - occurs upon an argument containing an invalid \
    *                                                                   character
    */
    var compose = function(subroutes, args) {
        args = args || {};

        var subpaths = [];
        subroutes.forEach(function(subroute) {
            if (subroute instanceof RoutePathPart) { // path part
                subpaths.push(subroute.encoded);
            } else if (subroute instanceof RouteParameterPart) { // parameter
                var argument = args[subroute.name];
                if (argument == undefined) { argument = ''; }

                if (subroute instanceof RouteWildcardParameterPart) { // wildcard parameter
                    if (util.isArray(argument)) { // array argument
                        argument.forEach(function(subargument) { subpaths.push(encodeURIComponent(subargument)); });
                    } else { subpaths.push(encodeURIComponent(String(argument))); } // string argument
                } else { // parameter
                    subpaths.push(encodeURIComponent(String(argument))); // string argument
                }
            }
        });

        var pathname = subpaths.join('/');
        if (pathname.charAt(0) !== '/') { pathname = '/' + pathname; }

        return pathname;
    };

    /*
     * validate {function}                                                  - validate arguments against constraints
     *      [@arguments] {object<string|array<string>>}                     - route arguments as name value pairs
     *      [@constraints] {function|object<RegExp|<array<string>>|undefined} - route argument constraints
     *          [@arguments] {object<string|array<string>>}                 - route arguments as name value pairs
     *          return {boolean}                                            - true if valid, false if invalid
     *      return {boolean|object<string>}                                 - true if valid, false if invalid, \
     *                                                                          constraint name value pair if \
     *                                                                          constraint in constraints map is \
     *                                                                          invalid
     */
    var validate = function(args, constraints) {
        args = args || {};

        if (constraints != undefined) {
            if (constraints instanceof Function) { // validate arguments against constraint function
                return constraints(args) ? true : false; // validate
            } else { // validate arguments against constraints map
                for (var name in constraints) { // iterate parameter names within constraints
                    if (!(name in args)) { continue; } // no argument to validate

                    var argument = args[name],
                        constraint = constraints[name];
                    if (constraint instanceof Function) { // function
                        if (!constraint(argument)) { // invalid
                            var invalid = {};
                            invalid[name] = argument;
                            return invalid;
                        }
                    } if (constraint instanceof RegExp) { // regular expression
                        if (util.isArray(argument)) { // array of strings wildcard parameter argument
                            var argumentLength = argument.length;
                            for (var i = 0; i < argumentLength; i++) {
                                var subargument = argument[i];
                                if (!constraint.test(subargument)) { // invalid
                                    var invalid = {};
                                    invalid[name] = subargument;
                                    return invalid;
                                }
                            }
                        } else { // string parameter argument
                            if (!constraint.test(argument)) { // invalid
                                var invalid = {};
                                invalid[name] = argument;
                                return invalid;
                            }
                        }
                    } else if (util.isArray(constraint)) { // array of strings
                        if (util.isArray(argument)) { // array of strings wildcard parameter argument
                            var argumentLength = argument.length;
                            for (var i = 0; i < argumentLength; i++) {
                                var subargument = argument[i];
                                if (constraint.indexOf(subargument) === -1) { // invalid
                                    var invalid = {};
                                    invalid[name] = subargument;
                                    return invalid;
                                }
                            }
                        } else { // string parameter argument
                            if (constraint.indexOf(argument) === -1) { // invalid
                                var invalid = {};
                                invalid[name] = argument;
                                return invalid;
                            }
                        }
                    }
                }
                return true; // valid
            }
        } else { return true; } // valid
    };
})();