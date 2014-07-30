var http = require('http');
var fs = require('fs');
var path = require('path');
var route = require('./route.js');
var tmpl = require('./tmpl.js');
var url = require('url');
var util = require('util');

// app
var App = function() {
    var server = new http.Server(), router = new route.Router(), template = new tmpl.Template();

    this.start = function(port) { server.listen.apply(server, arguments); }; // start app
    this.stop = function() { server.close.apply(server, arguments); }; // stop app

    // define route
    this.route = function(name, route, callback) { 
        if (arguments.length < 3) { name = undefined; route = arguments[0]; callback = arguments[1]; } // route name omitted
        router.define(name, route, function(name, args) { return {'name': name, 'args': args, 'callback': callback}; });
    };

    // define template
    this.template = this.tmpl = function(name, tmpl) { template.define(name, tmpl); };

    // handle request
    server.on('request', function(request, response) {
        var c = {}; // context

        // http objects
        c.request = c.req = request;
        c.response = c.res = response;

        // url related
        c.url = url.parse(c.request.url); // parsed url
        c.route = undefined; // route info, initialized upon routing
        c.to = function(name, args) { return router.path.apply(router, arguments); }; // generate url path

        // response functions
        c.ok = function() { return ok.apply(c, arguments); }; // serve missing response
        c.missing = function() { return missing.apply(c, arguments); }; // serve missing response
        c.error = c.err = function(err) { return error.apply(c, arguments); }; // serve error response
        c.redirect = function(url) { return redirect.apply(c, arguments); } // serve redirect response
        c.file = function(path, type) { return file.apply(c, arguments); }; // serve file

        // template
        c.template = c.tmpl = function(descriptor, args) { return template.template(descriptor).call(c, args); }

        // route
        var route = router.route(c.url.pathname); // match route
        if (route == undefined || route.callback == undefined) { c.missing(); } // route not found
        else { 
            c.route = {'name': route.name, 'args': route.args}; // route info
            with (route) { callback.call(c); } // run route callback
        }
    });
};

// serve ok response
var ok = function(body, type) {
    this.response.writeHead(200, type != undefined ? {'Content-Type': type} : undefined);
    this.response.write(body);
    this.response.end();
};

// serve missing response 
var missing = function() {
    console.warn('404 Not Found - ' + this.request.url);

    this.response.writeHead(404, {'Content-Type': 'text/plain'});
    this.response.write('404 Not Found');
    this.response.end();
};

// serve error response
var error = function(err) {
    console.error('500 Internal Server Error - ' + this.request.url);
    if (err) { console.error(err.stack + '\n'); }

    this.response.writeHead(500, {'Content-Type': 'text/plain'});
    this.response.write('500 Internal Server Error');
    this.response.end();
};

// serve redirect response
var redirect = function(url) {
    this.response.writeHead(302, {'Content-Type': 'text/plain', 'Location': url});
    this.response.write('302 Found');
    this.response.end();
};

// serve file
var file = function(filepath, type) {
    var self = this;

    fs.readFile(filepath, 'binary', function(err, file) {
        if (err != undefined) { 
            if (err.code === 'ENOENT' || err.code === 'EISDIR') { self.missing(); }
            else { self.error(err); }
            return;
        }

        if (type == undefined) { // resolve content type
            var extension = path.extname(filepath).substring(1);
            type = types[extension.toLowerCase()];
        }
        
        self.response.writeHead(200, type != undefined ? {'Content-Type': type} : undefined);
        self.response.write(file, 'binary');
        self.response.end();
    });
};

// content types by file extension
var types = {
    'html': 'text/html',
    'js': 'application/javascript',
    'css': 'text/css',
    'gif': 'image/gif', 
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'png': 'image/png',
    'json': 'application/json',
    'xml': 'application/xml',
    'txt': 'text/plain'
};

module.exports.App = App;