#include "client.h"
#include "player.h"
#include "clients.h"

class Players : Clients
{
	public:
		Players(std::vector<Client*> List);
		~Players();
};