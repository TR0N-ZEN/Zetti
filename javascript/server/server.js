const os = require('os');
const path = require('path');

const Zetti = require('./zetti').Zetti;
let IPaddress, dirname = undefined;
console.log(`Started process with arg: '${process.argv[2]}'`);
switch (process.argv[2])
{
	case("local"):
		IPaddress = os.networkInterfaces()["enp2s0"][0]["address"]; // - for dev on laptop via ethernet
		// const IPaddress = os.networkInterfaces()["wlp4s0"][0]["address"]; // - for dev on laptop via wifi
		//const dirname = "/mnt/EAD49BDCD49BA979/Users/ego/desktop/Zetti/javascript"; // deprecated
		dirname = __dirname; // only to use when not in node's interactive mode
		break;
	case("server"):
		// const IPaddress = '85.214.165.83'; // deprecated
		IPaddress = os.networkInterfaces()["venet0:0"][0].address; // execution from server
		// const dirname = "/home/zetti/Zetti/javascript"; // deprecated
		dirname = __dirname; // only to use when not in node's interactive mode
		break;
	default:
		console.log("Your supplied argument is invalid. Valid arguents are 'local', 'server'.");
}


const port = 80; // port for http server

// helper code for constant variable "client_dir"
let x = dirname.split(path.sep);
x.splice((-1),1);
x.splice(0,1);
let y = "";
for (e of x) { y+= (`/${e}`); }
const client_dir = path.join(y, "/client");

//logging for checking
console.log("--------------------------");
console.log(`process.argv[2] = ${process.argv[2]}`);
console.log(`IPaddress = ${IPaddress}`);
console.log(`dirname = ${dirname}`);
console.log(`client_dir = ${client_dir}`);
//console.log(` = ${}`);
console.log("--------------------------");


//const { disconnect } = require('process');

const express = require('express');
const app = express();
const httpsserver = require('http').Server(app);
const io = require('socket.io')(httpsserver); // 'io' holds all sockets

io.on('connection', (socket) =>
{
	console.log('user connected');
	socket.on("connect_to_game", (number) => {  });
});

var namespace_1 = io.of("/game_1");
var namespace_2 = io.of("/game_2");
var game_1 = new Zetti(namespace_1);
var game_2 = new Zetti(namespace_2);


app.get("/game_1", (req, res) =>
{
	app.use(express.static(path.join(client_dir, '/game_1')));
	if (game_1.clients.list.length < 6 || game_1.clients.left.length != 0)
	{
		res.sendFile(path.join(client_dir, '/game_1/index.html'));
	}
	else
	{
		res.sendFile(path.join(client_dir, '/game_1/game_is_full.html'));
	}
});
app.get("/game_2", (req, res) =>
{
	app.use(express.static(path.join(client_dir, '/game_2')));
	if (game_2.clients.list.length < 6 || game_2.clients.left.length != 0)
	{
		res.sendFile(path.join(client_dir, '/game_2/index.html'));
	}
	else
	{
		res.sendFile(path.join(client_dir, '/game_2/game_is_full.html'));
	}
});

app.get("/", (req, res) =>
{
	app.use(express.static(path.join(client_dir, '/overview')));
	res.sendFile(path.join(client_dir, '/overview/overview.html'));
});
// app.get("/excuse", (req, res) => {
// 	app.use(express.static('client/excuse'));
// 	res.sendFile(path.join(dirname, '/client/excuse/excuse.html'));
// });
httpsserver.listen(port, IPaddress, () =>
{
  console.log(`Server is listening on ${IPaddress} : ${port.toString()}`);
});
