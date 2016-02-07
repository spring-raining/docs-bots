'use strict';

const argv = require('yargs')
  .options({
    'port': {
      describe: 'Listening port',
      demand: true,
    },
    'slack-token': {
      describe: 'Slack outgoing token',
      demand: true,
    },
    'script-id': {
      describe: 'Google Script ID (Project Key)',
      demand: true,
    },
    'scopes': {
      describe: 'Scopes required to execute your Google Apps Script',
      type: 'array',
      default: ['https://www.googleapis.com/auth/spreadsheets'],
    },
    'function': {
      describe: 'The Google Apps Script function name which is called',
      default: 'myFunction',
    },
  })
  .argv;

require('./src/docs-bots')(argv);

