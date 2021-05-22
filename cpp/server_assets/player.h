#include "../game_props/card.h"
#include "client.h"

#include <iostream>

class Player : Client
{
	public:
		std::string name;
		short int points;
		short unsigned int guess;
		short unsigned int tricks_won;
		std::vector<Card*> hand;
		static void update_points(Player& player);
		Player(/*socket, */std::vector<short unsigned int>& Ids, std::string Name, short int Points = 0, short unsigned int Guess = 0, short unsigned int Tricks_won = 0, std::vector<Card*> Hand = {});
		~Player();
#ifdef DEBUG
		static void log(Player& player, short unsigned int mode = 0);
#endif
};