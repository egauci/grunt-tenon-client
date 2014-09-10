'use strict';

/* NOTE - this is non-functional. It may never work. */

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
        sent = 0,
        snippet,
        tenonResult
    ;

    tenonResult = function(err, res) {
      sent -= 1;
      if (err) {
        grunt.log.writeln('');
        grunt.log.error(err);
        done(false);
        return;
      }
      console.log('For: ' + res.orgUrl + ', sent: ' + sent);
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
      if (sent <= 0) {
        if (failed > 0) {
          grunt.log.error('Files with errors: ' + failed);
          done(false);
        } else {
          done(true);
        }
      }
    };

    snippet = options.snippet;
    delete options.snippet;

    if (!files || files.length === 0) {
      grunt.log.error('No files');
      done(false);
      return;
    }

    sent = files.length;

    files.forEach(function(file) {
      grunt.log.writeln('Req for: ' + file);
      options.url = file;
      var opts = merge(options);
      tenon(opts, tenonResult);
    });

    grunt.log.writeln('Sent: ' + sent);

  });
};
