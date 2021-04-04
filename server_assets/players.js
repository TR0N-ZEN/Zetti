const { Player } = require("./player");

class Players
{
	constructor() {
		this.list = [];
	}
	static update_points(players)
	{
		for (player of players)
		{
			Player.update_points(player);
			player.socket.emit('info.points.update', player.points);
		}
	}
	static lock(players) { for (player of players) { Player.lock(player); } }
	static unlock(players) { for (player of players) { Player.unlock(player); } }
}

module.exports.Players = Players;