const Card = require('./card').Card;
const Field = require('./field').Field;

class Zetti_field extends Field 
{
	static colors = ["red", "green", "blue", "yellow"];
	constructor()
	{
		super(60)
		cardIndex = 0
		for (color of Zetti_field.colors)
		{
			for (let i = 1; i < 14; i++)
			{
				this.deck[cardIndex] = new Card(color, i);
				++cardIndex;
			}
		}
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
		this.trick_starter = 0; // to know who starts a trick
		this.winner_index = undefined; // to know who starts a trick if it isn't the first in the round
		this.current_round = 1;
		this.total_rounds = 0;
	}
}


module.exports.Zetti_field = Zetti_field;