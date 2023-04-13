const os = require('os');
const path = require('path');

const Zetti = require('./zetti').Zetti;
let IPaddress, dirname = undefined;
console.log(`Started process with arg: '${process.argv[2]}'`);

for (let [key, value] of Object.entries(os.networkInterfaces()))
{ 
  if (["eth0","enp2s0","venet0:0","wlp3s0"].includes(key)) { IPaddress=value[0].address; break; }
}

console.log(IPaddress);

dirname = __dirname; // only to use when not inside node's interactive mode
// helper code for constant variable "client_dir"
let x = dirname.split(path.sep);
x.splice((-1),1); // remove last element which will hold 'server'
x.splice(0,1); // remove first item since it will be an empty string, so just ''
let y = "";
for (e of x) { y+= (`/${e}`); } // aggregate the elements inside x on y
const client_dir = path.join(y, "/client");

//logging for checking
console.log("--------------------------");
console.log(`process.argv[2] = ${process.argv[2]}`);
console.log(`IPaddress = ${IPaddress}`);
console.log(`dirname = ${dirname}`);
console.log(`client_dir = ${client_dir}`);
//console.log(` = ${}`);
console.log("--------------------------");











// create webserver
const express = require('express');
const app = express();


// define webserver behaviour

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
  app.use(express.static(path.join(client_dir, '/game_1')));
  if (game_2.clients.list.length < 6 || game_2.clients.left.length != 0)
  {
    res.sendFile(path.join(client_dir, '/game_1/index.html'));
  }
  else
  {
    res.sendFile(path.join(client_dir, '/game_1/game_is_full.html'));
  }
});

app.get("/", (req, res) =>
{
  app.use(express.static(path.join(client_dir, '/overview')));
  res.sendFile(path.join(client_dir, '/overview/overview.html'));
});

// app.get("/excuse", (req, res) => {
//   app.use(express.static('client/excuse'));
//   res.sendFile(path.join(dirname, '/client/excuse/excuse.html'));
// });

app.get("/oversight", (req, res) =>
{
  app.use(express.static(path.join(client_dir, '/oversight')));
  res.sendFile(path.join(client_dir, '/oversight/index.html'));
});

const httpserver = require('http').Server(app);

// create websockets on connection to http server
const io = require('socket.io')(httpserver); // 'io' holds all sockets

// create function which handles what happens if a new socket is created
io.on('connection', (socket) =>
{
  console.log('user connected');
  socket.on("connect_to_game", (number) => {  });
});

const namespace_oversight = io.of("/oversight");

// const debug_stream = require('./debug_stream').debug_stream;
// const game_1_debug_stream = new debug_stream('game_1', namespace_oversight);
// const game_2_debug_stream = new debug_stream('game_2', namespace_oversight);

var game_1 = new Zetti(
  io.of("/game_1")
  /*, game_1_debug_stream*/
);
var game_2 = new Zetti(
  io.of("/game_2")
  /*, game_2_debug_stream*/
);


// port for http server
const port = 80;
httpserver.listen(port, IPaddress, () =>
{
  console.log(`Server is listening on ${IPaddress} : ${port.toString()}`);
});
