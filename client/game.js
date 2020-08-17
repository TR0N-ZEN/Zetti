const socket = io();



//Login------------------------------------------------------------------------
$('#login form').submit(function (e) {
    e.preventDefault(); // prevents default action of e/the button so page reloading
    socket.emit('Login', $('#login form #loginName').val());
    $('#login').slideUp();
    return false;
});
//END Login--------------------------------------------------------------------

//All around the chat----------------------------------------------------------
$('.chat > button').click(function () {
    $('.info .chat .window').slideToggle("fast", "swing");
});

$('.chat .window > form').submit(function (e) {
    e.preventDefault(); // prevents page reloading
    socket.emit('MessageFromClient', PlayerObject.name + ": " + $('.chat .window form #message').val());
    $('.chat .window form #message').val('');
    return false;
});

var chatWindowsList = $('.chat .window > ul');
socket.on('MessageFromServer', function (message) {
    chatWindowsList.prepend($('<li>').text(message));
});

//END All around the chat------------------------------------------------------



//------------------------------------------------------

var infoName = $('.wrapper .info #Name');
var infoPoints = $('.wrapper .info #Points');
var infoGuesses = $('.wrapper .info #Guesses');
var cards = $('.wrapper .hand div');
socket.on('PlayerObject', (JSON_PlayerObject) => {
    PlayerObject = JSON.parse(JSON_PlayerObject);
    infoName.append(PlayerObject.name);
    infoPoints.append(PlayerObject.points);
    infoGuesses.append(PlayerObject.guesses);
    //ATTENTION
    for (i = 0; i < cards.length; i++) {
        cards[i].append(PlayerObject.cards[i].color + " " + PlayerObject.cards[i].value);
    }
});
//END--------------------------------------------------

