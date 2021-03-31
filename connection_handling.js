const Player = require('./player');
const Clients = require('./clients');

function login(/*string*/name, socket, /*array*/players, /*array*/votes, /*array*/disconnected_players, io)
{
	if (disconnected_players.length != 0)
	{
		disconnected_players.forEach((player, index) => {
			if (player.name == name)
			{
				disconnected_players.splice(index, 1);
				Player.by_id(player.id, players).socket = socket;
				return 0;
			}
		});
	}
	if (players.length < 6)
	{
		let new_player = new Player(name, clients.ids, socket);
		players.push(new_player);
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
	return 0;
}
function vote(/*number*/playerid, /*array*/players, /*array*/votes, io)
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
function disconnected(/*array*/players, /*array*/votes, /*array*/disconnected_players, ids, io)
{
	console.log('user disconnected');
	for (player of players)
	{
		if (!player.socket.connected)
		{
			if (game_is_running.value) {
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
