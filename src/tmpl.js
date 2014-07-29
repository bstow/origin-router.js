var assert = require('assert');

// template
var Template = function() {
    this.templates = {};
    this.templates.by = {'name': {}, 'template': {}};
};

// define and compile template
Template.prototype.define = function(name, template) {
    with (this.templates) {
        if (name != undefined && name in by.name) { // duplicate name
            throw new Error(
                "Couldn't define template '" + name + "' because another template named '" + name + "' already exists"
            );
        }
    
        var func;
        if (template in by.template) { func = by.template[template]; } // use previously cached compiled template
        else { func = by.template[template] = compile(template); } // compile and cache a new template

        if (name != undefined) { by.name[name] = func; }
    }
};

// get function for defined template by name or compile dynamic template
Template.prototype.template = function(descriptor) {
    with (this.templates) {
        if (descriptor in by.name) { // descriptor is a name 
            return by.name[descriptor]; // defined template by name
        } else if (descriptor.indexOf('<%') === -1) { // descriptor is not a template
            throw new Error("No template named '" + name + "' exists");
        } else { // descriptor is a dynamic template
            var func;
            if (descriptor in by.template) { func = by.template[descriptor]; } // use previously cached compiled template
            else { func = by.template[descriptor] = compile(descriptor); } // compile and cache a new template
            return func;
        }
    }
};

// compile template into function
var compile = function(template) {
    return build(parse(template));
};

// parse template into parts
var parse = function(template) {
    var parts = [];

    var index = 0;
    var length = template.length;
    while (index < length) {
        var start = template.indexOf('<%', index); // find next '<%'
        
        if (start === -1) { // no add'l code found
            parts.push({'string': template.substring(index)}); // add remaining string
            break; // done
        } else if (start > index) { // string found before code
            parts.push({'string': template.substring(index, start)}); // add string 
        } 

        index = start + 2; // move past '<%'

        var end = template.indexOf('%>', index); // find next '%>'
        if (end === -1) { throw new Error("Template is missing a '%>'"); } // unended code

        if (index !== end) { // add code
            code = template.substring(index, end);

            var output = code.charAt(0) === '=' ? true : false; // is code output? ('<%=')
            if (output) { code = code.substr(1); } // remove '='

            parts.push({'code': code, 'output': output});
        }
        index = end + 2; // move past '%>'
    }

    return parts;
};

// build function from parts
var build = function(parts) {
    var code = '';

    code += 'with (arguments[0] || {}) {\n  var ___ = [];\n';

    parts.forEach(function(part, index, parts) { 
        if (part.string != undefined) { // string
            code += (
                '  ___.push(\n' + 
                '    "' + part.string.split('"').join('\\"').split('\n').join('\\n" +\n' + '    "') + '"\n' + 
                '  );\n'
            ); 
        } else if (part.code != undefined) { // code
            if (part.output) { // code output
                code += (
                    '  ___.push\n' + 
                    '    ( ' + part.code.trim() + ' );\n'
                ); 
            } else { 
                code += ( // code
                    '  ' + part.code.trim()
                ); 

                // end code statement
                var last = code.charAt(code.length - 1);
                code += (last != ';' && last != '{' && last != '}') ? ';\n' : '\n';
            } 
        }
    });

    code += 'return ___.join("");\n}';

    return new Function(code);
};

module.exports.Template = Template;

// tests

var tmpl = new Template(); // test template

// define templates
tmpl.define('template number', "t<%=\"emp\"%><%=\n'_l'.substring(1)\n%>ate<%if(this.space){%> <%}%><%=number%>");

// define template containing code with bad syntax
assert.throws(function() { tmpl.define('bad syntax', 'bad syntax <% a?b %>'); }, SyntaxError);

// define duplicate template name
tmpl.define('duplicate template', 'duplicate <%= template1 %>'); 
assert.throws(function() { tmpl.define('duplicate template', 'duplicate <%= template2 %>'); }, /duplicate[\s]template/,
    'Defining a template with a duplicate name did not fail as expected');

var result;

// compiled template
result = tmpl.template('template number');
assert.strictEqual(result.call({'space': true}, {'number': 1}), 'template 1', 'The template output did not match the expected value');
assert.strictEqual(result.call({'space': false}, {'number': 2}), 'template2', 'The template output did not match the expected value');
assert.throws(function() { result.call({'space': false}, {'missing number': 1}); }, /number/, 
    'The template with missing arguments did not fail as expected');

// dynamic template
result = tmpl.template("t<%=\"emp\"%><%=\n'_l'.substring(1)\n%>ate<%if(this.space){%> <%}%><%=number%>");
assert.strictEqual(result.call({'space': true}, {'number': 3}), 'template 3', 'The template output did not match the expected value');
result = tmpl.template("dynamic t<%=\"emp\"%><%=\n'_l'.substring(1)\n%>ate<%if(this.space){%> <%}%><%=number%>");
assert.strictEqual(result.call({'space': true}, {'number': 1}), 'dynamic template 1', 'The template output did not match the expected value');
assert.throws(function() { tmpl.template('bad syntax <% a?b %>'); }, SyntaxError);