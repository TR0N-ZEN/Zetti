// JavaScript source code
const express = require('express');
const app = express();
const httpserver = require('http').Server(app);
let io = require('socket.io')(httpserver);

const IPaddress = "localhost";//'85.214.165.83';
const port = 80;

app.use(express.static('client'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + 'client/index.html');
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('ClientMessage', function (message) {
        console.log('client: ' + message);
        io.emit('ServerMessage', message);
    });
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

httpserver.listen(port, IPaddress, function () {
    console.log( 'Server is listening on ' + IPaddress + ':' + port.toString() );
});