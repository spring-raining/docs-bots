const koa = require('koa');
const bodyParser = require('koa-bodyparser');

const executor = require('./executor');

module.exports = main;

function main(argv) {
  const run = () => {
    const app = koa();
    app.use(bodyParser());

    app.use(function *() {
      const data = this.request.body;
      if (this.method === 'POST' && argv['slack-token'] === data.token) {
        const command = data.text
          .split(/\s+/)
          .filter(c => c !== '' && c !== data.trigger_word);
        console.log(command.join(' '));
        const res = yield executor.execute(
            argv['script-id'],
            argv['scopes'],
            argv['function'],
            command);
        this.body = {
          text: res,
        };
      }
    });

    app.listen(argv['port']);
  };

  if (executor.hasToken()) {
    run();
  } else {
    executor.getNewToken(argv['scopes'])
      .then(() => run());
  }
}

