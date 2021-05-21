#include <iostream>
#include <vector>
#include "client.h"

class Clients
{
	std::vector<Client*> list;
	std::vector<int> ids;
	std::vector<Client*> left;
	void append(Client client);
	//static info(&Clients clients); //client needs to be casted as player
};