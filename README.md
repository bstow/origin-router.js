* [Examples of Using the Router](#examples)
    * [Example: Setting Up the Router](#example_setup)
    * [Example: Routing URL Paths](#example_routing)
    * [Example: Routes with Parameters](#example_parameters)
    * [Example: Routes with Wildcard Parameters](#example_wildcard_parameters)
    * [Example: Applying Constraints to Route Parameters](#example_parameter_constraints)
    * [Example: HTTP Method-Specific Routing](#example_http_methods)
    * [Example: Generating URL Paths using Routes](#example_reverse_routing)
    * [Example: Generating URL Paths on the Client-Side](#example_client_side_reverse_routing)
    * [Example: Working with Route Objects](#example_route_objects)
    * [Example: Router and Route Events and Data](#example_events)
    * [Example: About URL Encoding](#example_url_encoding)
    * [Example: Using with an HTTP Server](#example_http_server)

<br>

* [Router Documentation](#documentation)
    * [Class: Router](#Router)
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
        * [router.route(pathname, [options], [callback])](#router_route)
        * [router.routeGet(pathname, [options], [callback])](#router_routeGet)
        * [router.routePost(pathname, [options], [callback])](#router_routePost)
        * [router.routePut(pathname, [options], [callback])](#router_routePut)
        * [router.routeDelete(pathname, [options], [callback])](#router_routeDelete)
        * [router.routeHead(pathname, [options], [callback])](#router_routeHead)
        * [router.routeOptions(pathname, [options], [callback])](#router_routeOptions)
        * [router.routeTrace(pathname, [options], [callback])](#router_routeTrace)
        * [router.routeConnect(pathname, [options], [callback])](#router_routeConnect)
        * [router.path(name, [arguments])](#router_path)
        * [router.pathSourceCode(name)](#router_pathSourceCode)
        * [Event: 'add'](#router_add_event)
        * [Event: 'success'](#router_success_event)
        * [Event: 'fail'](#router_fail_event)
    * [Class: Route](#Route)
        * [new Route(expression, [options])](#new_Route)
        * [route.name](#route_name)
        * [route.method](#route_method)
        * [route.constraints](#route_constraints)
        * [route.encoded](#route_encoded)
        * [route.ignoreCase](#route_ignoreCase)
        * [route.path([arguments])](#route_path)
        * [route.pathSourceCode](#route_pathSourceCode)
        * [Event: 'route'](#route_route_event)
    

<br>
<br
<br>

##<a name='examples'>Examples of Using the Router

<br>
<br>

####<a name='example_setup'>Example: Setting Up the Router
```javascript
// require the router module
var orouter = require('./index.js');

// instantiate a new router
var router = new orouter.Router();
```

<br>
<br>

####<a name='example_routing'>Example: Routing URL Paths
```javascript
// add routes to the router with corresponding callbacks ...
router.add('/dog', function() { console.log('I have a dog'); });
router.add('/cat', function() { console.log('I have a cat'); });

// route some URL paths ...
router.route('/cat'); // outputs 'I have a cat'
router.route('/dog'); // outputs 'I have a dog'

// attempt to route URL paths that don't match either route ...
router.route('/bulldog'); // outputs nothing
router.route('/dog/bulldog'); // outputs nothing
```

<br>
<br>

####<a name='example_parameters'>Example: Routes with Parameters
```javascript
// add some more routes that use ':' to denote parameters ...
router.add('/dog/:color', function(event) {
    console.log('I have a ' + event.arguments.color + ' dog'); });
router.add('/cat/:color', function(event) {
    console.log('I have a ' + event.arguments.color + ' cat'); });
router.add('/:pet/homework', function(event) {
    console.log('My ' + event.arguments.pet + ' ate my homework'); })

// route some more URL paths that match the added routes ...
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

####<a name='example_wildcard_parameters'>Example: Routes with Wildcard Parameters
```javascript
// add a route with a wildcard parameter denoted by a '*' at the end ...
router.add('/calico/:pet/:colors*', function(event) {
        console.log('I have a ' +
            event.arguments.colors.join(',') + ' ' + event.arguments.pet);
    });

// the wildcard parameter matches anything at the end of the URL path
// and translates the argument to an array of subpaths ...
router.route('/calico/cat/white/orange/gray'); // outputs
                                               // 'I have a white,orange,gray cat'
```

<br>
<br>

####<a name='example_parameter_constraints'>Example: Applying Constraints to Route Parameters
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

####<a name='example_http_methods'>Example: HTTP Method-Specific Routing
```javascript
// add routes that apply to only certain HTTP methods ...
router.add('/fish', {'method': 'GET'},
    function() { console.log('I have a fish'); });
router.add('/bird', {'method': ['GET', 'POST']},
    function() { console.log('I have a bird'); });

// alternatively routes can be applied for an HTTP method like so ...
router.addGet('/turtle', function() { console.log('I have a turtle'); });
router.addPost('/rabbit', function() { console.log('I have a rabbit'); });

// route URL paths with a corresponding HTTP method specified ...
router.route('/fish', {'method': 'GET'}); // outputs 'I have a fish'
router.route('/fish', {'method': 'POST'}); // outputs nothing
router.route('/bird', {'method': 'GET'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'POST'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'DELETE'}); // outputs nothing

// alternatively a URL path may be routed for an HTTP method like so ...
router.routeGet('/fish'); // outputs 'I have a fish'
router.routePost('/bird'); // outputs 'I have a bird'

// HTTP method-specific routes are still applicable when no method is specified ...
router.route('/fish'); // outputs 'I have a fish'
router.route('/bird'); // outputs 'I have a bird'
```

<br>
<br>

####<a name='example_reverse_routing'>Example: Generating URL Paths using Routes
```javascript
// add a route and give it a name for future reference ...
router.add('/:pet/mixed/:breeds*', {'name': 'my mix breed'}, function(event) {
        console.log('I have a mixed breed ' + event.arguments.pet +
            ' that is a ' + event.arguments.breeds.join(','));
    });

// alternatively the route's name can pe passed as the first argument like so...
router.add('my pure breed', '/:pet/pure/:breed', function(event) {
        console.log('I have a pure breed ' + event.arguments.pet +
            ' that is a ' + event.arguments.breed);
    });

// generate a URL path using the route named 'my mix breed' ...
var pathname = router.path('my mix breed', // use the route named 'my mix breed'
    {'pet': 'dog', 'breeds': ['beagle', 'pug', 'terrier']}); // parameter arguments

console.log(pathname); // outputs '/dog/mixed/beagle/pug/terrier'
```

<br>
<br>

####<a name='example_client_side_reverse_routing'>Example: Generating URL Paths on the Client-Side
```javascript
// add a route and give it a name for future reference ...
router.add('/:pet/age/:years', {'name': "my pet's age"}, function(event) {
        console.log('I have a ' + event.arguments.years + ' year old ' +
            event.arguments.pet);
    });

// get the source code for the function to generate a URL path using
// the route named "my pet's age" ...
var pathSourceCode = router.pathSourceCode("my pet's age");

// compile the source code into a function using eval, although typically
// the source code would be included and compiled within a script sent to and
// processed by the client ...
var pathFunction;
eval('pathFunction = ' + pathSourceCode);

// generate a URL by running the compiled function and passing any
// route parameter arguments
console.log(pathFunction({'pet': 'cat', 'years': 2})); // outputs /cat/age/2
```

<br>
<br>

####<a name='example_route_objects'>Example: Working with Route Objects
```javascript
// a route can be instantiated directly ...
var route = new orouter.Route('/:pet/trick/:tricks*',
    {'name': 'tricks', 'method': 'GET'});

// the route instance can then be used to generate a URL path
// without being added to a router ...
var pathname = route.path({'pet': 'dog', 'tricks': ['sit', 'roll']});

console.log(pathname); // outputs '/dog/trick/sit/roll'

// the route can also be added to any router(s)
router.add(route, function(event) {
        console.log('My ' + event.arguments.pet + "'s best " + event.route.name +
            ' are ' + event.arguments.tricks.join(' and '));
    });

router.routeGet(pathname); // outputs "My dog's best tricks are sit and roll"
```

<br>
<br>

####<a name='example_events'>Example: Router and Route Events and Data
```javascript
// know when a route routes a URL path by listening to
// the route's 'route' event ...
var route = router.add('/hamster/:color', {'name': 'hamster'});
route.on('route', function(event) {
    console.log('I have a ' + event.arguments.color + ' ' + this.name); });

router.route('/hamster/brown'); // outputs 'I have a brown hamster'

// know when the router is unable to find a matching route to route a URL path
// by listening to the router's 'fail' event ...
router.once('fail', function(event) {
    console.log('What is a ' + event.pathname.replace('/', '-') + '?'); });

router.route('guinea/pig'); // outputs 'What is a guinea-pig?'

// alternatively, know when the router successfully routes any URL path by
// listening to the router's 'success' event ...
router.once('success', function(event) {
    console.log('My ' + event.route.name + ' is ' + event.arguments.color); });

router.route('/hamster/yellow'); // outputs 'I have a yellow hamster'
                                 // outputs 'My hamster is yellow'

// additionally when routing a URL path, arbitrary data can be attached
// by setting the data object which then will be accessible by any of the
// triggered listeners ...
router.add('mouse', '/mouse/:color', function(event) {
    console.log(event.data + ' has a ' + event.arguments.color + ' mouse'); });
router.route('/mouse/white', {'data': 'John'}); // outputs 'John has a white mouse'
```

<br>
<br>

####<a name='example_url_encoding'>Example: About URL Encoding
```javascript
// by default, routes should be defined without any URL encoding...
router.add('/pet name/:name', {'constraints': {'name': ['Pete', 'Mary Jo', 'Al']}},
    function(event) { console.log("My pet's name is " + event.arguments.name); });

// when routing a URL path, the path should be in its original URL encoded form ...
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

// when generating a URL path from a route, any passed route parameter arguments
// shouldn't contain URL encoding ...
router.add('/pet toys/:pet/:toys*', {'name': 'toys'});
pathname = router.path('toys',
    {'pet': 'bengal cat', 'toys': ['ball of yarn', 'catnip']});
// the generated URL path is URL encoded ...
console.log(pathname); // ouputs '/pet%20toys/bengal%20cat/ball%20of%20yarn/catnip'
```

<br>
<br>

####<a name='example_http_server'>Example: Using with an HTTP Server
```javascript

```

<br>
<br>
<br>

##<a name='documentation'>Router Documentation

<br>
<br>



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

Create a new `Router` instance. (See [Example: Setting Up the Router](#example_setup))

<br>
<br>

####<a name='router_add'></a>router.add([name], expression, [options], [callback])
Add a route to the router to serve in matching and routing URL paths.

<a name='router_add__name'></a>The route may optionally be assigned a unique name by passing the `name` `String` as the 1st argument.

<a name='router_add__expression'></a>The `expression` `String` defines if and how the route will match a URL path.  A simple example of a route expression is `'/my/path'` which will route any similar URL path such as `'/my/path'` or `'my/path/'` (route matching disregards leading and trailing `/` characters).

A route expression can match variable subpaths by specifying a route parameter denoted by a `:` character.  As an example, the route expression `'/my/:foo/path'` has a parameter `foo` and will route the URL paths `'/my/bar/path'` and `'/my/qux/path'`.  In each case, the `foo` parameter will respectively have an argument value of `'bar'` and '`qux`'.  Furthermore, a route wildcard parameter can be specified which will match multiple subpaths at the end of a URL path.  A route wildcard parameter must be specified at the end of the route expression with a `*` appended to the end of the parameter name. For example, the expression `'/my/:foo/:bar*'` has a wildcard parameter `bar` at the end and will match the URL path`'my/lorem/ipsum/dolor/sit/amet'`.  In this case, the `foo` parameter will have an argument value of `'lorem'` and the `bar` wildcard parameter will have an argument value of `['ipsum', 'dolor', 'sit', 'amet']` (wildcard parameter matches are split into an `Array` of subpaths). (See [Example: Routes with Parameters](#example_parameters) and [Example: Routes with Wildcard Parameters](#example_wildcard_parameters))

<a name='router_add__options'></a>The optional `options` `Object` can specify the following properties:

* <a name='router_add__options_name'></a>`name`: `String` the unique name to assign to the route (this is the same as specifying the name as the 1st argument)

* <a name='router_add__options_method'></a>`method`: `String | Array` the HTTP method that the added route should apply to, ex. `'GET'`.  To specify multiple HTTP methods, assign an `Array` of HTTP methods, ex. `['GET', 'POST']`.  By default, the added route will apply to all HTTP methods. (See [Example: HTTP Method-Specific Routing](#example_http_methods))

* <a name='router_add__options_constraints'></a>`constraints`: `Function | Object` the constraints to apply to any of the route's parameters during URL path matching.
  
  This option allows for rules to be set to restrict what one or more of the route parameters will match.  The most flexible way to set route parameter constraints is by setting the constraint option to a `Function`.  Upon the route initially matching a URL path, the constraints `Function` will be called and passed the route parameter arguments as an `Object` of URL decoded name value pairs for evaluation.  The constraints `Function` should return either `true`, indicating that the route parameter arguments are compliant, or `false`, indicating that the route parameters do **not** match the URL path and that the router should continue matching with other subsequent routes.  An example of a constraints `Function` is `function(args) { return args.foo === 'bar' || args.foo === 'qux'; }` where the route will only match a URL path when the `foo` route parameter argument value is either `'bar'` or `'qux'`.
  
  Alternatively, route parameter constraints can be set as an `Object` where the constraint for a route parameter is assigned to a property corresponding to the parameter's name.  Each constraint may be either a `RegExp`, an `Array` of matching `Strings`, or a `Function` that accepts the route parameter argument value as the 1st argument and returns `true` or `false` to indicate compliance.  An example of a constraints `Object` is `{'foo': /^[0-9]/, 'bar': ['asdf', 'qwerty'], 'qux': function(arg) { return arg.length > 10; }}`.  In this case, the route will only match a URL path when the `foo` route parameter argument value starts with a number, the `bar` route parameter argument value is either `'asdf'` or `'qwerty'`, and the `qux` route parameter argument value is longer than 10 characters. Moreover, when a `RegExp` or `Array` of `String`s route parameter constraint is applied to a parameter wildcard argument, each URL subpath of the argument value will be tested for compliance.
  
  (See [Example: Applying Constraints to Route Parameters](#example_parameter_constraints))

* <a name='router_add__options_encoded'></a>`encoded`: `Boolean` indicator that the route expression uses URL encoding within subpaths.  This is primarily useful in allowing a route expression to match special route expression characters such as `/` and `:`.  For example, in the case of defining a route that could route the URL path `'/foo%2Fbar'` (`%2F` is the URL encoding for `/`), the route expression of `'/foo/bar'` would be ineffective because the `/` character is interpreted as a subpath delineator.  In order to effectively match the URL path `'/foo%2Fbar'`, the encoded option should be set to `true`, and the route expression's subpath should be URL encoded accordingly, `'/foo%2fbar'`. By default, the encoded option is `false` indicating that the route expression is unencoded. (See [Example: About URL Encoding](#example_url_encoding))

* <a name='router_add__options_ignoreCase'></a>`ignoreCase`: `Boolean` if set to `true`, the route expression will match URL paths using case-insensitive comparison.  By default, route expression matching is case-sensitive.

<a name='router_add__callback'></a>A `callback` `Function` can be passed as the last argument.  If specified, the callback will be called every time a URL path is routed by the added route.  (This is the same as setting a ['route' event](#route_route_event) listener on the returned and newly added [Route](#Route) instance.) Upon the added route routing a URL path, the callback will be called and passed an `Object` with the following properties:
* <a name='router_add__callback_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
* <a name='router_add__callback_method'></a>`method`: `String | undefined` the HTTP method used. (See [Example: HTTP Method-Specific Routing](#example_http_methods))
* <a name='router_add__callback_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
* <a name='router_add__callback_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs. (See [Example: Routes with Parameters](#example_parameters))
* <a name='router_add__callback_data'></a>`data`: `* | undefined` any data passed upon routing. (See [Example: Router and Route Events and Data](#example_events))

Returns the created [Route](#Route) instance that has been newly added to the router. 

<br>

####<a name='router_add_alt'></a>router.add(route, [callback])
Add a [Route](#Route) instance to the router to serve in matching and routing URL paths.  (This is an alternative method call to [router.add([name], expression, [options], [callback])](#router_add) which instead allows for an already instantiated [Route](#Route) to be added to the router.)

<a name='router_add_alt__route'></a>The `route` `Route` is the [Route](#Route) instance to be added to the router and should be passed as the 1st argument. (See [Example: Working with Route Objects](#example_route_objects))

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

Aliases for [router.add](#router_add) that specify the HTTP method option (corresponding to the function name) that the added route should apply to. (See [Example: HTTP Method-Specific Routing](#example_http_methods))

<br>
<br>

####<a name='router_route'></a>router.route(pathname, [options], [callback])

Route a URL path using the routes added to the router.

<a name='router_route__pathname'></a>The `pathname` `String` should be passed as the 1st argument and be a URL encoded path. (See [url.URL](http://nodejs.org/api/url.html#url_url))

<a name='router_route__options'></a>The optional `options` `Object` can specify the following properties:

* <a name='router_route__options_method'></a>`method`: `String` the HTTP method to be used in routing the URL path. (See [Example: HTTP Method-Specific Routing](#example_http_methods))

* <a name='router_route__options_data'></a>`data`: `*` arbitrary data to be passed to any callbacks or listeners triggered during the routing process. (See [Example: Router and Route Events and Data](#example_events))

<a name='router_route__callback'></a>A `callback` `Function` can be passed as the last argument.  If specified, the callback will be called and passed an `Object` with the following properties upon the URL path being successfully routed:
* <a name='router_route__callback_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
* <a name='router_route__callback_method'></a>`method`: `String | undefined` the HTTP method used. (See [Example: HTTP Method-Specific Routing](#example_http_methods))
* <a name='router_route__callback_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
* <a name='router_route__callback_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs. (See [Example: Routes with Parameters](#example_parameters))
* <a name='router_route__callback_data'></a>`data`: `* | undefined` any data passed upon routing. (See [Example: Router and Route Events and Data](#example_events))

Returns the [Route](#Route) instance that routed the URL path or `undefined` if the URL path couldn't be routed.

<br>

####<a name='router_routeGet'></a>router.routeGet(pathname, [options], [callback])
####<a name='router_routePost'></a>router.routePost(pathname, [options], [callback])
####<a name='router_routePut'></a>router.routePut(pathname, [options], [callback])
####<a name='router_routeDelete'></a>router.routeDelete(pathname, [options], [callback])
####<a name='router_routeHead'></a>router.routeHead(pathname, [options], [callback])
####<a name='router_routeOptions'></a>router.routeOptions(pathname, [options], [callback])
####<a name='router_routeTrace'></a>router.routeTrace(pathname, [options], [callback])
####<a name='router_routeConnect'></a>router.routeConnect(pathname, [options], [callback])

Aliases for [router.route](#router_route) that specify the HTTP method option (corresponding to the function name) that should be used in routing the URL path. (See [Example: HTTP Method-Specific Routing](#example_http_methods))

<br>
<br>

####<a name='router_path'></a>router.path(name, [arguments])

Generate a URL path using one of the routes that has been added to the router. (See [Example: Generating URL Paths using Routes](#example_reverse_routing))

<a name='router_path__name'></a>The `name` `String` of the route to use to generate the URL path.  Consequently, only named routes can be used to generate URL paths.

<a name='router_path__arguments'></a>If the route being used to generate the URL path has parameters, specify the route parameter `arguments` `Object` as URL decoded name value pairs.  The route parameter arguments will be mapped to the route parameters and be embedded within the URL path.  (Note that the route parameter arguments passed must comply with the corresponding route constraints or otherwise an error will be thrown.)

Returns the the URL encoded pathname generated using the route specified. (See [url.URL](http://nodejs.org/api/url.html#url_url))

<br>
<br>

####<a name='router_pathSourceCode'></a>router.pathSourceCode(name)

Get the source code `String` for a `Function` that will generate a URL path using the route specified.  Upon compiling the source code, the `Function` may be called and optionally passed a route parameter arguments `Object` of URL decoded name value pairs as the 1st parameter to be mapped and embedded within the generated URL path.  (Note that the route parameter arguments are **not** validated for compliance against the corresponding route constraints.)
  
  This is primarily useful in allowing for a URL path to be dynamically generated on the client-side. (See [Example: Generating URL Paths on the Client-Side](#example_client_side_reverse_routing))

<a name='router_pathSourceCode__name'></a>The `name` `String` of the route to use to generate the source code `String` of the URL path generating `Function`.  Consequently, only named routes can be used with this feature.

Returns the source code `String` for a `Function` that will generate a URL path using the route specified.
  
<br>
<br>

####<a name='router_events'></a>Events

This is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

<br>

####<a name='router_add_event'></a>Event: 'add'

`function(event) {}`
* <a name='router_add_event__event'></a>`event`: `Object`
    * <a name='router_add_event__event_route'></a>`route`: `Route` the newly added [Route](#Route) instance

Emitted each time a new route is added to the router. (See [Example: Router and Route Events and Data](#example_events))

<br>

####<a name='router_success_event'></a>Event: 'success'

`function(event) {}`
* <a name='router_success_event__event'></a>`event`: `Object`
    * <a name='router_success_event__event_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * <a name='router_success_event__event_method'></a>`method`: `String | undefined` the HTTP method used
    * <a name='router_success_event__event_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
    * <a name='router_success_event__event_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs
    * <a name='router_success_event__event_data'></a>`data`: `* | undefined` any data passed upon routing

Emitted each time the router successfully routes a path. (See [Example: Router and Route Events and Data](#example_events))

<br>

####<a name='router_fail_event'></a>Event: 'fail'

`function(event) {}`
* <a name='router_fail_event__event'></a>`event`: `Object`
    * <a name='router_fail_event__event_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * <a name='router_fail_event__event_method'></a>`method`: `String | undefined` the HTTP method used
    * <a name='router_fail_event__event_data'></a>`data`: `* | undefined` any data passed upon routing

Emitted each time the router can't find any matching route to route a path. (See [Example: Router and Route Events and Data](#example_events))

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

* `Function | Object | undefined` get the constraints that are applied to any of the route's parameters during URL path matching. (See [router.add](#router_add) [[options.constraints](#router_add__options_constraints)])

<br>
<br>

####<a name='route_encoded'></a>route.encoded

* `Boolean` get indicator that the route expression uses URL encoding within subpaths

<br>
<br>

####<a name='route_ignoreCase'></a>route.ignoreCase

* `Boolean` get indicator of case-insensitive matching of URL paths by the route expression

<br>
<br>

####<a name='route_path'></a>route.path([arguments])

Generate a URL path using the route. (See [Example: Working with Route Objects](#example_route_objects))

<a name='route_path__arguments'></a>If the route has parameters, specify the route parameter `arguments` `Object` as URL decoded name value pairs.  The route parameter arguments will be mapped to the route parameters and be embedded within the URL path. (Note that the route parameter arguments passed must comply with the corresponding route constraints or otherwise an error will be thrown.)

Returns the the URL encoded pathname generated using the route. (See [url.URL](http://nodejs.org/api/url.html#url_url))

<br>
<br>

####<a name='route_pathSourceCode'></a>route.pathSourceCode

* `String` get the source code for a `Function` that will generate a URL path using the route.  Upon compiling the source code, the `Function` may be called and optionally passed a route parameter arguments `Object` of URL decoded name value pairs as the 1st parameter to be mapped and embedded within the generated URL path.  (Note that the route parameter arguments are **not** validated for compliance against the corresponding route constraints.)  
  
  This is primarily useful in allowing for a URL path to be dynamically generated on the client-side. (See [Example: Generating URL Paths on the Client-Side](#example_client_side_reverse_routing))

<br>
<br>

####<a name='route_events'></a>Events

This is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:

<br>

####<a name='route_route_event'></a>Event: 'route'

`function(event) {}`
* <a name='route_route_event__event'></a>`event`: `Object`
    * <a name='route_route_event__event_pathname'></a>`pathname`: `String` the URL encoded pathname used. (See [url.URL](http://nodejs.org/api/url.html#url_url))
    * <a name='route_route_event__event_method'></a>`method`: `String | undefined` the HTTP method used
    * <a name='route_route_event__event_route'></a>`route`: `Route` the [Route](#Route) instance that routed the URL path
    * <a name='route_route_event__event_arguments'></a>`arguments`: `Object` the route parameter arguments as URL decoded name value pairs
    * <a name='route_route_event__event_data'></a>`data`: `* | undefined` any data passed upon routing

Emitted each time the route successfully routes a path. (See [Example: Router and Route Events and Data](#example_events))


