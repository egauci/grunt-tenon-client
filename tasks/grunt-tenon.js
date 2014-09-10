'use strict';

module.exports = function(grunt) {

  grunt.registerMultiTask('tenon', 'Grunt plugin for tenon', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var done = this.async(),
        options = this.options({
          config: '.tenonrc'
        }),
        files = this.filesSrc,
        tenon = require('../src/tenon'),
        merge = require('merge'),
        failed = 0,
        snippet = options.snippet,
        writePath = options.saveOutputIn,
        allOut = {},
        procFile
    ;

    delete options.snippet;
    delete options.saveOutputIn;

    procFile = function() {
      var file = files.shift(),
          opts
      ;
      opts = merge(options);
      if (!file) {
        if (writePath && Object.keys(allOut).length > 0) {
          grunt.file.write(writePath, JSON.stringify(allOut, null, '  '));
        }
        if (failed > 0) {
          grunt.log.writeln('\nFiles with errors: ' + failed + '\n');
          done(false);
        } else {
          done(true);
        }
        return;
      }
      opts.url = file;
      tenon(opts, function(err, res) {
        grunt.log.write('\nFile: ' + file + ' ');
        if (err) {
          grunt.log.writeln('');
          grunt.log.error(err);
          done(false);
          return;
        }
        if (writePath) {
          allOut[file] = res;
        }
        if (res.resultSetFiltered.length > 0) {
          failed += 1;
          grunt.log.writeln('');
          res.resultSetFiltered.forEach(function(itm) {
            grunt.log.error('  tID:   ' + itm.tID);
            grunt.log.writeln('  Title: ' + itm.errorTitle);
            grunt.log.writeln('  Xpath: ' + itm.xpath);
            if (snippet) {
              grunt.log.writeln('  Snippit:');
              grunt.log.writeln(itm.errorSnippet.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
            }
          });
        } else {
          grunt.log.ok(' OK');
        }
        process.nextTick(procFile);
      });
    };

    procFile();
  });
};
