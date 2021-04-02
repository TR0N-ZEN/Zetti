const Player = require('./player').Player;
const Clients = require('./clients').Clients;

function login(/*string*/name, socket, /*array*/clients, /*array*/votes, io, game_is_running, playingfield = undefined)
{
	let players = clients.list;
	let ids = clients.ids;
	let disconnected_players = clients.left;
	console.log(`Login attempt by ${name}`);
	if (disconnected_players.length != 0)
	{
		disconnected_players.forEach((player, index) => {
			console.log(`${player.name}`);
			if (player.name == name)
			{
				disconnected_players.splice(index, 1);
				Player.by_id(player.id, players).socket = socket;
				socket.emit('login.successful', JSON.stringify(player.info()));
				socket.emit('game.start');
				socket.emit('game.round.start', /*number*/playingfield.current_round, /*string*/playingfield.trump);
				socket.emit('info.points.update', /*number*/player.points);
				socket.emit('info.guess.update', /*number*/(player.guess-player.tricks_won));
				socket.emit('playerBoard.update', JSON.stringify(Clients.info(players)));
				socket.emit('card.distribute', JSON.stringify(player.hand));
				if (playingfield.waiting_for_card != undefined) { socket.emit('card.waitingFor', playingfield.waiting_for_card); }
				else if (playingfield.waiting_for_guess != undefined) { socket.emit('guess.waitingFor', playingfield.waiting_for_guess); }
				if (playingfield.waiting_for_card == player.id) { socket.emit(`card.request`); }
				else if (playingfield.waiting_for_guess == player.id) { socket.emit(`guess.request`); }
				console.log(`${player.name} reconnected.`);
				//return 0;
			}
		});
	}
	if (!game_is_running.value && players.length < 6)
	{
		let new_player = new Player(name, ids, socket);
		players.push(new_player);
		console.log(`New Player ${name} logged in.`);
		socket.emit('login.successful', JSON.stringify(new_player.info()));
		io.emit('playerBoard.update', JSON.stringify(Clients.info(players)));
		io.emit('MessageFromServer', name + " logged in.");
		io.emit('vote.update', votes.length, players.length);
	}
	else if (game_is_running.value || players.length == 6)
	{
		console.log("login.unsuccessful");
		socket.emit('login.unsuccessful');
	}
	return 0;
}
function vote(/*number*/playerid, /*array*/players, /*array*/votes, io, game_is_running)
{
	console.group("vote");
	if (!votes.includes(playerid))
	{
		console.log("vote accepted");
		io.emit('vote.update', /*number*/votes.push(playerid), /*number*/players.length);
		console.groupEnd();
		if (votes.length == players.length)
		{
			game_is_running.value = true;
			console.log("start game");
			io.emit('game.start');
			return true;
		}
	}
	else { console.log("vote rejected"); console.groupEnd(); return false; }
}
function disconnected(/*array*/clients, /*array*/votes, io, game_is_running)
{
	let players = clients.list;
	let ids = clients.ids;
	let disconnected_players = clients.left;
	console.log('user disconnected');
	for (player of players)
	{
		if (!player.socket.connected)
		{
			if (game_is_running.value)
			{
				io.emit('MessageFromServer', player.name + " lost connection to the game.");
				disconnected_players.push(player);
			}
			else
			{
				io.emit('MessageFromServer', player.name + " left.");
				votes.splice(votes.indexOf(player.id), 1);
				ids[player.id] = 0;
				Player.delete_by_id(player.id, players);
				io.emit('playerBoard.update', JSON.stringify(Clients.info(players)));
				io.emit('vote.update', votes.length, players.length);
			}
			break;
		}
	}
}

module.exports.login = login;
module.exports.vote = vote;
module.exports.disconnected = disconnected;
