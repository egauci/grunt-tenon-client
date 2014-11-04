Tenon Tests
===========

This is an exploration of [TENON](http://tenon.io/) - a web accessiblity testing API - in
the form of a Grunt plugin.

Tenon docs: http://tenon.io/documentation/

What's Here
-----------

The src folder contains *index.js*, a CLI front-end to the API.
It is not used for the Grunt plugin.
Type "node src/index --help" for instructions.

The Grunt plugin is in the tasks folder, named *grunt-tenon.js*.

A similar gulp plugin that was part of this project has been moved to its own
repository: https://github.com/egauci/gulp-tenon-client.

Things to Note
--------------

The API client module is a separate package: https://github.com/egauci/tenon-api-client --
please check its documentation for hints on configuration parameters.

The Grunt Plugin
----------------

The Grunt plugin is a standard Grunt MultiTask. It can be configured in the normal multitask
way. In addition to the API and client module options, there are these specific to the plugin:

- snippet -- true or false (default false) to include errorSnippet in the console output.
- saveOutputIn -- an (optional) path to a file that will receive all the results from the Tenon API. Default is no file output.
- asyncLim -- the maximum number of files to test in parallel. Default is 1.

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
