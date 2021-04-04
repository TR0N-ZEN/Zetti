const Card = require('./card').Card;
const Field = require('./field').Field;

class Zetti_field extends Field
{
	constructor(player_count = 6)
	{
		const decksize = 60;
		super(decksize);
		this.trick = this.playing_stack; // array of Cards
		this.total_rounds = 60 / player_count;
		var cardIndex = 0;
		this.colors = ["red", "green", "blue", "yellow"]; // should be static but this doesn't work for some reason on 28th March 2021
		this.colors.forEach((color, index) => 
		{
			for (let i = 1; i < 14; i++)
			{
				this.deck[cardIndex] = new Card(color, i);
				++cardIndex;
			}
		});
		for (let i = 0; i < 4; i++)
		{
			this.deck[cardIndex] = new Card("Z", i); // Zauberer; each card needs to have unique properties
			++cardIndex;
		}
		for (let i = 0; i < 4; i++)
		{
			this.deck[cardIndex] = new Card("N", i); // Narren each card needs to have unique properties
			++cardIndex;
		}
		// unused
		this.current_round = undefined;
		this.round_starter = undefined;
		this.current_trick = undefined;
		this.trick_starter = undefined; // to know who starts a trick
		this.waiting_for_guess = undefined;
		this.waiting_for_card = undefined;
	}
}
module.exports.Zetti_field = Zetti_field;