
####Setup
```javascript
var router = new Router();
```


####Routing
```javascript
// add routes to the router ...
router.add('/dog', function() { console.log('I have a dog'); });
router.add('/cat', function() { console.log('I have a cat'); });

// route some paths ...
router.route('/cat'); // outputs 'I have a cat'
router.route('/dog'); // outputs 'I have a dog'
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

// route some more paths ...
router.route('/dog/brown'); // outputs 'I have a brown colored dog'
router.route('/cat/white'); // outputs 'I have a white colored cat'
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

router.route('/calico/cat/white/orange/gray'); // outputs
                                               // 'I have a white/orange/gray cat'
```


####Parameter Constraints
```javascript
// add a route with parameter constraints ...
router.add('/dogs/:count/:breed',
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
// add method-specific routes to the router ...
router.add('/fish', {'method': 'GET'},
    function() { console.log('I have a fish'); });
router.add('/bird', {'method': ['GET', 'POST']},
    function() { console.log('I have a bird'); });

// route method-specific paths ...
router.route('/fish', {'method': 'GET'}); // outputs 'I have a fish'
router.route('/fish', {'method': 'POST'}); // outputs nothing
router.route('/bird', {'method': 'GET'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'POST'}); // outputs 'I have a bird'
router.route('/bird', {'method': 'DELETE'}); // outputs nothing

router.route('/fish'); // outputs 'I have a fish'
router.route('/bird'); // outputs 'I have a bird'
```


####Reverse Routing
```javascript
// add a named route ...
router.add('/:pet/mixed/:breeds*',
    {'name': 'mixed breed'},
    function(args) {
        console.log('I have a mix breed ' + args.pet + ' that is a ' + args.breeds);
    });

// generate a path using the named route ...
var path = router.path('mixed breed', // path is '/dog/mixed/beagle/bulldog/boxer'
    {'pet': 'dog', 'breeds': 'beagle/bulldog/boxer'});

// generated path matches the 'mixed breed' route ...
router.route(path); // outputs
                    // 'I have a mix breed dog that is a beagle/bulldog/boxer'
```

