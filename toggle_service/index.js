const express = require('express');
const amqp = require('amqplib/callback_api');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const key = '$2a$10$gj1t4IZpOshgV09nGpZLn.EMiXW2YBudP9YESIzeofNwq.4Pd/Mkm';
const URI = 'https://api.jsonbin.io/b/5b20a5e7c2e3344ccd96d631';
const { rabbitmq } = process.env;

app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('Please use /toggle route for operation.');
});

app.post('/toggle', function(req, res) {
  const toggleStatus = req.body.toggleStatus;

  amqp.connect(
    rabbitmq,
    function(err, conn) {
      if (err) {
        throw new Error(err.message);
      }

      conn.createChannel(function(error, ch) {
        if (error) {
          throw new Error(error);
        }

        const q = 'fiddle-toggle';
        ch.assertQueue(q, { durable: false });
        ch.sendToQueue(q, Buffer.from(toggleStatus || 'off'), {
          persistent: true,
        });

        res.send({ message: 'Message sent by toggle route.' });
      });
    },
  );
});

amqp.connect(
  rabbitmq,
  function(err, conn) {
    if (err) {
      throw new Error(err);
    }

    conn.createChannel(function(error, ch) {
      if (error) {
        throw new Error(error);
      }

      const q = 'fiddle-slide';

      ch.assertQueue(q, { durable: false });
      ch.consume(
        q,
        function(msg) {
          const state = parseInt(msg.content.toString(), 10);
          const defaultBin = {
            toggle: 'off',
            value: 0,
          };

          const newBin = Object.assign({}, defaultBin, {
            value: state,
          });

          return fetch(URI, {
            method: 'PUT',
            body: JSON.stringify(newBin),
            headers: {
              'Content-Type': 'application/json',
              'secret-key': key,
            },
          })
            .then(res => res.json())
            .then(({ data }) => {
              console.log('***** Application state: ', data, ' *****');
            });
        },
        { noAck: true },
      );
    });
  },
);

app.listen(process.env.PORT || 8080);

console.log('Toggle server is up');
