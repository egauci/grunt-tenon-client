'use strict';

/*
 * This is a command line interface to the tenon module. It will handle one file or http URL
 * at a time.
 */

var nom = require('nomnom'),
    tenon = require('tenon-api-client'),
    opts,
    res
    ;

opts = {
  userid: {
    abbr: 'u',
    full: 'userid',
    help: 'Basic auth userid'
  },
  password: {
    abbr: 'p',
    full: 'password',
    help: 'Basic auth password'
  },
  url: {
    position: 0,
    help: 'URL to test'
  },
  urlPrefix: {
    full: 'pref',
    help: 'prefix for target URL, ex: http://wfrapd.com/sa2/ - if not specified, assumes files'
  },
  key: {
    abbr: 'k',
    full: 'key',
    help: 'API Key'
  },
  apiURL: {
    abbr: 'a',
    full: 'api',
    help: 'API URL'
  },
  certainty: {
    abbr: 'c',
    full: 'certainty',
    type: 'number',
    help: 'Certainty: one of 0, 20, 40, 60, 80, 100'
  },
  fragment: {
    full: 'fragment',
    type: 'boolean',
    help: 'true if this is only a fragment, not a whole document'
  },
  importance: {
    abbr: 'i',
    full: 'importance',
    type: 'number',
    help: 'Importance: one of 0, 1, 2, 3'
  },
  level: {
    abbr: 'l',
    full: 'level',
    type: 'string',
    help: 'Level: one of A, AA, AAA'
  },
  priority: {
    full: 'priority',
    type: 'number',
    help: 'Priority: one of 0, 20, 40, 50, 80, 100'
  },
  ref: {
    abbr: 'r',
    full: 'ref',
    type: 'boolean',
    help: 'true to receive a referece link with each issue reported'
  },
  reportID: {
    full: 'reportid',
    type: 'string',
    help: 'reportID'
  },
  store: {
    abbr: 's',
    full: 'store',
    type: 'boolean',
    help: 'Set to true to store results at tenon.io'
  },
  systemID: {
    full: 'systemid',
    type: 'string',
    help: 'systemID'
  },
  uaString: {
    full: 'uastring',
    type: 'string',
    help: 'uaString'
  },
  viewPortHeight: {
    abbr: 'h',
    full: 'height',
    type: 'number',
    help: 'Viewport Height in pixels'
  },
  viewPortWidth: {
    abbr: 'w',
    full: 'width',
    type: 'number',
    help: 'Viewport Width in pixels'
  },
  filter: {
    abbr: 'f',
    full: 'filter',
    type: 'string',
    help: 'Comma-separated list if issues to filter out of results'
  },
  config: {
    full: 'config',
    'default': '.tenonrc',
    help: 'Configuration file containing additional options'
  }
};

nom.options(opts);
res = nom.parse();

if (res.filter) {
  res.filter = res.filter.split(/\s*,\s*/).map(function(itm) {return Number(itm);});
}

tenon(res, function(err, outp) {
  if (err) {
    console.error('Error: ' + err);
    process.exit(1);
  }
  console.log('Success:');
  console.log(JSON.stringify(outp, null, '  '));
});
