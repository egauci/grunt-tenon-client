'use strict';
/*
 * This is a simple inliner of LOCAL script and css tags. It will not handle http references.
 * Doesn't (yet) handle CSS @import. Basically this is all one level deep.
 *
 * This module expects an object with one required property: fname, which should be a path to
 * an HTML file to process. The local files to be included must have relative links (relative
 * from the HTML file path).
 *
 * An additional property in the configuration is cssUrlReplacer (optional). If present,
 * it should be a function that is called for URLs within CSS files.
 * (For example: background: url(...);) It will receive the content of the url and must
 * return a replacement (which may be the unchanged url).
 *
 * Returns a promise. It resolves with a string containing HTML with inlined JS and CSS.
 */

/*jshint -W079 */

var path = require('path'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require("fs"))
;

module.exports = function(conf) {
  return new Promise(function(resolve, reject) {

    var dirname = path.dirname(conf.fname) + path.sep,
        sre = /<script.+?src=["'](?!https?:\/\/)([^"']+?)["'].*?>/ig,
        srcre = / *src=["'][^"']+?["']/i,
        cre = /<link.+?href=["'](?!https?:\/\/)([^"']+?)["'].*>/ig,
        hrefre = / *href=["'][^"']+?["']/i,
        crerel = / *rel=["'][^"']+?["']/i,
        cretag = /<link/i,
        creend = / *\/{0,1}>/,
        cssurl = /(URL *\(["']?)([^"')]+)(["']?\))/ig,
        filecontent,
        incfiles = {}
    ;

    /* inlineLocalContent processes the HTML file,
     * inlining local CSS and JavaScript. The inlined
     * content is available in the incfiles object,
     * keyed by src or href attribute value.
     */
    function inlineLocalContent() {
      // inline local javascript
      filecontent = filecontent.replace(sre, function(matched, src) {
        if (!incfiles[src]) {
          return matched; // This file wasn't available
        }
        return matched.replace(srcre, '') + '\n' + incfiles[src];
      });
      // now inline local css
      filecontent = filecontent.replace(cre, function(matched, src) {
        var tag;
        if (!incfiles[src]) {
          return matched;
        }
        if (matched.toLowerCase().search('stylesheet') === -1) {
          return matched;
        }
        tag = matched.replace(hrefre, ''); // remove href attribute
        tag = tag.replace(crerel, ''); // remove rel attribute
        tag = tag.replace(cretag, '<style'); // change link to style
        tag = tag.replace(creend, '>'); // remove possible self-closing in style tag
        return tag + '\n' + incfiles[src] + '\n</style>';
      });
      //console.log(filecontent);
      resolve(filecontent);
    }

    /* fetch the content of one local CSS or Javascript file.
     * Add the content to the incfiles object.
     */
    function getIncludedContent(fileName, css) {
      return fs.readFileAsync(dirname + fileName, {encoding: 'utf8'}).then(function(data) {
        if (css && conf.cssUrlReplacer) {
          data = data.replace(cssurl, function(matched, pref, theUrl, suf) {
            //console.log('readFileAsync, css replacer: ' + url + ', ' + theUrl);
            return pref + conf.cssUrlReplacer(theUrl) + suf;
          });
        }
        incfiles[fileName] = data;
      })
      .catch(function(e) {
        // If we can't read the file, just issue a console warning and continue.
        // Content for this file will not be inlined.
        console.warn('Inliner:\n' + e);
      });
    }

    /*
     * Start by reading in the content of the HTML input file.
     * Find all the local script and link tags then read them in.
     * Once all have been read, call inlineLocalContent to do the inlining.
     */
    fs.readFile(conf.fname, {encoding: 'utf8'}, function(err, data) {
      // read the file, find all the local includes (JS & CSS).
      var found, files;
      if (data) {
        filecontent = data;
        files = [];
        while ((found = sre.exec(data)) !== null) {
          files.push(getIncludedContent(found[1]));
        }
        while ((found = cre.exec(data)) !== null) {
          files.push(getIncludedContent(found[1], true));
        }
        if (files.length === 0) {
          resolve(filecontent); // no files to inline, just return content
        } else {
          Promise.settle(files).then(inlineLocalContent);
        }
      } else {
        reject(err);
      }
    });
  });
};
