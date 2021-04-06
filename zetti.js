const mod = require('./tools/mod').mod;
const get_random_element = require('./tools/get_random_element').get_random_element;
const delay = require('./tools/delay').delay;

const Player = require('./server_assets/player').Player;
const Players = require('./server_assets/players').Players;
const Card = require('./game_props/card').Card;
const Zetti_field= require('./game_props/zetti_field').Zetti_field;
const Clients = require('./server_assets/clients').Clients;
const commands = require('./commands');
const connection_handling = require('./connection_handling');

class Zetti
{
	constructor(game_io)
	{
		let clients = new Clients(6, new Players().list);
		let already_voted = [];
		/*exposed*/let game_is_running = {value: false};
		let field = {};
		var take_next_guess = () => { };
		var go_on = () => { };
		//LISTENERS------------------------------------------------------------------------
		/*
		* login
		* MessageFromClient
		* vote
		* card
		*	.toPlayingstack
		* guess.
		* 	.response
		* disconnect
		*/
		game_io.on('connection', (socket) => { //parameter of the callbackfunction here called 'socket' is the connection to the client that connected
			console.log('a user connected');
			// connection_handling
			socket.on('login', (/*string*/name) => { connection_handling.login(name, socket, /*global object*/clients, /*global object*/already_voted, /*global object*/game_io, game_is_running ,field); });
			socket.on('vote', (/*number*/playerid) => {
				if (connection_handling.vote(playerid, clients.list, already_voted, game_io, game_is_running))
				{
					/*global variable*/ field = new Zetti_field(clients.list.length);
					/*global variable*/ game(clients.list, field);
				}
			});
			socket.on('disconnect', (reason) => { connection_handling.disconnected(clients, already_voted, /*global object*/game_io, game_is_running); });
			// command
			socket.on('Command', (string) => { console.log(`Command: ${string}`); commands.eval_command(string, /*global object*/game_io, field); });
			socket.on('changeCSS', (element_selector, property, value) => { changeCSS(element_selector, property, value, undefined, socket); });
			// miscellaneous
			socket.on('toServerConsole', (/*string*/text) => { console.log(text); });
			socket.on('MessageFromClient', (/*string*/message) => { game_io.emit('MessageFromServer', message); });
			socket.on('card.toPlayingstack', (/*string*/color, /*number*/number, /*number*/player_id) => {
				let pos_on_stack = CardtoPlayingstack(/*string*/color, /*number*/number, /*number*/player_id);
				socket.broadcast.emit('card.update', /*string*/color, /*number*/number, /*number*/pos_on_stack);
				go_on(); //resolves Promise in async play_trick()'s loop
			});
			socket.on('guess.response', (/*number*/guess, /*number*/id) => { //both numbers in decimal
				if (id == field.waiting_for_guess)
				{
					player = Player.by_id(id, clients.list)
					player.guess = guess;
					/*constantly redifined global */ take_next_guess(); //resolves Promise in async take_guesses()'s loop	
				}
			});
		});
	}
	clear_game()
	{
		//global variables resetted
		/*global variable*/ clients = new Clients(6, new Players().list);
		/*global variable*/ already_voted = [];
		/*global variable*/ field = {}; 
		/*global variable*/ game_is_running = { value: false };
	}
	//EMITTER---------------------------------------------------
	/*
	* login.
	* 	successful
	*	unsuccessful
	* playerboard.
	*	update
	* 	names
	*	points
	* vote.
	*	update
	* game.
	*	start
	*	round
	* 		.start
	*		.end
	* trick
	* 	.start
	*	.end
	* card.
	*	distribute //cards on hand
	*	update //card on stack
	* points
	*	.update
	* guess
	*	.update
	* changeCSS
	* */
	//LISTENERS------------------------------------------------------------------------
	/*
	* login
	* MessageFromClient
	* vote
	* card
	*	.toPlayingstack
	* guess.
	* 	.response
	* disconnect
	*/

	distribute_cards(/*number*/amount_per_player, /*array*/deck, /*array*/players)
	{
		console.log("distribute cards");
		let i = 0;
		for (player of players)
		{
			for (let j = 0; j < amount_per_player; j++) { player.hand.push(deck[i * amount_per_player + j]); }
			player.socket.emit('card.distribute', JSON.stringify(player.hand));
			i++;
		}
	}
	async take_guesses(/*array*/players, /*number*/starter_index, playingfield)
	{
		console.group("take_guesses");
		for (let i = 0; i < players.length; i++)
		{
			let player = players[mod(starter_index + i, players.length)];
			console.log(`guess.waitingFor: ${player.name}`);
			game_io.emit('guess.waitingFor', player.id);
			player.socket.emit('guess.request');
			/*global variable*/ playingfield.waiting_for_guess = player.id;
			await new Promise( (resolve) => {
				/*global variable*/ take_next_guess = resolve; // resolve can be triggered from outside by  call 'take_next_guess()' in 'game_io.on('guess.response')';
			});
			console.log(`${player.name} guessed: ${player.guess}`); 
			/*global variable*/game_io.emit('playerboard.guess.update', /*number*/player.id, /*number*/player.guess, 0);
		}
		console.groupEnd();
		/*global variable*/ playingfield.waiting_for_guess = undefined;
		return 0;
	}
	to_serve(/*array*/trick)
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
	best_card(/*array*/trick, /*string*/trump)
	{
		let color_to_serve = to_serve(trick);
		if (color_to_serve == "N") { return 0; }// der Only-Enno Fall
		let high_card_index = 0;
		let high_card = trick[high_card_index];
		let index = 0;
		let trump_played = false;
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
						trump_played = true;
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
					if (trump_played && parseInt(card.number, 10) > parseInt(high_card.number, 10))
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
	async play_trick(/*array*/players, /*number*/trick_starter_index, /*array*/trick)
	{
		// this  is waiting for resolves triggered in 'game_io.on('card.toPlayingstack')' by  call 'go_on()'
		console.group("play trick");
		// Requesting the players to put a card to the table.
		for (let i = 0; i < players.length; i++)
		{
			player = players[mod(trick_starter_index + i, players.length)];
			console.log(`card.waitingFor  ${player.name}`);
			/*global variable*/game_io.emit('card.waitingFor', player.id);
			player.socket.emit('card.request', trick.length);
			/*global variable*/ field.waiting_for_card = player.id;
			await new Promise((resolve) => { go_on = resolve; }); // Card is put on playingfield.playingstack in 'game_io.on('card.toPlayingstack')'.
		}
		console.groupEnd();
		/*global variable*/ field.waiting_for_card = undefined;
		return 0;
	}
	async play_round(/*array*/players, /*object*/playingfield, /*int*/round, trump, trick = 1)
	{
		console.group(`play round ${round}`);
		/*global variable*/ playingfield.current_trick = trick;
		let starter_index = mod((round - 1), players.length); //needs to be available between iterations of the following looped block
		/*global variable*/ playingfield.trick_starter_index = starter_index;
		game_io.emit('game.round.start', /*number*/round, /*string*/trump);
		Players.prep_for_round(players);
		console.log("after prep_for_round(): ");
		console.table(players);
		playingfield.shuffle();
		/*global variable*/ distribute_cards(round, playingfield.deck, players);
		/*global variable*/ await take_guesses(players, starter_index, playingfield); // sideeffects on players[i].guesses after "game_io.on('guess.response')"
		console.log("after take_guesses(): ");
		console.table(players);
		do
		{
			/*global variable*/ playingfield.trick = [];
			game_io.emit('game.trick.start');
			/*global variable*/ await play_trick(players, starter_index, playingfield.trick); // appends cards to 'playingfield.trick' in "game_io.on('card.toPlayingstack')"
			let winner_index = mod(starter_index + best_card(playingfield.trick, trump), players.length);
			let winner = players[winner_index];
			++winner.tricks_won;
			console.log(`winner: ${winner.name}`);
			await delay(500);
			game_io.emit('playerboard.guess.update', /*number*/winner.id, /*number*/winner.guess, /*number*/winner.tricks_won);
			winner.socket.emit('info.guess.update', (winner.guess - winner.tricks_won)); // updates the winner's "Noch zu holen: " field
			await delay(1500);
			game_io.emit('game.trick.end'); //for clearing playingfield from cards on clients
			starter_index = winner_index;
			/*global variable*/ playingfield.trick_starter_index = starter_index;
			++trick;
			/*global variable*/ playingfield.current_trick = trick;
		} while(trick <= round)
		game_io.emit('info.guess.update');
		/*global variable*/ Players.update_points(players); //calculate points after each round
		console.log("After update_points(): ");
		console.table(players);
		game_io.emit("playerboard.update", JSON.stringify(Clients.info(players)));
		console.groupEnd();
		game_io.emit('game.round.end');
	}
	async showresumee(players)
	{
		console.log("Resumee");
		console.table(players);
		await delay(30000);
	}
	async game(players, playingfield, round = 1)
	{
		console.log("After game(): ");
		console.table(players);
		for (player of players) {	player.points = 0; }
		console.log("After prep_for_game(): ");
		console.table(players);
		playingfield.current_round = round;
		do 
		{
			let trump = get_random_element(playingfield.colors);
			/*global variable*/ playingfield.trump = trump;
			console.log(`trump : ${trump}`);
			await play_round(/*array*/players, /*object*/playingfield, /*int*/round, trump);
			++round;
			playingfield.current_round = round;
			await delay(5000);
		} while (round <= playingfield.total_rounds)
		await showresumee(players);
		clear_game(players, playingfield);
		let message = "Please reload the website to login again in order to start a new round :-)";
		game_io.emit('MessageFromServer', message);
		console.log("process terminating");
	}
	CardtoPlayingstack(/*string*/color, /*number*/number, /*number*/player_id)
	{
		let player = Player.by_id(player_id, clients.list);
			for (let i = 0; i < player.hand.length; i++)
			{
				if (player.hand[i].color == color && player.hand[i].number == number)
				{
					player.hand.splice(i, 1);
					let pos_on_stack = field.trick.push(new Card(color, number)) - 1; //position in trick matches position of player who played the card in clients.list
					console.log(`card.update: ${color} ${number} on position ${pos_on_stack} by ${player.name}`);
					return pos_on_stack;
					//break;
				}
			}
	}

	//Server Setup-------------------------------------------------------------
	
	//-------------------------------------------------------------------------
	// functions below here use global attributes, so using variables of the global scope without getting those variables fed as arguments: those are io
	//DEBUGING------------------------------------------------------
	 changeCSS(element_selector, property, value, player_id, player_socket = undefined)
	{
		if (player_socket == undefined)
		{
			let player = Player.by_id(player_id, /*global variable*/ clients.list);
			player.socket.emit('changeCSS', element_selector,  property, value);
		}
		else if (player_id == undefined)
		{
			player_socket.emit('changeCSS', element_selector,  property, value);
		}
	}
}

module.exports.Zetti = Zetti;