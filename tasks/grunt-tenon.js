'use strict';

module.exports = function(grunt) {

  grunt.registerMultiTask('tenon', 'Grunt plugin for tenon', function() {
    var clone = require('clone'),
        async = require('async'),
        chalk = require('chalk'),
        tenon = require('tenon-api-client'),
        done = this.async(),
        options = this.options({
          config: '.tenonrc',
          asyncLim: 1
        }),
        files = this.filesSrc,
        failed = 0,
        snippet = options.snippet,
        writePath = options.saveOutputIn,
        asyncLim = options.asyncLim,
        allOut = {}
    ;

    delete options.snippet; // remove grunt task options before passing to tenon module
    delete options.saveOutputIn;
    delete options.asyncLim;

    function fmtFilename(file) {
      var lix = file.lastIndexOf('/');
      if (lix < 0) {
        return  chalk.bold(file);
      }
      return file.slice(0, lix+1) + chalk.bold(file.slice(lix+1));
    }

    function allDone(err) {
      if (writePath && Object.keys(allOut).length > 0) {
        grunt.file.write(writePath, JSON.stringify(allOut, null, '  '));
      }
      if (failed || err) {
        grunt.log.writeln(chalk.yellow('\nFiles with errors: ' + failed + '\n'));
        done(false);
      } else {
        done(true);
      }

    }

    function procFile(file, callback) { // process one html file
      var opts = clone(options, false);

      opts.url = file;
      tenon(opts, function(err, res) {
        if (err) {
          grunt.log.error(chalk.red.bgWhite('Tenon error:') + ' ' + err.slice(0,500));
          callback(err);
          return;
        }
        grunt.log.write('\n' + fmtFilename(file) + ' ');
        if (res.resultSetFiltered.length > 0) {
          failed += 1;
          grunt.log.writeln('');
          res.resultSetFiltered.forEach(function(itm) {
            grunt.log.error(' tID:   ' + itm.tID);
            grunt.log.writeln('   bpID:  ' + itm.bpID);
            grunt.log.writeln('   Title: ' + itm.errorTitle);
            grunt.log.writeln('   Xpath: ' + itm.xpath);
            if (snippet) {
              grunt.log.writeln('   Snippit:');
              grunt.log.writeln(chalk.gray(itm.errorSnippet.replace(/&lt;/g, '<').replace(/&gt;/g, '>')));
            }
          });
        } else {
          grunt.log.ok(chalk.green('OK'));
        }
        if (writePath) {
          delete res.resultSetFiltered;
          allOut[file] = res;
        }
        callback();
      });
    }

    async.eachLimit(files, asyncLim, procFile, allDone);
  });
};
