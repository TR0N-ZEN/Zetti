// JavaScript source code


//Player Generator---------------------------------------------------------
var IDs = [0, 0, 0, 0, 0, 0];
var ID;
var playerList = [];
class Player {
    constructor (name, socket_id) {
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
//END Player Generator------------------------------------------------------
var already_voted = [];

class Card {
    constructor(color, number) {
        this.color = color;
        this.number = number;
    }
}

var playingfield = {
    deck: new Array(),
    playingstack: new Array(),
    shuffle: () => {
        for (i = this.deck.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * i)
            let k = this.deck[i]
            this.deck[i] = deck[j]
            this.deck[j] = k
        }
        console.log(this.deck);
    },
    to_playingstack: (color, number) => {
        console.log(this.playingstack);
        //this.playingstack.push(new Card(color, number));
    }
}

//deck Generator----------------------------------------------------------
var cardIndex = 0;
var colors = ["red", "green", "blue", "yellow"]

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
//END Card Generator-------------------------------------------------------

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
                var round = 1;
            }
        } else { console.log("vote rejected"); }
    });
    socket.on('card.play', (color, number) => {
        console.log("card.play");
        playingfield.playingstack.push(color, number);
        io.emit('card.update', color, number);
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