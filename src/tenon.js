'use strict';

/*
 * This module does the basic task.
 * Given options and a reference to an html target, it will:
 *   - if the reference is a local file, inline local scripts and css and hand it off to the tenon API
 *   - if the reference is http, hand it off as is to the tenon API
 */

var fs = require('fs'),
    merge = require('merge'),
    request = require('request'),
    URL = require('url'),
    inliner = require('./inliner'),
    res,
    config,
    filter = [],
    callback,
    defaults = {
      fragment: '0',
      ref: '0',
      store: '0',
      viewPortHeight: '768',
      viewPortWidth: '1024',
      urlPrefix: ''
    }
;

function haveResults(err, response, body) {
  var jsn, rs;
  if (err) {
    callback(err);
    return;
  }
  try {
    jsn = JSON.parse(body);
  } catch(e) {
    callback(e);
    return;
  }
  if (!jsn.status || jsn.status !== 200) {
    console.dir(jsn);
    callback('Status: ' + (jsn.status ? String(jsn.status) : '555') + ' ' + (jsn.message ? jsn.message : ''));
    return;
  }
  rs = jsn.resultSet.filter(function(itm) {
    return filter.indexOf(itm.tID) === -1;
  });
  jsn.resultSetFiltered = rs;
  callback(null, jsn, response);
}

function createForm() {
  var frm = {},
      fname,
      url;
  if (res.userid && res.password) {
    url = URL.parse(res.urlPrefix + res.url);
    url.auth = res.userid + ':' + res.password;
    frm.url = URL.format(url);
    console.log('url formatted: ' + frm.url);
  } else {
    fname = res.urlPrefix + res.url;
    if ((res.urlPrefix && res.urlPrefix.search('http') === 0) || (!res.urlPrefix && res.url.search('http') === 0)) {
      frm.url = fname;
    } else {
      if (fs.existsSync(fname)) {
        frm.src = inliner({fname: fname});
        if (!frm.src) {
          callback('Inlining failed');
          return false;
        }
      } else {
        callback('File not found: "' + fname + '"');
        return false;
      }
    }
  }
  delete res.url;
  delete res.userid;
  delete res.password;
  delete res.urlPrefix;
  Object.keys(res).forEach(function(itm) {
    frm[itm] = res[itm];
  });

  return frm;
}

function haveConfig() {
  var frm = {},
      uri,
      hdrs;
  res = merge(JSON.parse(config), res);
  if (!res.apiURL) {
    callback('API URL is required');
    return;
  }
  if (!res.url) {
    callback('Target URL is required');
    return;
  }
  if (!res.key) {
    callback('API Key is required');
    return;
  }
  delete res._;
  uri = res.apiURL;
  delete res.apiURL;
  filter = res.filter || [];
  delete res.filter;
  frm = createForm();
  if (frm) {
    hdrs = {
      uri: uri,
      method: 'POST',
      form: frm
    };
    if (process.env.HTTP_PROXY) {
      hdrs.proxy = process.env.HTTP_PROXY;
    }

    //console.dir(hdrs);
    //process.exit(1);
    request(hdrs, haveResults);
  }
}

function proc(opts, cb) {
  callback = cb;
  Object.keys(opts).forEach(function(itm) {
    if (typeof opts[itm] === 'boolean') {
      opts[itm] = opts[itm] ? '1' : '0';
    } else if (typeof opts[itm] === 'number') {
      opts[itm] = String(opts[itm]);
    }
  });
  res = merge(defaults, opts);
  fs.readFile(res.config, function(err, dta) {
    delete res.config;
    config = err ? '{}' : dta;
    haveConfig();
  });
}

module.exports = proc;
