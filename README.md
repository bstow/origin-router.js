
####Setup
```javascript
var router = new Router();
```


####Routing
```javascript
// add routes to the router with corresponding callbacks ...
router.add('/dog', function() { console.log('I have a dog'); });
router.add('/cat', function() { console.log('I have a cat'); });

// route some paths ...
router.route('/cat'); // outputs 'I have a cat'
router.route('/dog'); // outputs 'I have a dog'
router.route('/dog/'); // outputs 'I have a dog'

// attempt to route paths that don't match either route ...
router.route('/bulldog'); // outputs nothing
router.route('/dog/bulldog'); // outputs nothing
```


####Route Parameters
```javascript
// add more routes using ':' to denote parameters ...
router.add('/dog/:color',
    function(args) { console.log('I have a ' + args.color + ' colored dog'); });
router.add('/cat/:color',
    function(args) { console.log('I have a ' + args.color + ' colored cat'); });
router.add('/:pet/homework',
    function(args) { console.log('My ' + args.pet + ' ate my homework'); })

// route some more paths that match the added routes ...
router.route('/dog/brown'); // outputs 'I have a brown colored dog'
router.route('cat/white'); // outputs 'I have a white colored cat'
router.route('/fish/homework'); // outputs 'My fish at my homework'
router.route('/dog/homework');  // outputs 'I have a homework colored dog'
                                // this is routed by the dog route and not
                                // the homework route because the dog route
                                // was added before the homework route
```


####Route Wildcard Parameters
```javascript
// add a route with a wildcard parameter denoted by a '*' at the end ...
router.add('/calico/:pet/:colors*',
    function(args) { console.log('I have a ' + args.colors + ' ' + args.pet); });

// the wildcard parameter matches anything at the end of the path ...
router.route('/calico/cat/white/orange/gray'); // outputs
                                               // 'I have a white/orange/gray cat'
```


####Parameter Constraints
```javascript
// add a route with parameter constraints ...
router.add('/dogs/:count/:breed', // count must be more than 0
    {'constraints': function(args) { return parseInt(args.count) > 0; },
    function(args) {
        console.log('I have ' + args.count + ' ' + args.breed + 's'); });

router.route('/dogs/0/poodle'); // outputs nothing because the count is invalid
router.route('/dogs/2/poodles'); // outputs 'I have 2 poodles'

// a route's parameter constraints may be defined per parameter
// as either a regular expression or an array of valid strings ...
router.add('cats/:count/:breed'
    {'constraints': 'count': /(two|three)/, 'breed': ['persian', 'siamese']},
    function(args) {
        console.log('I have ' + args.count + ' ' + args.breed + ' cats'); });

router.route('/cats/four/siamese'); // outputs nothing because the count is invalid
router.route('/cats/two/bengal'); // outputs nothing because the breed is invalid
router.route('/cats/two/persian'); // outputs 'I have two persian cats'
```


####HTTP Method-Specific Routing
```javascript
// add routes for only certain HTTP methods ...
router.add('/fish', {'method': 'GET'},
    function() { console.log('I have a fish'); });
router.add('/bird', {'method': ['GET', 'POST']},
    function() { console.log('I have a bird'); });

// alternatively routes can be added for an HTTP method like so ...
router.add.get('/turtle', function() { console.log('I have a turtle'); });
router.add.post('/rabbit', function() { console.log('I have a rabbit'); });

// route paths with a corresponding HTTP method specified ...
router.route('/fish', {'method': 'GET'}); // outputs 'I have a fish'
router.route('/fish', {'method': 'POST'}); // outputs nothing
router.route('/bird', {'method': 'GET'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'POST'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'DELETE'}); // outputs nothing

// HTTP method-specific routes are still applicable when no method is specified ...
router.route('/fish'); // outputs 'I have a fish'
router.route('/bird'); // outputs 'I have a bird'

// alternatively a path may be routed for an HTTP method like so ...
router.route.get('/fish'); // outputs 'I have a fish'
router.route.post('/bird'); // outputs 'I have a bird'
```


####Reverse Routing
```javascript
// add a route and give it a name for future reference ...
router.add('/:pet/mixed/:breeds*', {'name': 'mixed breed'},
    function(args) {
        console.log('I have a mix breed ' + args.pet + ' that is a ' + args.breeds);
    });

// alternatively the route's name can pe passed as the first argument like so...
router.add('pure breed', '/:pet/pure/:breed',
    function(args) {
        console.log('I have a pure breed ' + args.pet + ' that is a ' + args.breed);
    });

// generate a path using a route ...
var path = router.path('mixed breed', // use the route named 'mixed breed'
    {'pet': 'dog', 'breeds': 'beagle/pug/terrier'}); // route's parameter arguments

console.log(path); // outputs '/dog/mixed/beagle/pug/terrier'
```


####Events
```javascript
// know when a route routes a path by listening to the route's 'route' event ...
var route = router.add('hamster', '/hamster/:color');
route.on('route',
    function(args) { console.log('I have a ' + args.color + ' ' + this.name); });

router.route('/hamster/gray'); // outputs 'I have a gray hamster'

// know when the router is unable to find a matching route to route a path
// by listening to the router's 'fail' event ...
router.on('fail', function() { console.log('Sorry! Not found'); });

router.route('/guinea/pig'); // outputs 'Sorry! Not found'
```


####Using with a Server
```javascript

```

