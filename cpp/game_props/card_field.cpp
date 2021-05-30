
#include <cmath>
#include <random>
#include <iostream>
#include <vector>
#include <deque>

#include "card.h"
#include "card_field.h"

//
#define TEST
//#define DEBUG
//

Card_Field::Card_Field(int Deck_size, int Stack_size, std::vector<Card>* Cards)
{
	deck_size = Deck_size;
	stack_size = Stack_size;
	cards = Cards;
	deck.reserve(deck_size); // changes the allocated memeory and swaps content of container to newly allocated memory
	deck.resize(deck_size); // changes the attribute that is returned by deck.size()
	playing_stack.resize(stack_size);
	for (int i = 0; i < deck_size; i++)
	{
		deck[i] = &(Cards->at(i));
#ifdef DEBUG
		std::cout << (Cards->at(i)).number << " saved in " << deck[i] << std::endl;
#endif
	}
#ifdef DEBUG
	std::cout << "deck.size() " << deck.size() << std::endl;
#endif
}


void Card_Field::shuffle()
{
	std::random_device rd;
	std::mt19937 gen(rd());
	std::uniform_int_distribution<> distrib(0, deck_size - 1);
	Card* cache = new Card("empty", 0);
	for (int i = 0; i < deck_size; i++) // randomizing order of elements in std::vector<Card*> (element = pointer to Card)
	{
		int j = distrib(gen);
		cache = deck.at(i);
		deck[i] = deck[j];
		deck[j] = cache;
	}
}


#ifdef TEST
void test()
{
	std::cout << "TEST field.cpp" << std::endl;
	// create test_deck
	std::vector<Card>* crds= new std::vector<Card>;
	std::vector<Card>& cards = *crds;
	for (int i = 0; i < 60; i++)
	{
		cards.push_back(Card("test", i));
	}
	std::cout << std::endl;

	Card_Field* test_field = new Card_Field(60, 2, crds);

#ifdef DEBUG
	std::cout << "cards.size() " << cards.size() << std::endl;
	std::cout << "(testfield->cards)->size " << (test_field->cards)->size() << std::endl;
	std::cout << "(test_field->deck).size() " << (test_field->deck).size() << std::endl;
#endif
	// for (int i = 0; i < 60; i++) { std::cout << test_field->deck[i]->number << " "; }
	for (Card* card : (test_field->deck)) { std::cout << card->number << " "; }
	std::cout << std::endl;
	
	// test Field::shuffle()
	test_field->shuffle();
	for (Card* card : test_field->deck) { std::cout << card->number << " "; }
	std::cout << std::endl;	
}
#endif

int main()
{
#ifdef TEST
	test();
#endif
	return 0;
}