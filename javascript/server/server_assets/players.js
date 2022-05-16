const Player = require("./player").Player;

class Players
{
  constructor() {
    this.list = [];
  }
  static update_points(players)
  {
    //for (player of players)
    //{
    for (let a = 0; a < players.length; a++) {  let player = players[a];
      Player.update_points(player);
      player.socket.emit('info.points.update', player.points);
    }
  }
  static prep_for_round(players)
  {
    //for (player of players)
    //{
    for (let a = 0; a < players.length; a++) {  let player = players[a];
      Player.prep_for_round(player);
    }
  }
}

module.exports.Players = Players;