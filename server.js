const os = require('os');
const path = require('path');

const Zetti = require('./zetti').Zetti;
// const IPaddress = '192.168.0.13'; // address for the http server
// const IPaddress = os.networkInterfaces()["wlp4s0"][0]["address"]; // - for dev on laptop
const IPaddress = os.networkInterfaces()["enp2s0"][0]["address"]; // - for dev on laptop
// const IPaddress = '85.214.165.83'; //enter your current ip address inorder to avoid errors
const port = 80; // port for http server

//const { disconnect } = require('process');

const express = require('express');
const app = express();
const httpsserver = require('http').Server(app);
const io = require('socket.io')(httpsserver); // 'io' holds all sockets

io.on('connection', (socket) => {
	console.log('user connected');
	socket.on("connect_to_game", (number) => {  });
});

var namespace_1 = io.of("/game_1");
var namespace_2 = io.of("/game_2");
var game_1 = new Zetti(namespace_1);
var game_2 = new Zetti(namespace_2);

// const dirname = __dirname; //only to use when not in interactive mode
const dirname = "/media/theo/shared/Users/ego/desktop/Zetti";
// const dirname = "/apps/Zetti";

app.get("/game_1", (req, res) => {
	app.use(express.static('client/game_1'));
	if (game_1.clients.list.length < 6 || game_1.clients.left.length != 0)
	{
		res.sendFile(path.join(dirname, '/client/game_1/index.html'));
	}
	else
	{
		res.sendFile(path.join(dirname, '/client/game_1/game_is_full.html'));
	}
});
app.get("/game_2", (req, res) => {
	app.use(express.static('client/game_2'));
	if (game_2.clients.list.length < 6 || game_2.clients.left.length != 0)
	{
		res.sendFile(path.join(dirname, '/client/game_2/index.html'));
	}
	else
	{
		res.sendFile(path.join(dirname, '/client/game_2/game_is_full.html'));
	}
});

app.get("/", (req, res) => {
	app.use(express.static('client/overview'));
	res.sendFile(path.join(dirname, '/client/overview/overview.html'));
});
// app.get("/excuse", (req, res) => {
// 	app.use(express.static('client/excuse'));
// 	res.sendFile(path.join(dirname, '/client/excuse/excuse.html'));
// });
httpsserver.listen(port, IPaddress, () => {
  console.log(`Server is listening on ${IPaddress} : ${port.toString()}`);
});
