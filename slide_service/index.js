const express = require('express');
const amqp = require('amqplib/callback_api');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const wss = new WebSocket.Server({ port: 1515 });
const { rabbitmq } = process.env;

app.use(bodyParser.json());
app.use(cors());

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname));
});

app.post('/slide', function(req, res) {
  const sliderValue = req.body.sliderValue;

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

        const q = 'fiddle-slide';
        const message = { sliderValue };
        ch.assertQueue(q, { durable: false });
        ch.sendToQueue(q, Buffer.from(sliderValue.toString() || '0'), {
          persistent: true,
        });

        res.send({ message: 'Message sent by slide route.' });
      });
    },
  );
});

wss.on('open', () => {
  wss.send('Slide service connected');
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

        const q = 'fiddle-toggle';

        ch.assertQueue(q, { durable: false });
        ch.consume(
          q,
          function(msg) {
            const state = msg.content.toString();

            try {
              ws.send(JSON.stringify({ toggle: state }));
            } catch (error) {}
          },
          { noAck: true },
        );
      });
    },
  );
});

app.listen(process.env.PORT || 8080);

console.log('Slider server is up');
