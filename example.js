
/*************************
 * Setting Up the Router *
 *************************/                            console.log("Setting Up the Router\n---------------------");

// require the router module
var orouter = require('./origin-router.js');

// instantiate a new router
var router = new orouter.Router();


/*********************
 * Routing URL Paths *
 *********************/                                console.log("\nRouting URL Paths\n-----------------");

// add routes to the router with corresponding callbacks ...
router.add('/dog', function() { console.log('I have a dog'); });
router.add('/cat', function() { console.log('I have a cat'); });

// route a couple of URL paths ...
router.route('/cat'); // outputs 'I have a cat'
router.route('/dog'); // outputs 'I have a dog'

// attempt to route URL paths that don't match either of the routes ...
router.route('/bulldog');     // outputs nothing
router.route('/dog/bulldog'); // outputs nothing


/**************************
 * Routes with Parameters *
 **************************/                           console.log("\nRoutes with Parameters\n----------------------");

// add a few routes that use ':' to denote parameters ...
router.add('/dog/:color', function(event) {
    console.log('I have a ' + event.arguments.color + ' dog'); });
router.add('/cat/:color', function(event) {
    console.log('I have a ' + event.arguments.color + ' cat'); });
router.add('/:pet/homework', function(event) {
    console.log('My ' + event.arguments.pet + ' ate my homework'); })

// route some URL paths that match the added routes with parameters ...
router.route('/dog/brown'); // outputs 'I have a brown dog'
router.route('cat/white');  // outputs 'I have a white cat'
router.route('/fish/homework'); // outputs 'My fish ate my homework'
router.route('/dog/homework');  // outputs 'I have a homework dog'
                                // this is routed by the 'dog color' route and not
                                // the 'homework' route because the 'dog color'
                                // route was added before the 'homework' route


/***********************************
 * Routes with Wildcard Parameters *
 ***********************************/                  console.log("\nRoutes with Wildcard Parameters\n-------------------------------");

// add a route with a wildcard parameter denoted by a '*' at the end ...
router.add('/calico/:pet/:colors*', function(event) {
        console.log('I have a ' +
            event.arguments.colors.join(',') + ' ' + event.arguments.pet);
    });

// the wildcard parameter matches anything at the end of the URL path
// and translates the argument to an array of subpaths ...
router.route('/calico/cat/white/orange/gray'); // outputs
                                               // 'I have a white,orange,gray cat'


/********************************************
 * Applying Constraints to Route Parameters *
 ********************************************/         console.log("\nApplying Constraints to Route Parameters\n----------------------------------------");

// add a route with parameters and corresponding inline regex constraints ...
router.add('/fish/:count<^[0-9]+$>/:colors*<^[a-z]+$>', // total must be numeric
    function(event) {                                   // colors must be lower case
        console.log('I have ' + event.arguments.count +
            ' ' + event.arguments.colors.join(' and ') + ' fish');
    });

router.route('/fish/12/blue/red');     // outputs 'I have 12 blue and red fish'
router.route('/fish/twelve/blue/RED'); // outputs nothing because
                                       // the count is not numeric and
                                       // one of the colors is upper cased

// add a route with parameters and a corresponding constraints function ...
router.add('/dogs/:count/:breed', // count must be more than 0 to match
    {'constraints': function(args) { return parseInt(args.count) > 0; }},
    function(event) {
        console.log('I have ' +
            event.arguments.count + ' ' + event.arguments.breed + 's');
    });

router.route('/dogs/0/poodle'); // outputs nothing because the count is invalid
                                // according to the route's parameter constraints
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
router.route('/cats/two/maltese');  // outputs nothing because the breed is invalid
router.route('/cats/two/persian');  // outputs 'I have two persian cats'


/*****************************
 * Handling Trailing Slashes *
 *****************************/                        console.log("\nHandling Trailing Slashes\n-------------------------");

// add a route to the router that won't match URL paths with a trailing '/' ...
router.add('/lizard/:color', function(event) {
    console.log('I have a ' + event.arguments.color + ' lizard'); });

router.route('/lizard/green');  // outputs 'I have a green lizard';
router.route('/lizard/green/'); // outputs nothing

// add a route to the router that will only match URL paths with a trailing '/' ...
router.add('/snake/:colors*/', function(event) {
    console.log('I have a ' + event.arguments.colors.join(', ') + ' snake'); });

router.route('/snake/yellow/green');  // outputs nothing
router.route('/snake/yellow/green/'); // outputs 'I have a yellow, green snake';

// add a route that will match URL paths with or without a trailing '/' ...
router.add('/iguana/?', function(event) {
    console.log('I have an iguana'); });

router.route('/iguana');  // outputs 'I have an iguana';
router.route('/iguana/'); // outputs 'I have an iguana';


/********************************
 * HTTP Method-Specific Routing *
 ********************************/                     console.log("\nHTTP Method-Specific Routing\n----------------------------");

// add a couple of routes that apply to only certain HTTP methods ...
router.add('/fish', {'method': 'GET'},
    function() { console.log('I have a fish'); });
router.add('/bird', {'method': ['GET', 'POST']},
    function() { console.log('I have a bird'); });

// alternatively routes can be applied for an HTTP method like so ...
router.addGet('/turtle', function() { console.log('I have a turtle'); });
router.addPost('/rabbit', function() { console.log('I have a rabbit'); });

// route URL paths with a corresponding HTTP method specified ...
router.route('/fish', {'method': 'GET'});    // outputs 'I have a fish'
router.route('/fish', {'method': 'POST'});   // outputs nothing
router.route('/bird', {'method': 'GET'});    // outputs 'I have a bird'
router.route('/bird', {'method': 'POST'});   // outputs 'I have a bird'
router.route('/bird', {'method': 'DELETE'}); // outputs nothing

// alternatively a URL path may be routed for an HTTP method like so ...
router.routeGet('/fish');  // outputs 'I have a fish'
router.routePost('/bird'); // outputs 'I have a bird'

// HTTP method-specific routes are still applicable when no method is specified ...
router.route('/fish'); // outputs 'I have a fish'
router.route('/bird'); // outputs 'I have a bird'


/*************************************
 * Generating URL Paths using Routes *
 *************************************/                console.log("\nGenerating URL Paths using Routes\n---------------------------------");

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


/*******************************************
 * Generating URL Paths on the Client-Side *
 *******************************************/          console.log("\nGenerating URL Paths on the Client-Side\n---------------------------------------");

// add a route and give it a name for future reference ...
router.add('/:pet/age/:years', {'name': "my pet's age"}, function(event) {
        console.log('I have a ' + event.arguments.years + ' year old ' +
            event.arguments.pet);
    });

// get the source code for the function to generate a URL path using
// the route named "my pet's age" ...
var pathSourceCode = router.pathSourceCode("my pet's age");

// compile the source code into a function using eval for the sake of example,
// typically the source code would not be eval'd but rather included into a
// script or <script> tag that is then sent to and compiled by the client ...
var pathFunction;
eval('pathFunction = ' + pathSourceCode);

// generate a URL by running the compiled function and passing any
// route parameter arguments ...
console.log(pathFunction({'pet': 'cat', 'years': 2})); // outputs /cat/age/2


/******************************
 * Working with Route Objects *
 ******************************/                       console.log("\nWorking with Route Objects\n--------------------------");

// a route can be instantiated directly ...
var route = new orouter.Route('/:pet/trick/:tricks*',
    {'name': 'tricks', 'method': 'GET'});

// the route instance can then be used to generate a URL path
// without being added to a router ...
var pathname = route.path({'pet': 'dog', 'tricks': ['sit', 'roll']});

console.log(pathname); // outputs '/dog/trick/sit/roll'

// the route can also be added to any router(s) ...
router.add(route, function(event) {
        console.log('My ' + event.arguments.pet + "'s best " + event.route.name +
            ' are ' + event.arguments.tricks.join(' and '));
    });

router.routeGet(pathname); // outputs "My dog's best tricks are sit and roll"


/************************************
 * Router and Route Events and Data *
 ************************************/                 console.log("\nRouter and Route Events and Data\n--------------------------------");

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


/**********************
 * About URL Encoding *
 **********************/                               console.log("\nAbout URL Encoding\n------------------");

// by default, routes should be defined without any URL encodings ...
router.add('/pet name/:name', {'constraints': {'name': ['Pete', 'Mary Jo', 'Al']}},
    function(event) { console.log("My pet's name is " + event.arguments.name); });

// when routing a URL path, the path should be in its original URL encoded form ...
router.route('/pet%20name/Pete'); // outputs "My pet's name is Pete"

// route parameter arguments are URL decoded upon matching ...
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


/**********************************
 * Mapping URL Paths to Filepaths *
 **********************************/                   console.log("\nMapping URL Paths to Filepaths\n------------------------------");

var basejoin = orouter.basejoin; // 'basejoin' utility function

// add a route that will map a portion of the URL path into a filepath referring
// to a file on the filesystem ...
router.add('/pics/:pet/:breed/:dir*', function(event) {
        // join the route parameter arguments with a base filepath using the
        // 'basejoin' utility function to safely form a filepath restricted to
        // be within the base filepath on the file system ...
        var filepath = basejoin('../images', // base filepath
            event.arguments.pet,
                'breeds/small',
                    event.arguments.breed,
                        event.arguments.dir);

        console.log(filepath);
    });

router.route('pics/dog/pug/brown/image.gif');
// outputs '../images/dog/breeds/small/pug/brown/image.gif'

router.route('/pics/dog/malicious/../../../../../../../../../etc/private.conf');
// outputs '../images/etc/private.conf'


/*****************************
 * Using with an HTTP Server *
 *****************************/                        console.log("\nUsing with an HTTP Server\n-------------------------");

var http = require('http');

// instantiate a new router ...
var router = new orouter.Router();

// create the server on port 3000 ...
var server = http.createServer(function(request, response) {
    // pass all HTTP requests and corresponding response objects to the router ...
    router.route(request, response);
}).listen(3000);

// add a route to show all users ...
router.add('all users', '/users/all', function(event) {
    var response = event.response; // passed HTTP response object

    // build the HTTP response ...

    var entry1 = {'username': 'John Doe', 'pet': 'cat', 'color': 'brown'};
    var entry2 = {'username': 'Jane Doe', 'pet': 'dog', 'color': 'white'};
    var entry3 = {'username': 'Joe No Show'};

    response.writeHead(200, {'Content-Type': 'text/html'});

    // list users with links to each user's information on an HTML page ...
    response.write(['<html><head></head><body>',
            '<h3>Users:</h3>',

            // generate URL path to link to the 'user' route for entry1 ...
            '<a href="' + router.path('user', entry1) + '">',
                entry1.username,
            '</a><br />',

            // generate URL path to link to the 'user' route for entry2 ...
            '<a href="' + router.path('user', entry2) + '">',
                entry2.username,
            '</a><br />',

            // no matching route for the following link ...
            '<a href="/user/inactive">',
                '<strike>' + entry3.username + '<strike>',
            '</a><br />',
        '</body></html>'].join('\n'));
    response.end();
});

// add another route to show information about a user's pet ...
router.add('user', '/user/:username/:pet/:color', function(event) {
    var response = event.response; // passed HTTP response object

    // create the response ...

    response.writeHead(200, {'Content-Type': 'text/html'});

    // show a user's information on an HTML page ...
    response.write(['<html><head></head><body>',
            // use a few of the route parameter arguments to show as info ...
            '<h4>User: ' + event.arguments.username + '</h4>',
            event.arguments.username + ' has a ' +
                event.arguments.color + ' ' + event.arguments.pet,
        '</body></html>'].join('\n'));
    response.end();
});

// add a homepage route that will redirect to the show all users page ...
router.add('/?', function(event) {
    var response = event.response; // passed HTTP response object

    // create the response ...

    // generate URL path to redirect to the 'all users' route ...
    response.writeHead(302, {'Location': router.path('all users')});
    response.end();
});

// catch any requests that do not match a route and show a 404 message ...
router.on('fail', function(event) {
    var request = event.request,   // passed HTTP request object
        response = event.response; // passed HTTP response object

    // create the response ...

    response.writeHead(404, {'Content-Type': 'text/html'});

    // show a not found message on an HTML page ...
    response.write(['<html><head></head><body>',
            '<h4 style="color: red">',
                'Sorry, a page for ' + request.url + " wasn't found",
            '</h4>',
        '</body></html>'].join('\n'));
    response.end();
});

console.log('Browse to http://localhost:3000');

