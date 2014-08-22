/**** { @! name }.js v.{ @! version } **/

/*{ @! example code }*/

(function() { 'use strict';
    var events = require('events'),
        util = require('util');

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
    var Route = function(expression, options) {
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

        var routes = this.__routes__, methods = routes.methods;

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

/*{ @! tests }*/
(function() { // tests
    var assert = require('assert');

    var router = new module.exports.Router(); // test router

    var result;

    result = {};
    var onRoute = function(event) { result = {'name': this.name, 'args': event.arguments, 'data': event.data}; };

    // add routes
                            //  "' path '" ...
    var firstRoute = router.add("/%27 path%20'/:param1/:param2/:param3*",  // 1st route
        {'name': 'route 1', 'encoded': true}, onRoute);
    router.add("/' path '/:param1/:param2/", {'name': 'route 2'}).on('route', onRoute); // 2nd route
    router.add(':param1*/:param2/path', {'name': 'route 3'}).on('route', onRoute); // 3rd route
    router.add('%2F%20path/file.ext', {'name': 'route 4', 'ignoreCase': true, 'encoded': true}, onRoute); // 4th route
            // '/ path' ...

    var constraints;
    constraints = function(args) {
        return args.param1 != 'not 1' && args.param2 != 'not 1' && this.expression.indexOf('constrain') != -1;
    };
    router.add('/constraint/:param1/:param2', // 1st constrained route
        {'name': 'constrained route 1', 'method': ['connect'], 'constraints': constraints}).on('route', onRoute);
    constraints = {'param1': /^(?!(?:not\s2)).*$/, 'param2': /^(?!(?:not\s2)).*$/, 'param3': /^(?!(?:not\s2)).*$/};
    var routeConstraint2 = router.add('/constraint/:param1/:param2', // 2nd constrained route
        {'name': 'constrained route 2', 'method': 'connect', 'constraints': constraints}).on('route', onRoute);
    routeConstraint2.constraints = constraints;
    constraints = {'param1': ['not 1', 'not 2'], 'param2': /^not\s[1-2]$/};
    router.add('/constraint/:param1/:param2', // 3rd constrained route
        {'name': 'constrained route 3', 'method': 'connect', 'constraints': constraints}).on('route', onRoute);
    constraints = {
        'param1': function(arg) { return arg === 'arg 1' && this.name === 'constrained route 4'; },
        'param2': ['arg 2'],
        'param3': ['arg 3', 'arg 4', 'arg 5']};
    router.add.post('constraint/:param1/:param2/:param3*', // 4th constrainted route
        {'name': 'constrained route 4', 'constraints': constraints}).on('route', onRoute);
    constraints = {
        'param1': /arg\s1/,
        'param3': /arg\s[3-6]/};
    router.add.post('constraint/:param1/:param2/:param3*', // 5th constrainted route
        {'name': 'constrained route 5', 'constraints': constraints}).on('route', onRoute);

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

    // route path with 4th route
    router.route('/%2f%20path/file.EXT/', {'method': 'Delete'});
    assert.strictEqual(result.name, 'route 4', 'The path did not match the 4th route');

    // route paths with constrained routes
    router.route('/constraint/1/1', {'method': 'connect'});
    assert.strictEqual(result.name, 'constrained route 1', 'The path did not match the 1st constrained route');
    router.route('/constraint/1/not%201', {'method': 'connect'});
    assert.strictEqual(result.name, 'constrained route 2', 'The path did not match the 2nd constrained route');
    router.route('/constraint/not%202/not 1', {'method': 'connect'});
    assert.strictEqual(result.name, 'constrained route 3', 'The path did not match the 3rd constrained route');
    router.route.post('/constraint/arg%201/arg 2/arg 3/arg 5');
    assert.strictEqual(result.name, 'constrained route 4', 'The path did not match the 4th constrained route');
    router.route.post('/constraint/arg%201/arg 2/arg 3/arg 5/arg 6');
    assert.strictEqual(result.name, 'constrained route 5', 'The path did not match the 5th constrained route');

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

    // generate path with 1st route
    result = router.path('route 1', {'param1': 'arg/1', 'param2': 'arg2', 'param3': '/a/r/g/3/'});
    assert.strictEqual(result, "/%27 path%20'/arg%2F1/arg2/%2Fa%2Fr%2Fg%2F3%2F",
        'The path generated using the 1st route did not match the expected value');
    result = router.path('route 1', {'param1': 'arg/1', 'param2': 'arg2', 'param3': ['arg ', 3]});
    assert.strictEqual(result, "/%27 path%20'/arg%2F1/arg2/arg%20/3",
        'The path generated using the 1st route did not match the expected value');

    // generate path with 2nd route
    result = router.path('route 2', {'param1': 'arg1', 'param2': 'arg2'});
    assert.strictEqual(result, '/' + encodeURIComponent("' path '") + '/arg1/arg2',
        'The path generated using the 2nd route did not match the expected value');

    // generate path with 3rd route
    result = router.path('route 3', {'param1': 'arg 1', 'param2': 'arg 2'});
    assert.strictEqual(result, '/arg%201/arg%202/path',
        'The path generated using the 3rd route did not match the expected value');

    // generate path with 4th route
    result = router.path('route 4');
    assert.strictEqual(result, '/%2F%20path/file.ext',
        'The path generated using the 4th route did not match the expected value');

    // generate path with constrained routes
    assert.throws(
        function() { router.path('constrained route 1', {'param1': 'not 1', 'param2': '1'}); },
        function(err) {
            return (err instanceof Error &&
                /constrained\sroute\s1/.test(err.message) && /one\sor\smore/.test(err.message));
        },
        'Generating a path with the 1st constrained route and an invalid argument did not fail as expected');
    assert.throws(
        function() { router.path('constrained route 2', {'param1': 'not 2', 'param2': '2'}); },
        function(err) {
            return (err instanceof Error &&
                /constrained\sroute\s2/.test(err.message) && /param1/.test(err.message) && /not\s2/.test(err.message));
        },
        'Generating a path with the 2nd constrained route and an invalid argument did not fail as expected');
    result = router.path('constrained route 3', {'param1': 'not 1', 'param2': 'not 2'});
    assert.strictEqual(result, '/constraint/not%201/not%202',
        'The path generated using the 3rd constrained route did not match the expected value');
    result = router.path('constrained route 3', {'param2': 'not 2'});
    assert.strictEqual(result, '/constraint//not%202',
        'The path generated using the 3rd constrained route did not match the expected value');
    result = router.path('constrained route 4', {'param1': 'arg 1', 'param2': 'arg 2', 'param3': 'arg 3'});
    assert.strictEqual(result, '/constraint/arg%201/arg%202/arg%203',
        'The path generated using the 4th constrained route did not match the expected value');
    result = router.path('constrained route 4', {'param1': 'arg 1', 'param2': 'arg 2', 'param3': ['arg 3', 'arg 4']});
    assert.strictEqual(result, '/constraint/arg%201/arg%202/arg%203/arg%204',
        'The path generated using the 4th constrained route did not match the expected value');
    result = router.path('constrained route 4', {'param1': 'arg 1', 'param2': 'arg 2', 'param3': ['arg 3', 'arg 4']});
    assert.strictEqual(result, '/constraint/arg%201/arg%202/arg%203/arg%204',
        'The path generated using the 4th constrained route did not match the expected value');
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
    router.once('add', function(event) {
        if (event.route.name !== 'added-route') { return; }
        if (this !== router) { return; }
        result = 'add';
    });
    router.add('/added/route', {'name': 'added-route', 'method': 'Options'});
    assert.strictEqual(result, 'add', "The router 'add' event did not occur as expected");
    router.once('fail', function(event) {
        if (event.pathname !== '/*/*/*/no/matching/route/*/*/*/' || event.method !== '  Get') { return; }
        if (event.data !== 'pass-to-listener') { return; }
        if (this !== router) { return; }
        result = 'fail';
    });
    router.route('/*/*/*/no/matching/route/*/*/*/', {'method': '  Get', 'data': 'pass-to-listener'});
    assert.strictEqual(result, 'fail', "The router 'fail' event did not occur as expected");
    router.once('success', function(event) {
        if (event.pathname !== '/%27%20path%20%27/arg1/arg2/arg3' || event.method !== 'PoST') { return; }
        if (event.data.info !== 'pass-to-listener') { return; }
        if (this !== router || event.route !== firstRoute || event.arguments.param1 !== 'arg1') { return; }
        result = 'success';
    });
    router.route('/%27%20path%20%27/arg1/arg2/arg3', {'method': 'PoST', 'data': {'info': 'pass-to-listener'}});
    assert.strictEqual(result, 'success', "The router 'success' event did not occur as expected");
})();