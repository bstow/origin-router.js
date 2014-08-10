
```javascript
var router = new Router();
```


```javascript
// add routes to the router ...

router.add('/dog', function() { console.log('I have a dog!'); });
router.add('/cat', function() { console.log('I have a cat!'); });

// route some paths ...

router.route('/cat'); // outputs 'I am a cat!'
router.route('/dog'); // outputs 'I am a dog!'
router.route('/poodle'); // outputs nothing
router.route('/dog/poodle'); // outputs nothing
```


```javascript
// add more routes using ':' to denote variables ...

router.add('/dog/:color', function(args) { console.log('I have a ' + args.color + ' colored dog!'); });
router.add('/cat/:color', function(args) { console.log('I have a ' + args.color + ' colored cat!'); });
router.add('/:pet/homework', function(args) { console.log('My ' + args.pet + ' ate my homework!'); })

// route some more paths ...

router.route('/dog/brown'); // outputs 'I have a brown colored dog!'
router.route('/cat/white'); // outputs 'I have a white colored cat!'
router.route('/fish/homework'); // outputs 'My fish at my homework!'
router.route('/dog/homework');  // outputs 'I have a homework colored dog!' 
                                // this is routed by the dog route and not the homework route 
                                // because the dog route was added before the homework route
```


```javascript
// add a route with a wildcardcard path variable denoted by a '*' at the end ...

router.add('/calico/:pet/:colors*', function(args) { console.log("I have a " + args.colors + ' ' + args.pet '!'); });

router.route('/calico/cat/white/orange/gray'); // outputs 'I have a white/orange/gray cat!'
```


```javascript
// add a named route ...

router.add('/:pet/mixed/:breeds*', {'name': 'mixed breed'}, 
    function(args) { console.log('I have a mixed breed ' + args.pet + ' that is part ' + args.breeds + '!'); });

// generate a path using the named route ...

var path = router.path('mixed breed',                   // path is '/dog/mixed/beagle/bulldog/boxer'           
    {'pet': 'dog', 'breeds': 'beagle/bulldog/boxer'});  // and matches the 'mixed breed' route

                                                                                          
router.route(path); // outputs 'I have a mixed breed dog that is part beagle/bulldog/boxer!'
```

