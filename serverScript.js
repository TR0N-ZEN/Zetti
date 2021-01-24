//message from ubuntu
////playingfield and player preparation
const mod = require('./mod');
const Player = require('./player').Player;
var IDs = require('./player').IDs;
var playerList = [];
var already_voted = [];
var cardIndex = 0;
var colors = ["red", "green", "blue", "yellow"];

class Card {
    constructor(color, number) {
        this.color = color;
        this.number = number;
    }
}
var playingfield = {
    deck: new Array(60),
    playingstack: new Array(),
    card_pos_on_stack: 0,
    shuffle: function () {
        for (let i = this.deck.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * i);
            let k = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = k;
        }
    }
}
for (color of colors) {
    for (let i = 1; i < 14; i++) {
        playingfield.deck[cardIndex] = new Card(color, i);
        ++cardIndex;
    }
}
for (let i = 0; i < 4; i++) {
    playingfield.deck[cardIndex] = new Card("Z", i); //Zauberer; each card needs to have unique properties
    ++cardIndex;
}
for (let i = 0; i < 4; i++) {
    playingfield.deck[cardIndex] = new Card("N", i); //Narren each card needs to have unique properties
    ++cardIndex;
}

//delay only works in async functions
function delay(milliseconds) {
    return new Promise( (resolve) => {
        setTimeout( () => {
            resolve();
        }, milliseconds);
    });
}

////game functionalities

//EMITTER---------------------------------------------------
/*
 * login.
 *      successful
 *      unsuccessful
 * playerBoard.
 *      update.
 *          names
 *          points
 * vote.
 *      update
 * game.
 *      start
 *      round.start
 *      round.end
 *      trick.start
 *      trick.end
 * card.
 *      distribute //cards on hand
 *      update //card on stack
 * points
 *      .update
 * guess
 *      .update
 * changeCSS
 * */

var go_on = () => { };
var current_player = 0;
var last_winner_index = undefined;
var trick_starter;
var trick = [];
async function play_trick() {
    console.group("play trick");
    if (last_winner_index === undefined) {
        trick_starter = round_starter;
    } else {
        trick_starter = last_winner_index;
    }
    console.log("start player: " + trick_starter);
    for (let i = 0; i < playerList.length; i++) {
        go_on = () => { };
        current_player = mod(trick_starter + i, playerList.length);
        let socket_id = playerList[current_player].socket_id;
        playingfield.card_pos_on_stack = i;
        console.log("card.waitingFor " + playerList[current_player].name);
        io.emit('card.waitingFor', playerList[current_player].id);
        io.to(socket_id).emit('card.waiting', playingfield.card_pos_on_stack);
        await new Promise((resolve) => { go_on = resolve; });
    }
    return 0;
}
function distribute_cards(round) {
    console.log("distribute cards");
    for (let i = 0; i < playerList.length; i++) {
        let socket_id = playerList[i].socket_id;
        for (let j = 0; j < round; j++) {
            playerList[i].hand.push(playingfield.deck[i * round + j]);
        }
        //console.log("to " + playerList[i].name + ": " + cards_to_distribute);
        io.to(socket_id).emit('card.distribute', JSON.stringify(playerList[i].hand));
    }
}
function get_random_color() {
    let index = Math.floor(Math.random() * 4);
    if (index == 4) { index = 3; }
    return colors[index];
}
async function take_guesses() {
    console.group("take_guesses");
    for (let i = 0; i < playerList.length; i++) {
        let the_asked_one = mod(round_starter + i, playerList.length);
        console.log("guess.waitingFor " + playerList[the_asked_one].name);
        io.emit('guess.waitingFor', playerList[the_asked_one].id);
        io.to(playerList[the_asked_one].socket_id).emit('guess.request');
        await new Promise( (resolve) => {
            ask_next = resolve; // resolve can be triggered from outside by calling go_on();
        });
    }
    console.groupEnd();
    return 0;
}
async function calculate_winner() {
    console.group("calculate winner");
    var color_to_serve;
    var high_card_index;
    var high_card;
    for (let i = 0; i < playerList.length; i++) {
        let c_player = mod(trick_starter + i, playerList.length);
        if (trick[c_player].color != "N") {
            color_to_serve = trick[c_player].color; //found color that should be served
            high_card_index = c_player;
            high_card = trick[high_card_index];
            console.log("color to be served: " + color_to_serve);
            break;
        }
    }
    if (color_to_serve === undefined) { //der Only-Enno Fall
        last_winner_index = trick_starter;
        console.log("der Only-Enno Fall");
        console.groupEnd();
        return 0;
    }
    //color_to_serve END
    for (let i = 0; i < playerList.length; i++) {
        let c_player = mod(trick_starter + i, playerList.length);
        if (trick[c_player].color == "Z") { //der erste Zetti ist geflogen
            console.log("der erste Zetti ist geflogen");
            last_winner_index = c_player;
            console.groupEnd();
            return 0;
        }
        if (trick[c_player].color == trump_color) {
            console.log("Trump has been played.");
            if (high_card.color != trump_color) {
                console.log("Trump has been played for the first time.");
                high_card_index = c_player;
                high_card = trick[high_card_index];
            } else if (parseInt(trick[c_player].number, 10) > parseInt(high_card.number, 10)) {
                high_card_index = c_player;
                high_card = trick[high_card_index];
                console.log("Topped.");
            }
        } else if (high_card.color == color_to_serve && trick[c_player].color == color_to_serve) {
            if (parseInt(trick[c_player].number, 10) > parseInt(high_card.number, 10)) {
                high_card_index = c_player;
                high_card = trick[high_card_index];
                console.log("Topped.");
            }
        }
    }
    last_winner_index = high_card_index;
    console.groupEnd();
    return 0;
}
function update_points() {
    for (let i = 0; i < playerList.length; i++) {
        let delta;
        let guess = playerList[i].guess;
        let tricks_won = playerList[i].tricks_won;
        if (guess == tricks_won) {
            delta = 20 + guess*10;
        } else {
            delta = (guess - tricks_won)*10;
            if (delta > 0) { delta *= -1; }
        }
        playerList[i].points += delta;
        io.to(playerList[i].socket_id).emit('points.update', playerList[i].points);
        playerList[i].guess = 0;
        playerList[i].tricks_won = 0;
        console.log(playerList[i].name + "\n\tguessed: " + guess.toString() + "\n\twon: " + tricks_won.toString() +  "\n\tdelta_in_points: " + delta.toString());
    }
    let points = new Array(playerList.length);
    for (let i = 0; i < playerList.length; i++) {
        points[i] = playerList.length.points[i];
    }
    io.emit("playerBoard.update.points", JSON.stringify(points));
}
var round_starter = 0;
var trump_color = "";
async function play_round(/*number*/round) {
    console.group("play round " + round);
    trump_color = get_random_color();
    console.log("trump color: " + trump_color);
    io.emit('game.round.start', /*number*/round, /*string*/trump_color);
    playingfield.shuffle();
    await delay(1500);
    distribute_cards(round);
    await take_guesses();
    for (let trick_number = 1; trick_number <= round; trick_number++) {
        io.emit("game.trick.start");
        await play_trick();
        await calculate_winner();
        console.log("last winner: " + playerList[last_winner_index].name);
        ++playerList[last_winner_index].tricks_won;
        io.emit('guess.update', /*number*/playerList[last_winner_index].id, /*number*/playerList[last_winner_index].guess, /*number*/playerList[last_winner_index].tricks_won);
        //console.log("last winner: " + playerList[last_winner].name);
        console.groupEnd();
        await new Promise((resolve) => {
            setTimeout( () => {
                io.emit("game.trick.end"); //for clearing playingfield from cards on clients
                resolve();
            }, 3000);
        });
    }
    update_points(); //calculate points after each round
    last_winner_index = undefined;
    round_starter = mod(round_starter + 1, playerList.length); //rule of starter of first trick in a round is passed in a circle
    console.groupEnd();
    io.emit('game.round.end');
    if (round < (60 / playerList.length)) {
        setTimeout(() => {
            play_round(/*number*/++round);
        }, 6000);
    }
}

//Server Setup-------------------------------------------------------------
const express = require('express');
//const { disconnect } = require('process');
const app = express();
const httpsserver = require('http').Server(app);
let io = require('socket.io')(httpsserver); // 'io' holds all sockets
const IPaddress = '192.168.178.3';//'localhost';// //enter your current ip address inorder to avoid errors
const port = 80;
//-------------------------------------------------------------------------
function login(/*string*/name, /*string*/socketid) {
    if (playerList.length < 6) {
        playerList.push(new Player(name, socketid));
        playerList[playerList.length - 1].index = playerList.length - 1;
        console.log("login.successful");
        io.to(socketid).emit('login.successful', JSON.stringify(playerList[playerList.length - 1]));
        let names = new Array(playerList.length);
        let ids = new Array(playerList.length);
        for (let a = 0; a < playerList.length; a++) {
            names[a] = playerList[a].name;
            ids[a] = playerList[a].id;
        }
        io.emit('playerBoard.update.names', JSON.stringify(names), JSON.stringify(ids));
        io.emit('MessageFromServer', playerList[playerList.length - 1].name + " logged in.");
        io.emit('vote.update', already_voted.length, playerList.length);
        console.log(names);
        console.log("New Player " + playerList[playerList.length - 1].name + " logged in.");
    } else {
        console.log("login.unsuccessful");
        io.to(socketid).emit('login.unsuccessful');
    }
    console.log("IDs: " + IDs);
}
function vote(/*number*/playerid) {
    console.group("vote");
    if (!already_voted.includes(playerid)) {
        console.log("vote accepted");
        already_voted.push(playerid);
        io.emit('vote.update', /*number*/already_voted.length, /*number*/playerList.length);
        console.groupEnd();
        if (already_voted.length == playerList.length) {
            console.log("start game");
            io.emit('game.start');
            setTimeout(() => { play_round(1); }, 2000);
        }
    } else { console.log("vote rejected"); console.groupEnd(); }
}
function disconnected() {
    console.log('user disconnected');
    for (let i = 0; i < playerList.length; i++) {
        if (io.of('/').sockets[playerList[i].socket_id] === undefined) {
            io.emit('MessageFromServer', playerList[i].name + " left.")
            already_voted.splice(already_voted.indexOf(playerList[i].id), 1);
            IDs[playerList[i].id] = 0;
            playerList.splice(i, 1);
            let names = new Array(playerList.length);
            let ids = new Array(playerList.length);
            for (let a = 0; a < playerList.length; a++) {
                names[a] = playerList[a].name;
                ids[a] = playerList[a].id;
            }
            io.emit('playerBoard.update.names', JSON.stringify(names), JSON.stringify(ids));
            io.emit('vote.update', already_voted.length, playerList.length);
            break;
        }
    }
    console.log("IDs: " + IDs);
}
//LISTENER------------------------------------------------------------------------
/*
 * login
 * MessageFromClient
 * vote
 * card
 *      .toPlayingstack
 * guess.
 *      response
 * disconnect
 */
io.on('connection', (socket) => { //parameter of the callbackfunction here called 'socket' is the connection to the client that connected
    //console.log(Object.keys(io.sockets.sockets));
    console.log('a user connected');
    socket.on('toServerConsole', (/*string*/text) => { console.log(text); });
    socket.on('login', (/*string*/name) => { login(name, socket.id); });
    socket.on('MessageFromClient', (/*string*/message) => { io.emit('MessageFromServer', message); });
    socket.on('vote', (/*number*/playerid) => { vote(playerid); });
    socket.on('card.toPlayingstack', (/*string*/color, /*number*/number, /*number*/playerINDEX) => {
        console.log(color + " " + number);
        trick[current_player] = new Card(color, number); //position in trick matches position of player who played the card in playerList
        for (let i = 0; i < playerList.length; i++) {
            if (playerList[playerINDEX].hand[i] === trick[current_player]) {
                playerList[playerINDEX].hand[i].splice(i, 1);
                console.log(playerList[playerINDEX].hand[i]);
            }
        }
        socket.broadcast.emit('card.update', /*string*/color, /*number*/number, /*number*/playingfield.card_pos_on_stack);
        go_on(); //resolves Promise in async play_trick()'s loop
    });
    socket.on('guess.response', (/*number*/guess, /*number*/index) => { //both numbers in decimal
        playerList[index].guess = guess;
        console.log(playerList[index].name + " guessed from object: " + playerList[index].guess);
        io.emit('guess.update', /*number*/playerList[index].id, /*number*/guess, 0);
        ask_next(); //resolves Promise in async take_guesses()'s loop
    });
    socket.on('disconnect', (reason) => { disconnected(); });
});
app.use(express.static('client'));
app.get('/', (req, res) => {
    //let p = 'C:/Users/Ego/source/repos/TR0N-ZEN/Zetti';
    let p = __dirname;
    if (playerList.length < 6) {
        res.sendFile( p + '/client/index.html');
    } else {
        res.sendFile( p  + '/client/game_is_full.html');
    }
});
httpsserver.listen(port, IPaddress, () => {
    console.log( 'Server is listening on ' + IPaddress + ':' + port.toString() );
});
//console.log(Object.keys(io.sockets.sockets));
//console.log(Object.keys(io.sockets.connected));


//DEBUGING------------------------------------------------------
function changeCSS(element, property, value) {
    io.emit('changeCSS', element,  property, value);
}