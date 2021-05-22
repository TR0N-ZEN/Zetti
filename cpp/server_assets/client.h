#include <vector>
#include <iostream>


class Client
{
	public:
		protected:
			//socket;
			short int id;
			static short int getID(std::vector<short unsigned int>& Ids);
			Client(/*socket;*/std::vector<short unsigned int>& Ids);
			~Client();
};