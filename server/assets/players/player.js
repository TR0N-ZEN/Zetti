const Client = require('./clients/client.js').Client;

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
  
  /**
   * 
   * @returns copy of the playerobject without .socket and .hand attribute
   */
  info ()
  {
    let player = Object.assign({}, this);
    delete player.socket;
    delete player.hand;
    return player;
  }

  /**
   * Reset .guess, .tricks_won and .hand to neutral
   * @param {Object} player 
   */
  static prep_for_round(player)
  {
    player.guess = undefined;
    player.tricks_won = 0;
    player.hand = [];
  }
  
  /**
   * Get id for a player
   * @param {number[]} ids array of zeros and ones
   * @returns {number} index of the zero changed to a one in the array
   */
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
  
  /**
   * calculate point won or lost through the just ending round
   * @param {Object} player 
   */
  static update_points(player)
  {
    //console.log(`Player ${player.name}:\n\tguess: ${player.guess}\n\ttricks_won: ${player.tricks_won}.`);
    let delta = player.guess - player.tricks_won;
    if (delta == 0) { delta = 20 + player.tricks_won*10; }
    else
    {
      if (delta > 0) { delta *= (-1); }
      delta = (delta*10);
    }
    player.points += delta;
    //console.log(`\thas delta ${delta}\n\tpoints: ${player.points}`);
  }
  
  /**
   * 
   * @param {number} id 
   * @param {Object[]} players 
   * @returns reference to player object inside players that has the id
   */
  static by_id (id, players)
  {
    //for (player of players)
    for (let a = 0; a < players.length; a++)
    {
      let player = players[a];
      if (player.id == id) { return player } }
  }

  /**
   * 
   * @param {Object} player 
   */
  static update_points_branchless(player)
  {
    //console.log(`Player ${player.name}:\n\tguess: ${player.guess}\n\ttricks_won: ${player.tricks_won}.`);
    let delta = player.guess - player.tricks_won;
    delta = (delta==0)*(20 + player.tricks_won*10) +
            (delta>0)*delta*(-10) +
            (delta<0)*delta*10;
    player.points += delta;
    //console.log(`\thas delta ${delta}\n\tpoints: ${player.points}`);
  }

  /**
   * 
   * @param {String} socket_id 
   * @param {Objects[]} players 
   * @returns {number}index
   */
  static index_by_socket_id(socket_id, players)
  {
    for (let index = 0; index < players.length; index++) {
      if ( players[index].socket.id == socket_id ) { return index; }
    }
  }

  /**
   * 
   * @param {String} socket_id 
   * @param {Object[]} players 
   * @returns boolean value that indicates success of operation
   */
  static delete_by_socket_id(socket_id, players) {
    let index = this.index_by_socket_id(socket_id, players);
    if (typeof(index) !== 'undefined') {
      players.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * 
   * @param {String} player_id 
   * @param {Object[]} players 
   * @returns index of player which has player_id as id
   */
  static index_by_id(player_id, players) {
    for (let index = 0; index < players.length; index++) {
      if ( players[index].id == player_id ) { return index; }
    }
  }
  
  /**
   * maybe need to delete keyword 'static'
   * @param {String} id 
   * @param {Object[]} players 
   * @returns boolean indicating  
   */
  static delete_by_id(id, players)
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