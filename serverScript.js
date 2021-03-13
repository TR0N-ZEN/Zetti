//message from ubuntu
////playingfield and player preparation
const mod = require('./mod');
const Player = require('./player').Player;
var IDs = require('./player').IDs;
const Card = require('./card').Card;
const Field = require('./field').Field;
const playerList = [];
const already_voted = [];
var cardIndex = 0;
const colors = ["red", "green", "blue", "yellow"];
var game_is_running = false;
const recently_left = []; //can only be filled if game is running
//add a variable to track who is requested a card at the moment, so if it is the one that has disconnected he gets a request so he can play and the game can


var playingfield = new Field(60);

for (color of colors) {
	for (let i = 1; i < 14; i++) {
		playingfield.deck[cardIndex] = new Card(color, i);
		++cardIndex;
	}
}
for (let i = 0; i < 4; i++) {
	playingfield.deck[cardIndex] = new Card("Z", i); //Zauberer; each card needs to have unique properties
	++cardIndex;
}
for (let i = 0; i < 4; i++) {
	playingfield.deck[cardIndex] = new Card("N", i); //Narren each card needs to have unique properties
	++cardIndex;
}

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
var current_player = 0;
var last_winner_index = undefined;
var trick_starter;
var trick = [];
async function play_trick(/*array*/players, /*number*/trick_starter_index)
{ // sideeffects only on: playingfield.card_pos_on_stack
	// this function is waiting for resolves triggered in 'io.on('card.toPlayingstack')' by function call 'go_on()'
	console.group("play trick");
	// Requesting the players to put a card to the table.
	for (let i = 0; i < players.length; i++)
	{
		go_on = () => { };
		current = mod(trick_starter_index + i, players.length);
		playingfield.card_pos_on_stack = i; // sideeffect for visual representation for clients
		console.log("card.waitingFor " + players[current].name);
		io.emit('card.waitingFor', players[current].id);
		let socket_id = players[current].socket_id;
		io.to(socket_id).emit('card.waiting', playingfield.card_pos_on_stack);
		await new Promise((resolve) => { go_on = resolve; }); // Card is put on playingfield.playingstack in 'io.on('card.toPlayingstack')'.
	}
	return 0;
}
function distribute_cards(/*number*/amount_per_player, /*array*/deck, /*array*/players)
{
	console.log("distribute cards");
	for (let i = 0; i < players.length; i++) {
		let socket_id = players[i].socket_id;
		for (let j = 0; j < amount_per_player; j++) {
			players[i].hand.push(deck[i * amount_per_player + j]);
		}
		//console.log("to " + players[i].name + ": " + cards_to_distribute);
		io.to(socket_id).emit('card.distribute', JSON.stringify(players[i].hand));
	}
}
function get_random_element(/*array*/array)
{
	let index = Math.floor(Math.random() * array.length);
	if (index == array.length) { index = array.length - 1; }
	return array[index];
}
async function take_guesses(/*array*/players, /*number*/starter_index)
{
	console.group("take_guesses");
	for (let i = 0; i < players.length; i++)
	{
		let the_asked_one = mod(starter_index + i, players.length);
		console.log("guess.waitingFor: " + players[the_asked_one].name);
		io.emit('guess.waitingFor', players[the_asked_one].id);
		io.to(players[the_asked_one].socket_id).emit('guess.request');
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
		switch(trick[c_player].color) {
			case("Z"):
				console.log("der erste Zetti ist geflogen");
				last_winner_index = c_player;
				console.groupEnd();
				return last_winner_index;
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
	last_winner_index = high_card_index;
	return last_winner_index;
}
function update_points(/*array*/players)
{
	for (let i = 0; i < players.length; i++) {
		let delta;
		let guess = players[i].guess;
		let tricks_won = players[i].tricks_won;
		if (guess == tricks_won)
		{
			delta = 20 + guess*10;
		}
		else
		{
			delta = (guess - tricks_won)*10;
			if (delta > 0) { delta *= -1; }
		}
		players[i].points += delta;
		io.to(players[i].socket_id).emit('points.update', players[i].points);
		players[i].guess = 0;
		players[i].tricks_won = 0;
		players[i].hand = [];
		console.group(players[i].name);
		console.log("guessed: " + guess.toString() + "\nwon: " + tricks_won.toString() +  "\ndelta_in_points: " + delta.toString());
		console.groupEnd();
	}
	let points = new Array(players.length);
	for (let i = 0; i < players.length; i++) {
		points[i] = players[i].points;
	}
	io.emit("playerBoard.update.points", JSON.stringify(points));
}

async function play_round(/*number*/round, /*array*/players, /*object*/playingfield, /*number*/round_starter)
{
	console.group("play round " + round);
	trump_color = get_random_element(colors);
	console.log("trump color: " + trump_color);
	io.emit('game.round.start', /*number*/round, /*string*/trump_color);
	playingfield.shuffle();
	//await delay(1500); // why though is this line needed, calls of syncronous functions should be awaited the return of that function
	distribute_cards(round, playingfield.deck, players);
	await take_guesses(players, round_starter); // sideeffects on players[i].guesses after "io.on('guess.response')"
	var winner_index = undefined; //needs to be available between iterations of the following looped block
	for (let trick_number = 1; trick_number <= round; trick_number++)
	{
		io.emit("game.trick.start");
		// Who is starting to put a card to the field?
		if (trick_number == 1) { trick_starter = round_starter; }
		else { trick_starter = winner_index; }
		await play_trick(players, trick_starter); // appends cards to 'playingfield.playingstack' in "io.on('card.toPlayingstack')"
		winner_index = calculate_winner(players, trick, trick_starter, trump_color);
		console.log("winner: " + players[winner_index].name);
		++players[winner_index].tricks_won;
		io.emit('guess.update', /*number*/players[winner_index].id, /*number*/players[winner_index].guess, /*number*/players[winner_index].tricks_won);
		console.groupEnd();
		await new Promise((resolve) => {
			setTimeout( () => {
					io.emit("game.trick.end"); //for clearing playingfield from cards on clients
					resolve();
			}, 3000);
		});
	}
	update_points(players); //calculate points after each round
	console.groupEnd();
	io.emit('game.round.end');
	if (round < (60 / players.length))
	{
		round_starter = mod(round_starter + 1, players.length); //rule of starter of first trick in a round is passed in a circle
		setTimeout(() => {
				play_round(/*number*/++round, /*array*/players, /*object*/playingfield, /*number*/round_starter);
		}, 6000);
	}
	else
	{
		console.log("END\n20 seconds until process terminates");
		await delay(20000);
		console.log("process terminating");
		//showresumee();
	}
}

//Server Setup-------------------------------------------------------------
const express = require('express');
//const { disconnect } = require('process');
const app = express();
const httpsserver = require('http').Server(app);
let io = require('socket.io')(httpsserver); // 'io' holds all sockets
const IPaddress = '192.168.178.3';//'85.214.165.83'; //enter your current ip address inorder to avoid errors
const port = 80;
//-------------------------------------------------------------------------
function login(/*string*/name, /*string*/socketid, playerList, already_voted)
{
	if (recently_left.length != 0) {
		for (let a = 0; a < recently_left.length; a++) {
			if (name == recently_left[a].name) {
				for (let b = 0; b < playerList.length; b++) {
					playerList[recently_left[a].index].socket_id = socketid;
				}
			}
		}
	}
	else if (playerList.length < 6 && playerList)
	{
		playerList.push(new Player(name, socketid));
		playerList[playerList.length - 1].index = playerList.length - 1;
		console.log("login.successful");
		io.to(socketid).emit('login.successful', JSON.stringify(playerList[playerList.length - 1]));
		let names = new Array(playerList.length);
		let ids = new Array(playerList.length);
		for (let a = 0; a < playerList.length; a++)
		{
			names[a] = playerList[a].name;
			ids[a] = playerList[a].id;
		}
		io.emit('playerBoard.update.names', JSON.stringify(names), JSON.stringify(ids));
		io.emit('MessageFromServer', playerList[playerList.length - 1].name + " logged in.");
		io.emit('vote.update', already_voted.length, playerList.length);
		console.log(names);
		console.log("New Player " + playerList[playerList.length - 1].name + " logged in.");
	}
	else
	{
		console.log("login.unsuccessful");
		io.to(socketid).emit('login.unsuccessful');
	}
	console.log("IDs: " + IDs);
}
function vote(/*number*/playerid, playerList, already_voted)
{
	console.group("vote");
	if (!already_voted.includes(playerid))
	{
		console.log("vote accepted");
		already_voted.push(playerid);
		io.emit('vote.update', /*number*/already_voted.length, /*number*/playerList.length);
		console.groupEnd();
		if (already_voted.length == playerList.length)
		{
			game_is_running = true;
			console.log("start game");
			io.emit('game.start');
			setTimeout(() => { play_round(1); }, 2000);
		}
	}
	else { console.log("vote rejected"); console.groupEnd(); }
}
function disconnected()
{
	console.log('user disconnected');
	for (let i = 0; i < playerList.length; i++)
	{
		if (io.of('/').sockets[playerList[i].socket_id] === undefined)
		{
			if (game_is_running)
			{
				recently_left.push(playerList[i]);
			}
			else
			{
				io.emit('MessageFromServer', playerList[i].name + " left.")
				already_voted.splice(already_voted.indexOf(playerList[i].id), 1);
				IDs[playerList[i].id] = 0;
				playerList.splice(i, 1);
				let names = new Array(playerList.length);
				let ids = new Array(playerList.length);
				for (let a = 0; a < playerList.length; a++)
				{
					names[a] = playerList[a].name;
					ids[a] = playerList[a].id;
				}
				io.emit('playerBoard.update.names', JSON.stringify(names), JSON.stringify(ids));
				io.emit('vote.update', already_voted.length, playerList.length);
			}
			break;
		}
	}
	console.log("IDs: " + IDs);
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
	socket.on('login', (/*string*/name) => { login(name, socket.id, playerList, already_voted); });
	socket.on('MessageFromClient', (/*string*/message) => { io.emit('MessageFromServer', message); });
	socket.on('vote', (/*number*/playerid) => { vote(playerid, playerList, already_voted); });
	socket.on('card.toPlayingstack', (/*string*/color, /*number*/number, /*number*/playerINDEX) => {
		console.log(color + " " + number);
		trick.push(new Card(color, number)); //position in trick matches position of player who played the card in playerList
		for (let i = 0; i < playerList[playerINDEX].hand.length; i++)
		{
			if (playerList[playerINDEX].hand[i].color == color && playerList[playerINDEX].hand[i].number == number)
			{
				playerList[playerINDEX].hand.splice(i, 1);
			}
		}
		socket.broadcast.emit('card.update', /*string*/color, /*number*/number, /*number*/playingfield.card_pos_on_stack);
		go_on(); //resolves Promise in async play_trick()'s loop
	});
	socket.on('guess.response', (/*number*/guess, /*number*/index) => { //both numbers in decimal
		playerList[index].guess = guess;
		console.log(playerList[index].name + " guessed from object: " + playerList[index].guess);
		io.emit('guess.update', /*number*/playerList[index].id, /*number*/guess, 0);
		take_next_guess(); //resolves Promise in async take_guesses()'s loop
	});
	socket.on('disconnect', (reason) => { disconnected(); });
});
app.use(express.static('client'));
app.get('/', (req, res) => {
	//let p = 'C:/Users/Ego/source/repos/TR0N-ZEN/Zetti';
	let p = __dirname;
	if (playerList.length < 6 || recently_left.length != 0) { res.sendFile( p + '/client/index.html'); }
	else { res.sendFile( p  + '/client/game_is_full.html'); }
});
httpsserver.listen(port, IPaddress, () => {
  console.log( 'Server is listening on ' + IPaddress + ':' + port.toString() );
});
//console.log(Object.keys(io.sockets.sockets));
//console.log(Object.keys(io.sockets.connected));


//DEBUGING------------------------------------------------------
function changeCSS(element, property, value) { io.emit('changeCSS', element,  property, value); }