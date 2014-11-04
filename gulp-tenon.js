'use strict';

var clone = require('clone'),
    through = require('through2'),
    merge = require('merge'),
    chalk = require('chalk'),
    fs = require('fs'),
    tenon = require('tenon-api-client')
;

var PLUGIN_NAME = 'gulp-tenon';

console.log(PLUGIN_NAME);

module.exports = function(opts) {
  var options = merge({config: '.tenonrc'}, opts),
      failed = 0,
      snippet = options.snippet,
      writePath = options.saveOutputIn,
      allOut = {}
  ;
  delete options.snippet;
  delete options.saveOutputIn;

  function fmtFilename(file) {
    var fp = file.path,
        lix;
    if (file.cwd && fp.indexOf(file.cwd) === 0) {
      fp = fp.slice(file.cwd.length + 1);
    }
    fp = fp.replace(/\\/g, '/');
    lix = fp.lastIndexOf('/');
    if (lix < 0) {
      return  chalk.bold(fp);
    }
    return fp.slice(0, lix+1) + chalk.bold(fp.slice(lix+1));
  }

  return through.obj(function(file, enc, cb) {
    var fopts = clone(options, false);
    fopts.url = file.path;
    tenon(fopts, function(err, data) {
      var fname = fmtFilename(file);
      if (err) {
        console.log('\n' + fname + '\n' + chalk.red.bgWhite('Tenon error:') + ' ' + err.slice(0,500));
      } else {
        if (data.resultSetFiltered.length > 0) {
          failed += 1;
          console.log('\n' + fname);
          data.resultSetFiltered.forEach(function(itm) {
            console.log(chalk.red('>>') + ' tID:   ' + itm.tID);
            console.log('   bpID:  ' + itm.bpID);
            console.log('   Title: ' + itm.errorTitle);
            console.log('   Xpath: ' + itm.xpath);
            if (snippet) {
              console.log('   Snippit:');
              console.log(chalk.gray(itm.errorSnippet.replace(/&lt;/g, '<').replace(/&gt;/g, '>')));
            }
          });
        } else {
          console.log('\n' + fname + chalk.green(' >> OK'));
        }
        if (writePath) {
          delete data.resultSetFiltered;
          allOut[file.path] = data;
        }
      }
      cb();
    });
  }, function() {
    if (writePath && Object.keys(allOut).length > 0) {
      fs.writeFileSync(writePath, JSON.stringify(allOut, null, '  '), {encoding: 'utf8'});
    }
    if (failed) {
      console.log(chalk.yellow('\nFiles with errors: ' + failed + '\n'));
    }
  });
};
