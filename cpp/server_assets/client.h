#include <vector>

class Client
{
	public:
		protected:
			//socket;
			short int id;
			static short int getID(std::vector<short int>& Ids);
			Client(/*socket;*/std::vector<short int>& Ids);
			~Client();
};