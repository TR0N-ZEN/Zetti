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
////vote------------------------------------------------------
$('#ready_player > button').on('click', () => {
    socket.emit('vote', PlayerObject.id);
});
///card.play
$('.hand > div').on('click', (card) => {
    socket.emit('card.play', (card.color, card.number)); //not thought out yet
});


//LISTENERS---------------------------------------------------
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
socket.on('vote.update', (votes, amount_of_players) => {
    $('#votes').text(votes.toString() + " / " + amount_of_players.toString());
});
socket.on('MessageFromServer', (message) => {
    chatWindowsList.prepend($('<li>').text(message));
});
socket.on('game.start', () => {
    console.log("game.start");
    $('#ready_player').css("transform", "translateY(-40vh)");
});
socket.on('card.distribute', (cards) => {
    console.log("card.distribute");
});
socket.on('card.update', (color, number) => {
    console.log("card: " + color + " " + number);
    $('.playingStack p:first').text(color + " " + number);
    let card_svg = $('.card .' + color + number).html();
    console.log(card_svg);
    $('.playingStack').html(card_svg);
});
socket.on('game.round', (round, trumpColor) => {
    console.log("game.round");
    for (i = 0; i < cards.length; i++) {
        cards[i].append(PlayerObject.cards[i].color + " " + PlayerObject.cards[i].value);
    }
});
socket.on('game.trick', () => {
    console.log("game.trick");
}); // de: Stich <=> eng: trick
socket.on('changeCSS', (element, property, value) => {
    $(element).css(property, value);
});