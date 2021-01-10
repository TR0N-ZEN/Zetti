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

function make_card(color, number, from) {
    let card_svg = $("#svgs > ." + color + "_" + number).html();
    if (from == "me") {
        from = "cardinhand";
    } else if (from == "oponent") {
        from = "fromanotherplayer";
    } else {
        from = "";
    }
    let card = document.createElement('div');
    card.setAttribute("class", color + "_" + number + " card " + from);
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
    $('#ready_player').css("transform", "translateY(-40vh)"); //hardcoded
    playingfield.css("left", "34vw"); //hardcoded
    playingstack.css("left", "66vw"); //hardcoded
    hand.css("top", "56vh"); //hardcoded
    setTimeout(() => { $('#ready_player').css("display", "none"); }, 3000);
});
socket.on('game.round', (round, trumpColor) => {
    $('#hand > .card_frame').remove();
    console.log("game.round :" + round.toString());
    info.round.text("Runde: " + round.toString());
    info.trump.text("Trumpf: " + trumpColor.toString());
});
socket.on('game.trick', () => {
    console.log("game.trick");
    $('.onplayingstack').remove();
}); // de: Stich <=> eng: trick
socket.on('guess.waitingFor', (playerName) => {
    $('.playerboard > p').css("color", "white");
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
        let card_frame = document.createElement('div');
        hand.append(card_frame);
    }
    $("#hand > div").addClass("card_frame");
    for (let a = 0; a < cards.length; a++) {
        let card = make_card(cards[a].color, cards[a].number, "");
        $('.wrapper').append(card);
        let pos = $("#hand > div").slice(a, a+1).position().left + hand.position().left;
        console.log(pos);
        $(".wrapper > " + "." + cards[a].color + "_" + cards[a].number + ".card").css("left", pos + "px");
        //await delay(1100);//not the most beautiful way
        setTimeout( () => {
            $(".wrapper > " + "." + cards[a].color + "_" + cards[a].number + ".card").addClass("cardinhand"); //hardcoded
        },1100);
    }
});
socket.on('card.waitingFor', (playerName) => {
    $('.playerboard > p').css("color", "white");
    $("#" + playerName).css("color", "lightgreen");
});
var last_card;
socket.on('card.waiting', (card_level_on_stack) => {
    console.log("card.waiting");
    $('.card').unbind("click");
    $('.card').click( async function () {
        let card = $(this);
        let card_id =  $(this)[0].className.split(" ");
        let card_name = card_id[0].split("_");//.target.attributes.class.name;
        console.log("You clicked: " + card_name[0], card_name[1]);
        socket.emit('card.toPlayingstack', card_name[0], card_name[1]); // => card.update
        await delay(400);
        card.addClass("onplayingstack"); //hardcoded
        card.css("left", (66+card_level_on_stack*2).toString() + "vw"); //hardcoded
        card.css("z-index", (card_level_on_stack+2).toString());
    });
});
socket.on('card.update', async (color, number, card_level_on_stack) => {
    console.log("card.update: " + color + " " + number);
    let card = make_card(color, number, "oponent");
    $(".wrapper").append(card);
    $(".wrapper > ." + color + "_" + number + ".card.fromanotherplayer").css("z-index", (card_level_on_stack+2).toString()).css("left", (66+card_level_on_stack*2).toString() + "vw"); //hardcoded
    $(".wrapper > ." + color + "_" + number + ".card.fromanotherplayer").addClass("onplayingstack");
});
socket.on('points.update', (points) => {
    info.points.text("Points: " + points.toString());
});


//DEBUGING-------------------------------------------------------
socket.on('changeCSS', (element, property, value) => {
    $(element).css(property, value);
});