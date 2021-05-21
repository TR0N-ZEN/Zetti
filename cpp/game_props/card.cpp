#include "card.h"
#include <iostream>

Card::Card(std::string Color, int Number)
{
	color = Color;
	number = Number;
	static std::string colors[4]  = { "red", "green", "blue", "yellow" };
}

Card::~Card() {};