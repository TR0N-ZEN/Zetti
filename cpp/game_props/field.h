#pragma once
#include <iostream>
#include <vector>
#include <deque>

#include "card.h"

class Field
{
	private:
		std::vector<Card>* cards;
		int deck_size = 0;
		int stack_size = 0;
	public:
		std::vector<Card*> deck;
		std::deque<Card*> playing_stack;
		int card_pos_on_stack = 0;
		Field(int Deck_size, int Stack_size, std::vector<Card>* Cards);
		~Field() {}
		void shuffle();
};
