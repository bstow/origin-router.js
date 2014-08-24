##Router

To use the router one must `require('./orgin-router.js')`.
```javascript
var orouter = require('./orgin-router.js');
```

<br>
<br>

###Class: orouter.Router
The `Router` class can be instantiated to create a router instance that allows for routes to be defined. The defined routes then serve to allow the router to predictably route URL paths to specified `Function` handlers.

<br>
<br>

####router.add([name], expression, [options], [callback])
Add a route to the router to serve in matching and routing URL paths.

The route may optionally be assigned a unique name by passing the `name` `String` as the 1st argument.

The `expression` `String` defines if and how the route will match a URL path.  A simple example of a route expression is `'/my/path'` which will route any similar URL path such as `'/my/path'` or `'my/path/'` (route matching disregards leading and trailing `/` characters).

A route expression can match variable subpaths by specifying a route parameter denoted by a `:` character.  As an example, the route expression `'/my/:foo/path'` has a parameter `foo` and will route the URL paths `'/my/bar/path'` and `'/my/qux/path'`.  In each case, the `foo` parameter will respectively have an argument value of `'bar'` and '`qux`'.  Furthermore, a route wildcard parameter can be specified which will match multiple subpaths at the end of a URL path.  A route wildcard parameter must be specified at the end of the route expression with a `*` appended to the end of the parameter name. For example, the expression `'/my/:foo/:bar*'` has a wildcard parameter `bar` and will match the URL path`'my/lorem/ipsum/dolor/sit/amet'`.  In this case, the `foo` parameter will have an argument value of `'lorem'` and the `bar` wildcard parameter will have an argument value of `['ipsum', 'dolor', 'sit', 'amet']` (wildcard parameter matches are split into an `Array` of subpaths).

The optional `options` `Object` can specify the following properties:

* `name`: `String` the unique name to assign to the route (this is the same as specifying the name as the 1st argument)

* `method`: `String | Array` the HTTP method that the added route should apply to, ex. `'GET'`.  To specify multiple HTTP methods, assign an `Array` of HTTP methods, ex. `['GET', 'POST']`.  By default, the added route will apply to all HTTP methods.

* `constraints`: `Function | Object` the constraints to apply to any of the route's parameters during URL path matching.

  This option allows for rules to be set to restrict what one or more of the route parameters will match.  The most flexible way to set route parameter constraints is by setting the constraint option to a `Function`.  Upon the route initially matching a URL path, the constraints `Function` will be called and passed the route parameter arguments as an `Object` of URL decoded name value pairs for evaluation.  The constraints `Function` should return either `true`, indicating that the route parameter arguments are compliant, or `false`, indicating that the route parameters do **not** match the URL path and that the router should continue matching with other subsequent routes.  An example of a constraints `Function` is `function(args) { return args.foo === 'bar' || args.foo === 'qux'; }` where the route will only match a URL path when the `foo` route parameter argument value is either `'bar'` or `'qux'`.

  Alternatively, route parameter constraints can be set as an `Object` where the constraint for a route parameter is assigned to a property corresponding to the parameter's name.  Each constraint may be either a `RegExp`, `Array` of matching `Strings`, or a `Function` that accepts the route parameter argument value as the 1st argument and returns `true` or `false` to indicate compliance.  An example of a constraints `Object` is `{'foo': /^[0-9]/, 'bar': ['asdf', 'qwerty'], 'qux': function(arg) { return arg.length > 10; }}`.  In this case, the route will only match a URL path when the `foo` route parameter argument value starts with a number, the `bar` route parameter argument value is either `'asdf'` or `'qwerty'`, and the `qux` route parameter argument value is longer than 10 characters. Moreover, when a `RegExp` or `Array` of `String`s route parameter constraint is applied to a parameter wildcard argument, each URL subpath of the argument value will be tested for compliance.

* `encoded`: `Boolean` indicator that the route expression uses URL encoding within subpaths.  This is primarily useful in allowing a route expression to match special route expression characters such as `/` and `:`.  For example, in the case of defining a route that could route the URL path `'/foo%2Fbar'` (`%2F` is the URL encoding for `/`), the route expression of `'/foo/bar'` would be ineffective because the `/` character is interpreted as a subpath delineator.  In order to effectively match the URL path `'/foo%2Fbar'`, the encoded option should be set to `true`, and the route expression's subpath should be URL encoded accordingly, `'/foo%2fbar'`. By default, the encoded option is `undefined` (and evaluates to `false`) indicating that the route expression is unencoded.

* `ignoreCase`: `Boolean` if set to `true`, the route expression will match URL paths using a case-insensitive comparison.  By default, route expression matching is case-sensitive.

A `callback` `Function` can be passed as the last argument.  If specified, the callback will be called every time a URL path is routed by the added route.  (This is the same as setting a 'route' event listener on the returned and newly added `Route` instance.) Upon the added route routing a URL path, the callback will be called and passed an `Object` with the following properties:
* `pathname`: `String` the URL encoded pathname used (See [url.URL](http://nodejs.org/api/url.html#url_url))
* `method`: `String | undefined` the HTTP method used
* `route`: `Route` the `Route` instance that routed the URL path (See [orouter.Route](orouter.Route))
* `arguments`: `Object` the route parameter arguments as URL decoded name value pairs
* `data`: `* | undefined` any data passed upon routing

Returns the created `Route` instance that has been newly added to the router. (See [orouter.Route](orouter.Route))

<br>

####router.add.get([name], expression, [options], [callback])
####router.add.post([name], expression, [options], [callback])
####router.add.put([name], expression, [options], [callback])
####router.add.delete([name], expression, [options], [callback])
####router.add.head([name], expression, [options], [callback])
####router.add.options([name], expression, [options], [callback])
####router.add.trace([name], expression, [options], [callback])
####router.add.connect([name], expression, [options], [callback])

Aliases for `router.add` that specify the HTTP method option (corresponding to the function name) that the added route should apply to.


<br>
<br>


####router.route(pathname, [options], [callback])

Route a URL path using the routes added to the router.

The `pathname` `String` should be passed as the 1st argument and be a URL encoded path. (See [url.URL](http://nodejs.org/api/url.html#url_url))

The optional `options` `Object` can specify the following properties:

* `method`: `String` the HTTP method to be used in routing the URL path

* `data`: `*` arbitrary data to be passed to any callbacks or listeners triggered during the routing process

A `callback` `Function` can be passed as the last argument.  If specified, the callback will be called and passed an `Object` with the following properties upon the URL path being successfully routed:
* `pathname`: `String` the URL encoded pathname used (See [url.URL](http://nodejs.org/api/url.html#url_url))
* `method`: `String | undefined` the HTTP method used
* `route`: `Route` the `Route` instance that routed the URL path (See [orouter.Route](orouter.Route))
* `arguments`: `Object` the route parameter arguments as URL decoded name value pairs
* `data`: `* | undefined` any data passed upon routing

Returns the Route instance that routed the URL path or `undefined` if the URL path couldn't be routed. (See [orouter.Route](orouter.Route))

<br>

####router.route.get(pathname, [options], [callback])
####router.route.post(pathname, [options], [callback])
####router.route.put(pathname, [options], [callback])
####router.route.delete(pathname, [options], [callback])
####router.route.head(pathname, [options], [callback])
####router.route.options(pathname, [options], [callback])
####router.route.trace(pathname, [options], [callback])
####router.route.connect(pathname, [options], [callback])

Aliases for `router.route` that specify the HTTP method option (corresponding to the function name) that should be used in routing the URL path.

<br>
<br>

####router.path(name, [arguments])

Generate a URL path using one of the routes that has been added to the router.

The `name` `String` of the route to use to generate the URL path.  Consequently, only named routes can be used to generate URL paths.

If the route being used to generate the URL path has parameters, specify the `arguments` `Object` as URL decoded name value pairs.  The arguments will be mapped to the route parameters and be embedded within the URL path.

Returns the the URL encoded pathname generated using the route specified. (See [url.URL](http://nodejs.org/api/url.html#url_url))

<br>
<br>

This is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

<br>

####Event: 'add'
`function(event) {}`
* `event`: `Object`
    * `route`: `Route` the newly added `Route` instance

Emitted each time a new route is added to the router.

<br>

####Event: 'success'
`function(event) {}`
* `event`: `Object`
    * `pathname`: `String` the URL encoded pathname used (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * `method`: `String | undefined` the HTTP method used
    * `route`: `Route` the `Route` instance that routed the URL path (See [orouter.Route](orouter.Route))
    * `arguments`: `Object` the route parameter arguments as URL decoded name value pairs
    * `data`: `* | undefined` any data passed upon routing

Emitted each time the router successfully routes a path.

<br>

####Event: 'fail'
`function(event) {}`
* `event`: `Object`
    * `pathname`: `String` the URL encoded pathname used (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * `method`: `String | undefined` the HTTP method used
    * `data`: `* | undefined` any data passed upon routing

Emitted each time the router can't find any matching route to route a path.

<br>
<br>
<br>

###Class: orouter.Route




<br>
<br>
<br>

##Examples


<br>
<br>

####Example: Setup
```javascript
// require the router module
var orouter = require('./origin-router.js');

// instantiate a new router
var router = new orouter.Router();
```

<br>
<br>

####Example: Routing
```javascript
// add routes to the router with corresponding callbacks ...
router.add('/dog', function() { console.log('I have a dog'); });
router.add('/cat', function() { console.log('I have a cat'); });

// route some paths ...
router.route('/cat'); // outputs 'I have a cat'
router.route('/dog'); // outputs 'I have a dog'

// attempt to route paths that don't match either route ...
router.route('/bulldog'); // outputs nothing
router.route('/dog/bulldog'); // outputs nothing
```

<br>
<br>

####Example: Route Parameters
```javascript
// add some more routes that use ':' to denote parameters ...
router.add('/dog/:color', function(event) {
    console.log('I have a ' + event.arguments.color + ' dog'); });
router.add('/cat/:color', function(event) {
    console.log('I have a ' + event.arguments.color + ' cat'); });
router.add('/:pet/homework', function(event) {
    console.log('My ' + event.arguments.pet + ' ate my homework'); })

// route some more paths that match the added routes ...
router.route('/dog/brown'); // outputs 'I have a brown dog'
router.route('cat/white'); // outputs 'I have a white cat'
router.route('/fish/homework'); // outputs 'My fish at my homework'
router.route('/dog/homework');  // outputs 'I have a homework dog'
                                // this is routed by the dog color route and not
                                // the homework route only because the dog color
                                // route was added before the homework route
```

<br>
<br>

####Example: Route Wildcard Parameters
```javascript
// add a route with a wildcard parameter denoted by a '*' at the end ...
router.add('/calico/:pet/:colors*', function(event) {
        console.log('I have a ' +
            event.arguments.colors.join(',') + ' ' + event.arguments.pet);
    });

// the wildcard parameter matches anything at the end of the path
// and translates the argument to an array of subpaths ...
router.route('/calico/cat/white/orange/gray'); // outputs
                                               // 'I have a white,orange,gray cat'
```

<br>
<br>

####Example: Parameter Constraints
```javascript
// add a route with parameter constraints ...
router.add('/dogs/:count/:breed', // count must be more than 0
    {'constraints': function(args) { return parseInt(args.count) > 0; }},
    function(event) {
        console.log('I have ' +
            event.arguments.count + ' ' + event.arguments.breed + 's');
    });

router.route('/dogs/0/poodle'); // outputs nothing because the count is invalid
router.route('/dogs/2/poodle'); // outputs 'I have 2 poodles'

// a route's parameter constraints may be defined per parameter
// as either a function, regular expression or an array of valid strings ...
router.add('cats/:count/:breed',
    {'constraints': {'count': /(two|three)/, 'breed': ['persian', 'siamese']}},
    function(event) {
        console.log('I have ' +
            event.arguments.count + ' ' + event.arguments.breed + ' cats');
    });

router.route('/cats/four/siamese'); // outputs nothing because the count is invalid
router.route('/cats/two/maltese'); // outputs nothing because the breed is invalid
router.route('/cats/two/persian'); // outputs 'I have two persian cats'
```

<br>
<br>

####Example: HTTP Method-Specific Routing
```javascript
// add routes that apply to only certain HTTP methods ...
router.add('/fish', {'method': 'GET'},
    function() { console.log('I have a fish'); });
router.add('/bird', {'method': ['GET', 'POST']},
    function() { console.log('I have a bird'); });

// alternatively routes can be applied for an HTTP method like so ...
router.add.get('/turtle', function() { console.log('I have a turtle'); });
router.add.post('/rabbit', function() { console.log('I have a rabbit'); });

// route paths with a corresponding HTTP method specified ...
router.route('/fish', {'method': 'GET'}); // outputs 'I have a fish'
router.route('/fish', {'method': 'POST'}); // outputs nothing
router.route('/bird', {'method': 'GET'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'POST'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'DELETE'}); // outputs nothing

// alternatively a path may be routed for an HTTP method like so ...
router.route.get('/fish'); // outputs 'I have a fish'
router.route.post('/bird'); // outputs 'I have a bird'

// HTTP method-specific routes are still applicable when no method is specified ...
router.route('/fish'); // outputs 'I have a fish'
router.route('/bird'); // outputs 'I have a bird'
```

<br>
<br>

####Example: Reverse Routing
```javascript
// add a route and give it a name for future reference ...
router.add('/:pet/mixed/:breeds*', {'name': 'mixed breed'}, function(event) {
        console.log('I have a mixed breed ' + event.arguments.pet +
            ' that is a ' + event.arguments.breeds.join(','));
    });

// alternatively the route's name can pe passed as the first argument like so...
router.add('pure breed', '/:pet/pure/:breed', function(event) {
        console.log('I have a pure breed ' + event.arguments.pet +
            ' that is a ' + event.arguments.breed);
    });

// generate a path using a route ...
var pathname = router.path('mixed breed', // use the route named 'mixed breed'
    {'pet': 'dog', 'breeds': ['beagle', 'pug', 'terrier']}); // parameter arguments

console.log(pathname); // outputs '/dog/mixed/beagle/pug/terrier'
```

<br>
<br>

####Example: Events
```javascript
// know when a route routes a path by listening to the route's 'route' event ...
var route = router.add('/hamster/:color', {'name': 'hamster'});
route.on('route', function(event) {
    console.log('I have a ' + event.arguments.color + ' ' + this.name); });

router.route('/hamster/brown'); // outputs 'I have a brown hamster'

// know when the router is unable to find a matching route to route a path
// by listening to the router's 'fail' event ...
router.once('fail', function(event) {
    console.log('What is a ' + event.pathname.replace('/', '-') + '?'); });

router.route('guinea/pig'); // outputs 'What is a guinea-pig?'

// alternatively, know when the router successfully routes any path by listening
// to the router's 'success' event ...
router.once('success', function(event) {
    console.log('My ' + event.route.name + ' is ' + event.arguments.color); });

router.route('/hamster/yellow'); // outputs 'I have a yellow hamster'
                                 // outputs 'My hamster is yellow'

// additionally when routing a path, arbitrary data can be attached by setting the
// data object which then will be accessible by any of the triggered listeners ...
router.add('mouse', '/mouse/:color', function(event) {
    console.log(event.data + ' has a ' + event.arguments.color + ' mouse'); });
router.route('/mouse/white', {'data': 'John'}); // outputs 'John has a white mouse'
```

<br>
<br>

####Example: URL Encoding
```javascript
// by default, routes should be defined without any URL encoding...
router.add('/pet name/:name', {'constraints': {'name': ['Pete', 'Mary Jo', 'Al']}},
    function(event) { console.log("My pet's name is " + event.arguments.name); });

// when routing a path, the path should be in its original URL encoded form ...
router.route('/pet%20name/Pete'); // outputs "My pet's name is Pete"

// route arguments are URL decoded ...
router.route('/pet%20name/Mary%20Jo'); // outputs "My pet's name is Mary Jo"

// in some cases, a route may need to be defined with URL encoding ...
router.add('/%3adogs%2fcats/:actions*', // 1st subpath is ':dogs/cats' URL encoded
    {'encoded': true}, // indicate that the route is URL encoded
    function(event) {
        console.log('Dogs and cats ' +
            event.arguments.actions.join(' and '));
    });

router.route('/%3Adogs%2Fcats/run/jump'); // outputs 'Dogs and cats run and jump'

// when generating a path from a route, any passed route parameter arguments
// shouldn't contain URL encoding ...
router.add('/pet toys/:pet/:toys*', {'name': 'toys'});
pathname = router.path('toys',
    {'pet': 'bengal cat', 'toys': ['ball of yarn', 'catnip']});
// the generated path is URL encoded ...
console.log(pathname); // ouputs '/pet%20toys/bengal%20cat/ball%20of%20yarn/catnip'
```

<br>
<br>

####Example: Using with an HTTP Server
```javascript

```