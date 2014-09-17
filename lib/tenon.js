'use strict';

/*
 * This module does the basic task.
 * Given options and a reference to an html target, it will:
 *   - if the reference is a local file, inline local scripts and css and hand it off to the tenon API
 *   - if the reference is http, hand it off as is to the tenon API
 *
 * This module uses sync filesystem functions, so it is not suitable for use in a server.
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

/*
 * haveResults is currently the only async function in this module.
 * It is bound to a context with two properties: callback and filter.
 */
function haveResults(err, response, body) {
  /*jshint -W040*/
  var jsn, rs, self = this;
  if (err) {
    this.callback(err);
    return;
  }
  try {
    jsn = JSON.parse(body);
  } catch(e) {
    this.callback('JSON Parse error:\n' + body);
    return;
  }
  if (!jsn.status || jsn.status !== 200) {
    console.dir(jsn);
    this.callback('Status: ' + (jsn.status ? String(jsn.status) : '555') + ' ' + (jsn.message ? jsn.message : ''));
    return;
  }
  rs = jsn.resultSet.filter(function(itm) {
    return self.filter.indexOf(itm.tID) === -1;
  });
  jsn.resultSetFiltered = rs;
  this.callback(null, jsn, this.fname);
}

function callCb(err, dta) { // call callback function nextTick
  process.nextTick(function() {
    callback(err, dta);
  });
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
          callCb('Inlining failed');
          return false;
        }
      } else {
        callCb('File not found: "' + fname + '"');
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
      fname,
      hdrs;
  res = merge(JSON.parse(config), res);
  if (!res.apiURL) {
    callCb('API URL is required');
    return;
  }
  if (!res.url) {
    callCb('Target URL is required');
    return;
  }
  if (!res.key) {
    callCb('API Key is required');
    return;
  }
  fname = res.urlPrefix + res.url;
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

    request(hdrs, haveResults.bind({callback: callback, filter: filter, fname: fname}));
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
  if (fs.existsSync(res.config)) {
    config = fs.readFileSync(res.config);
  } else {
    config = '{}';
  }
  haveConfig();
}

module.exports = proc;
