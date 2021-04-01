//message from ubuntu
////playingfield and player preparation
const os = require('os');
const mod = require('./mod');
const Player = require('./player').Player;
const Card = require('./card').Card;
const Zetti_field= require('./zetti_field').Zetti_field;
const Clients = require('./clients').Clients;
const commands = require('./commands');
const connection_handling = require('./connection_handling');

let clients = new Clients(6);
let already_voted = [];
let field = {}; 
let game_is_running = {value: false};

// const IPaddress = '192.168.0.13'; // address for the http server
// const IPaddress = os.networkInterfaces()["wlp4s0"][0]["address"]; // - for dev on laptop
const IPaddress = os.networkInterfaces()["enp2s0"][0]["address"]; // - for dev on laptop
// const IPaddress = '85.214.165.83'; //enter your current ip address inorder to avoid errors
const port = 80; // port for http server


//delay only works in async functions
function delay(milliseconds)
{
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
function to_serve(/*array*/trick)
{
	// for (card of trick)
	for (let i = 0; i < trick.length; i++)
	{
		let card = trick[i];
		if (card.color != "N") { return card.color; }// found color that should be served
	}
	// der Only-Enno Fall
	console.log("der Only-Enno Fall");
	return "N";
}
function best_card(/*array*/trick, /*string*/trump)
{
	let color_to_serve = to_serve(trick);
	if (color_to_serve == "N") { return 0; }// der Only-Enno Fall
	let high_card_index = 0;
	let high_card = trick[high_card_index];
	let index = 0;
	for (card of trick)
	{
		switch(card.color)
		{
			case("Z"):
				// console.log("der erste Zetti ist geflogen");
				return index;
			case(trump):
				// console.log("Trump has been played.");
				if (high_card.color != trump)
				{
					// console.log("Trump has been played for the first time.");
					high_card_index = index;
					high_card = card;
				}
				else if (parseInt(card.number, 10) > parseInt(high_card.number, 10))
				{
					high_card_index = index;
					high_card = card;
					// console.log("Topped.");
				}
				break;
			case(color_to_serve):
				if (parseInt(card.number, 10) > parseInt(high_card.number, 10))
				{
					high_card_index = index;
					high_card = card;
					// console.log("Topped.");
				}
				break;
		}
		index++;
	}
	// console.log(high_card_index);
	return high_card_index;
}
function update_points(/*array*/players)
{
	for (player of players) {
		let delta;
		let tricks_won = player.tricks_won;
		let guess = player.guess;
		if (guess == tricks_won) { delta = 20 + guess*10; }
		else
		{
			delta = (guess - tricks_won)*10;
			if (delta > 0) { delta *= -1; }
		}
		player.points += delta;
		player.socket.emit('points.update', player.points);
		// Resetting player attributes for next round;
		player.guess = ""; // not necessary cause it will be overwritten
		player.tricks_won = "";
		player.hand = [];
	}
	io.emit("playerBoard.update", JSON.stringify(Clients.info(players)));
}
var go_on = () => { };
async function play_trick(/*array*/players, /*number*/trick_starter_index, /*array*/trick)
{
	// this function is waiting for resolves triggered in 'io.on('card.toPlayingstack')' by function call 'go_on()'
	console.group("play trick");
	// Requesting the players to put a card to the table.
	for (let i = 0; i < players.length; i++)
	{
		player = players[mod(trick_starter_index + i, players.length)];
		console.log("card.waitingFor " + player.name);
		io.emit('card.waitingFor', player.id);
		player.socket.emit('card.waiting', trick.length);
		await new Promise((resolve) => { go_on = resolve; }); // Card is put on playingfield.playingstack in 'io.on('card.toPlayingstack')'.
	}
	return 0;
}
async function play_round(/*array*/players, /*object*/playingfield, /*int*/round)
{
	console.group(`play round ${round}`);
	let trick = 1;
	let trump = get_random_element(playingfield.colors);
	playingfield.trump = trump;
	console.log(`trump : ${trump}`);
	let starter_index = mod(round - 1, players.length); //needs to be available between iterations of the following looped block
	playingfield.trick_starter_index = starter_index;
	io.emit('game.round.start', /*number*/round, /*string*/trump);
	playingfield.shuffle();
	distribute_cards(round, playingfield.deck, players);
	await take_guesses(players, starter_index); // sideeffects on players[i].guesses after "io.on('guess.response')"
	do
	{
		playingfield.trick_starter_index = starter_index;
		playingfield.current_trick = trick;
		playingfield.trick = [];
		io.emit('game.trick.start');
		await play_trick(players, starter_index, playingfield.trick); // appends cards to 'playingfield.trick' in "io.on('card.toPlayingstack')"
		await delay(5000);
		let winner_index = mod(starter_index + best_card(playingfield.trick, trump), players.length);
		starter_index = winner_index;
		let winner = players[winner_index];
		console.log(`winner: ${winner.name}`);
		++winner.tricks_won;
		io.emit('guess.update', /*number*/winner.id, /*number*/winner.guess, /*number*/winner.tricks_won);
		io.emit('game.trick.end'); //for clearing playingfield from cards on clients
		++trick;
	} while(trick <= round)
	update_points(players); //calculate points after each round
	console.groupEnd();
	io.emit('game.round.end');
}
function clear_game()
{
	//global variables resetted
	clients = new Clients(6);
	already_voted = [];
	field = {}; 
	game_is_running = {value: false};
}
async function showresumee(players)
{
	console.table(players);
	await delay(30000);
}
async function game(players, playingfield)
{
	let round = 1;
	do 
	{
		field.current_round = round;
		await play_round(/*array*/players, /*object*/playingfield, /*int*/round);
		++round;
		await delay(5000);
	} while (round <= playingfield.total_rounds)
	await showresumee(players);
	clear_game(players, playingfield);
	let message = "Please reload the website to login again in order to start a new round :-)";
	io.emit('MessageFromServer', message);
	console.log("process terminating");
}

//Server Setup-------------------------------------------------------------
const express = require('express');
//const { disconnect } = require('process');
const app = express();
const httpsserver = require('http').Server(app);
const io = require('socket.io')(httpsserver); // 'io' holds all sockets
//-------------------------------------------------------------------------
// functions below here use global attributes, so using variables of the global scope without getting those variables fed as arguments: those are io


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
	console.log('a user connected');
	// connection_handling
	socket.on('login', (/*string*/name) => { connection_handling.login(name, socket, /*global object*/clients, /*global object*/already_voted,/*global object*/io, game_is_running ,field); });
	socket.on('vote', (/*number*/playerid) => {
		if (connection_handling.vote(playerid, clients.list, already_voted, io, game_is_running))
		{
			field = new Zetti_field(clients.list.length);
			game(clients.list, field);
		}
	});
	socket.on('disconnect', (reason) => { connection_handling.disconnected(clients, already_voted,io, game_is_running); });
	// command
	socket.on('Command', (string) => { console.log(`Command: ${string}`); commands.eval_command(string, socket, field); });
	// miscellaneous
	socket.on('toServerConsole', (/*string*/text) => { console.log(text); });
	socket.on('MessageFromClient', (/*string*/message) => { io.emit('MessageFromServer', message); });
	socket.on('card.toPlayingstack', (/*string*/color, /*number*/number, /*number*/player_id) => {
		let player = Player.by_id(player_id, clients.list);
		for (let i = 0; i < player.hand.length; i++)
		{
			if (player.hand[i].color == color && player.hand[i].number == number)
			{
				player.hand.splice(i, 1);
				let pos_on_stack = field.trick.push(new Card(color, number)) - 1; //position in trick matches position of player who played the card in clients.list
				console.log(`card.update: ${color} ${number} on position ${pos_on_stack} by ${player.name}`);
				socket.broadcast.emit('card.update', /*string*/color, /*number*/number, /*number*/pos_on_stack);
				break;
			}
			else { console.log("card not found"); }
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
});

app.get("/", (req, res) => {
	app.use(express.static('client/game'));
	//let p = 'C:/Users/Ego/source/repos/TR0N-ZEN/Zetti';
	let p = __dirname;
	if (clients.list.length < 6 || clients.left.length != 0) { res.sendFile( p + '/client/game/index.html'); }
	else { res.sendFile( p  + '/client/game/game_is_full.html'); }
});
app.get("/help", (req, res) => {
	app.use(express.static('client/help'));
	res.sendFile(__dirname + '/client/help/help.html');
});
app.get("/overview", (req, res) => {
	app.use(express.static('client/overview'));
	res.sendFile(__dirname + '/client/overview/overview.html');
});
httpsserver.listen(port, IPaddress, () => {
  console.log( 'Server is listening on ' + IPaddress + ':' + port.toString() );
});
//console.log(Object.keys(io.sockets.sockets));
//console.log(Object.keys(io.sockets.connected));


//DEBUGING------------------------------------------------------
function changeCSS(element, property, value) { io.emit('changeCSS', element,  property, value); }