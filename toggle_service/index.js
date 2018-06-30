const express = require('express');
const amqp = require('amqplib/callback_api');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const wss = new WebSocket.Server({ port: 2525 });
const { rabbitmq } = process.env;

app.use(bodyParser.json());
app.use(cors());

app.get('/', function(req, res) {
  res.json({ message: 'ok' });
  // res.sendfile(path.join(__dirname, 'dist'));
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

wss.on('open', () => {
  wss.send('Toggle service connected');
});

wss.on('connection', function connection(ws) {
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

            try {
              ws.send(JSON.stringify({ slider: state }));
            } catch (error) {}
          },
          { noAck: true },
        );
      });
    },
  );
});

app.listen(process.env.PORT || 8080);

console.log('Toggle server is up');
