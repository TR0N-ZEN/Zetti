#define TEST

#include <cmath>
#include <random>
#include <iostream>
#include <vector>
#include <deque>

#include "card.h"
#include "field.h"

Field::Field(int Deck_size, int Stack_size, std::vector<Card>* Cards)
{
	deck_size = Deck_size;
	stack_size = Stack_size;
	cards = Cards;
	for (int i = 0; i < Deck_size; i++) { deck[i] = &(Cards->at(i)); }
	deck.reserve(deck_size); //changes the allocated memeory and swaps content of container to newly allocated memory
	playing_stack.resize(stack_size); //what does it exacly
}


void Field::shuffle()
{
	std::random_device rd;
	std::mt19937 gen(rd());
	std::uniform_int_distribution<> distrib(0, deck_size - 1);
	Card* cache = new Card("empty", 0);
	for (int i = 0; i < deck_size; i++)
	{
		int j = distrib(gen);
		cache = deck.at(i);
		deck[i] = deck[j];
		deck[j] = cache;
	}
}

#ifdef TEST
int main()
{
	// create test_deck
	std::vector<Card>* t_d= new std::vector<Card>;
	std::vector<Card>& test_deck = *t_d;
	Field* test_field = new Field(60, 2, t_d);
	for (Card *card : test_field->deck) { std::cout << card->number << " "; }
	std::cout << std::endl;
	for (int i = 0; i < 60; i++)
	{
		test_deck[i] = Card("test", i);
	}
	// testing Field::shuffle()
	test_field->shuffle();
	for (Card *card : test_field->deck) { std::cout << card->number << std::endl; }
	std::cout << std::endl;
	return 0;
}
#endif