var _ = require('underscore');
var got = require('got');
var uid = require('uid');
var util = require('util');
var crypto = require('crypto');
var querystring = require('querystring');
var cache = require('memory-cache');
var express = require('express');
var app = express();

app.use('/html', express.static(__dirname + '/html'))
app.use('/js', express.static(__dirname + '/js'))
app.use('/css', express.static(__dirname + '/css'))
app.use('/img', express.static(__dirname + '/img'))
app.use('/font', express.static(__dirname + '/font'))
app.use('/audio', express.static(__dirname + '/audio'))
app.use('/components', express.static(__dirname + '/components'))
app.use('/node_modules', express.static(__dirname + '/node_modules'))

app.get('/api/config', function(req, res) {

    var config = cache.get('config');
    if (config) {
        return res.json({
            code: 0,
            config: _.pick(config, ['signature', 'timestamp', 'noncestr'])
        });
    }

    got.get('http://kuzhanggui.com/backend/settings/token/limijiaoyin', function(err, data) {
        if (err) {
            console.error(e);
            return res.json({
                code: 1001
            });
        }
        data = JSON.parse(data);

        got.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket?' + querystring.stringify({
            access_token: data.token,
            type: 'jsapi'
        }), function(err, data) {
            if (err) {
                console.error(e);
                return res.json({
                    code: 1001
                });
            }

            data = JSON.parse(data);

            var timestamp = new Date().getTime();
            var url = 'http://film.limijiaoyin.com/html';
            var noncestr = uid(15);
            var str = util.format('jsapi_ticket=%s&noncestr=%s&timestamp=%d&url=%s',
                data.ticket, noncestr, timestamp, url);
            var sha1 = crypto.createHash('sha1');
            sha1.update(str);
            var signature = sha1.digest('hex');

            var config = {
                signature: signature,
                timestamp: timestamp,
                url: url,
                noncestr: noncestr,
                jsapi_ticket: data.ticket
            };
            cache.put('config', config, 7200 * 1000);

            return res.json({
                code: 0,
                config: _.pick(config, ['signature', 'timestamp', 'noncestr'])
            });
        });
    });
});

var PORT = 7748;
app.listen(PORT, function() {
    console.log('listening on', PORT);
});