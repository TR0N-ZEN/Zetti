#include "client.h"


short unsigned int Client::getID(std::vector<short unsigned int>& Ids)
{
	short unsigned int id = 0;
	if (Ids[0] != 0)
	{
		// for vectors with not many elements - 100% branchless but iterates all elements
		for (short unsigned int i = 1; i < Ids.size(); i++)
		{
			id += (Ids[i]==0)*(i<id)*i;
		}
		
		// //for vectors with many elements - many if statements because of do-while-loop but doesn't iterate all elements
		// 	short unsigned int i = 1;
		//  short unsigned max = Ids.size();
		// 	do { id = (Ids[i] == 0)*(i); i++;} while (id == 0 && i < );
		
		// assuring id is different from 0
#ifdef DEBUG
		if (id == 0) { std::cout << "No ID free."; }
#endif
	}
	return id;
};

Client::Client(/*socket; */ std::vector<short unsigned int>& Ids)
{
	id = Client::getID(Ids);
#ifdef DEBUG
	std::cout << "Client::getID(Ids) returned " << id << std::endl;
#endif
};

Client::~Client() {};