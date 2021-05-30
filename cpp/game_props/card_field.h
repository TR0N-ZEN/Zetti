#pragma once
#include <iostream>
#include <vector>
#include <deque>

#include "card.h"

class Card_Field
{
	private:
		int deck_size = 0;
		int stack_size = 0;
	public:
		std::vector<Card>* cards;
		std::vector<Card*> deck;
		std::deque<Card*> playing_stack;
		int Card_pos_on_stack = 0;
		Card_Field(int Deck_size, int Stack_size, std::vector<Card>* Cards);
		~Card_Field() {}
		void shuffle();
};

