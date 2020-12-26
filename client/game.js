const socket = io();
var chat_hidden = false;
var chatWindowsList = $('.chat .window > ul');
var infoName = $('.wrapper .info #Name');
var infoPoints = $('.wrapper .info #Points');
var infoGuesses = $('.wrapper .info #Guesses');
var cards = $('.wrapper .hand div');

//SENDERS------------------------------------------------------------------------
////login------------------------------------------------------------------------
$('#login form').submit(function (button) {
    button.preventDefault(); // prevents default action of e/the button so page reloading
    socket.emit('login', $('#login form #loginName').val());
    return false;
});
////chat------------------------------------------------------------------------
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
$('.chat .window > form').submit(function (button) {
    button.preventDefault(); // prevents page reloading
    socket.emit('MessageFromClient', PlayerObject.name + ": " + $('.chat .window form #message').val());
    $('.chat .window form #message').val('');
    return false;
});
////ready?------------------------------------------------------
$('#ready_player > button').on('click', () => {
    socket.emit('vote', PlayerObject.id);
});
socket.on('login.successful', (JSON_PlayerObject) => {
    $('#login').slideUp();
    PlayerObject = JSON.parse(JSON_PlayerObject);
    infoName.append(PlayerObject.name);
    infoPoints.append(PlayerObject.points);
    infoGuesses.append(PlayerObject.guesses);
    //ATTENTION
});
socket.on('login.unsuccessful', () => {
    $('#login').slideUp();
    //ATTENTION
});


//LISTENERS---------------------------------------------------
socket.on('login.unsuccessful', () => {  })
socket.on('vote.update', (votes, amount_of_players) => {
    $('#votes').text(votes.toString() + " / " + amount_of_players.toString());
});
socket.on('MessageFromServer', function (message) {
    chatWindowsList.prepend($('<li>').text(message));
});
socket.on('prepare');
socket.on('newRound', (round, trumpColor) => {
    for (i = 0; i < cards.length; i++) {
        cards[i].append(PlayerObject.cards[i].color + " " + PlayerObject.cards[i].value);
    }
});