// JavaScript source code


//Player Generator---------------------------------------------------------
var IDs = [0, 0, 0, 0, 0, 0];
var ID;
var playerList = [];
function Player(name, socket_id) {
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
    this.cards = [];
    console.log(this);
}
//END Cards Generator------------------------------------------------------
var already_voted = [];


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
            socket.emit('prepare_game');
            console.log("START GAME");
        }
    }
}

//Server Setup-------------------------------------------------------------
const express = require('express');
const app = express();
const httpsserver = require('http').Server(app);
let io = require('socket.io')(httpsserver); // 'io' holds all sockets
const IPaddress = '192.168.178.32'; //enter your current ip address inorder to avoid errors
const port = 80;
//-------------------------------------------------------------------------
io.on('connection', function (socket) { //parameter of the callbackfunction here called 'socket' is the connection to the client that connected 
    console.log('a user connected');
    socket.on('toServerConsole', function (text) { console.log(text); });
    socket.on('login', (name) => {
        if (playerList.length < 6) {
            playerList.push(new Player(name, socket.id));
            console.log("IDs: " + IDs)
            console.log("New Player " + playerList[playerList.length - 1].name + " logged in.");
            socket.emit('login.successful', JSON.stringify(playerList[playerList.length - 1]));
            io.emit('vote.update', already_voted.length, playerList.length);
            io.emit('MessageFromServer', playerList[playerList.length - 1].name + " logged in.");
        } else {
            socket.emit('login.unsuccessful');
        }
    });
    socket.on('MessageFromClient', (message) => { io.emit('MessageFromServer', message); });
    socket.on('vote', (playerid) => {
        if (!already_voted.includes(playerid)) {
            console.log("vote");
            already_voted.push(playerid);
            io.emit('vote.update', already_voted.length, playerList.length);
            if (already_voted.length == playerList.length) {
                //START GAME
                io.emit('prepare_game');
                console.log("START GAME");
            }
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
app.get('/', function (req, res) {
    if (playerList.length < 6) {
        res.sendFile(__dirname + '/client/game.html');
    } else {
        res.sendFile(__dirname + '/client/game_is_full.html');
    }
});
httpsserver.listen(port, IPaddress, function () {
    console.log( 'Server is listening on ' + IPaddress + ':' + port.toString() );
});
//END Server Setup---------------------------------------------------------



//Cards Generator----------------------------------------------------------
function card(color, value) {
    this.color = color;
    this.value = value;
}
//global set of cards
var cards = [];
var cardIndex = 0;
var colors = ["red", "green", "blue", "yellow"]

for (color of colors) {
    for (x = 1; x < 14; x++) {
        cards[cardIndex] = new card(color, x);
        cardIndex++;
    }
}
for (x = 1; x < 5; x++) {
    cards[cardIndex] = new card(undefined, 14);
    cardIndex++;
}
for (x = 1; x < 5; x++) {
    cards[cardIndex] = new card(undefined, 0);
    cardIndex++;
}
//END Card Generator-------------------------------------------------------



//Schuffle Cards-----------------------------------------------------------
function shuffleCards() {
    for (i = cards.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * i)
        k = cards[i]
        cards[i] = cards[j]
        cards[j] = k
    }
    console.log(cards);
}
//END Schuffle Cards-------------------------------------------------------



//GAME---------------------------------------------------------------------
function game() {
    const AmountOfRounds = cards.lenght() / playerList.length;
    console.log("The amount of rounds to be played is " + AmountOfRounds.toString());
    var trumpColor;
    for (round = 1; round <= AmountOfRounds; round++) {
        //determine trump color
        trumpColor = colors[Math.floor(Math.random() * 4)];
        //
        io.emit('newRound', round, trumpColor); 
        //io.emit('MessageFromServer', "Trump is " + trumpColor + ". " + trumpColor + " is trump.");
        shuffleCards();
        cardIndex = 0;
        for (id = 0; id < playerList.length; id++) {
            playerList[id].cards = cards.slice(cardIndex, cardIndex + round); //this is copying the elements of the cards array with the index 'cardIndex' to 'cardIndex + round -1' into the playerList object's cards array
            cardIndex = cardIndex + round;
        }
        //now send the playerList[id].card arrays to the associated clients / sockets

    }
}
//END GAME-----------------------------------------------------------------