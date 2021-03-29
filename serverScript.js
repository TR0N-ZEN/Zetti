//message from ubuntu
////playingfield and player preparation
const os = require('os');
const mod = require('./mod');
const Player = require('./player').Player;
const Card = require('./card').Card;
const Zetti_field= require('./zetti_field').Zetti_field;
const field = new Zetti_field();
const Clients = require('./clients').Clients;
const clients = new Clients(6);
const already_voted = [];
//add a variable to track who is requested a card at the moment, so if it is the one that has disconnected he gets a request so he can play and the game can
const game_url = '/';
// const IPaddress = '192.168.0.13'; // address for the http server
// const IPaddress = os.networkInterfaces()["wlp4s0"][0]["address"]; // - for dev on laptop
const IPaddress = os.networkInterfaces()["enp2s0"][0]["address"]; // - for dev on laptop
// const IPaddress = '85.214.165.83'; //enter your current ip address inorder to avoid errors
const port = 80; // port for http server

//delay only works in async functions
function delay(milliseconds) {
	return new Promise( (resolve) => {
		setTimeout( () => {
			resolve();
		}, milliseconds);
	});
}

////game functionalities

//EMITTER---------------------------------------------------
/*
 * login.
 *      successful
 *      unsuccessful
 * playerBoard.
 *      update.
 *          names
 *          points
 * vote.
 *      update
 * game.
 *      start
 *      round.start
 *      round.end
 *      trick.start
 *      trick.end
 * card.
 *      distribute //cards on hand
 *      update //card on stack
 * points
 *      .update
 * guess
 *      .update
 * changeCSS
 * */

var go_on = () => { };
async function play_trick(/*array*/players, /*number*/trick_starter_index)
{ // sideeffects only on: playingfield.card_pos_on_stack
	// this function is waiting for resolves triggered in 'io.on('card.toPlayingstack')' by function call 'go_on()'
	console.group("play trick");
	// Requesting the players to put a card to the table.
	for (let i = 0; i < players.length; i++)
	{
		player = players[mod(trick_starter_index + i, players.length)];
		console.log("card.waitingFor " + player.name);
		io.emit('card.waitingFor', player.id);
		player.socket.emit('card.waiting', playingfield.trick.length);
		await new Promise((resolve) => { go_on = resolve; }); // Card is put on playingfield.playingstack in 'io.on('card.toPlayingstack')'.
	}
	return 0;
}
function distribute_cards(/*number*/amount_per_player, /*array*/deck, /*array*/players)
{
	console.log("distribute cards");
	let i = 0;
	for (player of players) {
		for (let j = 0; j < amount_per_player; j++) { player.hand.push(deck[i * amount_per_player + j]); }
		//console.log("to " + player.name + ": " + cards_to_distribute);
		player.socket.emit('card.distribute', JSON.stringify(player.hand));
		i++;
	}
}
function get_random_element(/*array*/array)
{
	let index = mod(Math.floor(Math.random() * array.length), array.length);
	return array[index];
}
var take_next_guess = () => { };
async function take_guesses(/*array*/players, /*number*/starter_index)
{
	console.group("take_guesses");
	for (let i = 0; i < players.length; i++)
	{
		let the_asked_one = players[mod(starter_index + i, players.length)];
		console.log("guess.waitingFor: " + the_asked_one.name);
		io.emit('guess.waitingFor', the_asked_one.id);
		the_asked_one.socket.emit('guess.request');
		await new Promise( (resolve) => {
			take_next_guess = resolve; // resolve can be triggered from outside by function call 'take_next_guess()' in 'io.on('guess.response')';
		});
  }
	console.groupEnd();
	return 0;
}
function to_serve(/*array*/players, /*number*/trick_starter_index, /*array*/trick)
{
	for (let i = 0; i < players.length; i++)
	{
		let c_player = mod(trick_starter_index + i, players.length);
		if (trick[c_player].color != "N")
		{
			return trick[c_player].color; //found color that should be served
		}
	}
	if (color_to_serve === undefined)
	{ //der Only-Enno Fall
		console.log("der Only-Enno Fall");
		console.groupEnd();
		return "N";
	}
}
function calculate_winner(/*array*/players, /*array*/trick, /*number*/trick_starter_index, /*string*/trump_color)
{
	console.group("calculate winner");
	var color_to_serve = to_serve(players, trick_starter_index, trick);
	var high_card_index = 0;
	var high_card = trick[high_card_index];
	for (let i = 0; i < players.length; i++)
	{
		let c_player = mod(trick_starter_index + i, players.length);
		switch(trick[c_player].color)
		{
			case("Z"):
				console.log("der erste Zetti ist geflogen");
				winner_index = c_player;
				console.groupEnd();
				return winner_index;
			case(trump_color):
				console.log("Trump has been played.");
				if (high_card.color != trump_color)
				{
					console.log("Trump has been played for the first time.");
					high_card_index = c_player;
					high_card = trick[high_card_index];
				}
				else if (parseInt(trick[c_player].number, 10) > parseInt(high_card.number, 10))
				{
					high_card_index = c_player;
					high_card = trick[high_card_index];
					console.log("Topped.");
				}
				break;
			case(color_to_serve):
				if (parseInt(trick[c_player].number, 10) > parseInt(high_card.number, 10)) {
					high_card_index = c_player;
					high_card = trick[high_card_index];
					console.log("Topped.");
				}
				break;
			case("N"):
				high_card_index = c_player;
				high_card = trick[c_player];
				break;
		}
	}
	console.groupEnd();
	winner_index = high_card_index;
	return winner_index;
}
function update_points(/*array*/players)
{
	for (player of players) {
		let delta;
		let tricks_won = player.tricks_won;
		if (guess == tricks_won) { delta = 20 + guess*10; }
		else
		{
			delta = (guess - tricks_won)*10;
			if (delta > 0) { delta *= -1; }
		}
		player.points += delta;
		player.socket.emit('points.update', player.points);
		player.guess = 0;
		player.tricks_won = 0;
		player.hand = [];
	}
	io.emit("playerBoard.update", JSON.stringify(Clients.info(players)));
}

async function play_round(/*array*/players, /*object*/playingfield)
{
	console.group("play round " + playingfield.current_round);
	var trump_color = get_random_element(playingfield.colors);
	console.log("trump color: " + trump_color);
	io.emit('game.round.start', /*number*/playingfield.current_round, /*string*/trump_color);
	playingfield.shuffle();
	//await delay(15000); // why though is this line needed, calls of syncronous functions should be awaited the return of that function
	distribute_cards(playingfield.current_round, playingfield.deck, players);
	await take_guesses(players, playingfield.round_starter); // sideeffects on players[i].guesses after "io.on('guess.response')"
	playingfield.winner_index = undefined; //needs to be available between iterations of the following looped block
	while (playingfield.round >= playingfield.current_trick)
	{
		io.emit("game.trick.start");
		// Who is starting to put a card to the field?
		if (playingfield.current_trick == 1) { playingfield.trick_starter = playingfield.round_starter; }
		else { playingfield.trick_starter = playingfield.winner_index; }
		await play_trick(players, playingfield.trick_starter); // appends cards to 'playingfield.trick' in "io.on('card.toPlayingstack')"
		playingfield.winner_index = calculate_winner(players, playingfield.trick, playingfield.trick_starter, trump_color);
		console.log("winner: " + players[playingfield.winner_index].name);
		++players[playingfield.winner_index].tricks_won;
		io.emit('guess.update', /*number*/players[playingfield.winner_index].id, /*number*/players[playingfield.winner_index].guess, /*number*/players[playingfield.winner_index].tricks_won);
		console.groupEnd();
		await delay(3000);
		io.emit("game.trick.end"); //for clearing playingfield from cards on clients
		++playingfield.current_trick;
	}
	update_points(players); //calculate points after each round
	console.groupEnd();
	io.emit('game.round.end');
}
async function showresumee(players)
{
	console.table(players);
	await delay(30000);
}
async function game(players, playingfield)
{
	playingfield.current_round = 1;
	while (playingfield.current_round <= playingfield.total_rounds)
	{
		playingfield.round_starter = mod(playingfield.round_starter + 1, players.length); //rule of starter of first trick in a round is passed in a circle
		play_round(/*array*/players, /*object*/playingfield);
		++playingfield.current_round;
	}
	showresumee(players);
	console.log("process terminating");
}

//Server Setup-------------------------------------------------------------
const express = require('express');
//const { disconnect } = require('process');
const app = express();
const httpsserver = require('http').Server(app);
let io = require('socket.io')(httpsserver); // 'io' holds all sockets
//-------------------------------------------------------------------------
function login(/*string*/name, socket, /*array*/players,/*array*/votes, /*array*/disconnected_players)
{
	if (disconnected_players.length != 0)
	{
		disconnected_players.foreach(player => {
			if (player.name == name)
			{
				Player.by_id(player.id, players).socket = socket;
				return 0;
			}
		});
	}
	if (players.length < 6)
	{
		let new_player = new Player(name, clients.ids, socket);
		players.push(new_player);
		console.log("login.successful");
		console.log(`New Player ${name} logged in.`);
		socket.emit('login.successful', JSON.stringify(new_player.info()));
		io.emit('playerBoard.update', JSON.stringify(Clients.info(players)));
		io.emit('MessageFromServer', name + " logged in.");
		io.emit('vote.update', votes.length, players.length);
	}
	else
	{
		console.log("login.unsuccessful");
		socket.emit('login.unsuccessful');
	}
	console.log("IDs: " + clients.ids);
	return 0;
}
function vote(/*number*/playerid, /*array*/players, /*array*/votes)
{
	console.group("vote");
	if (!votes.includes(playerid))
	{
		console.log("vote accepted");
		io.emit('vote.update', /*number*/votes.push(playerid), /*number*/players.length);
		console.groupEnd();
		if (votes.length == players.length)
		{
			playingfield.game_is_running = true;
			console.log("start game");
			io.emit('game.start');
			setTimeout(() => { playingfield.total_rounds = 60 / players.length; game(players, field); }, 2000);
		}
	}
	else { console.log("vote rejected"); console.groupEnd(); }
}

function disconnected(/*array*/players, /*array*/votes, /*array*/disconnected_players)
{
	console.log('user disconnected');
	for (player of players)
	{
		if (player.socket.id === undefined)
		{
			if (playingfield.game_is_running) {
				io.emit('MessageFromServer', player.name + " lost connection to the game.");
				disconnected_players.push(player);
			}
			else
			{
				io.emit('MessageFromServer', player.name + " left.");
				votes.splice(votes.indexOf(player.id), 1);
				clients.ids[player.id] = 0;
				Player.delete_by_id(player.id, clients.list);
				io.emit('playerBoard.update', JSON.stringify(Clients.info(players)));
				io.emit('vote.update', votes.length, players.length);
			}
			break;
		}
	}
	console.log("IDs: " + clients.ids);
}
function eval_command(string)
{
	switch(string)
	{
		case("SetRounds"):
			var str = message.slice(11);
			var nr = parseInt(str);
			if (nr < 60 / clients.list.length) { playingfield.total_rounds = nr; }
			io.emit('MessageFromServer', `Server: Total rounds ${playingfield.total_rounds}.`)
		case("GetRounds"):
			io.emit('MessageFromServer', `Server: Total rounds ${playingfield.total_rounds}.`)
	}
}
//LISTENER------------------------------------------------------------------------
/*
 * login
 * MessageFromClient
 * vote
 * card
 *      .toPlayingstack
 * guess.
 *      response
 * disconnect
 */
io.on('connection', (socket) => { //parameter of the callbackfunction here called 'socket' is the connection to the client that connected
	//console.log(Object.keys(io.sockets.sockets));
	console.log('a user connected');
	socket.on('toServerConsole', (/*string*/text) => { console.log(text); });
	socket.on('login', (/*string*/name) => { login(name, socket, clients.list, already_voted, clients.left); });
	socket.on('MessageFromClient', (/*string*/message) => { io.emit('MessageFromServer', message); });
	socket.on('Command', (string) => { eval_command(string); });
	socket.on('vote', (/*number*/playerid) => { vote(playerid, clients.list, already_voted); });
	socket.on('card.toPlayingstack', (/*string*/color, /*number*/number, /*number*/player_id) => {
		console.log(color + " " + number);
		let player = Player.by_id(player_id, clients.list);
		for (let i = 0; i < player.hand.length; i++)
		{
			if (player.hand[i].color == color && player.hand[i].number == number)
			{
				player.hand.splice(i, 1);
				let pos_on_stack = playingfield.trick.push(new Card(color, number)) - 1; //position in trick matches position of player who played the card in clients.list
				socket.broadcast.emit('card.update', /*string*/color, /*number*/number, /*number*/pos_on_stack);
				break;
			}
		}
		go_on(); //resolves Promise in async play_trick()'s loop
	});
	socket.on('guess.response', (/*number*/guess, /*number*/id) => { //both numbers in decimal
		player = Player.by_id(id, clients.list)
		player.guess = guess;
		console.log(player.name + " guessed: " + player.guess); 
		io.emit('guess.update', /*number*/player.id, /*number*/player.guess, 0);
		take_next_guess(); //resolves Promise in async take_guesses()'s loop
	});
	socket.on('disconnect', (reason) => { disconnected(clients.list); });
});
app.use(express.static('client'));
app.get(game_url, (req, res) => {
	//let p = 'C:/Users/Ego/source/repos/TR0N-ZEN/Zetti';
	let p = __dirname;
	if (playerList.length < 6 || clients.left.length != 0) { res.sendFile( p + '/client/index.html'); }
	else { res.sendFile( p  + '/client/game_is_full.html'); }
});
httpsserver.listen(port, IPaddress, () => {
  console.log( 'Server is listening on ' + IPaddress + ':' + port.toString() );
});
//console.log(Object.keys(io.sockets.sockets));
//console.log(Object.keys(io.sockets.connected));


//DEBUGING------------------------------------------------------
function changeCSS(element, property, value) { io.emit('changeCSS', element,  property, value); }