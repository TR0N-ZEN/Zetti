////playingfield and player preparation
// var IDs = [0, 0, 0, 0, 0, 0];
// var ID;
const mod = require('./mod');
const Player = require('./player').Player;
var IDs = require('./player').IDs;
var playerList = [];
var already_voted = [];
var round_starter = 0;
var last_winner = undefined;
var trick = [];
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
    shuffle: function () {
        for (let i = this.deck.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * i);
            let k = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = k;
        }
    },
    to_playingstack: function (color, number) {
        this.playingstack.push(new Card(color, number));
    }
}
for (color of colors) {
    for (let x = 1; x < 14; x++) {
        playingfield.deck[cardIndex] = new Card(color, x);
        cardIndex++;
    }
}
for (let x = 1; x < 5; x++) {
    playingfield.deck[cardIndex] = new Card("Z", 14); //Zauberer
    cardIndex++;
}
for (let x = 1; x < 5; x++) {
    playingfield.deck[cardIndex] = new Card("N", 0); //Narren
    cardIndex++;
}

////game functionalities

//EMITTER---------------------------------------------------
/*
 * login.
 *      successful
 *      unsuccessful
 * playerBoard.
 *      update
 * vote.
 *      update
 * game.
 *      start
 *      round
 *      trick
 * card.
 *      distribute //cards on hand
 *      update //card on stack
 * waiting_for_card
 * waiting_for_player
 * 
 * changeCSS
 * */

var go_on = () => { };
async function play_trick() {
    console.group("play trick");
    let start_player;
    if (last_winner === undefined) {
        start_player = round_starter;
    } else {
        start_player = last_winner;
    }
    console.log(start_player);
    for (let i = 0; i < playerList.length; i++) {
        go_on = () => { };
        let current_player = mod(start_player + i, playerList.length);
        console.log("card.waitingFor " + playerList[current_player].name);
        let socket_id = playerList[current_player].socket_id;
        io.to(socket_id).emit('card.waiting');
        io.emit('card.waitingFor', playerList[current_player].name);
        await new Promise((resolve) => {
            go_on = resolve; // resolve can be triggered from outside by calling go_on();
        });
    }
    return 0;
}
function distribute_cards(round) {
    console.log("distribute cards");
    for (let i = 0; i < playerList.length; i++) {
        let cards_to_distribute = [];
        let socket_id = playerList[i].socket_id;
        for (let j = 0; j < round; j++) {
            cards_to_distribute.push(playingfield.deck[i * round + j]);
        }
        //console.log("to " + playerList[i].name + ": " + cards_to_distribute);
        io.to(socket_id).emit('card.distribute', JSON.stringify(cards_to_distribute));
    }
}
function get_random_color() {
    //let index = Math.floor(Math.random() * 60);
    //if (index == 60) { index = 59; }
    //return playingfield.deck[index].color;
    let index = Math.floor(Math.random() * 4);
    if (index == 4) { index = 3; }
    return colors[index];
}
async function take_guesses() {
    console.group("take_guesses");
    console.groupEnd();
    return 0;
}
async function calculate_winner() {
    console.log("calculate winner");
    last_winner = 0;
    return 0;
}
async function play_round(round) {
    console.group("play round " + round);
    let trump_color = get_random_color();
    console.log(trump_color);
    io.emit('game.round', round, trump_color);
    playingfield.shuffle();
    distribute_cards(round);
    //take guesses
    await take_guesses();
    for (let trick_number = 0; trick_number < round; trick_number++) {
        await play_trick();
        //console.log(trick);
        await calculate_winner();
        console.log("last winner: " + playerList[last_winner].name);
        console.groupEnd();
    }
    last_winner = undefined;
    round_starter = mod(round_starter + 1, playerList.length);
    //calculate winner;
    console.groupEnd();
    if (round < (60 / playerList.length)) {
        play_round(++round);
    }
}

//Server Setup-------------------------------------------------------------
const express = require('express');
//const { disconnect } = require('process');
const app = express();
const httpsserver = require('http').Server(app);
let io = require('socket.io')(httpsserver); // 'io' holds all sockets
const IPaddress = '192.168.178.4'; //enter your current ip address inorder to avoid errors
const port = 80;
//-------------------------------------------------------------------------
function login(name, socketid) {
    if (playerList.length < 6) {
        playerList.push(new Player(name, socketid));
        console.log("login.successful");
        io.to(socketid).emit('login.successful', JSON.stringify(playerList[playerList.length - 1]));
        let names = new Array(playerList.length);
        for (let a = 0; a < playerList.length; a++) {
            names[a] = playerList[a].name;
        }
        io.emit('playerBoard.update', JSON.stringify(names));
        io.emit('MessageFromServer', playerList[playerList.length - 1].name + " logged in.");
        io.emit('vote.update', already_voted.length, playerList.length);
        console.log(names);
        console.log("New Player " + playerList[playerList.length - 1].name + " logged in.");
    } else {
        console.log("login.unsuccessful");
        io.to(socketid).emit('login.unsuccessful');
    }
}
function vote(playerid) {
    console.group("vote");
    if (!already_voted.includes(playerid)) {
        console.log("vote accepted");
        already_voted.push(playerid);
        io.emit('vote.update', already_voted.length, playerList.length);
        console.groupEnd();
        if (already_voted.length == playerList.length) {
            console.log("start game");
            io.emit('game.start');
            setTimeout(() => { play_round(1); }, 2000);
        }
    } else { console.log("vote rejected"); console.groupEnd();}
    
}
function disconnected() {
    console.log('user disconnected'); 
    for (let i = 0; i < playerList.length; i++) {
        if (io.of('/').sockets[playerList[i].socket_id] === undefined) {
            io.emit('MessageFromServer', playerList[i].name + " left.")
            already_voted.splice(already_voted.indexOf(playerList[i].id), 1);
            IDs[playerList[i].id] = 0;
            playerList.splice(i, 1);
            io.emit('vote.update', already_voted.length, playerList.length);
            break;
        }
    }
    console.log("IDs: " + IDs)
}
//LISTENER------------------------------------------------------------------------
/*
 * login
 * MessageFromClient
 * vote
 * card
 *      .toPlayingstack
 */
io.on('connection', function (socket) { //parameter of the callbackfunction here called 'socket' is the connection to the client that connected 
    //console.log(Object.keys(io.sockets.sockets));
    console.log('a user connected');
    socket.on('toServerConsole', (text) => { console.log(text); });
    socket.on('login', (name) => { login(name, socket.id); });
    socket.on('MessageFromClient', (message) => { io.emit('MessageFromServer', message); });
    socket.on('vote', (playerid) => { vote(playerid); });
    //socket.on('card.toPlayingstack', (color, number) => { card_to_playingstack(color, number); });
    socket.on('card.toPlayingstack', (color, number) => {
        console.log(color + " " + number);
        trick.push(new Card(color, number));
        playingfield.to_playingstack(color, number);
        io.emit('card.update', color, number);
        go_on();
    });
    socket.on('disconnect', (reason) => { disconnected(); });
});
app.use(express.static('client'));
app.get('/', (req, res) => {
    //let p = 'C:/Users/Ego/source/repos/TR0N-ZEN/Zetti';
    let p = __dirname;
    if (playerList.length < 6) {
        res.sendFile( p + '/client/game.html');
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