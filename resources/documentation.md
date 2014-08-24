##Router

To use the router one must `require('./orgin-router.js')`.
```javascript
var orouter = require('./orgin-router.js');
```

<br>
<br>

###<a name='Router'></a>Class: orouter.Router
The `Router` class can be instantiated to create a router instance that allows for routes to be defined. The defined routes then serve to allow the router to predictably route URL paths to specified `Function` handlers.

<br>
<br>

####<a name='new_Router'></a>new Router()

Create a new `Router` instance.

<br>
<br>

####<a name='router_add'></a>router.add([name], expression, [options], [callback])
Add a route to the router to serve in matching and routing URL paths.

<a name='router_add__name'></a>The route may optionally be assigned a unique name by passing the `name` `String` as the 1st argument.

<a name='router_add__expression'></a>The `expression` `String` defines if and how the route will match a URL path.  A simple example of a route expression is `'/my/path'` which will route any similar URL path such as `'/my/path'` or `'my/path/'` (route matching disregards leading and trailing `/` characters).

A route expression can match variable subpaths by specifying a route parameter denoted by a `:` character.  As an example, the route expression `'/my/:foo/path'` has a parameter `foo` and will route the URL paths `'/my/bar/path'` and `'/my/qux/path'`.  In each case, the `foo` parameter will respectively have an argument value of `'bar'` and '`qux`'.  Furthermore, a route wildcard parameter can be specified which will match multiple subpaths at the end of a URL path.  A route wildcard parameter must be specified at the end of the route expression with a `*` appended to the end of the parameter name. For example, the expression `'/my/:foo/:bar*'` has a wildcard parameter `bar` at the end and will match the URL path`'my/lorem/ipsum/dolor/sit/amet'`.  In this case, the `foo` parameter will have an argument value of `'lorem'` and the `bar` wildcard parameter will have an argument value of `['ipsum', 'dolor', 'sit', 'amet']` (wildcard parameter matches are split into an `Array` of subpaths).

<a name='router_add__options'></a>The optional `options` `Object` can specify the following properties:

* <a name='router_add__options_name'></a>`name`: `String` the unique name to assign to the route (this is the same as specifying the name as the 1st argument)

* <a name='router_add__options_method'></a>`method`: `String | Array` the HTTP method that the added route should apply to, ex. `'GET'`.  To specify multiple HTTP methods, assign an `Array` of HTTP methods, ex. `['GET', 'POST']`.  By default, the added route will apply to all HTTP methods.

* <a name='router_add__options_constraints'></a>`constraints`: `Function | Object` the constraints to apply to any of the route's parameters during URL path matching.
  
  This option allows for rules to be set to restrict what one or more of the route parameters will match.  The most flexible way to set route parameter constraints is by setting the constraint option to a `Function`.  Upon the route initially matching a URL path, the constraints `Function` will be called and passed the route parameter arguments as an `Object` of URL decoded name value pairs for evaluation.  The constraints `Function` should return either `true`, indicating that the route parameter arguments are compliant, or `false`, indicating that the route parameters do **not** match the URL path and that the router should continue matching with other subsequent routes.  An example of a constraints `Function` is `function(args) { return args.foo === 'bar' || args.foo === 'qux'; }` where the route will only match a URL path when the `foo` route parameter argument value is either `'bar'` or `'qux'`.
  
  Alternatively, route parameter constraints can be set as an `Object` where the constraint for a route parameter is assigned to a property corresponding to the parameter's name.  Each constraint may be either a `RegExp`, an `Array` of matching `Strings`, or a `Function` that accepts the route parameter argument value as the 1st argument and returns `true` or `false` to indicate compliance.  An example of a constraints `Object` is `{'foo': /^[0-9]/, 'bar': ['asdf', 'qwerty'], 'qux': function(arg) { return arg.length > 10; }}`.  In this case, the route will only match a URL path when the `foo` route parameter argument value starts with a number, the `bar` route parameter argument value is either `'asdf'` or `'qwerty'`, and the `qux` route parameter argument value is longer than 10 characters. Moreover, when a `RegExp` or `Array` of `String`s route parameter constraint is applied to a parameter wildcard argument, each URL subpath of the argument value will be tested for compliance.

* <a name='router_add__options_encoded'></a>`encoded`: `Boolean` indicator that the route expression uses URL encoding within subpaths.  This is primarily useful in allowing a route expression to match special route expression characters such as `/` and `:`.  For example, in the case of defining a route that could route the URL path `'/foo%2Fbar'` (`%2F` is the URL encoding for `/`), the route expression of `'/foo/bar'` would be ineffective because the `/` character is interpreted as a subpath delineator.  In order to effectively match the URL path `'/foo%2Fbar'`, the encoded option should be set to `true`, and the route expression's subpath should be URL encoded accordingly, `'/foo%2fbar'`. By default, the encoded option is `undefined` (and evaluates to `false`) indicating that the route expression is unencoded.

* <a name='router_add__options_ignoreCase'></a>`ignoreCase`: `Boolean` if set to `true`, the route expression will match URL paths using case-insensitive comparison.  By default, route expression matching is case-sensitive.

<a name='router_add__callback'></a>A `callback` `Function` can be passed as the last argument.  If specified, the callback will be called every time a URL path is routed by the added route.  (This is the same as setting a ['route' event](#route_route_event) listener on the returned and newly added [Route](#Route) instance.) Upon the added route routing a URL path, the callback will be called and passed an `Object` with the following properties:
* <a name='router_add__callback_pathname'></a>`pathname`: `String` the URL encoded pathname used (See [url.URL](http://nodejs.org/api/url.html#url_url))
* <a name='router_add__callback_method'></a>`method`: `String | undefined` the HTTP method used
* <a name='router_add__callback_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
* <a name='router_add__callback_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs
* <a name='router_add__callback_data'></a>`data`: `* | undefined` any data passed upon routing

Returns the created [Route](#Route) instance that has been newly added to the router. 

<br>

####<a name='router_add_get'></a>router.add.get([name], expression, [options], [callback])
####<a name='router_add_post'></a>router.add.post([name], expression, [options], [callback])
####<a name='router_add_put'></a>router.add.put([name], expression, [options], [callback])
####<a name='router_delete'></a>router.add.delete([name], expression, [options], [callback])
####<a name='router_add_head'></a>router.add.head([name], expression, [options], [callback])
####<a name='router_add_options'></a>router.add.options([name], expression, [options], [callback])
####<a name='router_add_trace'></a>router.add.trace([name], expression, [options], [callback])
####<a name='router_add_connect'></a>router.add.connect([name], expression, [options], [callback])

Aliases for [router.add](#router_add) that specify the HTTP method option (corresponding to the function name) that the added route should apply to.

<br>
<br>

####<a name='router_route'></a>router.route(pathname, [options], [callback])

Route a URL path using the routes added to the router.

<a name='router_route__pathname'></a>The `pathname` `String` should be passed as the 1st argument and be a URL encoded path. (See [url.URL](http://nodejs.org/api/url.html#url_url))

<a name='router_route__options'></a>The optional `options` `Object` can specify the following properties:

* <a name='router_route__options_method'></a>`method`: `String` the HTTP method to be used in routing the URL path

* <a name='router_route__options_data'></a>`data`: `*` arbitrary data to be passed to any callbacks or listeners triggered during the routing process

<a name='router_route__callback'></a>A `callback` `Function` can be passed as the last argument.  If specified, the callback will be called and passed an `Object` with the following properties upon the URL path being successfully routed:
* <a name='router_route__callback_pathname'></a>`pathname`: `String` the URL encoded pathname used (See [url.URL](http://nodejs.org/api/url.html#url_url))
* <a name='router_route__callback_method'></a>`method`: `String | undefined` the HTTP method used
* <a name='router_route__callback_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
* <a name='router_route__callback_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs
* <a name='router_route__callback_data'></a>`data`: `* | undefined` any data passed upon routing

Returns the [Route](#Route) instance that routed the URL path or `undefined` if the URL path couldn't be routed.

<br>

####<a name='router_route_get'></a>router.route.get(pathname, [options], [callback])
####<a name='router_route_post'></a>router.route.post(pathname, [options], [callback])
####<a name='router_route_put'></a>router.route.put(pathname, [options], [callback])
####<a name='router_route_delete'></a>router.route.delete(pathname, [options], [callback])
####<a name='router_route_head'></a>router.route.head(pathname, [options], [callback])
####<a name='router_route_options'></a>router.route.options(pathname, [options], [callback])
####<a name='router_route_trace'></a>router.route.trace(pathname, [options], [callback])
####<a name='router_route_connect'></a>router.route.connect(pathname, [options], [callback])

Aliases for [router.route](#router_route) that specify the HTTP method option (corresponding to the function name) that should be used in routing the URL path.

<br>
<br>

####<a name='router_path'></a>router.path(name, [arguments])

Generate a URL path using one of the routes that has been added to the router.

<a name='router_path__name'></a>The `name` `String` of the route to use to generate the URL path.  Consequently, only named routes can be used to generate URL paths.

<a name='router_path__arguments'></a>If the route being used to generate the URL path has parameters, specify the `arguments` `Object` as URL decoded name value pairs.  The arguments will be mapped to the route parameters and be embedded within the URL path.

Returns the the URL encoded pathname generated using the route specified. (See [url.URL](http://nodejs.org/api/url.html#url_url))

<br>
<br>

####<a name='router_events'></a>Events

This is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

<br>

####<a name='router_add_event'></a>Event: 'add'

`function(event) {}`
* <a name='router_add_event__event'></a>`event`: `Object`
    * <a name='router_add_event__event_route'></a>`route`: `Route` the newly added [Route](#Route) instance

Emitted each time a new route is added to the router.

<br>

####<a name='router_success_event'></a>Event: 'success'

`function(event) {}`
* <a name='router_success_event__event'></a>`event`: `Object`
    * <a name='router_success_event__event_pathname'></a>`pathname`: `String` the URL encoded pathname used (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * <a name='router_success_event__event_method'></a>`method`: `String | undefined` the HTTP method used
    * <a name='router_success_event__event_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
    * <a name='router_success_event__event_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs
    * <a name='router_success_event__event_data'></a>`data`: `* | undefined` any data passed upon routing

Emitted each time the router successfully routes a path.

<br>

####<a name='router_fail_event'></a>Event: 'fail'

`function(event) {}`
* <a name='router_fail_event__event'></a>`event`: `Object`
    * <a name='router_fail_event__event_pathname'></a>`pathname`: `String` the URL encoded pathname used (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * <a name='router_fail_event__event_method'></a>`method`: `String | undefined` the HTTP method used
    * <a name='router_fail_event__event_data'></a>`data`: `* | undefined` any data passed upon routing

Emitted each time the router can't find any matching route to route a path.

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

####<a name='route_events'></a>Events

This is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

<br>

####<a name='route_route_event'></a>Event: 'route'

`function(event) {}`
* <a name='route_route_event__event'></a>`event`: `Object`
    * <a name='route_route_event__event_pathname'></a>`pathname`: `String` the URL encoded pathname used (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * <a name='route_route_event__event_method'></a>`method`: `String | undefined` the HTTP method used
    * <a name='route_route_event__event_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
    * <a name='route_route_event__event_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs
    * <a name='route_route_event__event_data'></a>`data`: `* | undefined` any data passed upon routing

Emitted each time the route successfully routes a path.


