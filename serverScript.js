// JavaScript source code




//Player Generator---------------------------------------------------------
var ID = 0;
var playerList = [];
function Player(name) {
    this.name = name;
    this.id = ID;
    this.points = 0;
    this.guesses = 0;
    this.cards = [];
    ID++;
}
//END Cards Generator------------------------------------------------------



//Server Setup-------------------------------------------------------------
const express = require('express');
const app = express();
const httpsserver = require('http').Server(app);
var io = require('socket.io')(httpsserver); // 'io' holds all sockets

const IPaddress = '192.168.178.4'; //enter your current ip address inorder to avoid errors
const port = 80;

io.on('connection', function (socket) { //parameter of the callbackfunction here called 'socket' is the connection to the client that connected 
    console.log('a user connected');
    console.log(socket.id);

    socket.on('toServerConsole', function (text) { console.log(text); });
    socket.on('Login', function (name) {
        playerList.push(new Player(name));
        //console.log("New Player " + playerList[ID - 1].name + " arrived.");
        socket.emit('PlayerObject', JSON.stringify(playerList[ID - 1]));
        io.emit('MessageFromServer', playerList[ID - 1].name + " arrived.");
    });
    socket.on('MessageFromClient', function (message) {    //Messages from a Client to the Server
        //console.log(message);
        io.emit('MessageFromServer',message); //Message from the Server to Clients
    });
    socket.on('disconnect', function () { console.log('user disconnected'); });
});           

app.use(express.static('client'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/game.html');
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