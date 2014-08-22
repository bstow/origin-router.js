##Router

To use the router one must `require('./orgin-router.js')`.
```javascript
var orouter = require('./orgin-router.js');
```


###Class: orouter.Router
This is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

###Event: 'add'
`function(event) {}`
* event `Object`
..* .route `Route` the new route added

Emitted each time a new route is added to the router.

###Event: 'success'
`function(event) {}`
* event `Object`
..* .pathname `String` the URL encoded pathname used for routing (See [url.URL](http://nodejs.org/api/url.html#url_url))
..* .method `String` or `undefined` the HTTP method used for routing
..* .route `Route` the matching route
..* .arguments `Object` the route parameter arguments as name value pairs
..* .data `*` or `undefined` any data passed upon routing

Emitted each time the router successfully routes a path.

###Event: 'fail'
`function(event) {}`
* event `Object`
..* .pathname `String` the URL encoded pathname used for routing (See [url.URL](http://nodejs.org/api/url.html#url_url))
..* .method `String` or `undefined` the HTTP method used for routing
..* .data `*` or `undefined` any data passed upon routing

Emitted each time the router can't find any matching route to route a path.
