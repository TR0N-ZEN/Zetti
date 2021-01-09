const socket = io();
var chat = {
    hidden: false,
    window: $('.chat.window'),
    form: $('.chat.window > form'),
    list: $('.chat.window > ul'),
    message: $('.chat.window > form #message')
};
var playerboard = $('.wrapper > #playerboard');
var playingfield = $('.wrapper > #playingfield');
var hand = $('.wrapper > #hand');
var cards = $('.wrapper > .card');
var playingstack = $('.wrapper > #playingstack');

var info = {
    name: $('.wrapper .info #Name'),
    round: $('.wrapper .info #Round'),
    trump: $('.wrapper .info #Trump'),
    points: $('.wrapper .info #Points'),
    guesses: $('.wrapper .info #Guesses'),
    chat: $('.chat'),
};
var guesses = {
    take: $('.take_guess'),
    hide: () => {
        let width_in_px = guesses.take.css('width');
        guesses.take.css("right", "-" + width_in_px);
    }
};

info.chat.click( () => {
    if (chat.hidden) {
        chat.window.css('right', 0);
        chat.hidden = false;
    } else {
        chat.window.css('right', "-" + chat.window.css('width'));
        chat.hidden = true;
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
$('.chat.window > form').submit(function (button) {
    button.preventDefault(); // prevents page reloading
    socket.emit('MessageFromClient', PlayerObject.name + ": " + $('.chat.window > form > #message').val());
    $('.chat.window > form > #message').val('');
    return false;
});
$('#ready_player > button').on('click', () => {
    socket.emit('vote', PlayerObject.id);
});
$('.take_guess > form').submit(function (button) {
    button.preventDefault();
    guesses.hide();
    let guess_number = $('.take_guess > form > input').val();
    $('.take_guess > form > input').val("");
    socket.emit('guess.response', guess_number, index);
    info.guesses.text('Guesses: ' + guess_number);
    let width_in_px = guesses.take.css('width');
    guesses.take.css("righ", "-" + width_in_px);
    setTimeout(() => {
        guesses.take.css("display", "grid");
    }, 1000);
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
    info.name.append(PlayerObject.name);
    info.points.append(PlayerObject.points);
    info.guesses.append(PlayerObject.guesses);
    index = PlayerObject.index;
});
socket.on('login.unsuccessful', () => {
    $('#login').slideUp();
});
socket.on('playerBoard.update', (JSON_namesArray) => {
    let names = JSON.parse(JSON_namesArray);
    playerboard.html("");
    for (let a = 0; a < names.length; a++) {
        playerboard.append('<p id="' + names[a] + '">' + names[a] + '</p>');
    }
})
socket.on('vote.update', (votes, amount_of_players) => {
    $('#votes').text(votes.toString() + " / " + amount_of_players.toString());
});
socket.on('MessageFromServer', (message) => {
    chat.list.append($('<li>').text(message));
});
socket.on('game.start', () => {
    console.log("game.start");
    $('#ready_player').css("transform", "translateY(-40vh)");
    playingfield.css("left", "34vw");
    playingstack.css("left", "66vw");
    hand.css("top", "56vh");
    setTimeout(() => { $('#ready_player').css("display", "none"); }, 3000);
});
socket.on('game.round', (round, trumpColor) => {
    console.log("game.round :" + round.toString());
    info.round.text("Runde: " + round.toString());
    info.trump.text("Trumpf: " + trumpColor.toString());
    playingstack.html("");
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
    guesses.take.css("righ", "-" + width_in_px);
    guesses.take.css("display", "grid");
    guesses.take.css("right", width_in_px);
});
socket.on('guess.complete', () => {
    guesses.hide();
});
socket.on('card.distribute', (JSON_cards) => {
    console.log("card.distribute");
    let cards = JSON.parse(JSON_cards);
    hand.html("");
    for (let a = 0; a < cards.length; a++) {
        let card_svg = $('#svgs > .' + cards[a].color + "_" + cards[a].number).html();
        let card = document.createElement('div');
        card.setAttribute("class", cards[a].color + "_" + cards[a].number);
        card.innerHTML = card_svg;
        //hand.append(card);
    }
});
socket.on('card.waitingFor', (playerName) => {
    $('.playerBoard > p').css("color", "white");
    $("#" + playerName).css("color", "lightgreen");
});
var last_card;
socket.on('card.waiting', () => {
    console.log("card.waiting");
    $('.card').unbind("click");
    $('.card').css("transition", "left 3s, top 3s");
    $('.card').click(function () {
        let card = $(this);
        let card_name = $(this)[0].className.split("_");//.target.attributes.class.name;
        console.log("You clicked: " + card_name[0], card_name[1]);
        //socket.emit('card.toPlayingstack', card[0], card[1]);
        card.css("position", "fixed");
        let dest_left = playingstack.css("left");
        let dest_top = playingstack.css("top");
        //card.css("transition", "left 3s, top 3s");
        console.log(card.css("transition-property"));
        console.log(card.css("transition-duration"));
        setTimeout(() => {
            card.css("left", dest_left);
            card.css("top", dest_top);
            console.log(card.css("left"));
            console.log(card.css("top"));
        }, 2000);
    });
});
socket.on('card.update', (color, number) => {
    console.log("card.update: " + color + " " + number);
    //$('.playingStack p:first').text(color + " " + number);
    let card_svg = $("." + color + "_" + number).html();
    playingstack.html(card_svg);
});
socket.on('points.update', (points) => {
    info.points.text("Points: " + points.toString());
});


//DEBUGING-------------------------------------------------------
socket.on('changeCSS', (element, property, value) => {
    $(element).css(property, value);
});