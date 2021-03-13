class Field {
	constructor(decksize) {
		this.deck = new Array(decksize);
		this.playing_stack = new Array();
		this.card_pos_on_stack = 0;
		this.shuffle = function() {
			for (let i = this.deck.length - 1; i > 0; i--)
			{
				j = Math.floor(Math.random() * i);
				let k = this.deck[i];
				this.deck[i] = this.deck[j];
				this.deck[j] = k;
			}
			return 0;
		};
	}
}

module.exports.Field = Field;