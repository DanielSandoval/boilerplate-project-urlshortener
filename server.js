require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlparser = require('url');
const mongoose = require('mongoose');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const schema = new mongoose.Schema({url: 'string', short: 'number'});
const Url = mongoose.model('Url', schema);

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  var bodyUrl = req.body.url;
  var urlHostname = urlparser.parse(bodyUrl).hostname;
  dns.lookup(urlHostname, function(err, address) {
    if(err) {
      res.json({ error: 'an error occurred' });
    }
    else if(address) {
      var autoInc;
      Url.findOne().sort({short: '-1'}).exec(function(err, data) {
        if(data) {
          autoInc = data.short + 1;
        }
        else {
          autoInc = 1;
        }

        var url = new Url({ url: bodyUrl, short: autoInc });
        url.save(function(err, data) {
          res.json({
            original_url: data.url,
            short_url: data.short
          });
        });
      });
    }
    else {
      res.json({ error: 'invalid url' });
    }
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  var shortParam = req.params.short_url;
  Url.find({short: shortParam}, function(err, data) {
    if(data) {
      res.redirect(data[0].url);
    }
    else {
      res.json({error: "invalid url"});
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
