const fs = require('fs');
const path = require('path');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const open = require('open');

const OAUTH_PATH = path.join(__dirname, '../keys/oauth.json');
const TOKEN_PATH = path.join(__dirname, '../keys/token.json');

const oauth = require(OAUTH_PATH);

module.exports = {
  execute: (scriptId, scopes, funcName, parameters) => new Promise(resolve => {
    authorize(oauth, scopes, auth =>
      callAppsScript(auth, scriptId, funcName, parameters, res =>
        resolve(res)
      )
    );
  }),
  getNewToken: (scopes) => new Promise(resolve => {
    getNewToken(getClient(oauth), scopes, () =>
      resolve());
  }),
  hasToken: () => {
    try {
      const f = fs.readFileSync(TOKEN_PATH);
      return f !== null;
    } catch (e) {
      return false;
    }
  },
}


// Google auth tools
// https://developers.google.com/apps-script/guides/rest/quickstart/nodejs

function authorize(credentials, scopes, callback) {
  var oauth2Client = getClient(credentials);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, scopes, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

function getClient(credentials) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();

  return new auth.OAuth2(clientId, clientSecret, redirectUrl);
}

function getNewToken(oauth2Client, scopes, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  open(authUrl);
  var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  rl.question('Enter the code from that page here: ', function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, token) {
            if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    return;
                  }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
          });
    });
}

function storeToken(token) {
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function callAppsScript(auth, scriptId, funcName, parameters, callback) {
  var script = google.script('v1');

  // Make the API request. The request object is included here as 'resource'.
  script.scripts.run({
    auth: auth,
    resource: {
      'function': funcName,
      'parameters': [parameters],
      'devMode': true,
    },
    scriptId: scriptId,
  }, function(err, resp) {
    if (err) {
      // The API encountered a problem before the script started executing.
      callback(err);
      return;
    }
    if (resp.error) {
      // The API executed, but the script returned an error.

      // Extract the first (and only) set of error details. The values of this
      // object are the script's 'errorMessage' and 'errorType', and an array
      // of stack trace elements.
      var error = resp.error.details[0];
      var screen = '[Google App Script Error]\n'
      screen += `${error.errorType}: ${error.errorMessage}\n`;
      //screen += 'Script error stacktrace:\n';

      if (error.scriptStackTraceElements) {
        // There may not be a stacktrace if the script didn't start executing.
        for (var i = 0; i < error.scriptStackTraceElements.length; i++) {
          var trace = error.scriptStackTraceElements[i];
          screen += `\t${trace.function}: ${trace.lineNumber}\n`;
        }
      }
      callback(screen);
    } else {
      callback(resp.response.result);
    }

  });
}
