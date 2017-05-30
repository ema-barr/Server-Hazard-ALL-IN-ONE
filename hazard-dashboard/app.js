var express = require('express');
var app = express();
var server = require('http').createServer(app);  
var path = require('path');
var io = require('socket.io')(server);


app.use(express.static(__dirname +'/public'));

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/start',function(req,res){
	io.emit('init');
});

app.post('/xml',function(req,res){
	io.emit('parsingXML');
});

server.listen(3000);
io.listen(server);