##Router

To use the router one must `require('./orgin-router.js')`.
```javascript
var orouter = require('./orgin-router.js');
```


###Class: orouter.Router
The Router class can be instantiated to create a router instance that allows for routes to be defined. The defined routes then serve to allow the router to predictably route URL paths to specified function handlers.

####router.add([name], expression, [options], [callback])
Add a route to the router to serve in routing URL paths.  The route may be assigned a unique name by passing the `name` `String` as the first argument.

The `expression` `String` defines if and how the route will match a URL path.  A simple example of a route expression is `'/my/path'` which will route any similar URL path such as `'/my/path'` or `'my/path/'` (route matching disregards leading and trailing `/` characters).  A route expression can also match variable subpaths by specifying a route parameter denoted by a `:` character.  As an example the route expression `'/my/:foo/path'` has a parameter `foo` and will route the URL paths `'/my/bar/path'` and `'/my/qux/path'`.  In each case, the `foo` parameter will respectively have a value of `'bar'` and '`qux`'.  Additionally, a route wildcard parameter can be specified which will match multiple subpaths at the end of a URL path.  A route wildcard parameter must be specified at the end of the route expression with a `*` appended to the end of the parameter name. For example, the expression `'/my/:foo/:bar*'` has a wildcard parameter `bar` and will match the URL path`'my/lorem/ipsum/dolor/sit/amet'`.  In this case, the `foo` parameter will have a value of `'lorem'` and the `bar` wildcard parameter will have a value of `['ipsum', 'dolor', 'sit', 'amet']` (wildcard parameter matches are split into an array of subpaths).


This is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

####Event: 'add'
`function(event) {}`
* event `Object`
    * `route`: `Route` the new route added

Emitted each time a new route is added to the router.

####Event: 'success'
`function(event) {}`
* event: `Object`
    * `pathname`: `String` the URL encoded pathname used for routing (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * `method`: `String | undefined` the HTTP method used for routing
    * `route`: `Route` the matching route
    * `arguments`: `Object` the route parameter arguments as name value pairs
    * `data`: `* | undefined` any data passed upon routing

Emitted each time the router successfully routes a path.

####Event: 'fail'
`function(event) {}`
* event: `Object`
    * `pathname`: `String` the URL encoded pathname used for routing (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * `method`: `String | undefined` the HTTP method used for routing
    * `data`: `* | undefined` any data passed upon routing

Emitted each time the router can't find any matching route to route a path.
