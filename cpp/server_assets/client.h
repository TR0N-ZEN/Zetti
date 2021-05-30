#include <vector>
#include <iostream>

#define DEBUG

class Client
{
	protected:
		//socket;
		short unsigned int id;
		static short unsigned int getID(std::vector<short unsigned int>& Ids);
		Client(/*socket;*/std::vector<short unsigned int>& Ids);
		~Client();
};