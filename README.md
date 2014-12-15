Tenon Web Accessibility Testing Grunt Plugin
============================================

This is a Grunt plugin for [TENON](http://tenon.io/) - a web accessiblity testing API.

Tenon docs: http://tenon.io/documentation/

This Grunt Tenon plugin is [open and free](https://github.com/egauci/grunt-tenon-client/blob/master/LICENSE).
However, access to the Tenon API must be granted by [Tenon](http://tenon.io/).
You will need to obtain an API key to use it.

A similar gulp plugin that was part of this project has been moved to its own
repository: https://github.com/egauci/gulp-tenon-client.

Getting Started
---------------
This plugin requires Grunt ^0.4.5.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the
[Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to
create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use
Grunt plugins. Once you're familiar with that process, you may install this plugin
with this command:

    npm install grunt-tenon-client --save-dev

Once the plugin has been installed, it may be enabled inside your Gruntfile with this
line of JavaScript:

    grunt.loadNpmTasks('grunt-tenon-client');

Options
-------

The plugin allows passing through of any Tenon API parameters. See the
[Tenon Docs](http://tenon.io/documentation/) for details.

This plugin uses [tenon-api-client](https://github.com/egauci/tenon-api-client). The
API module has additional parameters you can include in the Grunt configuration, such as
"filter".

In addition to the API and client module options, there are these specific to the plugin:

- snippet -- true or false (default false) to include errorSnippet in the console output.
- saveOutputIn -- an (optional) path to a file that will receive all the results from the Tenon API. Default is no file output.
- asyncLim -- the maximum number of files to test in parallel. Default is 1.
- config -- path to a JSON file containing options. Default is '.tenonrc' in the current working directory.
The file is processed by the API module and can contain API and API Module parameters.
This may be a good place to put your API key.

Here is a sample Gruntfile.js configuration:

    tenon: {
      options: {
        key: 'your Tenon API key',
        filter: [31, 54],
        level: 'AAA'
      },
      all: {
        options: {
          saveOutputIn: 'allHtml.json',
          snippet: true,
          asyncLim: 2
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

The above defines two subtasks, *all* and *index*. The key, filter and level options are global and apply to both.
The *all* subtask has additional options not shared with the other subtask.


Note on using http(s) URLs:
---------------------------

My use case for making this Grunt plugin is to use Tenon during builds on servers that are not accessible to Tenon.
It passes the HTML file content, with inlined local Javascript and CSS to Tenon. However, it is possible to pass
server URLs to Tenon instead of source by using the "urlPrefix" option provided by
[tenon-api-client](https://github.com/egauci/tenon-api-client). For example, if your target file is
*build/index.html* and it can be addressed as *http://my.domain.com/foo/build/index.html* then you can
use the option *urlPrefix: 'http://my.domain.com/foo/'*.

Remember, for this to work *http://my.domain.com/foo/build/index.html* must be accessible to the Tenon server.

This option is applied to each target file.

Changelog
---------

  0.6.2 - Documented use of urlPrefix. No code changes.
