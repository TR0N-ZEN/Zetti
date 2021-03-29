const Card = require('./card').Card;
const Field = require('./field').Field;

class Zetti_field extends Field 
{
	constructor()
	{
		super(60)
		var cardIndex = 0
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
		this.trick = this.playing_stack; // array of Cards
		this.current_round = 1;
		this.total_rounds = undefined;
		this.round_starter = 0;
		this.current_trick = 1;
		this.trick_starter = 0; // to know who starts a trick
		this.game_is_running = false;
	}
}


module.exports.Zetti_field = Zetti_field;