#include "../game_props/card.h"
#include "client.h"

#include <iostream>

class Player : Client
{
	public:
		short int id;
		std::string name;
		short int points;
		short unsigned int guess;
		short unsigned int tricks_won;
		std::vector<Card*> hand;
		static short int getID(std::vector<short int>& Ids);
		static short int update_points(Player& player);
		Player(/*socket, */std::string Name, std::vector<short int>& Ids, short int Points = 0, short int Guess = 0, short int Tricks_won = 0, std::vector<Card*> Hand = {});
		~Player();
#ifdef DEBUG
		static void log(Player& player, short unsigned int mode = 0);
#endif
};