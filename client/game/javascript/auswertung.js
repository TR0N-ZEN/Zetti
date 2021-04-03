function make_card(/*string*/color, /*number*/number)
{
		let card_svg = $(`#jpgs > .${color}_${number.toString()}`).html();
		let card = document.createElement('div');
		card.setAttribute("class", `card ${color}_${number.toString()} hidden_card`);
		card.innerHTML = card_svg;
		return $( card );
};
class Card
{
	constructor(color, number) {
		this.color = color;
		this.number = number;
	}
}
function zetti_deck()
{
	let deck = [];
	colors = ["red", "green", "blue", "yellow"]; // should be static but this doesn't work for some reason on 28th March 2021
	colors.forEach((color, index) => 
	{
		for (let i = 1; i < 14; i++)
		{
			deck.push(new Card(color, i));
		}
	});
	for (let i = 0; i < 4; i++)
	{
		deck.push(new Card("Z", i)); // Zauberer; each card needs to have unique properties
	}
	for (let i = 0; i < 4; i++)
	{
		deck.push(new Card("N", i)); // Narren each card needs to have unique properties
	}
	return deck;
}

let card_wall = $('.wrapper > #card_wall');
//$(document).ready(function (){
	(function()
	{
		let deck = zetti_deck();
		for (card of deck)
		{
			let color = card.color;
			let number = card.number;
			setTimeout(() => {
				card_wall.append(make_card(color, number));
				setTimeout(() => {
					$(`.${color}_${number}`, card_wall).addClass('visible_card');
				}, Math.random()*10000);
			}, Math.random()*10000);
		}
	})();
//});