#include "card.h"
#include <iostream>

Card::Card(std::string Color, int Number)
{
	color = Color;
	number = Number;
}

Card::~Card() {};