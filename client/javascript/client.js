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
    name: $('.wrapper > #info #Name'),
    round: $('.wrapper > #info #Round'),
    trump: $('.wrapper > #info #Trump'),
    points: $('.wrapper > #info #Points'),
    guesses: $('.wrapper > #info #Guesses'),
    chat: $('.wrapper > #info > .chat')
};
var guesses = {
    take: $('.take_guess'),
    hide: () => {
        let distance_in_px = guesses.take.css('width');
        guesses.take.css("right", "-" + distance_in_px);
        guesses.take.css("display", "none");
    },
    show: () => {
        let distance_in_px = guesses.take.css('width');
        guesses.take.css("righ", "-" + distance_in_px);
        guesses.take.css("display", "grid");
        guesses.take.css("right", distance_in_px);
    }
};

//delay only works in async functions
function delay(milliseconds) {
    return new Promise( (resolve) => {
        setTimeout( () => {
            resolve();
        }, milliseconds);
    });
}

function make_card(color, number) {
    let card = document.createElement('div');
    let card_svg = $("#svgs > ." + color + "_" + number).html();
    card.setAttribute("class", color + "_" + number + " card fromanotherplayer");
    card.innerHTML = card_svg;
    return card;
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
    socket.emit('MessageFromClient', PlayerObject.name + ": " + chat.message.val());
    chat.message.val('');
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
    //server send a different website saying there is no space for antoher player
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
});
socket.on('game.trick', () => {
    console.log("game.trick");
    $('wrapper > .card').remove();
}); // de: Stich <=> eng: trick
socket.on('guess.waitingFor', (playerName) => {
    $('.playerBoard > p').css("color", "white");
    $("#" + playerName).css("color", "lightgreen");
})
socket.on('guess.request', () => {
    guesses.show();
});
socket.on('guess.complete', () => {
    guesses.hide();
});
socket.on('card.distribute', async (JSON_cards) => {
    console.log("card.distribute");
    let cards = JSON.parse(JSON_cards);
    for (let a = 0; a < cards.length; a++) {
        let card_svg = $('#svgs > .' + cards[a].color + "_" + cards[a].number).html();
        let card = document.createElement('div');
        let classname = cards[a].color + "_" + cards[a].number;
        card.setAttribute("class", classname + " card");
        card.innerHTML = card_svg;
        $('.wrapper').append(card);
        await delay(200);
        $(".wrapper > " + "." + classname + ".card").css("left", (a*(14+2)+20).toString()+"vw");
        $(".wrapper > " + "." + classname + ".card").addClass("cardinhand");
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
    $('.card').click( async function () {
        let card = $(this);
        let card_id =  $(this)[0].className.split(" ");
        let card_name = card_id[0].split("_");//.target.attributes.class.name;
        console.log("You clicked: " + card_name[0], card_name[1]);
        socket.emit('card.toPlayingstack', card_name[0], card_name[1], card_pos_on_stack); // => card.update
        let dest_left = playingstack.css("left");
        let dest_top = playingstack.css("top");
        await delay(400);
        card.css("left", dest_left);
        card.css("top", dest_top);
        card.css("z-index", card_pos_on_stack);
        //alternative to the two lines above:
        //card.addClass("onplayingstack");
    });
});
socket.on('card.update', async (color, number) => {
    console.log("card.update: " + color + " " + number);
    let card = make_card(color, number);
    $(".wrapper").append(card);
    await delay(300);
    let dest_left = playingstack.css("left");
    let dest_top = playingstack.css("top");
    $(card.className).css("left", dest_left);
    $(card.className).css("top", dest_top);
    //$(card.className).addClass("onplayingstack");
});
socket.on('points.update', (points) => {
    info.points.text("Points: " + points.toString());
});


//DEBUGING-------------------------------------------------------
socket.on('changeCSS', (element, property, value) => {
    $(element).css(property, value);
});