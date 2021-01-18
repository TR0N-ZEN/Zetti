const socket = io();

var left_first_coloumn = "2vw";
var left_second_coloumn = "34vw";
var top_first_row = "2vh";
var top_second_row = "14vh";
var top_third_row = "56vh";
var card_height = "30vh";
var card_width = "21vh";
var top_playingstack = "19vh";
var left_playingstack = "66vw";
var top_hand = "56vh";
var top_in_hand = "62vh";

var chat = {
    hidden: false,
    window: $('.chat.window'),
    form: $('.chat.window > form'),
    list: $('.chat.window > ul'),
    message: $('.chat.window > form #message')
};
var playerboard = $('.wrapper > #playerboard');
var playerboard_table = $('.wrapper > #playerboard > table');
var playingfield = $('.wrapper > #playingfield');
var hand = $('.wrapper > #hand');
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
        setTimeout( () => {
            guesses.take.css("display", "none");
            guesses.take.css("transition", "");
        }, 500);//hardcoded
    },
    show: () => {
        let distance_in_px = guesses.take.css('width');
        guesses.take.css("righ", "-" + distance_in_px);
        guesses.take.css("transition", "right 1s");
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

const resizeObserver = new ResizeObserver( async (entries) => {
    await delay(100);//cause until 1s after the first window resize the animation in css that positions #hand has finished
    $(".card").each(function (index_card) {
        // let distance = $("#hand > .card_frame").filter(function (index_card_frame) {
        //     return index_card === index_card_frame;
        // }).offset();
        let distance = $($("#hand > .card_frame")[index_card]).offset();
        $(this).offset(distance);
        console.log($(this));
        console.log(distance);
        console.log($(this).css("top") + " " + $(this).css("left"));
    });
});
resizeObserver.observe(document.querySelector("#hand"));


function make_card(/*string*/color, /*number*/number) {
    let card_svg = $("#svgs > ." + color + "_" + number.toString()).html();
    let card = document.createElement('div');
    card.setAttribute("class", color + "_" + number.toString() + " card");
    card.innerHTML = card_svg;
    return $( card );
};
function slideup_card(/*string*/color, /*number*/number) {
    $('.wrapper > ' + '.' + color + '_' + number.toString() + '.card').addClass("inhand"); //hardcoded
}

info.chat.click( () => {
    if (chat.hidden) {
        chat.window.css('right', 0);
        chat.hidden = false;
    } else {
        chat.window.css('right', "-" + chat.window.css('width'));
        chat.hidden = true;
    }
});

function removeTransition() {
    playingfield.css("transition", "none");
    playingstack.css("transition", "none");
    hand.css("transition", "none");
}


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
$('#login > form').submit(function (button) {
    button.preventDefault(); // prevents default action of e/the button so page reloading
    socket.emit('login', /*string*/$('#login > form > #loginName').val());
    return false;
});
$('.chat.window > form').submit(function (button) {
    button.preventDefault(); // prevents page reloading
    socket.emit('MessageFromClient', /*string*/PlayerObject.name + ": " + chat.message.val());
    chat.message.val('');
    return false;
});
$('#ready_player > button').on('click', () => {
    socket.emit('vote', /*number*/PlayerObject.id);
});
$('.take_guess > form').submit(function (button) {
    button.preventDefault();
    guesses.hide();
    let guess_number = parseInt($('.take_guess > form > input').val(), 10); // type number in deximal
    $('.take_guess > form > input').val("");
    socket.emit('guess.response', /*number*/guess_number, /*number*/player_index);
    info.guesses.text('Guesses: ' + guess_number.toString());
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
 *      round.start
 *      round.end
 *      trick.start
 *      trick.end
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

var player_index = 0;
socket.on('login.successful', (/*string*/JSON_PlayerObject) => {
    $('#login').slideUp();
    PlayerObject = JSON.parse(JSON_PlayerObject);
    info.name.append(PlayerObject.name);
    info.points.append(PlayerObject.points);
    info.guesses.append(PlayerObject.guesses);
    player_index = PlayerObject.index;
});
socket.on('login.unsuccessful', () => {
    $('#login').slideUp();
    //server send a different website saying there is no space for antoher player
});

socket.on('playerBoard.update', (/*string*/JSON_namesArray) => {
    let names = JSON.parse(JSON_namesArray);
    playerboard_table.html("");
    for (let a = 0; a < names.length; a++) {
        playerboard_table.append('<tr id="' + names[a] + '"> <td>' + names[a] + '</td>' + '<td>--<td>' + '</tr>');
    }
});

socket.on('vote.update', (/*number*/votes, /*number*/amount_of_players) => {
    $('#votes').text(votes.toString() + " / " + amount_of_players.toString());
});

socket.on('MessageFromServer', (/*string*/message) => {
    chat.list.append($('<li>').text(message));
});

socket.on('game.start', async () => {
    console.log("game.start");
    $('#ready_player').css("top", "-100vh"); //hardcoded
    playingfield.css("left", left_second_coloumn); //hardcoded
    playingstack.css("left", left_playingstack); //hardcoded
    hand.css("top", top_hand); //hardcoded
    await delay(2500); //hardcoded; deppendent on animation-duration of top_in_hand
    removeTransition();
    setTimeout(() => { $('#ready_player').css("display", "none"); }, 3000); //hardcoded; deppendent on animation-duration of #ready_player 
});
socket.on('game.round.start', async (/*number*/round, /*string*/trumpColor) => {
    $('#hand > .card_frame').remove();
    console.log("game.round.start :" + round.toString());
    info.round.text("Runde: " + round.toString());
    info.trump.text("Trumpf: " + trumpColor);
});
socket.on('game.round.end', async () => {
    console.log("game.round.end");
    $('#playerboard > table > tr').each(function () {
        $(this).children()[1].innerText = "";
        console.log($(this).children()[1].innerText);
    });
    $('#hand > .card_frame').removeClass("appear_border").addClass("disappear_border");
    await delay(1100); //hardcoded; deppendent on animation-duration of disappear_border
}); 
socket.on('game.trick.end', () => {
    console.log("game.trick");
    $('.onplayingstack').remove();
}); // de: Stich <=> eng: trick

socket.on('guess.waitingFor', (/*string*/playerName) => {
    $('#playerboard > table > tr > td:first-of-type').css("color", "white");
    $($('#' + playerName).children()[0]).css("color", "lightgreen");
});
socket.on('guess.update', (/*string*/playerName, /*number*/guess, /*number*/won) => {
    console.log("Won: " + won);
    $('#' + playerName).children()[1].innerText = won.toString() + " / " + guess.toString();
});
socket.on('guess.request', () => { 
    guesses.show();
});

socket.on('card.distribute', async (/*string*/JSON_cards) => {
    console.log("card.distribute");
    let cards = JSON.parse(JSON_cards);
    for (let a = 0; a < cards.length; a++) {
        let card_frame = document.createElement('div');
        hand.append(card_frame); //fade in by keyframe animation
    }
    $('#hand > div').addClass("card_frame").addClass("appear_border");
    for (let a = 0; a < cards.length; a++) {
        let card = $( make_card(/*string*/cards[a].color, /*number*/cards[a].number, ""));
        $('.wrapper').append(card);
        let pos = $('#hand > div').slice(a, a+1).position().left + hand.position().left;
        $('.wrapper > ' + '.' + cards[a].color + '_' + cards[a].number.toString() + '.card').css("left", pos + "px");
        setTimeout(slideup_card, 1100, /*string*/cards[a].color, /*number*/cards[a].number);
    }
});
socket.on('card.waitingFor', (/*string*/playerName) => {
    $('#playerboard > table > tr > td:first-of-type').css("color", "white");
    $($('#' + playerName).children()[0]).css("color", "lightgreen");
});
var last_card;
socket.on('card.waiting', (/*number*/card_level_on_stack) => {
    console.log("card.waiting");
    $('.card.inhand').click( async function () {
        $('.card.inhand').unbind("click");
        let card = $(this);
        let card_fullclassname =  $(this)[0].className.split(" ");
        let card_name = card_fullclassname[0].split("_");//.target.attributes.class.name;
        console.log("You clicked: " + card_name[0], card_name[1]);
        socket.emit('card.toPlayingstack', /*string*/card_name[0], /*number*/parseInt(card_name[1],10)); // => card.update
        card.removeClass("inhand");
        card.addClass("onplayingstack");
        await delay(90);
        card.css("z-index", (card_level_on_stack+2).toString());
        card.css("top", parseInt(top_playingstack, 10) + "vh");//card.addClass("onplayingstack"); //moves it to the appropirate height
        card.css("left", (parseInt(left_playingstack, 10)+card_level_on_stack*2).toString() + "vw"); //hardcoded
    });
});
socket.on('card.update', async (/*string*/color, /*number*/number, /*number*/card_level_on_stack) => {
    console.log("card.update: " + color + " " + number.toString());
    let card = make_card(color, number.toString());
    console.log(card);
    let crd = $('.wrapper').append(card);
    //.addClass("fromanotherplayer");
    console.log(crd);
    // $('.wrapper > .' + color + '_' + number.toString() + '.card.fromanotherplayer').css("z-index", card_level_on_stack+2);
    // $('.wrapper > .' + color + '_' + number.toString() + '.card.fromanotherplayer').addClass("onplayingstack");
    // $('.wrapper > .' + color + '_' + number.toString() + '.card.fromanotherplayer.onplayingstack').css("left", 66 + card_level_on_stack*2 + "vw");
    card.addClass( ["fromanotherplayer", "onplayingstack"] );
    await delay(90);//hardcoded and and a workaround for the problem of not applying the transition to card 
    card.css("z-index", card_level_on_stack+2);
    card.css("top", parseInt(top_playingstack, 10) + "vh");//card.addClass("onplayingstack"); //moves it to the appropirate height
    card.css("left", parseInt(left_playingstack, 10) + card_level_on_stack*2 + "vw");
});

socket.on('points.update', (/*number*/points) => {
    info.points.text("Punkte : " + points.toString());
});


//DEBUGING-------------------------------------------------------
socket.on('changeCSS', (/*string*/element, /*string*/property, /*string*/value) => {
    $(element).css(property, value);
});