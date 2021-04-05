const Client = require('./client').Client;

class Player extends Client
{
	constructor (name, ids, socket = undefined)
	{
		super(socket)
		this.name = name;
		this.points = undefined;
		this.guess = undefined;
		this.tricks_won = undefined;
		this.hand = [];
		this.id = Player.getID(ids);
	}
	info ()
		{
			let player = Object.assign({}, this);
			delete player.socket;
			delete player.hand;
			return player;
		}
	static lock(player)
	{
		player.guess = undefined; // not necessary cause it will be overwritten
		player.tricks_won = undefined;
		player.hand = [];
	}
	static unlock(player)
	{
		player.points = 0;
		player.guess = 0;
		player.tricks_won = 0;
	}
	static getID(ids)
	{
		for (let i = 0; i<ids.length; i++)
		{
			if (ids[i] == 0)
			{
				ids[i] = 1;
				return i;
			}
		}
	}
	static update_points(player)
	{
		let delta = player.guess - player.tricks_won;
		console.log(`Player ${player.name}:\n\tguess: ${player.guess}\n\ttricks_won: ${player.tricks_won}\n has delta ${delta}.`);
		if (delta == 0) { player.points = (20 + player.tricks_won*10) + player.points; }
		else
		{
			if (delta > 0) { delta *= (-1); }
			player.points = (delta*10) + player.points;
		}
		console.log(`\tpoints: ${player.points}`);
	}
	static by_id (id, players)
	{
		for (player of players) { if (player.id == id) { return player }}
	}
	static index_by_socket_id (socket_id, players)
	{
  	for (let index = 0; index < players.length; index++) {
     if ( players[index].socket.id == socket_id ) { return index; }
    }
  }
	static delete_by_socket_id (socket_id, players) {
		let index = this.index_by_socket_id(socket_id, players);
		if (typeof(index) !== 'undefined') {
			players.splice(index, 1);
			return true;
		}
		return false;
	}
	static index_by_id (player_id, players) {
		for (let index = 0; index < players.length; index++) {
			if ( players[index].id == player_id ) { return index; }
		}
	}
	static delete_by_id (id, players) //maybe need to delete keyword 'static'
	{
		let index = this.index_by_id(id, players);
		if (typeof(index) !== 'undefined')
		{
			players.splice(index, 1);
			return true;
		}
		return false;
	}
}

module.exports.Player = Player;