const Card = require('./card').Card;
const Field = require('./field').Field;

class Zetti_field extends Field
{
  constructor(player_count = 6)
  {
    const decksize = 60;
    super(decksize);
    
    // array of Cards
    this.trick = this.playing_stack; 
    
    this.total_rounds = 60 / player_count;
    
    var cardIndex = 0;
    
    // should be static but this doesn't work for some reason on 28th March 2021
    this.colors = ["red", "green", "blue", "yellow"];
    
    this.colors.forEach((color, index) => 
    {
      // create cards 1 to 13 for each color
      for (let i = 1; i < 14; i++)
      {
        this.deck[cardIndex] = new Card(color, i);
        ++cardIndex;
      }
    });
    // Zauberer; each card needs to have unique properties
    for (let i = 0; i < 4; i++)
    {
      this.deck[cardIndex] = new Card("Z", i);
      ++cardIndex;
    }
    // Narren each card needs to have unique properties
    for (let i = 0; i < 4; i++)
    {
      this.deck[cardIndex] = new Card("N", i);
      ++cardIndex;
    }
    // the following lines are unused
    this.current_round = undefined;
    this.round_starter = undefined;
    this.current_trick = undefined;
    this.trick_starter = undefined; // to know who starts a trick
    this.waiting_for_guess = undefined;
    this.waiting_for_card = undefined;
  }
}
module.exports.Zetti_field = Zetti_field;