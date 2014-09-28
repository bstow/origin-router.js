/*@![info]*/

/*@![examples]*/

(function() { 'use strict';
    var events  = require('events'),
        http    = require('http'),
        path    = require('path'),
        url     = require('url'),
        util    = require('util');

    var HTTP = { // http methods
        'METHODS': [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'HEAD',
            'OPTIONS',
            'TRACE',
            'CONNECT'
        ]};

    var PATH_SYMBOLS = { // path symbols
        'DELINEATOR':       '/',
        'TRAILING_SLASH':   '/'
    };

    var EXPRESSION_SYMBOLS = { // expression symbols
                'PARAMETER':                ':',
                'WILDCARD_PARAMETER':       '*',
                'PARAMETER_CONSTRAINT':     ['<', '>'],
                'DELINEATOR':               '/',
                'TRAILING_SLASH':           '/',
                'OPTIONAL_TRAILING_SLASH':  '/?'
            },
        EXPRESSION_PARAMETER_REGEX = new RegExp( // expression parameter part regex
                '^[' + EXPRESSION_SYMBOLS.PARAMETER + ']\\s*' +                         // parameter symbol
                '([^' + [                                                               // parameter name
                    EXPRESSION_SYMBOLS.PARAMETER,
                    EXPRESSION_SYMBOLS.WILDCARD_PARAMETER,
                    EXPRESSION_SYMBOLS.PARAMETER_CONSTRAINT[0], EXPRESSION_SYMBOLS.PARAMETER_CONSTRAINT[1],
                    EXPRESSION_SYMBOLS.DELINEATOR,
                    EXPRESSION_SYMBOLS.TRAILING_SLASH,
                    EXPRESSION_SYMBOLS.OPTIONAL_TRAILING_SLASH
                ].join('') + ']+?)\\s*' +
                '(?:([' + EXPRESSION_SYMBOLS.WILDCARD_PARAMETER + '])+)?\\s*' +         // wildcard parameter symbol
                '(?:[' + EXPRESSION_SYMBOLS.PARAMETER_CONSTRAINT[0] + ']' +             // parameter constraint symbol
                    '([^' +                                                             // parameter constraint regex
                        EXPRESSION_SYMBOLS.PARAMETER_CONSTRAINT[0] + EXPRESSION_SYMBOLS.PARAMETER_CONSTRAINT[1] +
                    ']*)' +
                '[' + EXPRESSION_SYMBOLS.PARAMETER_CONSTRAINT[1] + '])?\\s*' +
                '(?:([' + EXPRESSION_SYMBOLS.WILDCARD_PARAMETER + '])*)?\\s*' +         // wildcard parameter symbol
                '(?:(?=[' + EXPRESSION_SYMBOLS.TRAILING_SLASH + '])|$)'
            );

    var finalize = []; // finalizations to be executed last

    var argumentMaps = {}; // argument mappings for functions with variable parameters

    /*
     * Route {prototype}                                            - route for http requests
     *      inherits {events.EventEmitter}
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
     * Route.prototype.constraints {function|object<function|RegExp|<array<string>>|undefined} - get/set route \
     *                                                                                             argument constraints
     *      [@arguments] {object<string|array<string>>}             - route arguments as name value pairs
     *      this {Route}                                            - route
     *      return {boolean}                                        - true if valid, false if invalid
     *
     * Route.prototype.encoded {boolean|undefined}                  - get url encoded route expression indicator
     *
     * Route.prototype.ignoreCase {boolean|undefined}               - get/set case insensitive path matching
     *
     * Route.prototype.pathSourceCode {string}                      - get source code for function to generate a path
     *
     * Route.prototype
     *      emits added {event}                                     - occurs upon route being added to router
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .router {Router}                            - router added to
     *      emits removed {event}                                   - occurs upon route being removed from router
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .router {Router}                            - router removed from
     *      emits route {event}                                     - occurs upon routing
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .pathname {string}                          - url encoded pathname
     *                  .method {string|undefined}                  - http method
     *                  .router {Router}                            - router
     *                  .route {Route}                              - route
     *                  .arguments {object<string|array<string>>}   - route arguments as name value pairs
     *                  .request {http.IncomingMessage|undefined}   - request
     *                  .response {http.ServerResponse|undefined}   - response
     *                  .data {*|undefined}                         - data
     *              this {Route}                                    - route
     */
    var Route = module.exports.Route = function(expression, options) {
        events.EventEmitter.call(this);

        var self = this;

        var name, method, constraints, encoded, ignoreCase; // options
        if (options != undefined) {
            name    = options.name;
            method  = options.method;
        }

        var cacheable   = true;                             // caching allowed indicator, default true
        var cache       = new PathDataCache();              // cache
        var flush       = function() { cache.flush(); };    // flush cache

        // accessors

        Object.defineProperty(this, 'expression', {
            'get':          function() { return expression; }, // expression getter
            'enumerable':   true,
            'configurable': false });

        Object.defineProperty(this, 'name', {
            'get':          function() { return name; }, // name getter
            'enumerable':   true,
            'configurable': false });

        if (util.isArray(method)) { Object.freeze(method); }
        Object.defineProperty(this, 'method', {
            'get':          function() { return method; }, // method getter
            'enumerable':   true,
            'configurable': false });

        Object.defineProperty(this, 'encoded', {
            'get':          function() { return encoded; }, // encoded getter
            'enumerable':   true,
            'configurable': false });
        if ('encoded' in options)   { encoded = options.encoded; } // set encoded
        else                        { encoded = false; } // default encoded

        Object.defineProperty(this, 'ignoreCase', {
            'get':          function()      { return ignoreCase; },         // ignore case getter
            'set':          function(val)   { flush(); ignoreCase = val; }, // ignore case setter
            'enumerable':   true,
            'configurable': false });
        if ('ignoreCase' in options)    { ignoreCase = options.ignoreCase; }    // set ignore case
        else                            { ignoreCase = false; }                 // default ignore case

        var setConstraints = function(val) {
            cacheable = true; // allow caching by default

            if (val === undefined || val === null) { constraints = undefined; }
            else if (val instanceof Function) { // constraints function
                cacheable = false; // disallow caching, constraints function result may vary at run-time
                constraints = (function(_constraints) {
                        return function() { return _constraints.apply(self, arguments); };
                    })(val);
            } else if (val === Object(val)) { // constraints map
                constraints = {};

                var invalidate = function(key) {
                    throw new Error("Couldn't set constraints for route " +
                        (self.name != undefined ? "'" + self.name + "'" + ' ' : '') +
                        "because the constraint '" + key + "' was not a " +
                        'function, regular expression or an array of strings');
                };

                for (var key in val) {
                    var constraint = val[key];

                    if (constraint instanceof Function) {
                        cacheable = false; // disallow caching, constraint function result may vary at run-time
                        constraints[key] = (function(_constraint) {
                                return function() { return _constraint.apply(self, arguments); };
                            })(constraint);
                    } else if (constraint instanceof RegExp) {
                        constraints[key] = new RegExp(constraint);
                    } else if (util.isArray(constraint)) {
                        constraints[key] = constraint.map(function(val) {
                            if (typeof val === 'string' || val instanceof String)   { return String(val); }
                            if (typeof val === 'number')                            { return String(val); }
                            else                                                    { invalidate(key); }
                        });
                    } else { invalidate(key); }

                    try { Object.freeze(constraints[key]); } catch (err) {}
                }
            } else {
                throw new Error("Couldn't set constraints for route " +
                    (self.name != undefined ? "'" + self.name + "'" + ' ' : '') +
                    'because the constraints are invalid');
            }

            try { Object.freeze(constraints); } catch (err) {}
        };
        Object.defineProperty(this, 'constraints', {
            'get':          function()      { return constraints; },            // constraints getter
            'set':          function(val)   { flush(); setConstraints(val); },  // constraints setter
            'enumerable':   true,
            'configurable': false });
        if ('constraints' in options) { setConstraints(options.constraints); } // set constraints

        var subroutes = parse.route(this.expression, this.encoded);
        Object.defineProperty(this, '__subroutes__', { // private
            'get':          function() { return subroutes; }, // subroutes getter
            'enumerable':   false,
            'configurable': false });

        var pathSourceCode = compose.sourceCode(subroutes);
        Object.defineProperty(this, 'pathSourceCode', {
            'get':          function() { return pathSourceCode; }, // path source code getter
            'enumerable':   true,
            'configurable': false });

        Object.defineProperty(this, '__cache__', { // private
            'get':          function() { return (cacheable ? cache : undefined); }, // cache getter
            'enumerable':   false,
            'configurable': false });
    };
    util.inherits(Route, events.EventEmitter);

    /*
     * Route.prototype.path {function}                  - generate a path
     *      [@arguments] {object<string|array<string>>} - route arguments as name value pairs
     *      return {string}                             - url encoded path
     */
    Route.prototype.path = function(args) {
        args = args || {};

        var subroutes = this.__subroutes__;

        // validate constraints
        var constraints     = this.constraints;
        var valid           = validate(args, constraints);
        if (valid !== true) { // invalid
            if (typeof valid !== 'boolean' && !(valid instanceof Boolean)) { // invalid parameter constraint
                var key     = Object.keys(valid)[0],
                    value   = valid[key];
                throw new Error(
                    "Couldn't generate path with route " + (this.name != undefined ? "'" + this.name + "' " : '') +
                    "because the " + "'" + key + "' argument value of '" + value + "' is invalid " +
                    "according to the route's constraints");
            } else { // invalid constraints
                throw new Error(
                    "Couldn't generate path with route " + (this.name != undefined ? "'" + this.name + "' " : '') +
                    "because one or more of the arguments are invalid according to the route's constraints");
            }
        }

        return compose(subroutes, args);
    };

    /*
     * Router {prototype}                                           - router for http requests
     *      inherits {events.EventEmitter}
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
     *      emits remove {event}                                    - occurs upon removing a route
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .route {Route}                              - removed route
     *              this {Router}                                   - router
     *      emits success {event}                                   - occurs upon routing
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .pathname <string>                          - url encoded pathname
     *                  .method <string|undefined>                  - http method
     *                  .route {Route}                              - matching route
     *                  .arguments {object<string|array<string>>}   - route arguments as name value pairs
     *                  .request {http.IncomingMessage|undefined}   - request
     *                  .response {http.ServerResponse|undefined}   - response
     *                  .data {*|undefined}                         - data
     *              this {Router}                                   - router
     *      emits fail {event}                                      - occurs upon routing when no matching route found
     *          listener {function}
     *              @event {object}                                 - event object
     *                  .pathname <string>                          - url encoded pathname
     *                  .method <string|undefined>                  - http method
     *                  .request {http.IncomingMessage|undefined}   - request
     *                  .response {http.ServerResponse|undefined}   - response
     *                  .data {*|undefined}                         - data
     *              this {Router}                                   - router
     */
    var Router = module.exports.Router = function() {
        events.EventEmitter.call(this);

        var self = this;

        var routes = {}; // all routes regardless of method
        Object.defineProperty(this, '__routes__', { // private
            'get':          function() { return routes; }, // routes getter
            'enumerable':   false,
            'configurable': false });

        var methods = routes.methods = {} // routes segregated by method
        HTTP.METHODS.forEach(function(method) { methods[method.toLowerCase()] = {}; });

        // setup route stores
        [routes].concat(Object.keys(methods).map(function(key) { return methods[key]; })).forEach(
            function(stores) { stores.by = {'name': {}, 'order': []}; } // store by name and order
        );
    };
    util.inherits(Router, events.EventEmitter);

    /*
     * Router.prototype.get {function}                  - get an added route by name
     *      @name {string}                              - route name
     *      return {Route|undefined}                    - route
     */
    Router.prototype.get = function(name) {
        var routes = this.__routes__;

        if (name in routes.by.name) { // named route
            var route = routes.by.name[name];
            return route;
        } else { return undefined; } // named route doesn't exist
    };

    /*
     * Router.prototype.add {function}                              - add a route
     * Router.prototype.addGet {function}                           - add a route applicable to the HTTP GET method
     * Router.prototype.addPost {function}                          - add a route applicable to the HTTP POST method
     * Router.prototype.addPut {function}                           - add a route applicable to the HTTP PUT method
     * Router.prototype.addDelete {function}                        - add a route applicable to the HTTP DELETE method
     * Router.prototype.addHead {function}                          - add a route applicable to the HTTP HEAD method
     * Router.prototype.addOptions {function}                       - add a route applicable to the HTTP OPTIONS method
     * Router.prototype.addTrace {function}                         - add a route applicable to the HTTP TRACE method
     * Router.prototype.addConnect {function}                       - add a route applicable to the HTTP CONNECT method
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
     *              .router {Router}                                - router
     *              .route {Route}                                  - route
     *              .arguments {object<string|array<string>>}       - route arguments as name value pairs
     *              .request {http.IncomingMessage|undefined}       - request
     *              .response {http.ServerResponse|undefined}       - response
     *              .data {*|undefined}                             - data
     *          this {Route}                                        - route
     *      return {Route}                                          - added route
     *
     * Router.prototype.add {function}                              - add a route
     *      [@route] {Route}                                        - route
     *      [@callback] {function|undefined}                        - called upon every routing
     *          @event {object}                                     - event object
     *              .pathname {string}                              - url encoded pathname
     *              .method {string|undefined}                      - http method
     *              .router {Router}                                - router
     *              .route {Route}                                  - route
     *              .arguments {object<string|array<string>>}       - route arguments as name value pairs
     *              .request {http.IncomingMessage|undefined}       - request
     *              .response {http.ServerResponse|undefined}       - response
     *              .data {*|undefined}                             - data
     *          this {Route}                                        - route
     *      return {Route}                                          - edded route
     */
    Router.prototype.add = function() {
        var args        = argumentMaps.add.apply(this, arguments); // associate arguments to parameters
        var route       = args.route,
            name        = args.name,
            expression  = args.expression,
            options     = args.options,
            callback    = args.callback;

        var routes      = this.__routes__,
            methods     = routes.methods;

        var method, constraints; // options
        if (route != undefined) { // route object argument
            name        = route.name;
            expression  = route.expression;
            method      = route.method;
            constraints = route.constraints;
        } else if (options != undefined) {
            name        = name || options.name;
            method      = options.method;
            constraints = options.constraints;
        }

        if (name != undefined && name in routes.by.name) { // duplicate name
            throw new Error(
                "Couldn't add route '" + name + "' because another route named '" + name + "' already exists");
        }

        var stores = [routes]; // applicable stores for the route

        if (method != undefined) { // collect method(s) associated store(s)
            var indeces = {}; // processed method indeces
            (util.isArray(method) ? method : [method]).forEach(function(method) {
                // prevent processing a duplicate method
                var index = method.toLowerCase().trim(); // method index
                if (index in indeces)   { return; } // duplicate method
                else                    { indeces[index] = true; }

                var store = methods[index];

                if (store == undefined) { // no associated store
                    throw new Error("Couldn't add route " + (name != undefined ? "'" + name + "' " : '') +
                        "because the method '" + method + "' is not recognized");
                }

                stores.push(store);
            });
        } else { stores = stores.concat( // collect all method stores
            Object.keys(methods).map(function(key) { return methods[key]; })); }

        if (route == undefined) { // create route object
            var routeOptions = {'name': name, 'method': method, 'constraints': constraints}; // route options
            if (options != undefined) { // optional route options
                // forward encoded and ignore case option to route
                if ('encoded'    in options)    { routeOptions.encoded      = options.encoded; }
                if ('ignoreCase' in options)    { routeOptions.ignoreCase   = options.ignoreCase; }
            }
            route = new Route(expression, routeOptions); // route object
        }

        stores.forEach(function(store) {
            store.by.order.push(route); // store by order
            if (name != undefined) { store.by.name[name] = route; } // store by name
        });

        if (callback != undefined) { route.on('route', callback); }

        // emit add events upon adding route
        this.emit(  'add',      {'route': route});
        route.emit( 'added',    {'router': this});

        return route;
    };
    argumentMaps.add = function() { // associate arguments to parameters for add methods
        var route, name, expression, options, callback;

        var args = Array.prototype.slice.call(arguments);
        if (args.length >= 1 && args[0] instanceof Route) {
            route = args.shift();
            if (args.length > 0 && args[0] instanceof Function) { callback = args.shift(); }
        } else if (args.length >= 2) {
            if ((typeof args[1] === 'string' || args[1] instanceof String))     { name      = args.shift(); }
            expression = args.shift();
            if (args.length > 0 && !(args[0] instanceof Function))              { options   = args.shift(); }
            if (args.length > 0 && args[0] instanceof Function)                 { callback  = args.shift(); }
        }
        return {'route': route, 'name': name, 'expression': expression, 'options': options, 'callback': callback};
    };
    HTTP.METHODS.forEach(function(httpMethod) { // http method-specific add methods
        var methodName = 'add' + httpMethod.charAt(0).toUpperCase() + httpMethod.slice(1).toLowerCase();
        Router.prototype[methodName] = function() {
            var args        = argumentMaps.add.apply(this, arguments); // associate arguments to parameters
            var route       = args.route,
                name        = args.name,
                expression  = args.expression,
                options     = args.options,
                callback    = args.callback;

            if (route != undefined) {
                throw new Error(
                    "A route instance can not be added to the router using the '" + methodName + "' method " +
                    "and should instead be added using the router's 'add' method");
            }

            // add method to arguments
            options         = options        || {},
            options.method  = options.method || [];
            if (util.isArray(options.method))   { options.method.unshift(httpMethod); }
            else                                { options.method = [options.method, httpMethod]; }

            return this.add(name, expression, options, callback);
        };
    });

    /*
     * Router.prototype.remove {function}                           - remove a route
     *      @route {Route|string}                                   - route or route name
     *      return {Route}                                          - removed route
     */
    Router.prototype.remove = function() {
        var args        = argumentMaps.remove.apply(this, arguments); // associate arguments to parameters
        var route       = args.route,
            name        = args.name;

        var routes      = this.__routes__,
            methods     = routes.methods;

        if (name != undefined) { route = routes.by.name[name]; }

        if (route == undefined) { return; } // route was unspecified or not found

        var stores = [routes]; // potential stores containing the route
        stores = stores.concat( // collect all method stores
            Object.keys(methods).map(function(key) { return methods[key]; }));

        // remove route references
        stores.forEach(function(store) {
            store.by.order = store.by.order.filter(function(storedRoute) { return route !== storedRoute; });
            Object.keys(store.by.name).map(function(storedRouteName) {
                if (route === store.by.name[storedRouteName]) { delete store.by.name[storedRouteName]; }
            });
        });

        // emit remove events upon removing route
        this.emit(  'remove',   {'route': route});
        route.emit( 'removed',  {'router': this});

        return route;
    };
    argumentMaps.remove = function() { // associate arguments to parameters for add methods
        var route, name;

        var args = Array.prototype.slice.call(arguments);
        if (args.length >= 1) {
            if (args[0] instanceof Route)                                       { route = args[0]; }
            else if (typeof args[0] === 'string' || args[0] instanceof String)  { name  = args[0]; }
        }
        return {'route': route, 'name': name};
    };

    /*
     * Router.prototype.route {function}                    - route a path
     * Router.prototype.routeGet {function}                 - route a path using the HTTP GET method
     * Router.prototype.routePost {function}                - route a path using the HTTP POST method
     * Router.prototype.routePut {function}                 - route a path using the HTTP PUT method
     * Router.prototype.routeDelete {function}              - route a path using the HTTP DELETE method
     * Router.prototype.routeHead {function}                - route a path using the HTTP HEAD method
     * Router.prototype.routeOptions {function}             - route a path using the HTTP OPTIONS method
     * Router.prototype.routeTrace {function}               - route a path using the HTTP TRACE method
     * Router.prototype.routeConnect {function}             - route a path using the HTTP CONNECT method
     *      @request {string|http.IncomingMessage|url.URL}  - url encoded path, request or url object
     *      [@response] {http.ServerResponse|undefined}     - response
     *      [@options] {object|undefined}                   - options
     *          .method {string|undefined}                  - http method
     *          .request {http.IncomingMessage|undefined}   - request
     *          .response {http.ServerResponse|undefined}   - response
     *          .data {*|undefined}                         - data
     *      [@callback] {function|undefined}                - called upon routing
     *          @event {object}                             - event object
     *              .pathname {string}                      - url encoded pathname
     *              .method {string|undefined}              - http method
     *              .router {Router}                        - router
     *              .route {Route}                          - route
     *              .arguments {object<string|array<string>>} - route arguments as name value pairs
     *              .request {http.IncomingMessage|undefined} - request
     *              .response {http.ServerResponse|undefined} - response
     *              .data {*|undefined}                     - data
     *          this {Route}                                - route
     *          return {Route|undefined}                    - route or undefined if no matching route found
     */
    Router.prototype.route = function() {
        var args        = argumentMaps.route.apply(this, arguments); // associate arguments to parameters
        var request     = args.request,
            response    = args.response,

            options     = args.options,
            callback    = args.callback;

        var method, req, res, data; // options
        if (options != undefined) {
            method      = options.method;
            req         = options.request;
            res         = options.response;
            data        = options.data;
        }

        // resolve request argument to pathname string
        var pathname;
        if (typeof request === 'string' || request instanceof String) { pathname = request; } // request is string
        else if (request instanceof http.IncomingMessage) { // request is http incoming message
            var requestURL      = url.parse(request.url),
                requestMethod   = request.method;

            pathname = requestURL.pathname;
            // infer options from request
            if (req == undefined)       { req       = request; }
            if (method  == undefined)   { method    = requestMethod; }
        } else if ( // url
            request != undefined && (typeof request.pathname === 'string' || request.pathname instanceof String)) {
                var requestURL  = request;
                pathname        = requestURL.pathname;
        }

        // resolve response argument
        if (response != undefined && response instanceof http.ServerResponse) { // response is http server response
            if (res == undefined) { res = response; }
        }

        var routes      = this.__routes__,
            methods     = routes.methods;

        var stores;
        if (method != undefined) { // convert method to the associated store
            var stores = methods[method.toLowerCase().trim()];

            if (stores == undefined) { // no associated stores
                throw new Error(
                    "Couldn't route '" + pathname + "' because the method '" + method + "' is not recognized");
            }
        } else { stores = routes; } // all routes

        var subpaths = parse.path(pathname);

        // find matching route
        var length = stores.by.order.length;
        for (var index = 0; index < length; index++) {
            var route       = stores.by.order[index],
                routeCache  = route.__cache__,
                subroutes   = route.__subroutes__,
                ignoreCase  = route.ignoreCase;

            var args; // route match arguments

            var routeHasCache       = routeCache != undefined;  // route has cache
            var routeCacheHasMatch  = false;                    // match is cached
            if (routeHasCache) {
                var routeCacheData = routeCache.getData(pathname);
                if (routeCacheData != undefined) { // match is cached
                    routeCacheHasMatch = true;

                    if (routeCacheData == false)    { args = undefined; }       // cached no match
                    else                            { args = routeCacheData; }  // cached match
                }
            }

            if (!routeHasCache || !routeCacheHasMatch) { // match not cached
                args = match(subroutes, subpaths, ignoreCase); // match arguments

                if (args != undefined) { // match
                    var constraints;

                    // validate expression constraints
                    constraints = {};
                    subroutes.forEach(function(subroute) {
                        if (subroute instanceof RouteParameter && subroute.constraint != undefined) {
                            constraints[subroute.name] = subroute.constraint;
                        }
                    });
                    if (validate(args, constraints) !== true) { // invalid per expression constraints
                        args = undefined; // no match
                    }

                    // validate constraints
                    constraints = route.constraints;
                    if (constraints !== undefined && validate(args, constraints) !== true) { // invalid per constraints
                        args = undefined; // no match
                    }
                }

                if (routeHasCache) { // cache match
                    if (args == undefined)  { routeCache.setData(pathname, false); }    // cache no match
                    else                    { routeCache.setData(pathname, args); }     // cache match
                }
            }

            if (args != undefined) { // match
                if (callback != undefined) { route.once('route', callback); } // queue callback

                route.emit('route', { // emit route event from matching route upon matching route
                        'pathname':     pathname,
                        'method':       method,
                        'router':       this,
                        'route':        route,
                        'arguments':    args,
                        'request':      req,
                        'response':     res,
                        'data':         data
                    });
                this.emit('success', { // emit success event upon mathing route
                        'pathname':     pathname,
                        'method':       method,
                        'route':        route,
                        'arguments':    args,
                        'request':      req,
                        'response':     res,
                        'data':         data
                    });

                return route; // return matching route
            }
        }

        this.emit('fail', { // emit fail event upon not matching any route
                'pathname':     pathname,
                'method':       method,
                'request':      req,
                'response':     res,
                'data':         data
            });
        return undefined;
    }
    argumentMaps.route = function() { // associate arguments to parameters
        var args        = Array.prototype.slice.call(arguments);

        var request     = args.length                                           ?   args.shift() : undefined,
            response    = args.length && args[0] instanceof http.ServerResponse ?   args.shift() : undefined,
            options     = args.length && !(args[0] instanceof Function)         ?   args.shift() : undefined,
            callback    = args.length && (args[0] instanceof Function)          ?   args.shift() : undefined;

        return {'request': request, 'response': response, 'options': options, 'callback': callback};
    };
    HTTP.METHODS.forEach(function(httpMethod) { // http method-specific route methods
        var methodName = 'route' + httpMethod.charAt(0).toUpperCase() + httpMethod.slice(1).toLowerCase();
        Router.prototype[methodName] = function() {
            var args        = argumentMaps.route.apply(this, arguments); // associate arguments to parameters
            var request     = args.request,
                options     = args.options,
                callback    = args.callback;

            options         = options || {},
            options.method  = httpMethod; // add method to arguments

            return this.route(request, options, callback);
        };
    });

    /*
     * Router.prototype.path {function}                 - generate a path
     *      @name {string}                              - route name
     *      [@arguments] {object<string|array<string>>} - route arguments as name value pairs
     *      return {string}                             - url encoded path
     */
    Router.prototype.path = function(name, args) {
        var routes = this.__routes__;

        if (name in routes.by.name) { // named route
            var route = routes.by.name[name];
            return route.path(args);
        } else { // named route doesn't exist
            throw new Error(
                "Couldn't generate path with route '" + name + "' because no route named '" + name + "' exists");
        }
    };

    /*
     * Router.prototype.pathSourceCode {function}       - source code to generate a path
     *      @name {string}                              - route name
     *      return {string}                             - source code to generate a path
     */
    Router.prototype.pathSourceCode = function(name) {
        var routes = this.__routes__;

        if (name in routes.by.name) { // named route
            var route = routes.by.name[name];
            return route.pathSourceCode;
        } else { // named route doesn't exist
            throw new Error("Couldn't get source code to generate path with route '" + name + "'" +
                " because no route named '" + name + "' exists");
        }
    };

    /*
     * basejoin {function}                          - safe join utility for joining subpaths into a filepath
     *      module.exports.basejoin
     *      @basepath {string}                      - base filepath that the resulting filepath will be contained to
     *      [@subpaths, ...] {string|array<string>} - subpaths to sequentially join starting at the basepath to form \
     *                                                  the resulting filepath
     *      return {string}                         - filepath
     */
    var basejoin = module.exports.basejoin = function(basepath) {
        if (arguments.length === 0 || basepath == undefined) { return undefined; }

        // collect unsafe subpaths into a flattened array
        var subpaths    = [];
        var args        = Array.prototype.slice.call(arguments);
        args.shift(); // discard basepath
        args.forEach(function(arg) { subpaths = subpaths.concat(arg); });
        subpaths = subpaths.filter(function(s) { return s != undefined; }).map(function(s) { return String(s); });

        var relative = path.join.apply(undefined, subpaths); // join subpaths into a relative path
        relative     = path.resolve('/', relative); // resolve '.' and '..' subpaths

        return path.join(basepath, relative); // join basepath and relative path
    };

    /* RouteSubpath {prototype}                         - route subpath part
     *
     * RouteSubpath.prototype.constructor {function}
     *      @raw {string|undefined}                     - raw value
     *      [@encoded] {string|undefined}               - url encoded value
     *
     * RouteSubpath.prototype.raw {string}              - get raw value
     *
     * RouteSubpath.prototype.encoded {string}          - get encoded value
     *
     * RouteSubpath.prototype.decoded {string}          - get decoded value
     */
    var RouteSubpath = function(raw, encoded) {
        if (encoded == undefined && raw != undefined) { encoded = encodeURIComponent(raw); }
        if (encoded != undefined && raw == undefined) { raw     = decodeURIComponent(encoded); }

        // accessors

        Object.defineProperty(this, 'raw', {
            'get':          function() { return raw; }, // raw value getter
            'enumerable':   true,
            'configurable': false });

        Object.defineProperty(this, 'decoded', {
            'get':          function() { return raw; }, // decoded value getter
            'enumerable':   true,
            'configurable': false });

        Object.defineProperty(this, 'encoded', {
            'get':          function() { return encoded; }, // encoded value getter
            'enumerable':   true,
            'configurable': false });
    };

    /*
     * RouteSubpath.prototype.toString
     *      return {string}                 - decoded value
     */
    RouteSubpath.prototype.toString = function() {
        return this.decoded;
    };

    /* RouteParameter {prototype}                       - route parameter part
     *
     * RouteParameter.prototype.constructor {function}
     *      @name {string}                              - name
     *      @constraint {RegExp}                        - constraint
     *
     * RouteParameter.prototype.constructor {function}
     *      @parameter {RouteParameter}                 - route parameter part
     *
     * RouteParameter.prototype.name {string}           - get name
     *
     * RouteParameter.prototype.constraint {RegExp}     - get constraint
     */
    var RouteParameter = function(name, constraint) {
        if (arguments[0] instanceof RouteParameter) {
            var parameter   = arguments[0];
            name            = parameter.name;
            constraint      = parameter.constraint;
        }

        // accessors

        Object.defineProperty(this, 'name', {
            'get':          function() { return name; },        // name getter
            'enumerable':   true,
            'configurable': false });

        Object.defineProperty(this, 'constraint', {
            'get':          function() { return constraint; },  // constraint getter
            'enumerable':   true,
            'configurable': false });
    };

    /* RouteWildcardParameter {prototype}                       - route wildcard parameter part
     *      inherits {RouteParameter}
     *
     * RouteWildcardParameter.prototype.constructor {function}
     *      @name {string}                                      - name
     *      @constraint {RegExp}                                - constraint
     */
    var RouteWildcardParameter = function(name, constraint) {
        RouteParameter.call(this, name, constraint);
    };
    util.inherits(RouteWildcardParameter, RouteParameter);

    /* RouteTrailingSlash {prototype}                           - route trailing slash part
     *
     * RouteTrailingSlash.prototype.constructor {function}
     *      @optional {boolean}                                 - optional
     */
    var RouteTrailingSlash = function(optional) {
        // accessors

        Object.defineProperty(this, 'optional', {
            'get':          function() { return optional; }, // optional getter
            'enumerable':   true,
            'configurable': false });
    };

    /* PathSubpath {prototype}                          - path subpath part
     *
     * PathSubpath.prototype.constructor {function}
     *      @raw {string|undefined}                     - raw value
     *      [@decoded] {string|undefined}               - url decoded value
     *
     * PathSubpath.prototype.raw {string}               - get raw value
     *
     * PathSubpath.prototype.encoded {string}           - get encoded value
     *
     * PathSubpath.prototype.decoded {string}           - get decoded value
     */
    var PathSubpath = function(raw, decoded) {
        if (decoded == undefined && raw != undefined) { decoded = decodeURIComponent(raw); }
        if (decoded != undefined && raw == undefined) { raw     = encodeURIComponent(decoded); }

        // accessors

        Object.defineProperty(this, 'raw', {
            'get':          function() { return raw; }, // raw value getter
            'enumerable':   true,
            'configurable': false });

        Object.defineProperty(this, 'encoded', {
            'get':          function() { return raw; }, // encoded value getter
            'enumerable':   true,
            'configurable': false });

        Object.defineProperty(this, 'decoded', {
            'get':          function() { return decoded; }, // decoded value getter
            'enumerable':   true,
            'configurable': false });
    };

    /*
     * PathSubpath.prototype.toString
     *      return {string}                 - decoded value
     */
    PathSubpath.prototype.toString = function() {
        return this.decoded;
    };

    /* PathTrailingSlash {prototype}                            - path trailing slash part
     *
     * PathTrailingSlash.prototype.constructor {function}
     */
    var PathTrailingSlash = function() {
        // singleton
        if (PathTrailingSlash.prototype.__instance__) {
            return PathTrailingSlash.prototype.__instance__;
        } else { PathTrailingSlash.prototype.__instance__ = this; }
    };

    /*
     * parse {object}
     */
    var parse = {}; // parsing

    /*
     * parse.route {function}                                               - parse an expression into subroutes
     *      @expression {string}                                            - route expression
     *      [@decode] {boolean|undefined}                                   - url decode expression subroutes
     *      return {array<RouteSubpath|RouteParameter|RouteTrailingSlash>}  - parts of the route
     */
    parse.route = function(expression, decode) {
        expression = expression.trim();

        // inspect expression for trailing slash symbols
        var expressionHasOptionalTrailingSlash = false;
        var expressionHasTrailingSlash = false;
        if ( // optional trailing slash
                expression.substr(-EXPRESSION_SYMBOLS.OPTIONAL_TRAILING_SLASH.length) ===
                EXPRESSION_SYMBOLS.OPTIONAL_TRAILING_SLASH
            ) {
                expressionHasOptionalTrailingSlash = true;

                // remove optional trailing slash symbol
                expression = expression.slice(0, -EXPRESSION_SYMBOLS.OPTIONAL_TRAILING_SLASH.length);
        } else if ( // trailing slash
                expression.substr(-EXPRESSION_SYMBOLS.TRAILING_SLASH.length) ===
                EXPRESSION_SYMBOLS.TRAILING_SLASH
            ) {
                expressionHasTrailingSlash = true;

                // remove trailing slash symbol
                expression = expression.slice(0, -EXPRESSION_SYMBOLS.TRAILING_SLASH.length);
        }

        // inspect and collect subroutes
        var subroutes       = [],   // subroute objects
            index           = 0,    // current index
            next,                   // next index
            character,              // current character
            subroute,               // current subroute
            names           = {},   // parameter names
            collision,              // parameter name collision
            count           = 0;    // parameter count
        while (index != -1 && index < expression.length) {
            var character = expression.charAt(index);
            var part = undefined;

            if (character === EXPRESSION_SYMBOLS.DELINEATOR) { next = index + 1; }  // delineator
            else if (character === EXPRESSION_SYMBOLS.PARAMETER) {                  // parameter
                count++;

                EXPRESSION_PARAMETER_REGEX.lastIndex = 0;
                var expressionMatch = expression.substring(index).match(EXPRESSION_PARAMETER_REGEX);
                if (expressionMatch == undefined) {
                    var ORDINAL_SUFFIXES    = ["th", "st", "nd", "rd", "th"],
                        parameterOrdinal    = String(count) +
                            (ORDINAL_SUFFIXES[(count - 20) % 10] || ORDINAL_SUFFIXES[count] || ORDINAL_SUFFIXES[0]);

                    throw new Error('The ' + parameterOrdinal +
                        " parameter of route '" + expression + "' can not be interpretted");
                }

                subroute        = expressionMatch[0];
                var name        = expressionMatch[1],
                    wildcard    = expressionMatch[2] != undefined || expressionMatch[4] != undefined,
                    constraint  = expressionMatch[3];

                next = index + subroute.length;

                if (name in names) { // parameter name collision
                    if (collision == undefined) { collision = name; }
                    names[name]++; // increment parameter name count
                } else { names[name] = 1; }

                try { constraint = // compile regex constraint
                    (constraint != undefined && constraint.length) ? new RegExp(constraint) : undefined;
                } catch (error) { // invalid regex stderr beautification
                    throw error
                }

                if (wildcard) { part = new RouteWildcardParameter(name, constraint); }
                else          { part = new RouteParameter(name, constraint); }
            } else {                                                                // path part
                next = expression.indexOf(EXPRESSION_SYMBOLS.DELINEATOR, index);

                subroute = expression.substring(index, next !== -1 ? next : undefined);

                if (decode) { part = new RouteSubpath(undefined /* decoded subroute */, subroute); }
                else        { part = new RouteSubpath(subroute); }
            }

            if (part != undefined) { subroutes.push(part); }
            index = next;
        }

        if (collision != undefined) {
            throw new Error(
                "Route '" + expression + "' contains " + names[collision] + " parts named '" + collision + "'");
        }

        // validate subroutes structure
        var last = subroutes.length - 1;
        subroutes.forEach(function(subroute, index) {
            if (subroute instanceof RouteWildcardParameter && index !== last) { // not last wildcard parameter
                subroutes[index] = new RouteParameter(subroute);                // upcast wildcard param to param
            }
        });

        // append trailing slash subroute
        if      (expressionHasOptionalTrailingSlash)    { subroutes.push(new RouteTrailingSlash(true)); }
        else if (expressionHasTrailingSlash)            { subroutes.push(new RouteTrailingSlash(false)); }

        return subroutes;
    };

    /*
     * parse.path {function}                                        - parse url encoded path into subpaths
     *      @pathname {string}                                      - url encoded path
     *      return {array<string|PathSubpath|PathTrailingSlash>}    - parts of the path
     */
    parse.path = function(pathname) {
        var cachePath = pathname;
        var cacheData;

        // hit parsed path cache
        cacheData = parse.path.cache.getData(cachePath);
        if (cacheData != undefined) { return cacheData; }

        pathname = pathname.trim();

        // inspect path for trailing slash symbol
        var pathnameHasTrailingSlash = false;
        if ( // trailing slash
                pathname.substr(-PATH_SYMBOLS.TRAILING_SLASH.length) ===
                PATH_SYMBOLS.TRAILING_SLASH
            ) {
                pathnameHasTrailingSlash = true;

                // remove trailing slash symbol
                pathname = pathname.slice(0, -PATH_SYMBOLS.TRAILING_SLASH.length);
        }

        // inspect and collect subpaths
        var subpaths        = [],   // subpath objects
            index           = 0,    // current index
            next,                   // next index
            character,              // current character
            subpath;                // current subpath
        while (index != -1 && index < pathname.length) {
            var character = pathname.charAt(index);
            var part = undefined;

            if (character === PATH_SYMBOLS.DELINEATOR) { next = index + 1; }    // delineator
            else {                                                              // path part
                next = pathname.indexOf(PATH_SYMBOLS.DELINEATOR, index);

                subpath = pathname.substring(index, next !== -1 ? next : undefined);

                part = decodeURIComponent(subpath); // performance optimization for `new PathSubpath(subpath)`
            }

            if (part != undefined) { subpaths.push(part); }
            index = next;
        }

        if (pathnameHasTrailingSlash) { subpaths.push(new PathTrailingSlash()); }

        // cache parsed path
        cacheData = subpaths;
        parse.path.cache.setData(cachePath, cacheData);

        return subpaths;
    };
    finalize.push(function() { parse.path.cache = new PathDataCache(); }); // instantiate parsed path cache

    /*
     * match {function}                                                         - match subroutes and subpaths
     *      @subroutes {array<RouteSubpath|RouteParameter|RouteTrailingSlash>}  - parts of the route
     *      @subpaths {array<string|PathSubpath|PathTrailingSlash>}             - url decoded parts of the path
     *      [@ignoreCase {boolean|undefined}]                                   - case insensitive matching
     *      return {object<string|array<string>>|undefined}                     - route arguments as name value pairs,\
     *                                                                              undefined if no match
     */
    var match = function(subroutes, subpaths, ignoreCase) {
        var args = {};

        // match trailing slash
        var lastSubroute            = subroutes[subroutes.length - 1],
            lastSubpath             = subpaths[subpaths.length - 1],
            routeHasTrailingSlash   = lastSubroute instanceof RouteTrailingSlash,
            pathHasTrailingSlash    = lastSubpath  instanceof PathTrailingSlash;
        if (routeHasTrailingSlash) {                                        // route trailing slash
            var routeTrailingSlash = lastSubroute;
            if (!routeTrailingSlash.optional && !pathHasTrailingSlash) {    // no path trailing slash
                return;                                                     // match unsuccessful
            }
        } else {                        // no route trailing slash
            if (pathHasTrailingSlash) { // path trailing slashmatch unsuccessful
                return;                 // match unsuccessful
            }
        }
        var subpathsLength  = subpaths.length  - (pathHasTrailingSlash  ? 1 : 0);
        var subroutesLength = subroutes.length - (routeHasTrailingSlash ? 1 : 0);

        var wildcardParameterSubroute, // wildcard parameter subroute
            index;
        for (index = 0; index < subpathsLength; index++) { // traverse subpaths and subroutes
            var subroute    = index < subroutesLength ? subroutes[index] : undefined,
                subpath     = subpaths[index];

            if (subroute == undefined) { return; } // match unsuccessful
            else if (subroute instanceof RouteSubpath) { // path part
                if (typeof subpath === 'string' || subpath instanceof String || subpath instanceof PathSubpath) {
                    if (ignoreCase) {   // case insensitive match
                        if (String(subroute).toLowerCase() === String(subpath).toLowerCase()) { continue; } // continue
                        else                                                                { return; } // unsuccessful
                    } else {            // case sensitive match
                        if (String(subroute) === String(subpath)) { continue; } // continue matching
                        else                                      { return; }   // match unsuccessful
                    }
                } else { return; } // match unsuccessful
            } else if (subroute instanceof RouteParameter) { // parameter
                if (typeof subpath === 'string' || subpath instanceof String || subpath instanceof PathSubpath) {
                    if (subroute instanceof RouteWildcardParameter) { // wildcard parameter
                        wildcardParameterSubroute = subroute;
                        break; // end matching
                    } else { // parameter
                        args[subroute.name] = String(subpath); // store argument
                        continue; // continue matching
                    }
                } else { return; } // match unsuccessful
            } else { break; } // end matching
        }

        if (wildcardParameterSubroute != undefined) { // resolve wildcard parameter, store argument
            var wildcardSubpaths = subpaths.slice(index, subpathsLength);
            args[wildcardParameterSubroute.name] = wildcardSubpaths.map(function(subpath) { return String(subpath); });
        } else if (index != subroutesLength) { return; } // no match

        return args; // match
    };

    /*
    * compose {function}                                                        - compose path from subroutes
    *       @subroutes {array<RouteSubpath|RouteParameter|RouteTrailingPath>}   - parts of the route
    *       [@arguments] {object<string|array<string>>}                         - route arguments as name value pairs
    *       return {string}                                                     - url encoded path                                                                  character
    */
    var compose = function(subroutes, args) {
        args = args || {};

        var appendTrailingSlash = false;

        var subpaths = [];
        subroutes.forEach(function(subroute) {
            if (subroute instanceof RouteSubpath) { // path part
                subpaths.push(subroute.encoded);
            } else if (subroute instanceof RouteParameter) { // parameter
                var argument = args[subroute.name];
                if (argument == undefined) { argument = ''; }

                if (subroute instanceof RouteWildcardParameter) { // wildcard parameter
                    if (util.isArray(argument)) { // array argument
                        argument.forEach(function(subargument) { subpaths.push(encodeURIComponent(subargument)); });
                    } else { subpaths.push(encodeURIComponent(String(argument))); } // string argument
                } else { // parameter
                    subpaths.push(encodeURIComponent(String(argument))); // string argument
                }
            } else if (subroute instanceof RouteTrailingSlash) { // trailing slash
                appendTrailingSlash = !subroute.optional;
            }
        });

        var pathname = subpaths.join(PATH_SYMBOLS.DELINEATOR);
        if (appendTrailingSlash) { pathname += PATH_SYMBOLS.TRAILING_SLASH; }

        if (pathname.charAt(0) !== PATH_SYMBOLS.DELINEATOR) { pathname = PATH_SYMBOLS.DELINEATOR + pathname; }

        return pathname;
    };

    /*
    * compose.sourceCode {function}                                 - compose source code to generate path
    *       @subroutes {array<RouteSubpath|RouteParameter>}         - parts of the route
    *       return {string}                                         - source code of function to generate path
    */
    compose.sourceCode = function(subroutes) {
        var sourceCode = compose.sourceCode.START;

        subroutes.forEach(function(subroute) {
            if (subroute instanceof RouteSubpath) { // path part
                sourceCode +=       'subpath(' + JSON.stringify(subroute.encoded) + '); ';
            } else if (subroute instanceof RouteParameter) { // parameter
                var stringifiedSubrouteName = JSON.stringify(subroute.name);
                if (subroute instanceof RouteWildcardParameter) { // wildcard parameter
                    sourceCode +=   'parameter.wildcard(' + stringifiedSubrouteName + '); ';
                } else { // parameter
                    sourceCode +=   'parameter(' + stringifiedSubrouteName + '); ';
                }
            } else if (subroute instanceof RouteTrailingSlash) { // trailing slash
                if (!subroute.optional) {
                    sourceCode +=   'trailingSlash(); ';
                }
            }
        });

        sourceCode += compose.sourceCode.END;

        return sourceCode;
    };
    compose.sourceCode.START =  'function(args) { ' +
                                    'var subpaths = []; ' +

                                    'var subpath = function(encoded) { ' +
                                        'subpaths.push(String(encoded)); ' +
                                    '}; ' +

                                    'var parameter = function(name) { ' +
                                        "subpaths.push(encodeURIComponent(String(args[String(name)] || ''))); " +
                                    '}; ' +

                                    'parameter.wildcard = function(name) { ' +
                                        'var value = args[String(name)]; ' +
                                        'if (' +
                                            'value instanceof Array || ' +
                                            "Object.prototype.toString.call(value) === '[object Array]'" +
                                        ') { ' +
                                            'var length = value.length; ' +
                                            'for (var index = 0; index < length; index++) { ' +
                                                "subpaths.push(encodeURIComponent(String(value[index] || ''))); " +
                                            '} ' +
                                        '} else { ' +
                                            "subpaths.push(encodeURIComponent(String(value || ''))); " +
                                        '} ' +
                                    '}; ' +

                                    'var appendTrailingSlash = false; ' +
                                    'var trailingSlash = function() { appendTrailingSlash = true; }; ';
                                    // ...
    compose.sourceCode.END =        "var pathname = subpaths.join('" + PATH_SYMBOLS.DELINEATOR + "'); " +

                                    'if (appendTrailingSlash) { ' +
                                        "pathname += '" + PATH_SYMBOLS.TRAILING_SLASH + "'; " +
                                    '} ' +

                                    "if (pathname.charAt(0) !== '" + PATH_SYMBOLS.DELINEATOR + "') { " +
                                        "pathname = '" + PATH_SYMBOLS.DELINEATOR + "' + pathname; " +
                                    '} ' +

                                    'return pathname; ' +
                                '}';

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

                    var argument    = args[name],
                        constraint  = constraints[name];
                    if (constraint instanceof Function) { // function
                        if (!constraint(argument)) { // invalid
                            var invalid     = {};
                            invalid[name]   = argument;
                            return invalid;
                        }
                    } if (constraint instanceof RegExp) { // regular expression
                        if (util.isArray(argument)) { // array of strings wildcard parameter argument
                            for (var i = 0, length = argument.length; i < length; i++) {
                                var subargument = argument[i];
                                try { constraint.lastIndex = 0; } catch (err) {} // potentially frozen
                                if (!constraint.test(subargument)) { // invalid
                                    var invalid     = {};
                                    invalid[name]   = subargument;
                                    return invalid;
                                }
                            }
                        } else { // string parameter argument
                            try { constraint.lastIndex = 0; } catch (err) {} // potentially frozen
                            if (!constraint.test(argument)) { // invalid
                                var invalid     = {};
                                invalid[name]   = argument;
                                return invalid;
                            }
                        }
                    } else if (util.isArray(constraint)) { // array of strings
                        if (util.isArray(argument)) { // array of strings wildcard parameter argument
                            for (var i = 0, length = argument.length; i < length; i++) {
                                var subargument = argument[i];
                                if (constraint.indexOf(subargument) === -1) { // invalid
                                    var invalid     = {};
                                    invalid[name]   = subargument;
                                    return invalid;
                                }
                            }
                        } else { // string parameter argument
                            if (constraint.indexOf(argument) === -1) { // invalid
                                var invalid     = {};
                                invalid[name]   = argument;
                                return invalid;
                            }
                        }
                    }
                }
                return true; // valid
            }
        } else { return true; } // valid
    };

    /*
     * PathKeyCache {prototype}         - weak reference cache for keyed paths
     */
    var PathKeyCache = function() {
        // singleton
        if (PathKeyCache.prototype.__instance__) {
            return PathKeyCache.prototype.__instance__;
        } else { PathKeyCache.prototype.__instance__ = this; }

        var entryCount      = 0, // count for number of entries
            flushCount      = 0; // count for number of flushes

        var keysByPath      = {}, // { '{pathname}': '{key}', ... }
            pathsByKey      = {}; // { '{key}': '{pathname}', ... }

        Object.defineProperty(this, '__entryCount__', { // private
            'get':          function()      { return entryCount; }, // entry count getter
            'set':          function(val)   { entryCount = val; },  // entry count setter
            'enumerable':   false,
            'configurable': false });

        Object.defineProperty(this, '__flushCount__', { // private
            'get':          function()      { return flushCount; }, // flush count getter
            'set':          function(val)   { flushCount = val; },  // flush count setter
            'enumerable':   false,
            'configurable': false });

        Object.defineProperty(this, '__keysByPath__', { // private
            'get':          function()      { return keysByPath; }, // keys by path getter
            'set':          function(val)   { keysByPath = val; },  // keys by path setter
            'enumerable':   false,
            'configurable': false });

        Object.defineProperty(this, '__pathsByKey__', { // private
            'get':          function()      { return pathsByKey; }, // paths by key getter
            'set':          function(val)   { pathsByKey = val; },  // paths by key setter
            'enumerable':   false,
            'configurable': false });
    };

    PathKeyCache.MAX_STORED_ENTRIES = 4096;     // maximum entries stored in the cache
    PathKeyCache.MAX_STORED_PATH_LENGTH = 256;  // maximum accepted path length

    /*
     * PathKeyCache.prototype.flush {function}          - flush the cache
     */
    PathKeyCache.prototype.flush = function() {
        this.__entryCount__ = 0;

        this.__keysByPath__ = {};
        this.__pathsByKey__ = {};

        this.__flushCount__++; // increment the flush count
    };

    /*
     * PathKeyCache.prototype.getKey {function}         - get/create the key for the path
     *      @pathname {string}                          - url encoded path
     *      return {string|undefined}                   - key for path, undefined if not cacheable
     */
    PathKeyCache.prototype.getKey = function(pathname) {
        if (pathname in this.__keysByPath__) { return this.__keysByPath__[pathname]; }
        else {
            // don't cache excessively long paths
            if (pathname.length > PathKeyCache.MAX_STORED_PATH_LENGTH) { return undefined; }

            // flush cache upon surpassing maximum paths allowed for storage
            if (this.__entryCount__ >= PathKeyCache.MAX_STORED_ENTRIES) { this.flush(); }

            var key = String(++this.__entryCount__);

            this.__keysByPath__[pathname]   = key;
            this.__pathsByKey__[key]        = pathname;

            return key;
        }
    };

    /*
     * PathKeyCache.prototype.getPath {function}        - get the path for the key
     *      @key {string}                               - key
     *      return {string|undefined}                   - path, undefined if not found
     */
    PathKeyCache.prototype.getPath = function(key) {
        return this.__pathsByKey__[key];
    };

    /*
     * PathDataCache {prototype}            - weak reference cache for path data
     */
    var PathDataCache = function() {
        var keyCache = new PathKeyCache(); // key cache, singleton
        Object.defineProperty(this, '__keyCache__', { // private
            'get':          function()      { return keyCache; }, // key cache getter
            'enumerable':   false,
            'configurable': false });

        var flushCount = keyCache.__flushCount__; // current flush count from key cache
        Object.defineProperty(this, '__flushCount__', { // private
            'get':          function()      { return flushCount; }, // flush count getter
            'set':          function(val)   { flushCount = val; },  // flush count setter
            'enumerable':   false,
            'configurable': false });

        var data = {};
        Object.defineProperty(this, '__data__', { // private
            'get':          function()      { return data; }, // data getter
            'set':          function(val)   { data = val; },  // data setter
            'enumerable':   false,
            'configurable': false });
    };

    /*
     * PathDataCache.prototype.flush {function}             - flush the cache
     */
    PathDataCache.prototype.flush = function() {
        this.__data__ = {};

        this.__flushCount__ = this.__keyCache__.__flushCount__; // update flush count
    };

    /*
     * PathDataCache.prototype.getData {function}       - get the cached data for the path
     *      @pathname {string}                          - url encoded path
     *      return {*|undefined}                        - cached data, undefined if not found
     */
    PathDataCache.prototype.getData = function(pathname) {
        var key = this.__keyCache__.getKey(pathname);

        if (this.__flushCount__ !== this.__keyCache__.__flushCount__) { // key cache flush, keys invalid
            this.flush();
            key = this.__keyCache__.getKey(pathname);
        }

        return key != undefined ? this.__data__[key] : undefined;
    };

    /*
     * PathDataCache.prototype.setData {function}       - set the cached data for the path
     *      @pathname {string}                          - url encoded path
     *      @data {*}                                   - cache data
     */
    PathDataCache.prototype.setData = function(pathname, data) {
        var key = this.__keyCache__.getKey(pathname);

        if (this.__flushCount__ !== this.__keyCache__.__flushCount__) { // key cache flushed, keys invalid
            this.flush();
            key = this.__keyCache__.getKey(pathname);
        }

        if (key != undefined) { this.__data__[key] = data; }
    };

    // execute finalizations
    finalize.forEach(function(func) { func(); })
})();