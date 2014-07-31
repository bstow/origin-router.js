var assert = require('assert');
var fs = require('fs');

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
                "Couldn't define template '" + name + "' because another template named '" + name + "' was already defined"
            );
        }

        if (template.indexOf('<%') === -1 && template.indexOf('%>') === -1) { // template is a filepath
            try { template = fs.readFileSync(template, 'utf8'); } 
            catch (err) { // failed to read the template file
                var abridge = function() { // truncate to make errors caused by templates read as filepaths legible
                    var parts = template.trim().split('\n');
                    if (parts.length > 1) { return parts[0] + '...'; }
                    else { return parts[0] != undefined ? parts[0] : template; }
                };

                if (err.code === 'ENOENT') {
                    throw new Error(
                        "Couldn't define template '" + name + "' because the template filepath '" +
                        abridge() + "' doesn't exist"
                    );
                } else if (err.code === 'EISDIR') {
                    throw new Error(
                        "Couldn't define template '" + name + "' because the template filepath '" +
                        abridge() + "' is a directory not a file"
                    );
                } else { throw err; }
            }
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
            return by.name[descriptor]; // return defined template by name
        } else if (descriptor.indexOf('<%') === -1 && descriptor.indexOf('%>') === -1) { // descriptor is not a template
            throw new Error("No template named '" + name + "' exists");
        } else { // descriptor is a dynamic template
            var func;
            if (descriptor in by.template) { func = by.template[descriptor]; } // use previously cached compiled template
            else { func = by.template[descriptor] = compile(descriptor); } // compile and cache a new template
            return func; // return compiled template
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
    while (index < length) { // traverse template
        var start = template.indexOf('<%', index); // find next '<%'
        var end = template.indexOf('%>', index); // find next '%>'
        if (start !== -1 && end !== -1 && end < start) { // test for missing '<%'
            throw new Error("Template is missing a '<%'");
        }
        end = undefined;
        
        if (start === -1) { // no add'l code block found
            parts.push({'string': template.substring(index)}); // add remaining string literal
            break; // done
        } else if (start > index) { // string literal found before code block
            parts.push({'string': template.substring(index, start)}); // add string literal 
        } 

        index = start + 2; // move past '<%'

        // search for corresponding '%>'
        end = index;
        var depth = 1; // current depth of '<%' ... '%>' pairs
        while (true) {
            var substart = template.indexOf('<%', end);
            var subend = template.indexOf('%>', end);

            if (substart !== -1 && (subend === -1 || substart < subend)) { // found '<%' first
                depth++; // increment depth
                end = substart; // move to '<%' 
            } else if (subend !== -1 && (substart === -1 || subend < substart)) { // found '%>' first
                depth--; // decrement depth
                end = subend;  // move to '%>'
            } else { // found neither '<%' nor '%>'
                throw new Error("Template is missing a '%>'"); // missing corresponding'%>'
            }

            if (depth > 0) { end += 2; continue; } // move past '<%' or '%>' and continue search
            else { break; } // found corresponding '%>'
        }

        if (index !== end) { // add code
            code = template.substring(index, end);

            var output = code.charAt(0) === '=' ? true : false; // is code output block? ('<%=')
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
        if (part.string != undefined) { // string literal
            code += (
                '  ___.push(\n' + 
                '    "' + part.string.split('"').join('\\"').split('\n').join('\\n" +\n' + '    "') + '"\n' + 
                '  );\n'
            ); 
        } else if (part.code != undefined) { // code block
            if (part.output) { // code output block
                code += (
                    '  ___.push\n' + 
                    '    ( ' + part.code.trim() + ' );\n'
                ); 
            } else { // code block
                code += ( 
                    '  ' + part.code.trim()
                ); 

                // end code block statement
                var last = code.charAt(code.length - 1);
                code += (last != ';' && last != '{' && last != '}') ? ';\n' : '\n';
            } 
        }
    });

    code += 'return ___.join("");\n}';

    return new Function(code); // evaluate code and compile to function
};

module.exports.Template = Template; 

// tests

var tmpl = new Template(); // test template

// define templates
tmpl.define('template number', "t<%=\"emp\"%><%=\n'_l'.substring(1)\n%>ate<%if(this.space){%> <%}%><%=number%>");
tmpl.define('inner template', "in<%= this.template(\"<%=this.letters%>\").call({'letters': 'ner'}) %> <%=template%>");

// define invalid templates
assert.throws(function() { tmpl.define('bad syntax', 'bad syntax <% a?b %>'); }, SyntaxError,
    'The template with invalid syntax did not fail as expected');
assert.throws(function() { tmpl.define('no start', "no %> <%= 'start' %>"); }, /[<][%]/,
    'The template with invalid syntax did not fail as expected');
assert.throws(function() { tmpl.define('no inner start', "<%= 'no' %>%> <%= 'start' %>"); }, /[<][%]/,
    'The template with invalid syntax did not fail as expected');
assert.throws(function() { tmpl.define('no end', "<%= 'no' %> <%= end "); }, /[%][>]/,
    'The template with invalid syntax did not fail as expected');
assert.throws(function() { tmpl.define('no inner end', "<%= 'no' %> <%<%= 'end' %>"); }, /[%][>]/,
    'The template with invalid syntax did not fail as expected');

// define duplicate template name
tmpl.define('duplicate template', 'duplicate <%= template1 %>'); 
assert.throws(function() { tmpl.define('duplicate template', 'duplicate <%= template2 %>'); }, /duplicate[\s]template/,
    'Defining a template with a duplicate name did not fail as expected');

var result;

// compiled templates
result = tmpl.template('template number');
assert.strictEqual(result.call({'space': true}, {'number': 1}), 'template 1', 'The template output did not match the expected value');
assert.strictEqual(result.call({'space': false}, {'number': 2}), 'template2', 'The template output did not match the expected value');
assert.throws(function() { result.call({'space': false}, {'missing number': 1}); }, /number/, 
    'The template with missing arguments did not fail as expected');
result = tmpl.template('inner template');
assert.strictEqual(result.call(tmpl, {'template': 'template'}), 'inner template', 'The template output did not match the expected value');

// dynamic template
result = tmpl.template("t<%=\"emp\"%><%=\n'_l'.substring(1)\n%>ate<%if(this.space){%> <%}%><%=number%>");
assert.strictEqual(result.call({'space': true}, {'number': 3}), 'template 3', 'The template output did not match the expected value');
result = tmpl.template("dynamic t<%=\"emp\"%><%=\n'_l'.substring(1)\n%>ate<%if(this.space){%> <%}%><%=number%>");
assert.strictEqual(result.call({'space': true}, {'number': 1}), 'dynamic template 1', 'The template output did not match the expected value');
assert.throws(function() { tmpl.template('bad syntax <% a?b %>'); }, SyntaxError);