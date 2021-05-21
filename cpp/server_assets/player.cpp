#include "../game_props/card.h"
#include "client.h"
#include "player.h"

#include <vector>
#include <iostream>

short int Player::getID(std::vector<short int>& Ids)
{
	int id = -1;
	for (int i = 0; i < Ids.size(); i++)
	{
		id = (Ids[i]==0)*(i>id)*i;
	}
	Ids[id] = 1;
	return id;
};

Player::Player(std::string Name, std::vector<short int>& Ids /*, socket*/) : Client(/*socket*/)
{
	name = Name;
	points = 0;
	guess = 0;
	tricks_won = 0;
	hand = {};
	id = Player::getID(Ids);
};