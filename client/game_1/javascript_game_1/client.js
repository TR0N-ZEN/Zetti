const socket = io("/game_1");


const css = {
	primary_color: "black",
	secondary_color: "white",
	grid: {
		column: { first: "2vw", second: "34vw"},
		row: { first: "2vh", second: "14vh", third: "56vh" }
	},
	card: { height: "30vh", left: "66vh" },
	hand: { top: "56vh", top_in_hand: "62vh" },
	playingstack: { top: "19vh", left: "66vh"},
	hidden: {	bottom: "100vh", right: "100vw" }
}

//$( document ).ready(function() {
console.log("Loaded entire website.");
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
//const playingstack = $('.wrapper > #playingstack');
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

const resizeObserver = new ResizeObserver( /*async*/ (entries) => {
	//await delay(100);//cause until 100ms after the first window resize the animation in css that positions #hand has finished
	if (!guess.visible) { guess.hide(); }
	if (!chat.visible) { chat.hide(); }
	let jQuery_cards = $(".wrapper > .card");
	let card_frames =  $(".card_frame", hand);
	for (let index = 0; index < jQuery_cards.length; index++)
	{
		let offset = card_frames.eq(index).offset();
		jQuery_cards.eq(index).offset(offset);
	}
});
resizeObserver.observe(document.querySelector("#hand", {box: "border-box"}));

function make_card(/*string*/color, /*number*/number, /*string*/from)
{
		let card_svg = $(`#jpgs > .${color}_${number.toString()}`).html();
		if (from == "me") { from = " inhand"; }
		else if (from == "oponent") { from = " fromanotherplayer"; }
		else { from = ""; }
		let html_card = document.createElement('div');
		html_card.setAttribute("class", `${color}_${number.toString()} card`);
		html_card.innerHTML = card_svg;
		return $( html_card );
};
function slideup_card(/*string*/color, /*number*/number) { $(`.wrapper > .${color}_${number.toString()}.card`).addClass("inhand"); }

function removeTransition()
{
		playingfield.css("transition", "none");
		//playingstack.css("transition", "none");
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
* guess.
* 	response
* card.
* 	toPlayingstack //in LISTENERS

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


function safe(arg)
{
	if (arg == undefined) { console.log("undefined"); return " "; }
	else { console.log("safe"); return arg.toString(); };
}
//LISTENERS---------------------------------------------------
/*
* socket.on(x, function() {})
*
* login.
* 	successful
* 	unsuccessful
* playerBoard:
* 	update.
*   	names
* 		points
* vote.
* 	update
* MessageFromServer
* game.
* 	start
*    round.
*			start
* 		end
*   trick.
*			start
*     end
* guess.
*   waitingFor
*   request
* card.
* 	distribute
*   waiting -> emit('card.toPlayingstack', ...) -> card.update
*   waitingFor
*   update //card on stack
* points.
*   update
* changeCSS
* */
// socket.prependAny((event) => {
//   console.log(`socket.on(${event})`);
// });
socket.on('login.successful', (/*string*/JSON_PlayerObject) => {
		$('#login').slideUp();
		PlayerObject = JSON.parse(JSON_PlayerObject);
		info.name.append(PlayerObject.name);
		info.points.append(PlayerObject.points);
		info.guess.append(PlayerObject.guess);
});
socket.on('login.unsuccessful', () => {
		$('#login').slideUp();
});

socket.on('playerboard.update', (/*string*/JSON_players) => {
	let players = JSON.parse(JSON_players);
	playerboard.table.html("");
	let table;
	for (player of players)
	{
		table += `<tr id="${player.id}"> <td class="name">${player.name}</td> <td class="points">${safe(player.points)}</td> <td class="won_guess">${safe(player.tricks_won)}/${safe(player.guess)}</td> </tr>`;
	}
	playerboard.table.html(table);
});
socket.on('playerboard.guess.update', (/*number*/playerID, /*number*/guess = undefined, /*number*/won = undefined) => {
	$(`#${playerID} > .won_guess`, playerboard.table).html(`${safe(won)}/${safe(guess)}`);
});
socket.on('info.points.update', (/*number*/points = undefined) => {
	info.points.text(`Punkte : ${safe(points)}`);
});
socket.on('info.guess.update', (/*number*/number = undefined) => {
	info.guess.text(`Noch zu holen: ${safe(number)}`);
});
socket.on('vote.update', (/*number*/votes, /*number*/amount_of_players) => {
		$('#votes').text(`${votes.toString()}/${amount_of_players.toString()}`);
});

socket.on('MessageFromServer', (/*string*/message) => {
		chat.list.append($('<li>').text(message));
});

socket.on('game.start', async () => {
		vote.css("top", "-100vh"); //hardcoded
		playingfield.css("left", css.grid.column.second); //hardcoded
		//playingstack.css("left", css.playingstack.left); //hardcoded
		hand.css("top", css.hand.top); //hardcoded
		await delay(2500); //hardcoded; deppendent on animation-duration of top_in_hand
		removeTransition();
		setTimeout(() => { vote.css("display", "none"); }, 3000); //hardcoded; deppendent on animation-duration of #ready_player 
});
socket.on('game.round.start', async (/*number*/round, /*string*/trumpColor) => {
		console.log(`round: ${round.toString()}`);
		info.round.text(`Runde: ${round.toString()}`);
		info.trump.text(`Trumpf: ${trumpColor}`);
});
socket.on('game.round.end', async () => {
		$('tr', playerboard.table).each(function () {
				// $(this).children()[1].innerText = ""; //deleting won/guess
				$('.won_guess', this).html("");
		});
		$('.card_frame', hand).removeClass("appear_border").addClass("disappear_border");
		await delay(1100); //hardcoded; deppendent on animation-duration of disappear_border
		$('.card_frame', hand).remove();
}); 
socket.on('game.trick.start', () => {
}); // de: Stich <=> eng: trick
socket.on('game.trick.end', () => {
		$('.onplayingstack').remove();
}); // de: Stich <=> eng: trick

socket.on('guess.waitingFor', (/*string*/playerID) => {
		$('tr > .name', playerboard.table).css("color", css.secondary_color);
		$(`#${playerID} > .name`, playerboard.table).css("color", "lightgreen");
});
socket.on('guess.request', () => { 
		guess.show();
});

socket.on('card.distribute', async (/*string*/JSON_cards) => {
		let cards = JSON.parse(JSON_cards);
		for (card in cards)
		{
				let card_frame = document.createElement('div');
				hand.append(card_frame); //fade in by keyframe animation
		}
		$('#hand > div').addClass("card_frame").addClass("appear_border");
		for (let a = 0; a < cards.length; a++)
		{
				let html_card = $( make_card(/*string*/cards[a].color, /*number*/cards[a].number, "") );
				$('.wrapper').append(html_card);
				// let pos = $('#hand > div').slice(a, a+1)[0].position().left + hand.position().left;
				let offset_left = $('.card_frame', hand).slice(a, a+1).offset().left;
				// $(`.wrapper > .${cards[a].color}_${cards[a].number.toString()}.card`).css("left", `${offset_left}px`);
				$(`.wrapper > .card`).slice(a, a+1).css("left", `${offset_left}px`);
				setTimeout(slideup_card, 1100, /*string*/cards[a].color, /*number*/cards[a].number);
		}
});
socket.on('card.waitingFor', (/*string*/playerID) => {
		$('tr > td:first-of-type', playerboard.table).css("color", css.secondary_color);
		$(`#${playerID} > .name`).css("color", "lightgreen");
});
socket.on('card.request', (/*number*/card_level_on_stack) => {
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
				card.css("top", css.playingstack.top);//card.addClass("onplayingstack"); //moves it to the appropirate height
				card.css("left", (parseInt(css.playingstack.left, 10)+card_level_on_stack*2).toString() + "vw"); //hardcoded
		});
});
socket.on('card.update', async (/*string*/color, /*number*/number, /*number*/card_level_on_stack) => {
		console.log(`card.update: ${color} ${number.toString()}`);
		let card = make_card(color, number.toString());
		console.log(card);
		let crd = $('.wrapper').append(card);
		console.log(crd);
		card.addClass( ["fromanotherplayer", "onplayingstack"] ); // "fromanotherplayer" places card outside of viewport by shifting it to the right, "onplayingstack" positions card to fit playingtsack in vertical axis 
		await delay(90);//hardcoded and and a workaround for the problem of not applying the transition to card 
		card.css("z-index", card_level_on_stack+2);
		card.css("top", css.playingstack.top);//card.addClass("onplayingstack"); //moves it to the appropirate height
		card.css("left", (parseInt(css.playingstack.left, 10) + card_level_on_stack*2).toString() + "vw");
});

//DEBUGING-------------------------------------------------------
socket.on('changeCSS', (/*string*/element_selector, /*string*/property, /*string*/value) => {
		$(element_selector).css(property, value);
});
//});