'use strict';

/*
 * This module does the basic task.
 * Given options and a reference to an html target, it will:
 *   - if the reference is a local file, inline local scripts and css and hand it off to the tenon API
 *   - if the reference is http, hand it off as is to the tenon API
 *
 */

module.exports = function(opts, cb) {
  var Promise = require('bluebird'),
      fs = Promise.promisifyAll(require("fs")),
      merge = require('merge'),
      request = require('request'),
      URL = require('url'),
      inliner = require('./inliner'),
      defaults = {
        fragment: '0',
        ref: '0',
        store: '0',
        viewPortHeight: '768',
        viewPortWidth: '1024',
        urlPrefix: ''
      },
      res,
      config,
      fname,
      filter = [],
      callback,
      cfg
  ;

  function haveResults(err, response, body) {
    /*jshint -W040*/
    var jsn, rs;
    if (err) {
      callback(err);
      return;
    }
    try {
      jsn = JSON.parse(body);
    } catch(e) {
      callback('JSON Parse error:\n' + body);
      return;
    }
    if (!jsn.status || jsn.status !== 200) {
      console.dir(jsn);
      this.callback('Status: ' + (jsn.status ? String(jsn.status) : '555') + ' ' + (jsn.message ? jsn.message : ''));
      return;
    }
    rs = jsn.resultSet.filter(function(itm) {
      return filter.indexOf(itm.tID) === -1;
    });
    jsn.resultSetFiltered = rs;
    callback(null, jsn, fname);
  }

  function callCb(err, dta) { // call callback function nextTick
    process.nextTick(function() {
      callback(err, dta);
    });
  }

  function createForm() {
    return new Promise(function(resolve, reject) {
      var frm = {},
          fname,
          url;
      function returnForm() {
        delete res.url;
        delete res.userid;
        delete res.password;
        delete res.urlPrefix;
        Object.keys(res).forEach(function(itm) {
          frm[itm] = res[itm];
        });
        resolve(frm);
      }

      if (res.userid && res.password) {
        url = URL.parse(res.urlPrefix + res.url);
        url.auth = res.userid + ':' + res.password;
        frm.url = URL.format(url);
        console.log('url formatted: ' + frm.url);
        returnForm();
      } else {
        fname = res.urlPrefix + res.url;
        if ((res.urlPrefix && res.urlPrefix.search('http') === 0) || (!res.urlPrefix && res.url.search('http') === 0)) {
          frm.url = fname;
          returnForm();
        } else {
          inliner({fname: fname})
          .then(function(src) {
            frm.src = src;
            returnForm();
          })
          .catch(function(boo) {
            reject(boo);
          });
        }
      }
    });
  }

  function haveConfig() {
    var uri,
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
    createForm().then(function(frm) {
      hdrs = {
        uri: uri,
        method: 'POST',
        form: frm
      };
      if (process.env.HTTP_PROXY) {
        hdrs.proxy = process.env.HTTP_PROXY;
      }

      request(hdrs, haveResults);
    })
    .catch(function(err) {
      callback(err);
    });
  }

  callback = cb;
  Object.keys(opts).forEach(function(itm) {
    if (typeof opts[itm] === 'boolean') {
      opts[itm] = opts[itm] ? '1' : '0';
    } else if (typeof opts[itm] === 'number') {
      opts[itm] = String(opts[itm]);
    }
  });
  res = merge(defaults, opts);
  cfg = res.config;
  delete res.config;
  fs.readFileAsync(cfg)
  .then(function(conf) {
    config = conf;
    haveConfig();
  })
  .catch(function() {
    config = '{}';
    haveConfig();
  });
};


