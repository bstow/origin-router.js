@![intro <<]
##Origin Router
A Node.js module for routing HTTP requests by URL path

###Features
* Route URL paths to callbacks by HTTP method
* Match and capture variable URL subpaths as parameter arguments
* Dynamically generate URL paths from routes on the server-side and client-side
* Handle URL path decoding and encoding
* Safely map URL paths to filepaths on the filesystem
* Build advanced routing behaviors with a fully evented routing model
* Route faster with built-in caching
@![>> intro]

@![toc <<]

###[Cheatsheet](#cheatsheet)
* [Route Expressions](#cheatsheet__route_expressions)
* [Adding Routes](#cheatsheet__adding_routes)
* [Removing Routes](#cheatsheet__removing_routes)
* [Generating URL Paths](#cheatsheet__reverse_routing)

<br>

@![examples toc]

<br>

###[Documentation](#documentation)

<br>

* [Class: orouter.Router](#Router)
    * [new Router()](#new_Router)
    * [router.add([name], expression, [options], [callback])](#router_add)
    * [router.add(route, [callback])](#router_add_alt)
        * [router.addGet([name], expression, [options], [callback])](#router_addGet)
        * [router.addPost([name], expression, [options], [callback])](#router_addPost)
        * [router.addPut([name], expression, [options], [callback])](#router_addPut)
        * [router.addDelete([name], expression, [options], [callback])](#router_addDelete)
        * [router.addHead([name], expression, [options], [callback])](#router_addHead)
        * [router.addOptions([name], expression, [options], [callback])](#router_addOptions)
        * [router.addTrace([name], expression, [options], [callback])](#router_addTrace)
        * [router.addConnect([name], expression, [options], [callback])](#router_addConnect)
    * [router.remove(name)](#router_remove)
    * [router.remove(route)](#router_remove_alt)
    * [router.get(name)](#router_get)
    * [router.route(request, [response], [options], [callback])](#router_route)
        * [router.routeGet(request, [response], [options], [callback])](#router_routeGet)
        * [router.routePost(request, [response], [options], [callback])](#router_routePost)
        * [router.routePut(request, [response], [options], [callback])](#router_routePut)
        * [router.routeDelete(request, [response], [options], [callback])](#router_routeDelete)
        * [router.routeHead(request, [response], [options], [callback])](#router_routeHead)
        * [router.routeOptions(request, [response], [options], [callback])](#router_routeOptions)
        * [router.routeTrace(request, [response], [options], [callback])](#router_routeTrace)
        * [router.routeConnect(request, [response], [options], [callback])](#router_routeConnect)
    * [router.path(name, [arguments])](#router_path)
    * [router.pathjs(name)](#router_pathjs)
    * [Event: 'add'](#router_add_event)
    * [Event: 'remove'](#router_remove_event)
    * [Event: 'success'](#router_success_event)
    * [Event: 'fail'](#router_fail_event)

<br>

* [Class: orouter.Route](#Route)
    * [new Route(expression, [options])](#new_Route)
    * [route.name](#route_name)
    * [route.method](#route_method)
    * [route.constraints](#route_constraints)
    * [route.encoded](#route_encoded)
    * [route.ignoreCase](#route_ignoreCase)
    * [route.path([arguments])](#route_path)
    * [route.pathjs](#route_pathjs)
    * [Event: 'route'](#route_route_event)
    * [Event: 'added'](#route_added_event)
    * [Event: 'removed'](#route_removed_event)

<br>

* [orouter.basejoin(basepath, [subpaths, ...])](#basejoin)

@![>> toc]

##<a name='cheatsheet'></a>Cheatsheet
* <a name='cheatsheet__route_expressions'></a>**Route Expressions**
    * route _foo_ => matches URL path _foo_ and _<b>/</b>foo_
    * route _<b>/</b>foo_ => matches URL path _foo_ and _<b>/</b>foo_
    * route _/foo/bar_ => matches URL path _/foo/bar_ but **not** _/foo/bar<b>/</b>_
    * route _/foo/bar<b>/</b>_ => matches URL path _/foo/bar<b>/</b>_ but **not** _/foo/bar_
    * route _/foo/bar<b>/?</b>_ => matches URL path _/foo/bar_ and _/foo/bar<b>/</b>_
    * route _/<b>:foo</b>/bar_ => matches URL path _/<b>qux</b>/bar_ (where <b>:foo</b>=<b>qux</b>) and _/<b>baz</b>/bar_ (where <b>:foo</b>=<b>baz</b>)
    * route _/foo/<b>:bar*</b>_ => matches URL path _/foo/<b>qux</b>_ (where <b>:bar</b>=<b>[qux]</b>) and _/foo/<b>baz/qux</b>_ (where <b>:bar</b>=<b>[baz, qux]</b>)
    * route _/foo/:bar*<b>/?</b>_ => matches URL path _/foo/qux<b>/</b>_ (where :bar=[qux]) and _/foo/baz/qux_ (where :bar=[baz, qux])
    * route _/:foo<b><\^[a-z]+$></b>/bar_ => matches URL path _/<b>qux</b>/bar_ (where <b>:foo</b>=<b>qux</b>) but **not** _/<b>123</b>/bar_
    * route _/foo/:bar*<b><\^[a-z]+$></b>/_ => matches URL path _/foo/<b>qux</b>/_ (where <b>:bar</b>=<b>[qux]</b>) but **not** _/foo/<b>qux/123</b>/_
* <a name='cheatsheet__adding_routes'></a>**Adding Routes**
    * router.add('/foo') => adds a route that matches URL path <i>/foo</i>
    * router.add(<b>'my foo'</b>, '/foo') => adds a route named <b><i>my foo</i></b> that matches URL path <i>/foo</i>
    * router.add('/foo', {<b>method: 'GET'</b>}) => adds a route applicable to <b>GET requests</b> that matches URL path <i>/foo</i>
    * router.add<b>Get</b>('/foo') => adds a route applicable to <b>GET requests</b> that matches URL path <i>/foo</i>
    * router.add('/foo', {<b>method: ['GET', 'POST']</b>}) => adds a route applicable to <b>GET and POST requests</b> that matches URL path <i>/foo</i>
    * router.add('/foo', {<b>ignoreCase: true</b>}) => adds a route that matches URL path <i>/<b>foo</b></i> and <i>/<b>FOO</b></i>
    * router.add('/foo bar') => adds a route that matches URL path <i>/foo<b>%20</b>bar</i>
    * router.add('/foo<b>%20</b>bar', {<b>encoded: true</b>}) => adds a route that matches URL path <i>/foo<b>%20</b>bar</i>
    * router.add('/foo<b>%20</b>bar/<b>:qux</b>', {<b>encoded: true</b>}) => adds a route that matches URL path <i>/foo<b>%20</b>bar/<b>baz</b></i> (where <b>:qux</b>=<b>baz</b>)
    * router.add('/foo/:bar/:qux', {<b>constraints: function(args) { return args.bar.length > 2 && args.qux.length > 2; }</b>}) => adds a route that matches URL path <i>/foo/<b>aaa</b>/<b>bbb</b></i> (where <b>:bar</b>=<b>aaa</b> and <b>:qux</b>=<b>bbb</b>) but **not** <i>/foo/<b>aa</b>/<b>bb</b></i>
    * router.add('/foo/:bar/:baz/:qux/', {<b>constraints: {bar: /\^[a-z]+$/, baz: function(arg) { return arg.length > 2; }, qux: ['123', '456'] }</b>}) => adds a route that matches URL path <i>/foo/<b>abc</b>/<b>aaa</b>/<b>123</b></i> (where <b>:bar</b>=<b>abc</b>, <b>:baz</b>=<b>aaa</b>, <b>:qux</b>=<b>123</b>) but **not** <i>/foo/<b>123</b>/<b>bb</b>/<b>abc</b></i>
* <a name='cheatsheet__removing_routes'></a>**Removing Routes**
    * router.remove(<b>'my foo'</b>) => removes a route named <b><i>my foo</i></b>
* <a name='cheatsheet__reverse_routing'></a>**Generating URL Paths**
    * router.path(<b>'my foo'</b>, {<b>bar: 'abc'</b>, <b>qux: ['1', '2', '3']</b>}) => returns the URL path <i><b>/foo/abc/1/2/3</b></i> given that route named <b><i>my foo</i></b> has an expression of <i><b>/foo/:bar/:qux*</b></i>
    * router.pathjs(<b>'my foo'</b>) => returns the javascript source code for a function that will generate a URL path using the route named <b><i>my foo</i></b>

<br>
<br>

@![examples]

<br>
<br>

##<a name='documentation'>Router Documentation

<br>
<br>

To use the router one must `require('./origin-router.js')`.
```javascript
var orouter = require('./origin-router.js');
```

<br>
<br>

###<a name='Router'></a>Class: orouter.Router
The `Router` class can be instantiated to create a router instance that allows for routes to be defined. The defined routes then serve to allow the router to route URL paths to specified `Function` handlers.

<br>
<br>

####<a name='new_Router'></a>new Router()

Create a new `Router` instance. (See @![link example_setup])

<br>
<br>

####<a name='router_add'></a>router.add([name], expression, [options], [callback])
Add a route to the router to serve in matching and routing URL paths.

<a name='router_add__name'></a>The route may optionally be assigned a unique name by passing the `name` `String` as the 1st argument.

<a name='router_add__expression'></a>The `expression` `String` defines if and how the route will match a URL path.  A simple example of a route expression is `'/my/path'` which will route any similar URL path such as `'/my/path'` or `'my/path'` (route matching disregards a leading `/` character).

A route expression can match variable subpaths by specifying one or more route parameters.  Each parameter is denoted by a `:` character followed by the parameter name consisting of 1 or more non-special characters (not `:`, `*`, `<`, `>`, `/` or `?`).  As an example, the route expression `'/my/:foo/path'` has a parameter `foo` and will route the URL paths `'/my/bar/path'` and `'/my/qux/path'`.  In each case, the `foo` parameter will have an argument value of `'bar'` and '`qux`' respectively. (See @![link example_parameters])  Furthermore, a route wildcard parameter can be specified that will match multiple subpaths at the end of a URL path.  A route wildcard parameter must be specified at the end of the route expression with a `*` appended to the end of the parameter name. For example, the expression `'/my/:foo/:bar*'` has a wildcard parameter `bar` at the end and will match the URL path`'my/lorem/ipsum/dolor/sit/amet'`.  In this case, the `foo` parameter will have an argument value of `'lorem'` and the `bar` wildcard parameter will have an argument value of `['ipsum', 'dolor', 'sit', 'amet']` (wildcard parameter matches are split into an `Array` of subpaths). (See @![link example_wildcard_parameters])  Lastly, each route parameter can optionally be specified with an inline constraint that restricts what subpaths the route parameter will match according to a regular expression. An inline constraint is specified after the corresponding route parameter name and is denoted by a `<` and `>` character before and after the constraint regular expression.  As an example, the route expression `/:foo<^[a-z]+$>/qux/:bar*<^[0-9]$>` contains 2 constrained parameters, `foo` and `bar`, and will route the URL path `/lorem/qux/1/2/3` but will **not** route the URL path `/123/qux/1/2/ipsum`. (See @![link example_parameter_constraints])

By default, a route expression will not match a URL path with a trailing `/` character.  For example, the route expression `/my/:path*` will **not** match `/my/trailing/slash/`.  To enable a route expression to match only URL paths with a trailing `/` character, a `/` character should be specified at the end of the route expression.  For example, the route expression `/my/:path*/` will match `/my/trailing/slash/` but not `/my/omitted/trailing/slash`.  To enable a route expression to match both URL paths with and without a trailing `/` character, `/?` should be specified at the end of the route expression.  For example, the route expression `/my/path*/?` will match both `/my/trailing/slash/` and `/my/omitted/trailing/slash`. (See @![link example_trailing_slash])

<a name='router_add__options'></a>The optional `options` `Object` can specify the following properties:

* <a name='router_add__options_name'></a>`name`: `String` the unique name to assign to the route (this is the same as specifying the name as the 1st argument)

* <a name='router_add__options_method'></a>`method`: `String | Array` the HTTP method that the added route should apply to, ex. `'GET'`.  To specify multiple HTTP methods, specify an `Array` of HTTP methods, ex. `['GET', 'POST']`.  By default, the added route will apply to all HTTP methods. (See @![link example_http_methods])

* <a name='router_add__options_constraints'></a>`constraints`: `Function | Object` the constraints to apply to any of the route's parameters during URL path matching.
  
  This option allows for rules to be set to restrict what one or more of the route parameters will match.  The most flexible way to set route parameter constraints is by setting the constraint option to a `Function`.  Upon the route initially matching a URL path, the constraints `Function` will be called and passed the route parameter arguments as an `Object` of URL decoded name value pairs for evaluation.  The constraints `Function` should return either `true`, indicating that the route parameter arguments are compliant, or `false`, indicating that the route parameters do **not** match the URL path and that the router should continue matching with other subsequent routes.  An example of a constraints `Function` is `function(args) { return args.foo === 'bar' || args.foo === 'qux'; }` where the route will only match a URL path when the `foo` route parameter argument value is either `'bar'` or `'qux'`.
  
  Alternatively, route parameter constraints can be set as an `Object` of key value pairs where the key is the route parameter name and the value is the constraint for the route parameter.  Each constraint value may be either a `RegExp`, an `Array` of matching `Strings`, or a `Function` that accepts the route parameter argument value as the 1st argument and returns `true` or `false` to indicate compliance.  An example of a constraints `Object` is `{'foo': /^[0-9]/, 'bar': ['asdf', 'qwerty'], 'qux': function(arg) { return arg.length > 10; }}`.  In this case, the route will only match a URL path when the `foo` route parameter argument value starts with a number, the `bar` route parameter argument value is either `'asdf'` or `'qwerty'`, and the `qux` route parameter argument value is longer than 10 characters. Moreover, when a route parameter constraint value is either a `RegExp` or an `Array` of `String`s and the corresponding route parameter is a wildcard parameter, each URL subpath of the route parameter argument value will be tested for compliance.
  
  (See @![link example_parameter_constraints])

* <a name='router_add__options_encoded'></a>`encoded`: `Boolean` indicator that the route expression uses URL encoding within subpaths.  This is primarily useful in allowing a route expression to match special route expression characters such as `/` and `:`.  For example, in the case of defining a route that could route the URL path `'/foo%2Fbar'` (`%2F` is the URL encoding for `/`), the route expression of `'/foo/bar'` would be ineffective because the `/` character is interpreted as a subpath delineator.  In order to effectively match the URL path `'/foo%2Fbar'`, the encoded option should be set to `true`, and the route expression's subpath should be URL encoded accordingly, `'/foo%2fbar'`. By default, the encoded option is `false` indicating that the route expression is unencoded. (See @![link example_url_encoding])

* <a name='router_add__options_ignoreCase'></a>`ignoreCase`: `Boolean` if set to `true`, the route expression will match URL paths using case-insensitive comparison.  By default, route expression matching is case-sensitive.

<a name='router_add__callback'></a>A `callback` `Function` can be passed as the last argument.  If specified, the callback will be called every time a URL path is routed by the added route.  (This is the same as setting a ['route' event](#route_route_event) listener on the returned and newly added [Route](#Route) instance.) Upon the added route routing a URL path, the callback will be called and passed an `Object` with the following properties:
* <a name='router_add__callback_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
* <a name='router_add__callback_method'></a>`method`: `String | undefined` the HTTP method used. (See @![link example_http_methods])
* <a name='router_add__callback_router'></a>`router`: `Router` the [Router](#Router) instance
* <a name='router_add__callback_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
* <a name='router_add__callback_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs. (See @![link example_parameters])
* <a name='router_add__callback_request'></a>`request`: `http.IncomingMessage` the request if specified upon routing. (See @![link example_http_server])
* <a name='router_add__callback_response'></a>`response`: `http.ServerResponse` the response if specified upon routing. (See @![link example_http_server])
* <a name='router_add__callback_data'></a>`data`: `* | undefined` any data passed upon routing. (See @![link example_events])

Returns the created [Route](#Route) instance that has been newly added to the router. 

<br>

####<a name='router_add_alt'></a>router.add(route, [callback])
Add a [Route](#Route) instance to the router to serve in matching and routing URL paths.  (This is an alternative method call to [router.add([name], expression, [options], [callback])](#router_add) which instead allows for an already instantiated [Route](#Route) to be added to the router.)

<a name='router_add_alt__route'></a>The `route` `Route` is the [Route](#Route) instance to be added to the router and should be passed as the 1st argument. (See @![link example_route_objects])

<a name='router_add_alt__callback'></a>A `callback` `Function` can be passed as the last argument. (See See [router.add([name], expression, [options], [callback])](#router_add) [[callback](#router_add__callback)]))

Returns the [Route](#Route) instance added to the router.

<br>

####<a name='router_addGet'></a>router.addGet([name], expression, [options], [callback])
####<a name='router_addPost'></a>router.addPost([name], expression, [options], [callback])
####<a name='router_addPut'></a>router.addPut([name], expression, [options], [callback])
####<a name='router_addDelete'></a>router.addDelete([name], expression, [options], [callback])
####<a name='router_addHead'></a>router.addHead([name], expression, [options], [callback])
####<a name='router_addOptions'></a>router.addOptions([name], expression, [options], [callback])
####<a name='router_addTrace'></a>router.addTrace([name], expression, [options], [callback])
####<a name='router_addConnect'></a>router.addConnect([name], expression, [options], [callback])

Aliases for [router.add](#router_add) that specify the HTTP method option (corresponding to the function name) that the added route should apply to. (See @![link example_http_methods])

<br>
<br>

####<a name='router_remove'></a>router.remove(name)
Remove a route from the router.

<a name='router_remove__name'></a>The `name` `String` of the route to remove.

Returns the [Route](#Route) instance removed from the router.

<br>
<br>

####<a name='router_remove_alt'></a>router.remove(route)
Remove a route from the router.

<a name='router_remove_alt__name'></a>The `route` `Route` is the [Route](#Route) instance to be removed from the router

Returns the [Route](#Route) instance removed from the router.

<br>
<br>

####<a name='router_get'></a>router.get(name)

Get a [Route](#Route) instance added to the router by route `name` `String`.

Returns the named [Route](#Route) instance or `undefined` if no route with the given name exists.

<br>
<br>

####<a name='router_route'></a>router.route(request, [response], [options], [callback])

Route a URL path using the routes added to the router.

<a name='router_route__request'></a>The `request` `String | http.IncomingMessage | url.URL` should be passed as the 1st argument and can be either a URL encoded path, an HTTP request (See [http.IncomingMessage](http://nodejs.org/api/http.html#http_http_incomingmessage)) or a URL (See [url.URL](http://nodejs.org/api/url.html#url_url)).  If the `request` argument is an `http.IncomingMessage` it will be passed to any callbacks or listeners triggered during the routing process as the `request` property.

<a name='router_route__response'></a>The optional `response` `http.ServerResponse` may be passed as the 2nd argument and will be passed to any callbacks or listeners triggered during the routing process as the `response` property.

<a name='router_route__options'></a>The optional `options` `Object` can specify the following properties:

* <a name='router_route__options_method'></a>`method`: `String` the HTTP method to be used in routing the URL path. (See @![link example_http_methods])

* <a name='router_route__options_request'></a>`request`: `http.IncomingMessage` the request to be passed to any callbacks or listeners triggered during the routing process. (See @![link example_http_server])

* <a name='router_route__options_response'></a>`response`: `http.ServerResponse` the response to be passed to any callbacks or listeners triggered during the routing process. (See @![link example_http_server])

* <a name='router_route__options_data'></a>`data`: `*` arbitrary data to be passed to any callbacks or listeners triggered during the routing process. (See @![link example_events])

<a name='router_route__callback'></a>A `callback` `Function` can be passed as the last argument.  If specified, the callback will be called and passed an `Object` with the following properties upon the URL path being successfully routed:
* <a name='router_route__callback_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
* <a name='router_route__callback_method'></a>`method`: `String | undefined` the HTTP method used. (See @![link example_http_methods])
* <a name='router_route__callback_router'></a>`router`: `Router` the [Router](#Router) instance
* <a name='router_route__callback_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
* <a name='router_route__callback_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs. (See @![link example_parameters])
* <a name='router_route__callback_request'></a>`request`: `http.IncomingMessage` the request if specified upon routing. (See @![link example_http_server])
* <a name='router_route__callback_response'></a>`response`: `http.ServerResponse` the response if specified upon routing. (See @![link example_http_server])
* <a name='router_route__callback_data'></a>`data`: `* | undefined` any data passed upon routing. (See @![link example_events])

Returns the [Route](#Route) instance that routed the URL path or `undefined` if the URL path couldn't be routed.

<br>

####<a name='router_routeGet'></a>router.routeGet(request, [response], [options], [callback])
####<a name='router_routePost'></a>router.routePost(request, [response], [options], [callback])
####<a name='router_routePut'></a>router.routePut(request, [response], [options], [callback])
####<a name='router_routeDelete'></a>router.routeDelete(request, [response], [options], [callback])
####<a name='router_routeHead'></a>router.routeHead(request, [response], [options], [callback])
####<a name='router_routeOptions'></a>router.routeOptions(request, [response], [options], [callback])
####<a name='router_routeTrace'></a>router.routeTrace(request, [response], [options], [callback])
####<a name='router_routeConnect'></a>router.routeConnect(request, [response], [options], [callback])

Aliases for [router.route](#router_route) that specify the HTTP method option (corresponding to the function name) that should be used in routing the URL path. (See @![link example_http_methods])

<br>
<br>

####<a name='router_path'></a>router.path(name, [arguments])

Generate a URL path using one of the routes that has been added to the router. (See @![link example_reverse_routing])

<a name='router_path__name'></a>The `name` `String` of the route to use to generate the URL path.  Consequently, only named routes can be used to generate URL paths.

<a name='router_path__arguments'></a>If the route being used to generate the URL path has parameters, specify the route parameter `arguments` `Object` as URL decoded name value pairs.  The route parameter arguments will be mapped to the route parameters and be embedded within the URL path.  (Note that the route parameter arguments passed must comply with the corresponding route constraints or otherwise an error will be thrown.)

Returns the URL encoded pathname generated using the route specified. (See [url.URL](http://nodejs.org/api/url.html#url_url))

<br>
<br>

####<a name='router_pathjs'></a>router.pathjs(name)

Get the source code `String` for a `Function` that will generate a URL path using the route specified.  Upon compiling the source code, the `Function` may be called and optionally passed a route parameter arguments `Object` of URL decoded name value pairs as the 1st parameter to be mapped and embedded within the generated URL path.  (Note that the route parameter arguments are **not** validated for compliance against the corresponding route constraints.)
  
  This is primarily useful in allowing for a URL path to be dynamically generated on the client-side. (See @![link example_client_side_reverse_routing])

<a name='router_pathjs__name'></a>The `name` `String` of the route to use to generate the source code `String` of the URL path generating `Function`.  Consequently, only named routes can be used with this feature.

Returns the source code `String` for a `Function` that will generate a URL path using the route specified.
  
<br>
<br>

####<a name='router_events'></a>Events

A `Router` class instance is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

<br>

####<a name='router_add_event'></a>Event: 'add'

`function(event) {}`
* <a name='router_add_event__event'></a>`event`: `Object`
    * <a name='router_add_event__event_route'></a>`route`: `Route` the newly added [Route](#Route) instance

Emitted each time a new route is added to the router. (See @![link example_events])

<br>

####<a name='router_remove_event'></a>Event: 'remove'

`function(event) {}`
* <a name='router_remove_event__event'></a>`event`: `Object`
    * <a name='router_remove_event__event_route'></a>`route`: `Route` the removed [Route](#Route) instance

Emitted each time a route is removed from the router. (See @![link example_events])

<br>

####<a name='router_success_event'></a>Event: 'success'

`function(event) {}`
* <a name='router_success_event__event'></a>`event`: `Object`
    * <a name='router_success_event__event_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * <a name='router_success_event__event_method'></a>`method`: `String | undefined` the HTTP method used
    * <a name='router_success_event__event_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
    * <a name='router_success_event__event_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs
    * <a name='router_success_event__event_request'></a>`request`: `http.IncomingMessage` the request if specified upon routing. (See @![link example_http_server])
    * <a name='router_success_event__event_response'></a>`response`: `http.ServerResponse` the response if specified upon routing. (See @![link example_http_server])
    * <a name='router_success_event__event_data'></a>`data`: `* | undefined` any data passed upon routing

Emitted each time the router successfully routes a path. (See @![link example_events])

<br>

####<a name='router_fail_event'></a>Event: 'fail'

`function(event) {}`
* <a name='router_fail_event__event'></a>`event`: `Object`
    * <a name='router_fail_event__event_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * <a name='router_fail_event__event_method'></a>`method`: `String | undefined` the HTTP method used
    * <a name='router_fail_event__event_request'></a>`request`: `http.IncomingMessage` the request if specified upon routing. (See @![link example_http_server])
    * <a name='router_fail_event__event_response'></a>`response`: `http.ServerResponse` the response if specified upon routing. (See @![link example_http_server])
    * <a name='router_fail_event__event_data'></a>`data`: `* | undefined` any data passed upon routing

Emitted each time the router can't find any matching route to route a path. (See @![link example_events])

<br>
<br>
<br>

###<a name='Route'></a>Class: orouter.Route

A `Route` class instance represents a single route and should be used in conjuction with an instance of the [Router](#Router) class.  Furthermore, [Router](#Router) instances internally create and store `Route` instances to direct the  routing of URL paths.

<br>
<br>

####<a name='new_Route'></a>new Route(expression, [options])

Create a new `Route` instance.

<a name='new_Route__expression'></a>The `expression` `String` is required and defines if and how the route will match a URL path.  (See [orouter.Route](#Route) [[expression](#new_Route__expression)])

<a name='new_Route__options'></a>The optional `options` `Object` allows for a number of optional route properties to be defined: (See [router.add](#router_add) [[options](#router_add__options)])
* <a name='new_Route__options_name'></a>`name`: `String` the unique name to assign to the route
* <a name='new_Route__options_method'></a>`method`: `String | Array` the HTTP method or methods that the added route should apply to.  By default, the route will apply to all HTTP methods.
* <a name='new_Route__options_constraints'></a>`constraints`: `Function | Object` the constraints to apply to any of the route's parameters during URL path matching. (See [router.add](#router_add) [[options.constraints](#router_add__options_constraints)])
* <a name='new_Route__options_encoded'></a>`encoded`: `Boolean` indicator that the route expression uses URL encoding within subpaths
* <a name='new_Route__options'></a>`ignoreCase`: `Boolean` if set to `true`, the route expression will match URL paths using a case-insensitive comparison.  By default, route expression matching is case-sensitive.

<br>
<br>

####<a name='route_name'></a>route.name

* `String | undefined` get the name of the route. If `undefined`, the route is unnamed.

<br>
<br>

####<a name='route_method'></a>route.method

* `String | Array | undefined` get the HTTP method or methods that the route applies to. If `undefined`, the route applies to all HTTP methods.

<br>
<br>

####<a name='route_constraints'></a>route.constraints

* `Function | Object | undefined` get or set the constraints applied to any of the route's parameters during URL path matching. (See [router.add](#router_add) [[options.constraints](#router_add__options_constraints)])

<br>
<br>

####<a name='route_encoded'></a>route.encoded

* `Boolean` get indicator that the route expression uses URL encoding within subpaths

<br>
<br>

####<a name='route_ignoreCase'></a>route.ignoreCase

* `Boolean` get or set case-insensitive matching of URL paths by the route expression

<br>
<br>

####<a name='route_path'></a>route.path([arguments])

Generate a URL path using the route. (See @![link example_route_objects])

<a name='route_path__arguments'></a>If the route has parameters, specify the route parameter `arguments` `Object` as URL decoded name value pairs.  The route parameter arguments will be mapped to the route parameters and be embedded within the URL path. (Note that the route parameter arguments passed must comply with the corresponding route constraints or otherwise an error will be thrown.)

Returns the URL encoded pathname generated using the route. (See [url.URL](http://nodejs.org/api/url.html#url_url))

<br>
<br>

####<a name='route_pathjs'></a>route.pathjs

* `String` get the source code for a `Function` that will generate a URL path using the route.  Upon compiling the source code, the `Function` may be called and optionally passed a route parameter arguments `Object` of URL decoded name value pairs as the 1st parameter to be mapped and embedded within the generated URL path.  (Note that the route parameter arguments are **not** validated for compliance against the corresponding route constraints.)
  
  This is primarily useful in allowing for a URL path to be dynamically generated on the client-side. (See @![link example_client_side_reverse_routing])

<br>
<br>

####<a name='route_events'></a>Events

A `Route` class instance is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

<br>

####<a name='route_route_event'></a>Event: 'route'

`function(event) {}`
* <a name='route_route_event__event'></a>`event`: `Object`
    * <a name='route_route_event__event_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * <a name='route_route_event__event_method'></a>`method`: `String | undefined` the HTTP method used
    * <a name='route_route_event__event_router'></a>`router`: `Router` the [Router](#Router) instance that routed the URL path
    * <a name='route_route_event__event_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
    * <a name='route_route_event__event_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs
    * <a name='route_route_event__event_request'></a>`request`: `http.IncomingMessage` the request if specified upon routing. (See @![link example_http_server])
    * <a name='route_route_event__event_response'></a>`response`: `http.ServerResponse` the response if specified upon routing. (See @![link example_http_server])
    * <a name='route_route_event__event_data'></a>`data`: `* | undefined` any data passed upon routing

<br>

####<a name='route_added_event'></a>Event: 'added'

`function(event) {}`
* <a name='route_added_event__event'></a>`event`: `Object`
    * <a name='route_added_event__event_router'></a>`router`: `Router` the [Router](#Router) instance the route was added to


Emitted upon the route being added to a [Router](#Router) instance.

<br>

####<a name='route_removed_event'></a>Event: 'removed'

`function(event) {}`
* <a name='route_removed_event__event'></a>`event`: `Object`
    * <a name='route_removed_event__event_router'></a>`router`: `Router` the [Router](#Router) instance that the route was removed from


Emitted upon the route being removed from a [Router](#Router) instance.

<br>
<br>

####<a name='basejoin'></a>orouter.basejoin(basepath, [subpaths, ...])

A utility `Function` to safely join multiple subpaths into a filepath.  Upon routing a URL path, a common operation is to utilize route parameter arguments to form a filepath that refers to a file on the file system.  An example of this would be using all or part of a URL path to form a filepath referring to a static file on the file system; the file would then in turn be served through the HTTP response.  A potential security vulnerability in this scenario of deriving the filepath from the URL path is that more of the filesystem than intended can become accessible when a URL path contains components such as `..`  The `basejoin` `Function` mitigates this security vulnerability by ensuring that the joined subpaths form a filepath restricted to be within a base filepath on the file system. (See @![link example_filepaths])

<a name='basejoin__basepath'></a>The `basepath` `String` should be specified as the 1st argument and is the base filepath which the joined `subpaths` are relative to in forming the filepath.  The returned filepath is restricted to being within the `basepath` on the file system.

<a name='basejoin__subpaths'></a>The `subpaths` should be specified as the arguments after the `pasepath` argument and are joined sequentially starting at the `basepath` to form the returned filepath.  Each subpath argument can either be a `string` subpath or an `Array` of `string` subpaths. (Route parameter arguments as well as route wildcard parameter arguments can be passed directly as subpath arguments.)

Returns the filepath formed from the `basepath` and `subpaths`.  The returned filepath is contained within the `basepath` on the file system.
