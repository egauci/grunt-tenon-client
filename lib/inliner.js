'use strict';

/*
 * This is a simple inliner of LOCAL script and css tags. It will not handle http references.
 * Doesn't (yet) handle CSS @import. Basically this is all one level deep.
 *
 * This module expects an object with one property: fname, which should be a path to an HTML
 * file to process.
 *
 * Returns a promise. On resolution, it returns the HTML with inlined JS and CSS.
 */

var fs = require('fs'),
    path = require('path'),
    Promise = require('bluebird')
;

module.exports = function(conf) {
  return new Promise(function(resolve, reject) {

    var dirname = path.dirname(conf.fname) + path.sep,
        sre = /<script.+?src=["']([^"']+?)["'].*?>/ig,
        srcre = / *src=["'][^"']+?["']/i,
        cre = /<link.+?href=["']([^"']+?)["'].*>/ig,
        hrefre = / *href=["'][^"']+?["']/i,
        crerel = / *rel=["'][^"']+?["']/i,
        cretag = /<link/i,
        filecontent,
        incfiles = {},
        count = 0
    ;

    function doReplace() {
      // inline local javascript
      filecontent = filecontent.replace(sre, function(matched, src) {
        if (src.search(/http/i) === 0) {
          return matched;
        }
        return matched.replace(srcre, '') + '\n' + incfiles[src];
      });
      // now inline local css
      filecontent = filecontent.replace(cre, function(matched, src) {
        var tag;
        if (src.search(/http/i) === 0) {
          return matched;
        }
        if (matched.toLowerCase().search('stylesheet') === -1) {
          return matched;
        }
        tag = matched.replace(hrefre, ''); // remove href attribute
        tag = tag.replace(crerel, ''); // remove rel attribute
        tag = tag.replace(cretag, '<style'); // change link to style
        return tag + '\n' + incfiles[src] + '\n</style>';
      });
      resolve(filecontent);
    }

    function foundItem(item) {
      // get contents of an included file. If this is the last one,
      // then proceed to replace all the includes.
      fs.readFile(dirname + item, {encoding: 'utf8'}, function(err, data) {
        data = err ? '**NOT FOUND**' : data;
        incfiles[item] = data;
        count -= 1;
        if (count <= 0) {
          process.nextTick(doReplace);
        }
      });
    }

    fs.readFile(conf.fname, {encoding: 'utf8'}, function(err, data) {
      // read the file, find all the includes (JS & CSS).
      var found, files;
      if (data) {
        filecontent = data;
        files = [];
        while ((found = sre.exec(data)) !== null) {
          files.push(found[1]);
        }
        while ((found = cre.exec(data)) !== null) {
          files.push(found[1]);
        }
        files = files.filter(function(item) {
          return item.search(/http/i) !== 0;
        });
        if (files.length === 0) {
          resolve(filecontent); // no included files, just return content
        } else {
          count = files.length;
          files.forEach(foundItem);
        }
      } else {
        reject(err);
      }
    });
  });
};
