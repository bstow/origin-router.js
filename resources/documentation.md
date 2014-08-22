##Router

To use the router one must `require('./orgin-router.js')`.
```javascript
var orouter = require('./orgin-router.js');
```


###Class: orouter.Router
The Router class can be instantiated to create a router instance that allows for routes to be defined. The defined routes then serve to allow the router to predictably route URL paths to specified function handlers.

####router.add([name], expression, [options], [callback])
Add a route to the router to serve in routing URL paths.  The route may optionally be assigned a unique name by passing the `name` `String` as the 1st argument.

The `expression` `String` defines if and how the route will match a URL path.  A simple example of a route expression is `'/my/path'` which will route any similar URL path such as `'/my/path'` or `'my/path/'` (route matching disregards leading and trailing `/` characters).  A route expression can also match variable subpaths by specifying a route parameter denoted by a `:` character.  As an example the route expression `'/my/:foo/path'` has a parameter `foo` and will route the URL paths `'/my/bar/path'` and `'/my/qux/path'`.  In each case, the `foo` parameter will respectively have an argument value of `'bar'` and '`qux`'.  Additionally, a route wildcard parameter can be specified which will match multiple subpaths at the end of a URL path.  A route wildcard parameter must be specified at the end of the route expression with a `*` appended to the end of the parameter name. For example, the expression `'/my/:foo/:bar*'` has a wildcard parameter `bar` and will match the URL path`'my/lorem/ipsum/dolor/sit/amet'`.  In this case, the `foo` parameter will have an argument value of `'lorem'` and the `bar` wildcard parameter will have an argument value of `['ipsum', 'dolor', 'sit', 'amet']` (wildcard parameter matches are split into an array of subpaths).

The optional `options` `Object` can specify the following properties:
* `name`: `String` the unique name to assign to the route (this is the same as specifying the name as the 1st argument)
* `method`: `String|Array` the HTTP method that the added route should apply to, ex. `'GET'`.  To specify multiple HTTP methods, assign an `Array` of HTTP methods, ex. `['GET', 'POST']`.  By default, the added route will apply to all HTTP methods.
* `constraints`: `Function|Object` the constraints to apply to any of the route's parameters during URL path matching.  This option allows for rules to be set to restrict what one or more of the route parameters will match.  The most flexible way to set route parameter constraints is by setting the constraint option to a `Function`.  Upon the route initially matching a URL path, the constraints `Function` will be called and passed the route parameter name value pairs as an `Object` for evaluation.  The constraints `Function` should return either `true`, to indicate that the route parameter arguments are acceptable, or `false`, to indicate that the route parameters do not match the URL path and that the router should continue matching with the other subsequent routes.  An example of a constraints `Function` is `function(args) { return args.foo === 'bar' || args.foo === 'qux'; }` where the route will only match a URL path when the `foo` route parameter argument value is either `'bar'` or `'qux'`.



This is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

####Event: 'add'
`function(event) {}`
* `event`: `Object`
    * `route`: `Route` the new route added

Emitted each time a new route is added to the router.

####Event: 'success'
`function(event) {}`
* `event`: `Object`
    * `pathname`: `String` the URL encoded pathname used for routing (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * `method`: `String | undefined` the HTTP method used for routing
    * `route`: `Route` the matching route
    * `arguments`: `Object` the route parameter arguments as name value pairs
    * `data`: `* | undefined` any data passed upon routing

Emitted each time the router successfully routes a path.

####Event: 'fail'
`function(event) {}`
* `event`: `Object`
    * `pathname`: `String` the URL encoded pathname used for routing (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * `method`: `String | undefined` the HTTP method used for routing
    * `data`: `* | undefined` any data passed upon routing

Emitted each time the router can't find any matching route to route a path.