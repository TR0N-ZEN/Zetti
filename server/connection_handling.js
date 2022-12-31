const Player = require('./assets/players/player').Player;
const Clients = require('./assets/players/clients/clients').Clients;







/**
 *
 * @param {string} name
 * @param {any} socket provided by socket.io
 * @param {any} clients
 * @param {any} votes
 * @param {any} io
 * @param {boolean} game_is_running
 * @param {any} playingfield
 * @returns {number} 0
 */
function login(
  name,
  socket,
  clients,
  votes,
  io,
  game_is_running,
  playingfield = undefined
)
{
  // local pointers to attributes
  let players = clients.list;
  let ids = clients.ids;
  let disconnected_players = clients.left;
  
  // console.log(`Login attempt by ${name}`);
  
  // reconnect player who just timed out network wise
  // TODO: is check for length of 0 necassary?
  if (disconnected_players.length != 0)
  {
    disconnected_players.forEach((player, index) =>
    {
      if (player.name == name)
      {
        disconnected_players.splice(index, 1);
        Player.by_id(player.id, players).socket = socket;
        
        // inform clients
        socket.emit('login.successful', JSON.stringify(player.info()));
        socket.emit('game.start');
        socket.emit('game.round.start', /*number*/playingfield.current_round, /*string*/playingfield.trump);
        socket.emit('info.points.update', /*number*/player.points);
        socket.emit('info.guess.update', /*number*/(player.guess-player.tricks_won));
        socket.emit('playerboard.update', JSON.stringify(Clients.info(players)));
        socket.emit('card.distribute', JSON.stringify(player.hand));
        
        // send reconnected client info about who is waited upon for a guess or card
        if (playingfield.waiting_for_card != undefined) { socket.emit('card.waitingFor', playingfield.waiting_for_card); }
        else if (playingfield.waiting_for_guess != undefined) { socket.emit('guess.waitingFor', playingfield.waiting_for_guess); }
        
        // resend waitng for card request or guess if the the one clients are waiting for is the reconnected client
        if (playingfield.waiting_for_card == player.id) { socket.emit(`card.request`); }
        else if (playingfield.waiting_for_guess == player.id) { socket.emit(`guess.request`); }
        
        console.log(`${player.name} reconnected.`);
      }
    });
  }
  // permit login if game is not running and amount of players is less than 6
  if (!game_is_running.value && players.length < 6)
  {
    // add player to players
    let new_player = new Player(name, ids, socket);
    players.push(new_player);
    
    console.log(`New Player ${name} logged in.`);
    
    // inform clients
    socket.emit('login.successful', JSON.stringify(new_player.info()));
    io.emit('playerboard.update', JSON.stringify(Clients.info(players)));
    io.emit('MessageFromServer', name + " logged in.");
    io.emit('vote.update', votes.length, players.length);
  }
  // not permit login if game is running or count of players is 6
  else if (game_is_running.value || players.length == 6)
  {
    console.log("login.unsuccessful");
    socket.emit('login.unsuccessful');
  }
  return 0;
}








/**
 * Returns a boolean value
 *
 * @param {number} playerid
 * @param {any} players
 * @param {any} votes
 * @returns {any} io provided by socket io
 * @returns {boolean} game_is_running
 * @returns {boolean} if vote was acknowledged 
 */
function vote(
  /*number*/playerid,
  /*array*/players,
  /*array*/votes,
  io,
  game_is_running
)
{
  console.log("vote");
  if (votes.includes(playerid))
  {
    // vote rejected
    console.log("vote rejected"); console.groupEnd(); return false;
  }
  else
  {
    // vote accepted
    console.log("vote accepted");
    io.emit('vote.update', /*number*/votes.push(playerid), /*number*/players.length);
    if (votes.length == players.length)
    {
      console.log("start game");
      game_is_running.value = true;
      io.emit('game.start');
      return true;
    }
  }
}









/**
 * Description
 * @param {any} clients
 * @param {any} votes
 * @param {any} io
 * @param {any} game_is_running
 * @returns {any}
 */
function disconnected(
  /*array*/clients,
  /*array*/votes,
  io,
  game_is_running
)
{
  // local variables because save time to access pointer inside client.list, .ids and .left
  let players = clients.list;
  let ids = clients.ids;
  let disconnected_players = clients.left;
  console.log('user disconnected');
  // the following for loop seems to execute in parallel
  for (player of players)
  {
    if (!player.socket.connected)
    {
      if (game_is_running.value)
      {
        io.emit('MessageFromServer', `${player.name} lost connection to the game.`);
        disconnected_players.push(player);
      }
      else
      {
        // remove vote
        votes.splice(votes.indexOf(player.id), 1);
        ids[player.id] = 0;
        Player.delete_by_id(player.id, players);
        
        // inform clients
        io.emit('MessageFromServer', `${player.name} left.`);
        io.emit('playerboard.update', JSON.stringify(Clients.info(players)));
        io.emit('vote.update', votes.length, players.length);
      }
      break;
    }
  }
}



module.exports.login = login;
module.exports.vote = vote;
module.exports.disconnected = disconnected;
