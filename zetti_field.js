const Card = require('./card').Card;
const Field = require('./field').Field;
const colors = ["red", "green", "blue", "yellow"];

var playingfield = new Field(60);
cardIndex = 0;

for (color of colors)
{
	for (let i = 1; i < 14; i++)
	{
		playingfield.deck[cardIndex] = new Card(color, i);
		++cardIndex;
	}
}
for (let i = 0; i < 4; i++)
{
	playingfield.deck[cardIndex] = new Card("Z", i); // Zauberer; each card needs to have unique properties
	++cardIndex;
}
for (let i = 0; i < 4; i++)
{
	playingfield.deck[cardIndex] = new Card("N", i); // Narren each card needs to have unique properties
	++cardIndex;
}

module.exports.playingfield = playingfield;