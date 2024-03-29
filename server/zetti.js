const mod = require('./JSTools/math/mod').mod;
const get_random_element = require('./JSTools/datatypes/array').get_random_element;
const delay = require('./JSTools/delay').delay;

const Clients = require('./assets/players/clients/clients').Clients;
const Player = require('./assets/players/player').Player;
const Players = require('./assets/players/players').Players;
const Card = require('./entities/card').Card;
const Zetti_field= require('./entities/zetti_field').Zetti_field;
const commands = require('./commands');
const connection_handling = require('./connection_handling');



class Zetti
{
  constructor(namespace /*, debug_stream*/)
  {
    /*exposed*/this.game_io = namespace;
    /*exposed*/this.clients = new Clients(6, new Players().list);
    /*exposed*/this.already_voted = [];
    /*exposed*/this.game_is_running = {value: false};
    this.field = {};
    this.take_next_guess = () => { };
    this.go_on = () => { };


    this.game_io.on('connection',
                    /* define functions for reacting to socket events
                       socket events:
                         login
                         MessageFromClient
                         vote
                         card
                           .toPlayingstack
                         guess
                           .response
                         disconnect
                    */
                    /* 
                     parameter of the callbackfunction here called 'socket' 
                     is the connection to the client that connected
                    */
                    (socket) =>
                    {
                      console.log('a user connected');
                      // debug_stream.write('a user connected');

                      // connection_handling
                      socket.on('login',
                                (/*string*/name) =>
                                {
                                  connection_handling.login(
                                    name,
                                    socket,
                                    /*global object*/this.clients,
                                    /*global object*/this.already_voted,
                                    /*global object*/this.game_io,
                                    this.game_is_running,
                                    this.field
                                  ); 
                                }
                      );
                      socket.on('vote',
                                (/*number*/playerid) =>
                                {
                                  if (connection_handling.vote(
                                        playerid,
                                        this.clients.list,
                                        this.already_voted,
                                        this.game_io,
                                        this.game_is_running)
                                  )
                                  {
                                    /*global variable*/ this.field = new Zetti_field(this.clients.list.length);
                                    this.game(this.clients.list, this.field);
                                  }
                                }
                      );
                      socket.on('disconnect',
                                (reason) =>
                                {
                                  connection_handling.disconnected(
                                    this.clients,
                                    this.already_voted,
                                    this.game_io,
                                    this.game_is_running
                                  );
                                }
                      );

                      // command
                      socket.on('Command',
                                (string) =>
                                {
                                  console.log(`Command: ${string}`);
                                  commands.eval_command(string, this.game_io, this.field);
                                }
                      );
                      socket.on('changeCSS',
                                (element_selector, property, value) =>
                                {
                                  changeCSS(
                                    element_selector,
                                    property,
                                    value,
                                    undefined,
                                    socket
                                  );
                                 }
                      );

                      // miscellaneous
                      socket.on('toServerConsole',
                                (/*string*/text) => { console.log(text); }
                      );
                      socket.on('MessageFromClient',
                                (/*string*/message) => { this.game_io.emit('MessageFromServer', message); });
                      socket.on('card.toPlayingstack',
                                (/*string*/color, /*number*/number, /*number*/player_id) =>
                                {
                                  let pos_on_stack = this.CardtoPlayingstack(/*string*/color, /*number*/number, /*number*/player_id);
                                  socket.broadcast.emit('card.update', /*string*/color, /*number*/number, /*number*/pos_on_stack);
                                  
                                  //resolve Promise in this.play_trick()'s loop
                                  /*global variable*/ this.go_on(); 
                                }
                      );
                      socket.on('guess.response',
                                //giess and id are in decimal
                                (/*number*/guess, /*number*/id) => 
                                { 
                                  if (id == /*global variable*/ this.field.waiting_for_guess)
                                  {
                                    let player = Player.by_id(id, this.clients.list);
                                    player.guess = guess;
                                    /*global variable*/ this.take_next_guess(); //resolves Promise in async take_guesses()'s loop  
                                  }
                                }
                      );

                    }
    );
  }

/**
 * Clears data so that next game can be started.
 */
  clear_game()
  {
    //global variables resetted
    /*global variable*/ this.clients = new Clients(6, new Players().list);
    /*global variable*/ this.already_voted = [];
    /*global variable*/ this.field = {}; 
    /*global variable*/ this.game_is_running = { value: false };
  }





/*
  Defining the game and using socket events via socket.emit(...) on each player to inform them.  
  socket event:
    login.
      successful
     unsuccessful
    playerboard.
     update
      names
     points
    vote.
     update
    game.
     start
     round
        .start
       .end
    trick
      .start
     .end
    card.
     distribute //cards on hand
     update //card on stack
    points
     .update
    guess
     .update
    changeCSS
  */


  /**
   * Assigns and sends cards tp players from the deck.
   * @param {number} amount_per_player 
   * @param {object[]} deck 
   * @param {object[]} players 
   */
  distribute_cards(/*number*/amount_per_player, /*array*/deck, /*array*/players)
  {
    console.log("distribute_cards"); // debug_stream.write('distribute_cards');

    for (let i = 0; i < players.length; i++)
    {
      let player = players[i];
      for (let j = 0; j < amount_per_player; j++) { player.hand.push(deck[i * amount_per_player + j]); }
      player.socket.emit('card.distribute', JSON.stringify(player.hand));
    }
  }


  /**
   * One after another player is asked for guesses to win and waited upon an answer.
   * @param {object[]} players 
   * @param {number} starter_index 
   * @param {object} playingfield 
   * @returns zero
   */
  async take_guesses(/*array*/players, /*number*/starter_index, playingfield)
  {
    console.group("take_guesses"); // debug_stream.write('take_guesses');
    for (let i = 0; i < players.length; i++)
    {
      let player = players[mod(starter_index + i, players.length)];
      console.log(`guess.waitingFor: ${player.name}`); // debug_stream.write(`guess.waitingFor: ${player.name}`);
      /*global variable*/ this.game_io.emit('guess.waitingFor', player.id);
      player.socket.emit('guess.request');
      playingfield.waiting_for_guess = player.id; /* logging */

      // Create Promise that resolves if this.take_next_guess() is called,  
      // which will be called after the answer of the client arrived,  
      // in which case this.game_io.on('guess.response') will be called which calls this.go_on().
      await new Promise( (resolve) => { /*global variable*/ this.take_next_guess = resolve; });
      
      // debug_stream.write(`${player.name} guessed: ${player.guess}`);
      console.log(`${player.name} guessed: ${player.guess}`); 
      /*global variable*/ this.game_io.emit('playerboard.guess.update', /*number*/player.id, /*number*/player.guess, 0);
    }
    console.groupEnd();
    /*global variable*/ playingfield.waiting_for_guess = undefined; /* logging */
    return 0;
  }


  /**
   * Determines color that had to be served during a trick.
   * @param {object[]} trick 
   * @returns string color which must be served if one bears it in its hand
   */
  to_serve(/*array*/trick)
  {
    for (let a = 0; a < trick.length; a++) { let card = trick[a];
      if (card.color != "N") { return card.color; } // found color that should be served
    }

    // der Only-Enno Fall
    return "N";
  }


/**
 * Determines index of the best card inside the argument trick.
 * @param {object[]} trick 
 * @param {string} trump 
 * @returns {number} high_card_index
 */
  best_card(/*array*/trick, /*string*/trump)
  {
    /*string*/let color_to_serve = this.to_serve(trick);
    console.log(`color_to_serve ${color_to_serve}`); // debug_stream.write(`color_to_serve ${color_to_serve}`);
    if (color_to_serve == "N") { return 0; }// der Only-Enno Fall
    let high_card_index = 0;
    let high_card = trick[high_card_index];
    let index = 0;
    let trump_played = false;

    for (let a = 0; a < trick.length; a++) {  let card = trick[a];
      switch(card.color)
      {
        case(trump):
          // Trump has been played.
          if (high_card.color != trump)
          {
            // Trump has been played for the first time.
            trump_played = true;
            high_card_index = index;
            high_card = card;
          }
          else if (parseInt(card.number, 10) > parseInt(high_card.number, 10))
          {
            // high_card has been topped.
            high_card_index = index;
            high_card = card;
          }
          break;
        case(color_to_serve):
          if (!trump_played && parseInt(card.number, 10) > parseInt(high_card.number, 10))
          {
            // high_card has been topped
            high_card_index = index;
            high_card = card;
          }
          break;
        case("Z"):
          // Der erste Zetti ist geflogen.
          return index;
        default:
          console.log("This card doesn't compete.");
          // debug_stream.write("This card doesn't compete.");
      }
      index++;
    }
    // console.log(high_card_index); debug_stream.write();
    return high_card_index;
  }


/**
 * 
 * @param {*} players 
 * @param {*} trick_starter_index 
 * @param {*} trick 
 * @returns 
 */
  async play_trick(/*array*/players, /*number*/trick_starter_index, /*array*/trick)
  {
    console.group("play_trick()"); // debug_stream.write('play trick()');
    
    // Requesting the players to put a card to the table.
    for (let i = 0; i < players.length; i++)
    {
      let player = players[mod(trick_starter_index + i, players.length)];
      console.log(`card.waitingFor  ${player.name}`); // debug_stream.write(`card.waitingFor ${player.name}`);
      /*global variable*/ this.game_io.emit('card.waitingFor', player.id);
      player.socket.emit('card.request', trick.length);
      /*global variable*/ this.field.waiting_for_card = player.id;  /* logging */
      
      // Create Promise that resolves if this.go_on() is called,  
      // which will be called after the answer of the client arrived,  
      // in which case this.game_io.on('card.toPlayingstack') will be called which calls this.go_on().
      await new Promise((resolve) => { /*global variable*/ this.go_on = resolve; }); 
    }
    console.groupEnd();
    /*global variable*/ this.field.waiting_for_card = undefined; /* logging */
    return 0;
  }


/**
 * 
 * @param {object[]} players 
 * @param {object} playingfield 
 * @param {number} round 
 * @param {string} trump 
 * @param {number} trick 
 */
  async play_round(
    /*array*/players,
    /*object*/playingfield,
    /*int*/round,
    trump,
    trick = 1
  )
  {
    console.group(`play round ${round}`);
    playingfield.current_trick = trick; /* logging */
    
    // counter for started of a round needs to be available between iterations of the following looped block
    let starter_index = mod((round - 1), players.length);
    playingfield.trick_starter_index = starter_index; /* logging */
    
    /*global variable*/ this.game_io.emit('game.round.start', /*number*/round, /*string*/trump);

    Players.prep_for_round(players);
    console.log("after prep_for_round(): "); // debug_stream.write("after prep_for_round(): ");

    playingfield.shuffle();

    this.distribute_cards(round, playingfield.deck, players);
    
    await this.take_guesses(players, starter_index, playingfield);
    console.log("after take_guesses(): "); // debug_stream.write("after take_guesses(): ");
    console.table(players);
    do
    {
      playingfield.trick = [];
      /*global variable*/ this.game_io.emit('game.trick.start');
      
      // append cards to 'playingfield.trick' in 'this.game_io.on('card.toPlayingstack')'
      await this.play_trick(players, starter_index, playingfield.trick);
      console.table(playingfield.trick);
      
      let winner_index = mod((starter_index + this.best_card(playingfield.trick, trump)), players.length);
      let winner = players[winner_index];
      ++winner.tricks_won;
      console.log(`winner: ${winner.name}`); // debug_stream.write(`winner: ${winner.name}`);
      
      await delay(1000);
      /*global variable*/ this.game_io.emit('playerboard.guess.update', /*number*/winner.id, /*number*/winner.guess, /*number*/winner.tricks_won);
      winner.socket.emit('info.guess.update', (winner.guess - winner.tricks_won)); // updates the winner's "Noch zu holen: " field
      
      await delay(2000);
      /*global variable*/ this.game_io.emit('game.trick.end'); //for clearing playingfield from cards on this.clients
      
      starter_index = winner_index;
      playingfield.trick_starter_index = starter_index; /* logging */
      ++trick;
      playingfield.current_trick = trick; /* logging */
    } while(trick <= round)

    // after all tricks of a round are played
    /*global variable*/ this.game_io.emit('info.guess.update');
    Players.update_points(players); //calculate points after each round
    console.log("after update_points(): "); // debug_stream.write("after update_points(): ");
    console.table(players);

    /*global variable*/ this.game_io.emit("playerboard.update", JSON.stringify(Clients.info(players)));
    console.groupEnd();

    /*global variable*/ this.game_io.emit('game.round.end');
  }


/**
 * 
 * @param {object[]} players 
 */
  async showresumee(players)
  {
    console.log("Resumee"); // debug_stream.write("Resumee");
    console.table(players);
    await delay(30000);
  }


/**
 * 
 * @param {object[]} players 
 * @param {object} playingfield 
 * @param {number} round 
 */
  async game(players, playingfield, round = 1)
  {

    //for (player of players) {  player.points = 0; }
    for (let a = 0; a < players.length; a++) {  let player = players[a]; player.points = 0; }

    playingfield.current_round = round; /* logging */
    do 
    {
      let trump = get_random_element(playingfield.colors);
      playingfield.trump = trump; /* logging */
      console.log(`trump : ${trump}`); // debug_stream.write(`trump : ${trump}`);

      await this.play_round(/*array*/players, /*object*/playingfield, /*int*/round, trump);
      ++round;
      playingfield.current_round = round; /* logging */
      await delay(5000);

    } while (round <= playingfield.total_rounds)

    // after game finished
    /*global variable*/ this.game_io.emit('MessageFromServer',
                                          "in 40 seconds you can reload this website and start a new round after loggin in again."
                        );

    await this.showresumee(players);

    this.clear_game();

    /*global variable*/ this.game_io.emit('MessageFromServer',
                                          "Please reload the website to login again in order to start a new round :-)"
                        );
    console.log("process terminating"); // debug_stream.write("process terminating");
  }


/**
 * Securing the player played a card he really has in his hand.
 * @param {string} color 
 * @param {number} number 
 * @param {number} player_id 
 * @returns pos_on_stack
 */
  CardtoPlayingstack(/*string*/color, /*number*/number, /*number*/player_id)
  {
    let player = Player.by_id(player_id, /*global variable*/this.clients.list);
      for (let i = 0; i < player.hand.length; i++)
      {
        if (player.hand[i].color == color && player.hand[i].number == number)
        {
          // player has card he claims to have
          player.hand.splice(i, 1);
          let pos_on_stack = /*global variable*/ this.field.trick.push(new Card(color, number)) - 1; //position in trick matches position of player who played the card in this.clients.list

          console.log(`card.update: ${color} ${number} on position ${pos_on_stack} by ${player.name}`);
          // debug_stream.write(`card.update: ${color} ${number} on position ${pos_on_stack} by ${player.name}`);

          return pos_on_stack;
        }
        // player does not have card he claims to have
      }
  }


  //DEBUGING------------------------------------------------------
   changeCSS(element_selector, property, value, player_id, player_socket = undefined)
  {
    if (player_socket == undefined)
    {
      let player = Player.by_id(player_id, /*global variable*/ this.clients.list);
      player.socket.emit('changeCSS', element_selector,  property, value);
    }
    else if (player_id == undefined)
    {
      player_socket.emit('changeCSS', element_selector,  property, value);
    }
  }



}

module.exports.Zetti = Zetti;
