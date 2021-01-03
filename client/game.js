const socket = io();
var chat_hidden = false;
var chatWindowsList = $('.chat .window > ul');
var playerBoard = $('.playerBoard');
var infoName = $('.wrapper .info #Name');
var infoRound = $('.wrapper .info #Round');
var infoTrump = $('.wrapper .info #Trump');
var infoPoints = $('.wrapper .info #Points');
var infoGuesses = $('.wrapper .info #Guesses');
var hand = $('.wrapper .hand');
var cards = $('.wrapper .hand div');
var playingStack = $('.playingStack');


$('.chat > button').click( () => {
    //$('.info .chat .window').slideToggle("fast", "swing");
    if (chat_hidden) {
        $('.info .chat .window').css('right', 0);
        chat_hidden = false;
    } else {
        let width_in_px = $('.info .chat .window').css('width');
        let width = "-" + width_in_px;
        $('.info .chat .window').css('right', width);
        chat_hidden = true;
    }
});



//EMITTER------------------------------------------------------------------------
/* 
 * socket.emit(x, ...)
 * 
 * login
 * MessageFromClient
 * vote
 * guess
 *      .response
 * card
 *      .toPlayingstack //in LISTENERS

 */
$('#login form').submit(function (button) {
    button.preventDefault(); // prevents default action of e/the button so page reloading
    socket.emit('login', $('#login form #loginName').val());
    return false;
});
$('.chat .window > form').submit(function (button) {
    button.preventDefault(); // prevents page reloading
    socket.emit('MessageFromClient', PlayerObject.name + ": " + $('.chat .window form #message').val());
    $('.chat .window form #message').val('');
    return false;
});
$('#ready_player > button').on('click', () => {
    socket.emit('vote', PlayerObject.id);
});
$('.take_guess > form').submit( function (button) {
    button.preventDefault();
    let guess_number = $('.take_guess > form > input').val();
    socket.emit('guess.response', guess_number, index);
    $('.info > div > #Guesses').text('Guesses: ' + guess_number);
    let width_in_px = $('.take_guess').css('width');
    let width = "-" + width_in_px;
    $('.take_guess').css("righ", width);
});



//LISTENERS---------------------------------------------------
/*
 * socket.on(x, function)
 * 
 * login.
 *      successful
 *      unsuccessful
 * playerBoard:
 *      update
 * vote.
 *      update
 * MessageFromServer
 * game.
 *      start
 *      round
 *      trick
 * guess.
 *      waitingFor
 *      request
 *      complete
 * card.
 *      distribute //cards on hand
 *      waiting -> emit('card.toPlayingstack', ...) -> card.update
 *      waitingFor
 *      update //card on stack
 * points.
 *      update
 * changeCSS
 * */ 

 var index = 0;
socket.on('login.successful', (JSON_PlayerObject) => {
    $('#login').slideUp();
    PlayerObject = JSON.parse(JSON_PlayerObject);
    infoName.append(PlayerObject.name);
    infoPoints.append(PlayerObject.points);
    infoGuesses.append(PlayerObject.guesses);
    index = PlayerObject.index;
});
socket.on('login.unsuccessful', () => {
    $('#login').slideUp();
});
socket.on('playerBoard.update', (JSON_namesArray) => {
    let names = JSON.parse(JSON_namesArray);
    playerBoard.html("");
    for (let a = 0; a < names.length; a++) {
        playerBoard.append('<p id="' + names[a] + '">' + names[a] + '</p>');
    }
})
socket.on('vote.update', (votes, amount_of_players) => {
    $('#votes').text(votes.toString() + " / " + amount_of_players.toString());
});
socket.on('MessageFromServer', (message) => {
    chatWindowsList.prepend($('<li>').text(message));
});
socket.on('game.start', () => {
    console.log("game.start");
    $('#ready_player').css("transform", "translateY(-40vh)");
    setTimeout(() => { $('#ready_player').css("display", "none"); }, 3000);
});
socket.on('game.round', (round, trumpColor) => {
    console.log("game.round :" + round.toString());
    infoRound.text("Round: " + round.toString());
    infoTrump.text("Trump: " + trumpColor.toString());
});
socket.on('game.trick', () => {
    console.log("game.trick");
}); // de: Stich <=> eng: trick
socket.on('guess.waitingFor', (playerName) => {
    $('.playerBoard > p').css("color", "white");
    $("#" + playerName).css("color", "lightgreen");
})
socket.on('guess.request', () => {
    let width_in_px = $('.take_guess').css('width');
    let width = width_in_px;
    $('.take_guess').css("right", width);
});
socket.on('guess.complete', () => {
    let width_in_px = $('.take_guess').css('width');
    let width = "-" + width_in_px;
    $('.take_guess').css("right", width);
});
socket.on('card.distribute', (JSON_cards) => {
    console.log("card.distribute");
    let cards = JSON.parse(JSON_cards);
    hand.html("");
    for (let a = 0; a < cards.length; a++) {
        let card_svg = $('.card .' + cards[a].color + "_" + cards[a].number).html();
        let card = document.createElement('div');
        card.setAttribute("class", cards[a].color + "_" + cards[a].number);
        card.innerHTML = card_svg;
        hand.append(card);
    }
});
socket.on('card.waitingFor', (playerName) => {
    $('.playerBoard > p').css("color", "white");
    $("#" + playerName).css("color", "lightgreen");
});
socket.on('card.waiting', () => {
    console.log("card.waiting");
    $('.hand > div').unbind("click");
    $('.hand > div').click(function () {
        let card = $(this)[0].className.split("_");//.target.attributes.class.name;
        console.log("You clicked: " + card[0], card[1]);
        socket.emit('card.toPlayingstack', card[0], card[1]);
    });
});
socket.on('card.update', (color, number) => {
    console.log("card.update: " + color + " " + number);
    //$('.playingStack p:first').text(color + " " + number);
    let card_svg = $("." + color + "_" + number).html();
    playingStack.html(card_svg);
});
socket.on('points.update', (points) => {
    infoPoints.text("Points: " + points.toString());
});


//DEBUGING-------------------------------------------------------
socket.on('changeCSS', (element, property, value) => {
    $(element).css(property, value);
});