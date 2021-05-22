#include "../game_props/card.h"
#include "client.h"
#include "player.h"

#ifdef DEBUG
void log(Player& player, short unsigned int mode)
{
	std::cout << "Player '" << player.name << "':" << std::endl;
	switch(mode)
	{
		case 1:
			std::cout << "\tguess: " << player.guess << std::endl;
			std::cout << "\ttricks_won: " << player.tricks_won << std::endl;
			break;
		case 2:
			std::cout << "\tpoints: " << player.points << std::endl;
			break;
		case 3:
			std::cout << "\tpoints: " << player.points << std::endl;
			std::cout << "\tguess: " << player.guess << std::endl;
			std::cout << "\ttricks_won: " << player.tricks_won << std::endl;
			break;
		default:
			break;
	}
};
#endif

Player::Player(/*socket, */std::string Name, std::vector<short int>& Ids, short int Points, short int Guess, short int Tricks_won, std::vector<Card*> Hand) : Client(Ids)
{
	id = Player::getID(Ids);
	name = Name;
	points = Points;
	guess = Guess;
	tricks_won = Tricks_won;
	hand = Hand;
};

short int Player::update_points(Player& player)
{
	int delta = player.guess - player.tricks_won;
	if (delta == 0) { delta = 20 + player.tricks_won*10; }
	else
	{
		if (delta > 0) { delta *= (-1); }
		delta *= 10;
	}
	player.points += delta;
};
