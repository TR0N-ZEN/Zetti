#pragma once
#include <iostream>

class Card
{
	public:
		std::string color;
		int number;
		Card(std::string Color, int Number); //not the most efficient memory handling could just pass pointer to a string but then also the length would have to be passed
		~Card();
};