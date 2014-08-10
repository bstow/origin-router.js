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
 * // add routes to the router ...
 * router.add('/dog', function() { console.log('I have a dog'); });
 * router.add('/cat', function() { console.log('I have a cat'); });
 * 
 * // route some paths ...
 * router.route('/cat'); // outputs 'I have a cat'
 * router.route('/dog'); // outputs 'I have a dog'
 * router.route('/bulldog'); // outputs nothing
 * router.route('/dog/bulldog'); // outputs nothing
 */

/* [Example: Route Parameters]
 * 
 * // add more routes using ':' to denote parameters ...
 * router.add('/dog/:color',
 *     function(args) { console.log('I have a ' + args.color + ' colored dog'); });
 * router.add('/cat/:color',
 *     function(args) { console.log('I have a ' + args.color + ' colored cat'); });
 * router.add('/:pet/homework',
 *     function(args) { console.log('My ' + args.pet + ' ate my homework'); })
 * 
 * // route some more paths ...
 * router.route('/dog/brown'); // outputs 'I have a brown colored dog'
 * router.route('/cat/white'); // outputs 'I have a white colored cat'
 * router.route('/fish/homework'); // outputs 'My fish at my homework'
 * router.route('/dog/homework');  // outputs 'I have a homework colored dog'
 *                                 // this is routed by the dog route and not
 *                                 // the homework route because the dog route
 *                                 // was added before the homework route
 */

/* [Example: Route Wildcard Parameters]
 * 
 * // add a route with a wildcard parameter denoted by a '*' at the end ...
 * router.add('/calico/:pet/:colors*',
 *     function(args) { console.log('I have a ' + args.colors + ' ' + args.pet); });
 * 
 * router.route('/calico/cat/white/orange/gray'); // outputs
 *                                                // 'I have a white/orange/gray cat'
 */

/* [Example: Parameter Constraints]
 * 
 * // add a route with parameter constraints ...
 * router.add('/dogs/:count/:breed',
 *     {'constraints': function(args) { return parseInt(args.count) > 0; },
 *     function(args) {
 *         console.log('I have ' + args.count + ' ' + args.breed + 's'); });
 * 
 * router.route('/dogs/0/poodle'); // outputs nothing because the count is invalid
 * router.route('/dogs/2/poodles'); // outputs 'I have 2 poodles'
 * 
 * // a route's parameter constraints may be defined per parameter
 * // as either a regular expression or an array of valid strings ...
 * router.add('cats/:count/:breed'
 *     {'constraints': 'count': /(two|three)/, 'breed': ['persian', 'siamese']},
 *     function(args) {
 *         console.log('I have ' + args.count + ' ' + args.breed + ' cats'); });
 * 
 * router.route('/cats/four/siamese'); // outputs nothing because the count is invalid
 * router.route('/cats/two/bengal'); // outputs nothing because the breed is invalid
 * router.route('/cats/two/persian'); // outputs 'I have two persian cats'
 */

/* [Example: HTTP Method-Specific Routing]
 * 
 * // add method-specific routes to the router ...
 * router.add('/fish', {'method': 'GET'},
 *     function() { console.log('I have a fish'); });
 * router.add('/bird', {'method': ['GET', 'POST']},
 *     function() { console.log('I have a bird'); });
 * 
 * // route method-specific paths ...
 * router.route('/fish', {'method': 'GET'}); // outputs 'I have a fish'
 * router.route('/fish', {'method': 'POST'}); // outputs nothing
 * router.route('/bird', {'method': 'GET'}); // outputs 'I have a bird'
 * router.route('/bird', {'method': 'POST'}); // outputs 'I have a bird'
 * router.route('/bird', {'method': 'DELETE'}); // outputs nothing
 * 
 * router.route('/fish'); // outputs 'I have a fish'
 * router.route('/bird'); // outputs 'I have a bird'
 */

/* [Example: Reverse Routing]
 * 
 * // add a named route ...
 * router.add('/:pet/mixed/:breeds*',
 *     {'name': 'mixed breed'},
 *     function(args) {
 *         console.log('I have a mix breed ' + args.pet + ' that is a ' + args.breeds);
 *     });
 * 
 * // generate a path using the named route ...
 * var path = router.path('mixed breed', // path is '/dog/mixed/beagle/bulldog/boxer'
 *     {'pet': 'dog', 'breeds': 'beagle/bulldog/boxer'});
 * 
 * // generated path matches the 'mixed breed' route ...
 * router.route(path); // outputs
 *                     // 'I have a mix breed dog that is a beagle/bulldog/boxer'
 */

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