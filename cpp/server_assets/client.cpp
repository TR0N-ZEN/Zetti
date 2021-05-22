#include "client.h"

short int Client::getID(std::vector<short int>& Ids)
{
	int id = Ids.size();
	for (int i = 0; i < Ids.size(); i++)
	{
		id = (Ids[i]==0)*(i<id)*i;
	}
	Ids[id] = 1;
	return id;
};

Client::Client(/*socket; */ std::vector<short int>& Ids)
{
	this->id = Client::getID(Ids);
};

Client::~Client() {};