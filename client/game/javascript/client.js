const socket = io();
const left_first_coloumn = "2vw";
const left_second_coloumn = "34vw";
const top_first_row = "2vh";
const top_second_row = "14vh";
const top_third_row = "56vh";
const card_height = "30vh";
const card_width = "21vh";
const top_playingstack = "19vh";
const left_playingstack = "66vw";
const top_hand = "56vh";
const top_in_hand = "62vh";

//$( document ).ready(function() {
console.log( "Loaded entire website." );
$("#loading").slideUp();

const vote = $('#ready_player');
const chat = {
		visible: true,
		window: $('.chat.window'),
		form: $('.chat.window > form'),
		list: $('.chat.window > ul'),
		message: $('.chat.window > form #message'),
		hide: () => {
				chat.window.css('right', "-" + chat.window.css('width'));
				chat.visible = false;
		},
		show: () => {
				chat.window.css('right', 0);
				chat.visible = true;
		}
};
const playerboard = {
		object: $('.wrapper > #playerboard'),
		table: $('.wrapper > #playerboard > table')
} 
const playingfield = $('.wrapper > #playingfield');
const hand = $('.wrapper > #hand');
const playingstack = $('.wrapper > #playingstack');
const info = {
		name: $('.wrapper > #info #Name'),
		round: $('.wrapper > #info #Round'),
		trump: $('.wrapper > #info #Trump'),
		points: $('.wrapper > #info #Points'),
		guess: $('.wrapper > #info #Guess'),
		chat: $('.wrapper > #info > .chat')
};
const guess = {
		object: $('.take_guess'),
		visible: false,
		hide: () => {
				guess.visible = false;
				let distance_in_px = guess.object.css('width');
				guess.object.css("right", "-" + distance_in_px);
				setTimeout( () => {
						guess.object.css("display", "none");
						guess.object.css("transition", "");
				}, 500);//hardcoded
		},
		show: () => {
				guess.visible = true;
				let distance_in_px = guess.object.css('width');
				guess.object.css("righ", "-" + distance_in_px);
				guess.object.css("transition", "right 1s");
				guess.object.css("display", "grid");
				guess.object.css("right", distance_in_px);
		}
};

//delay only works in async functions
function delay(milliseconds)
{
		return new Promise( (resolve) => {
				setTimeout( () => {
						resolve();
				}, milliseconds);
		});
}

const resizeObserver = new ResizeObserver( async (entries) => {
		await delay(100);//cause until 1s after the first window resize the animation in css that positions #hand has finished
		if (!guess.visible) { guess.hide(); }
		if (!chat.visible) { chat.hide(); }
		$(".card").each(function (index_card) {
				let distance = $($("card_frame", hand)[index_card]).offset();
				$(this).offset(distance);
				// console.log($(this));
				// console.log(distance);
				// console.log($(this).css("top") + " " + $(this).css("left"));
		});
});
resizeObserver.observe(document.querySelector("#hand"));


function make_card(/*string*/color, /*number*/number, /*string*/from)
{
		//let card_svg = $("#svgs > ." + color + "_" + number.toString()).html();
		let card_svg = $(`#jpgs > .${color}_${number.toString()}`).html();
		if (from == "me") { from = " inhand"; }
		else if (from == "oponent") { from = " fromanotherplayer"; }
		else { from = ""; }
		let card = document.createElement('div');
		card.setAttribute("class", `${color}_${number.toString()} card`);
		card.innerHTML = card_svg;
		return $( card );
};
function slideup_card(/*string*/color, /*number*/number) { $(`.wrapper > .${color}_${number.toString()}.card`).addClass("inhand"); }

function removeTransition()
{
		playingfield.css("transition", "none");
		playingstack.css("transition", "none");
		hand.css("transition", "none");
}

info.chat.click( () => {
	if (!chat.visible) { chat.show(); }
	else { chat.hide(); }
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

$('#login > form').submit(function (button) {
		button.preventDefault(); // prevents default action of e/the button so page reloading
		socket.emit('login', /*string*/$('#loginName', this).val());
		return false;
});
// $('.chat.window > form')
chat.window.submit(function (button) {
		button.preventDefault(); // prevents page reloading
		if(chat.message.val()[0] == "#") { console.log(`Command: ${chat.message.val().slice(1)}`); socket.emit('Command', chat.message.val().slice(1)); }
		else { socket.emit('MessageFromClient', /*string*/PlayerObject.name + ": " + chat.message.val()); }
		chat.message.val('');
		return false;
});
$('#ready_player > button').on('click', () => {
		socket.emit('vote', /*number*/PlayerObject.id);
});
$('.take_guess > form').submit(function (button) {
		button.preventDefault();
		guess.hide();
		let guess_number = parseInt($('input', this).val(), 10); // type number in deximal
		//$('.take_guess > form > input').val("");
		$('input', this).val("");
		socket.emit('guess.response', /*number*/guess_number, /*number*/PlayerObject.id);
		info.guess.text('Noch zu holen: ' + guess_number.toString());
		let width_in_px = guess.object.css('width');
		guess.object.css("righ", "-" + width_in_px);
		setTimeout(() => {
				guess.object.css("display", "grid");
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
*      update.
*          names
*          points
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

socket.on('login.successful', (/*string*/JSON_PlayerObject) => {
		$('#login').slideUp();
		PlayerObject = JSON.parse(JSON_PlayerObject);
		info.name.append(PlayerObject.name);
		info.points.append(PlayerObject.points);
		info.guess.append(PlayerObject.guess);
});
socket.on('login.unsuccessful', () => {
		$('#login').slideUp();
		//server send a different website saying there is no space for antoher player
});

socket.on('playerBoard.update', (/*string*/JSON_players) => {
		let players = JSON.parse(JSON_players);
		playerboard.table.html("");
		let table;
		for (player of players)
		{
			table += `<tr id="${player.id}"> <td class="name">${player.name}</td> <td class="points">${player.points}</td> <td class="won_guess">${player.tricks_won}/${player.guess}</td> </tr>`;
		}
		playerboard.table.html(table);
});
socket.on('playerBoard.guess.update', (/*number*/playerID, /*number*/guess, /*number*/won) => {
			$(`#${playerID} > .won_guess`, playerboard.table).html(`${won.toString()}/${guess.toString()}`);
});
socket.on('info.points.update', (/*number*/points) => {
	info.points.text(`Punkte : ${points.toString()}`);
});
socket.on('info.guess.update', (/*number*/number = undefined) => {
	if ((typeof number) == "undefined") { info.guess.text(`Noch zu holen: `);}
	else { info.guess.text(`Noch zu holen: ${(number).toString()}`); }
});
socket.on('vote.update', (/*number*/votes, /*number*/amount_of_players) => {
		$('#votes').text(`${votes.toString()}/${amount_of_players.toString()}`);
});

socket.on('MessageFromServer', (/*string*/message) => {
		chat.list.append($('<li>').text(message));
});

socket.on('game.start', async () => {
		console.log("game.start");
		vote.css("top", "-100vh"); //hardcoded
		playingfield.css("left", left_second_coloumn); //hardcoded
		playingstack.css("left", left_playingstack); //hardcoded
		hand.css("top", top_hand); //hardcoded
		await delay(2500); //hardcoded; deppendent on animation-duration of top_in_hand
		removeTransition();
		setTimeout(() => { vote.css("display", "none"); }, 3000); //hardcoded; deppendent on animation-duration of #ready_player 
});
socket.on('game.round.start', async (/*number*/round, /*string*/trumpColor) => {
		$('#hand > .card_frame').remove();
		console.log(`game.round.start : ${round.toString()}`);
		info.round.text(`Runde: ${round.toString()}`);
		info.trump.text(`Trumpf: ${trumpColor}`);
});
socket.on('game.round.end', async () => {
		console.log("game.round.end");
		$('tr', playerboard.table).each(function () {
				// $(this).children()[1].innerText = ""; //deleting won/guess
				$('.won_guess', this).html("");
		});
		$('.card_frame', hand).removeClass("appear_border").addClass("disappear_border");
		await delay(1100); //hardcoded; deppendent on animation-duration of disappear_border
}); 
socket.on('game.trick.start', () => {
		console.log("game.trick.start");
}); // de: Stich <=> eng: trick
socket.on('game.trick.end', () => {
		console.log("game.trick.end");
		$('.onplayingstack').remove();
}); // de: Stich <=> eng: trick

socket.on('guess.waitingFor', (/*string*/playerID) => {
		$('tr > .name', playerboard.table).css("color", "white");
		$(`#${playerID} > .name`, playerboard.table).css("color", "lightgreen");
});
socket.on('guess.request', () => { 
		guess.show();
});

socket.on('card.distribute', async (/*string*/JSON_cards) => {
		console.log("card.distribute");
		let cards = JSON.parse(JSON_cards);
		for (card in cards)
		{
				let card_frame = document.createElement('div');
				hand.append(card_frame); //fade in by keyframe animation
		}
		$('#hand > div').addClass("card_frame").addClass("appear_border");
		for (let a = 0; a < cards.length; a++)
		{
				let card = $( make_card(/*string*/cards[a].color, /*number*/cards[a].number, "") );
				$('.wrapper').append(card);
				let pos = $('#hand > div').slice(a, a+1).position().left + hand.position().left;
				$(`.wrapper > .${cards[a].color}_${cards[a].number.toString()}.card`).css("left", `${pos}px`);
				setTimeout(slideup_card, 1100, /*string*/cards[a].color, /*number*/cards[a].number);
		}
});
socket.on('card.waitingFor', (/*string*/playerID) => {
		$('tr > td:first-of-type', playerboard.table).css("color", "white");
		$(`#${playerID} > .name`).css("color", "lightgreen");
});
socket.on('card.waiting', (/*number*/card_level_on_stack) => {
		console.log("card.waiting");
		$('.card.inhand').click( async function () {
				$('.card.inhand').unbind("click");
				let card = $(this);
				let card_fullclassname =  $(this)[0].className.split(" ");
				let card_name = card_fullclassname[0].split("_");//.target.attributes.class.name;
				console.log("You clicked: " + card_name[0], card_name[1]);
				socket.emit('card.toPlayingstack', /*string*/card_name[0], /*number*/parseInt(card_name[1],10), /*id*/ PlayerObject.id); // => card.update
				card.removeClass("inhand");
				card.addClass("onplayingstack");
				await delay(90);//hardcoded and and a workaround for the problem of not applying the transition to card 
				card.css("z-index", (card_level_on_stack+2).toString());
				card.css("top", parseInt(top_playingstack, 10).toString() + "vh");//card.addClass("onplayingstack"); //moves it to the appropirate height
				card.css("left", (parseInt(left_playingstack, 10)+card_level_on_stack*2).toString() + "vw"); //hardcoded
		});
});
socket.on('card.update', async (/*string*/color, /*number*/number, /*number*/card_level_on_stack) => {
		console.log(`card.update: ${color} ${number.toString()}`);
		let card = make_card(color, number.toString());
		console.log(card);
		let crd = $('.wrapper').append(card);
		console.log(crd);
		card.addClass( ["fromanotherplayer", "onplayingstack"] );
		await delay(90);//hardcoded and and a workaround for the problem of not applying the transition to card 
		card.css("z-index", card_level_on_stack+2);
		card.css("top", parseInt(top_playingstack, 10).toString() + "vh");//card.addClass("onplayingstack"); //moves it to the appropirate height
		card.css("left", (parseInt(left_playingstack, 10) + card_level_on_stack*2).toString() + "vw");
});

//DEBUGING-------------------------------------------------------
socket.on('changeCSS', (/*string*/element, /*string*/property, /*string*/value) => {
		$(element).css(property, value);
});
//});