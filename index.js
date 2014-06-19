
module.exports = require('./node_modules/express', './node_modules/socket.io');

var express = require('express');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static(__dirname+'/client'));
app.use('client/scripts', express.static(__dirname+'/client/scripts'));
app.use('client/styles', express.static(__dirname+'/client/styles'));

app.get('/', function(req, res){
    res.sendfile('client/index.html');
});



io.on('connection', function(socket){
    console.log("haha");
    socket.on('disconnect', function(){
        console.log("disconnect");
    });
})

http.listen(3000, function(){
});