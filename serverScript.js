// JavaScript source code
var IDs = [0, 0, 0, 0, 0, 0];
var ID;
var playerList = [];
var already_voted = [];
var current_starter = 0;
var last_winner = undefined;
var cardIndex = 0;
var colors = ["red", "green", "blue", "yellow"];

class Player {
    constructor(name, socket_id) {
        for (let i = 0; i < IDs.length; i++) {
            if (IDs[i] == 0) {
                IDs[i] = 1;
                ID = i;
                break;
            }
        }
        this.name = name;
        this.id = ID;
        this.socket_id = socket_id;
        this.points = 0;
        this.guesses = 0;
        this.hand = [];
        //console.log(this);
    }
}
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
        console.log(this.deck.length);
        for (let i = this.deck.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * i);
            let k = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = k;
        }
    },
    to_playingstack: function (color, number) {
        console.log(this.playingstack);
        this.playingstack.push(new Card(color, number));
    }
}
function mod(m, n) { // m is in one of the rest classes of Zn so mod: Z -> Zn: m -> r  surjective and not injective.
    let r = m % n;
    if (r == 0) {
        return 0;
    }
    if (r < 0) {
        return n + r;
    }
    return r;
}
function play_trick(d) {
    let trick = new Array(playerList.length);
    let color_to_serve;
    if (d == 0) {
        player = current_starter;
    } else {
        player = last_winner;
    }
    for (let i = 0; i < playerList.length; i++) {
        socket = playerList[player].socket_id;
        io.to(socket).emit('waiting_for_card');
        io.emit('waiting_for', playerList[player].name);
        let card_from_client_hasnt_arrived = true;
        io.on('client_plays_card', (color, number) => { trick.push(new Card(color, number)); card_from_client_hasnt_arrived = false; })
        while (card_from_client_hasnt_arrived) {
            //this blocks further execution so that one player can only play after another
        }
        if (i == 0) { color_to_serve = trick[0].color; }
        //determine who won and set last_winner to the winners index in playerList
    }
}
function distribute_cards(round) {
    for (let k = 0; k < playerList.length; k++) {
        let cards_to_distribute = [];
        let socket_id = playerList[k].socket_id;
        for (j = 0; j < round; j++) {
            cards_to_distribute.push(deck[k * round + j]);
        }
        io.to(socket_id).emit('distribute_cards', cards_to_distribute);
    }
}
function get_random_color() { let index = Math.floor(Math.random() * 60); return playingfield.deck[index].color; };
function play_round(c) {
    playingfield.shuffle();
    let trump_color = get_random_color();
    distribute_cards(c);
    for (let trick_number = 0; t < c; t++) {
        play_trick(trick_number, trump_color);
    }
    current_starter = mod(current_starter + 1, playerList.length);
}

for (color of colors) {
    for (x = 1; x < 14; x++) {
        playingfield.deck[cardIndex] = new Card(color, x);
        cardIndex++;
    }
}
for (x = 1; x < 5; x++) {
    playingfield.deck[cardIndex] = new Card(undefined, 14); //Zauberer
    cardIndex++;
}
for (x = 1; x < 5; x++) {
    playingfield.deck[cardIndex] = new Card(undefined, 0); //Narren
    cardIndex++;
}

/*
function login (name, socket_id) {
    playerList.push(new Player(name, socket_id));
    console.log("New Player " + playerList[playerList.length - 1].name + " logged in.");
    socket.emit('PlayerObject', JSON.stringify(playerList[playerList.length - 1]));
    io.emit('MessageFromServer', playerList[playerList.length - 1].name + " logged in.");
}

function vote (playerid) {
    if (!already_voted.includes(playerid)) {
        console.log("vote");
        already_voted.push(playerid);
        socket.emit('vote.update', already_voted.length, playerList.length);
        if (already_voted.length == playerList.length) {
            //START GAME
            console.log("game.start");
            socket.emit('game.start');
            
        }
    }
}

async function game() {
    let ready = await ready;
        io.emit('game.start');
        console.log("START GAME");
        const AmountOfRounds = playingfield.deck.lenght() / playerList.length;
        console.log("The amount of rounds to be played is " + AmountOfRounds.toString());
        var trumpColor;
        for (round = 1; round <= AmountOfRounds; round++) {
            //determine trump color
            trumpColor = colors[Math.floor(Math.random() * 4)];
            //
            io.emit('game.round', round, trumpColor);
            //io.emit('MessageFromServer', "Trump is " + trumpColor + ". " + trumpColor + " is trump.");
            shuffledeck();
            cardIndex = 0;
            for (let id = 0; id < playerList.length; id++) {
                playerList[id].playingfield.deck = playingfield.deck.slice(cardIndex, round);
                cardIndex = cardIndex + round;
                for (let i = 0; i < playerList.lenght; i++) {
                    if (playerList[i].socket_id == socket.id) {

                    }
                }
                socket.emit('playingfield.deck.hand.update', playerList);
            }
    }
}


function game() {
    const AmountOfRounds = playingfield.deck.lenght() / playerList.length;
    console.log("The amount of rounds to be played is " + AmountOfRounds.toString());
    var trumpColor;
    for (round = 1; round <= AmountOfRounds; round++) {
        //determine trump color
        trumpColor = colors[Math.floor(Math.random() * 4)];
        //
        io.emit('game.round', round, trumpColor);
        //io.emit('MessageFromServer', "Trump is " + trumpColor + ". " + trumpColor + " is trump.");
        shuffledeck();
        cardIndex = 0;
        for (let id = 0; id < playerList.length; id++) {
            playerList[id].playingfield.deck = playingfield.deck.slice(cardIndex, round);
            cardIndex = cardIndex + round;
            for (let i = 0; i < playerList.lenght; i++) {
                if (playerList[i].socket_id == socket.id) {

                }
            }
            socket.emit('playingfield.deck.hand.update', playerList);
        }
    }
}
*/

//Server Setup-------------------------------------------------------------
const express = require('express');
const app = express();
const httpsserver = require('http').Server(app);
let io = require('socket.io')(httpsserver); // 'io' holds all sockets
const IPaddress = '192.168.178.32'; //enter your current ip address inorder to avoid errors
const port = 80;
//-------------------------------------------------------------------------
io.on('connection', function (socket) { //parameter of the callbackfunction here called 'socket' is the connection to the client that connected 
    console.log(Object.keys(io.sockets.sockets));
    //console.log(io.sockets.connected);
    console.log('a user connected');
    socket.on('toServerConsole', function (text) { console.log(text); });
    socket.on('login', (name) => {
        //console.log(socket);
        if (playerList.length < 6) {
            playerList.push(new Player(name, socket.id));
            console.log("login.successful");
            socket.emit('login.successful', JSON.stringify(playerList[playerList.length - 1]));
            console.log("IDs: " + IDs)
            console.log("New Player " + playerList[playerList.length - 1].name + " logged in.");
            io.emit('MessageFromServer', playerList[playerList.length - 1].name + " logged in.");
            io.emit('vote.update', already_voted.length, playerList.length);
        } else {
            console.log("login.unsuccessful");
            socket.emit('login.unsuccessful');
        }
    });
    socket.on('MessageFromClient', (message) => { io.emit('MessageFromServer', message); });
    socket.on('vote', (playerid) => {
        console.log("vote");
        if (!already_voted.includes(playerid)) {
            console.log("vote accepted");
            already_voted.push(playerid);
            io.emit('vote.update', already_voted.length, playerList.length);
            if (already_voted.length == playerList.length) {
                console.log("start game");
                io.emit('game.start');
                play_round(1);
            }
        } else { console.log("vote rejected"); }
    });
    socket.on('card.play', (color, number) => {
        console.log("card.play");
        playingfield.to_playingstack(color, number);
        io.emit('card.update', color, number);
        if (playingfield.playingstack.length == playerList.length) {
            console.log("round over");
        }
    });
    socket.on('disconnect', (reason) => {
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
    });
});

app.use(express.static('client'));
app.get('/', (req, res) => {
    let p = 'C:/Users/Ego/source/repos/TR0N-ZEN/Zetti';
    //p = __dirname
    if (playerList.length < 6) {
        res.sendFile( p + '/client/game.html');
    } else {
        res.sendFile( p  + '/client/game_is_full.html');
    }
});
httpsserver.listen(port, IPaddress, () => {
    console.log( 'Server is listening on ' + IPaddress + ':' + port.toString() );
});
//END Server Setup---------------------------------------------------------
//console.log(Object.keys(io.sockets.sockets));
//console.log(Object.keys(io.sockets.connected));

//GAME---------------------------------------------------------------------
io.emit('MessageFromServer', "Ya know I am ready.");
//END GAME-----------------------------------------------------------------
function changeCSS(element, property, value) {
    io.emit('changeCSS', element,  property, value);
}