'use strict';
var fs = require('fs'),
    path = require('path')
;

function inline(conf) {
  var dirname = path.dirname(conf.fname) + path.sep,
      filecontent = fs.readFileSync(conf.fname, {encoding: 'utf8'}),
      sre = /<script.+?src=["']([^"']+?)["'].*?>/ig,
      srcre = / *src=["'][^"']+?["']/i,
      cre = /<link.+?href=["']([^"']+?)["'].*>/ig,
      hrefre = / *href=["'][^"']+?["']/i,
      crerel = / *rel=["'][^"']+?["']/i,
      cretag = /<link/i
  ;
  if (filecontent) {
    // inline local javascript
    filecontent = filecontent.replace(sre, function(matched, src) {
      var scriptcontent;
      if (src.search(/http/i) === 0) {
        return matched;
      }
      scriptcontent = fs.readFileSync(dirname + src, {encoding: 'utf8'});
      return matched.replace(srcre, '') + '\n' + scriptcontent;
    });
    // now inline local css
    filecontent = filecontent.replace(cre, function(matched, src) {
      var stylecontent,
          tag;
      if (src.search(/http/i) === 0) {
        return matched;
      }
      if (matched.toLowerCase().search('stylesheet') === -1) {
        return matched;
      }
      stylecontent = fs.readFileSync(dirname + src, {encoding: 'utf8'});
      tag = matched.replace(hrefre, ''); // remove href attribute
      tag = tag.replace(crerel, ''); // remove rel attribute
      tag = tag.replace(cretag, '<style'); // change link to style
      return tag + '\n' + stylecontent + '\n</style>';
    });
  }
  //console.log('returning:\n' + filecontent);
  return filecontent;
}

module.exports = inline;
