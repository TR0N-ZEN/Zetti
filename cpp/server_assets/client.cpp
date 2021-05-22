#include "client.h"

short int Client::getID(std::vector<short unsigned int>& Ids)
{
	int id = 0;
	if (Ids[0] != 0)
	{
		// for vectors with not many elements - 100% branchless but iterates all elements
		for (int i = 1; i < Ids.size(); i++)
		{
			id += (Ids[i]==0)*(i<id)*i;
		}
		
		// //for vectors with many elements - many if statements because of do-while-loop but doesn't iterate all elements
		// 	int i = 1;
		// 	do { id = (Ids[i] == 0)*(i); i++;} while (id == 0);
		
		// assuring id is different from 0
		id += (id == 0)*(-1);
	}
	if (id != (-1)) { Ids[id] = 1; }
	return id; // returns -1 if all entries in Ids are different from 0
};

Client::Client(/*socket; */ std::vector<short unsigned int>& Ids)
{
#ifdef DEBUG
	if(Client::getID(Ids) >= 0) { id = Client::getID(Ids); }
#else
	id = Client::getID(Ids);
#endif
};

Client::~Client() {};