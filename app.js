var _ = require('underscore');
var got = require('got');
var uid = require('uid');
var util = require('util');
var crypto = require('crypto');
var querystring = require('querystring');
var cache = require('memory-cache');
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/'));

var entry = 'http://film.limijiaoyin.com/';

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
            console.error(err);
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
                console.error(err);
                return res.json({
                    code: 1001
                });
            }

            data = JSON.parse(data);

            var timestamp = Math.ceil(new Date().getTime() / 1000);
            var noncestr = uid(15);
            var str = util.format('jsapi_ticket=%s&noncestr=%s&timestamp=%d&url=%s',
                data.ticket, noncestr, timestamp, entry);
            console.log(str);
            var sha1 = crypto.createHash('sha1');
            sha1.update(str);
            var signature = sha1.digest('hex');

            var config = {
                signature: signature,
                timestamp: timestamp,
                url: entry,
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
