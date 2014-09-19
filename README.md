Tenon Tests
===========

This is an exploration of http://tenon.io/ - a web accessiblity API.

Tenon docs: https://bitbucket.org/tenon-io/tenon.io-documentation/

What's Here
-----------

The lib folder contains node modules.

1. tenon.js is the main module that interacts with the Tenon API.
2. inliner.js inlines LOCAL Javascript and CSS into the document

The src folder contains *index.js*, a CLI front-end to tenon.js.
It is not used for the Grunt task.
Type "node src/index --help" for instructions.

The tasks folder contains a grunt plugin.

Things to Note
--------------

The tenon module (in tenon.js)
receives a configuration object. This object can contain properties corresponding to
all the options documented in the Tenon API documentation. In addition, it can also contain the
following properties:

- config -- Path to a JSON file with parameters to merge in. Default for this in both
index.js and the Grunt task is '.tenonrc' in the current working directory. This file would be
a convenient place to put the API URL and the API key.
- userid and password -- Presence of these means the document must be an HTTP url (the code
doesn't check, but it probably should) and these will be used for basic auth (userid:password@domain.com/...)
- filter - an array of tIDs to filter out of the results. Actually it leaves resultSet unmolested, but creates a
new array, resultSetFiltered, with these particular errors filtered out.

If tenon.js determines that the given URL is a local file (it doesn't start with "http" and userid and
password are not provided in the configuration) it will inline all local Javascript and CSS. For example:

  &lt;link rel="stylesheet" href="css/combo.css" media="screen"&gt;

will be converted to:

  &lt;style media="screen"&gt;
    [[content of css/combo.css]]
  &lt;/style&gt;

Javascript and CSS references that start with "http" are not touched.

The basic assumption is that files loaded with HTTP are accessible to the Tenon server, but
local files are not.

The Grunt Plugin
----------------

The Grunt plugin is a standard Grunt MultiTask. It can be configured in the normal multitask
way. In addition to the options described above, there are these specific to the plugin:

- snippet -- true or false (default false) to include errorSnippet in the console output.
- saveOutputIn -- an (optional) path to a file that will receive all the results from the Tenon API. Default is no file output.

