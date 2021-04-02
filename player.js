const Client = require('./client').Client;

class Player extends Client {
	constructor(name, ids, socket = undefined) {
		super(socket)
		this.name = name;
		this.points = undefined;
		this.guess = undefined;
		this.hand = [];
		this.tricks_won = 0;
		this.id = Player.getID(ids);
	}
	info()
		{
			let player = Object.assign({}, this);
			delete player.socket;
			delete player.hand;
			return player;
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
	static delete_by_socket_id(socket_id, players) {
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