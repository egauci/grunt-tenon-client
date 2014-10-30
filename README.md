Tenon Tests
===========

This is an exploration of [TENON](http://tenon.io/) - a web accessiblity testing API - in
the form of a Grunt plugin (also a gulp plugin).

Tenon docs: https://bitbucket.org/tenon-io/tenon.io-documentation/

What's Here
-----------

The lib folder contains node modules.

1. *tenon.js* is the interface for the Tenon API.
2. *inliner.js* inlines LOCAL Javascript and CSS into the document

The src folder contains *index.js*, a CLI front-end to tenon.js.
It is not used for the Grunt plugin.
Type "node src/index --help" for instructions.

The Grunt plugin is in the tasks folder, named *grunt-tenon.js*.

The gulp plugin is in the root folder, named *gulp-tenon.js*.

Things to Note
--------------

The tenon module (in tenon.js)
receives a configuration object. This object can contain properties corresponding to
all the options documented in the Tenon API documentation (with one exception, see below).
In addition, it can also contain the
following properties:

- config -- Path to a JSON file with parameters to merge in. Default for this in both
index.js and the Grunt task is '.tenonrc' in the current working directory. This file would be
a convenient place to put the API URL and the API key.
- userid and password -- if both are present and the url starts with http, then these
are incorporated into the url passed to Tenon for basic auth: (use<span>rid:</span>password@domain.com/...)
- filter -- an array of tIDs to filter out of the results. Actually it leaves resultSet unmolested, but creates a
new array, resultSetFiltered, with these particular errors filtered out.
- cssUrlReplacer -- a function which receives a CSS URL as its parameter and returns a replacement.
See below for more on this.

The only Tenon API property that cannot be passed is *src*. The module requires the url property
and will populate src if it points to a local file.

If tenon.js determines that the given url is a local file (it doesn't start with "http") it will inline all
local Javascript and CSS. For example:

    <link rel="stylesheet" href="css/combo.css" media="screen">

will be converted to:

    <style media="screen">
      [[content of css/combo.css]]
    </style>

CSS files may have URLs  within, such as:

    background: url(../images/foo.png) no-repeat;
    background: url('../../images/bar.png');

Inlining would likely make these URLs incorrect. The cssUrlReplacer configuration item is a function
that receives the url portion (in the first example above, it would receive *"../images/foo.png"*). It
returns text to replace it. The configuration item is optional. It defaults to this:

    function(url) {
      return url.replace(/^(\.\.\/)*/, '');
    }

This default CSS URL replacer removes any number of "../" substrings from the beginning of the URL.

The inlined files must be relative to the HTML file. For example, if a javascript src attribute
in an html file at C:\project\index.html is "js/script.js" then the file should be at
C:\project\js\script.js.

Javascript and CSS references that start with "http" are not touched. Userid/password are ignored
for local files.

The basic assumption is that files loaded with HTTP are accessible to the Tenon server, but
local files are not.

The modules in the lib folder are fully async and would be usable in a server that has to support
multiple connections.

The Grunt Plugin
----------------

The Grunt plugin is a standard Grunt MultiTask. It can be configured in the normal multitask
way. In addition to the options described above, there are these specific to the plugin:

- snippet -- true or false (default false) to include errorSnippet in the console output.
- saveOutputIn -- an (optional) path to a file that will receive all the results from the Tenon API. Default is no file output.
- asyncLim -- the maximum number of files to test in parallel. Default is 1. Setting this to a higher
value seems to cause "status: 500" results intermittently. This may be an issue with the still beta Tenon API.

At this time the Grunt plugin only passes local files to Tenon (the url is always a local file). It's easy
to envision a scenario where this is not desired, but it is a current limitation.

Here is a sample Gruntfile.js configuration:

    tenon: {
      options: {
        filter: [31]
      },
      all: {
        options: {
          saveOutputIn: 'allHtml.json',
          snippet: true
        },
        src: [
          'dev/build/*html'
        ]
      },
      index: {
        src: [
          'dev/build/index.html'
        ]
      }
    }

The above defines two subtasks, *all* and *index*. The filter option is global and applies to both. The *all* subtask
has additional options, not shared with other subtasks.

The Gulp Plugin
---------------

I'm not a gulp user, at least not yet, and this is probably not a very good first attempt at a plugin.
Any feedback would be much appreciated.

The plugin can handle the same options as the Grunt plugin except asyncLim. I didn't come up with a reasonable
way to implement that with gulp. The gulp plugin always processes one HTML file at a time.

Here is a sample gulp task:

    var gulp = require('gulp'),
        gtenon = require('gulp-tenon')
    ;

    gulp.task('default', function() {
      gulp.src('dev/build/*html', {read: false})
      .pipe(gtenon({
        snippet: true,
        filter: [31],
        saveOutputIn: 'allHtml.json'
      }));
    });

License (ISC)
-------------
Copyright &copy; 2014, Ed Gauci

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
