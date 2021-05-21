#include "../game_props/card.h"
#include "client.h"

#include <vector>
#include <iostream>

class Player : Client
{
	public:
		std::string name;
		short int points;
		short unsigned int guess;
		short unsigned int tricks_won;
		std::vector<Card*> hand;
		short int id;
		static short int getID(std::vector<short int>& Ids);
		Player(std::string Name, std::vector<short int>& Ids /*, socket*/);
		~Player();
};