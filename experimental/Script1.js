// JavaScript source code
const express = require('express');
const app = express();
const httpsserver = require('http').Server(app);
let io = require('socket.io')(httpsserver); // 'io' holds all sockets
const IPaddress = '192.168.178.32'; //enter your current ip address inorder to avoid errors
const port = 80;

app.use(express.static('client'));
app.get('/', function (req, res) {
    if (playerList.length < 6) {
        res.sendFile(__dirname + '/client/game.html');
    } else {
        res.sendFile(__dirname + '/client/game_is_full.html');
    }
});
httpsserver.listen(port, IPaddress, function () {
    console.log('Server is listening on ' + IPaddress + ':' + port.toString());
});