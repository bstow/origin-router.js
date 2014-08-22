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


####Setup
```javascript
// require the router module
var orouter = require('./origin-router.js');

// instantiate a new router
var router = new orouter.Router();
```

####Routing
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

####Route Parameters
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

####Route Wildcard Parameters
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

####Parameter Constraints
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

####HTTP Method-Specific Routing
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

####Reverse Routing
```javascript
// add a route and give it a name for future reference ...
router.add('/:pet/mixed/:breeds*', {'name': 'mixed breed'}, function(event) {
        console.log('I have a mix breed ' + event.arguments.pet +
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

####Events
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

####URL Encoding
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

####Using with an HTTP Server
```javascript

```

