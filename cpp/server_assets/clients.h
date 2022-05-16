#include <iostream>
#include "client.h"

class Clients
{
  protected:
    std::vector<Client*> list;
  private:
    std::vector<short int> ids;
    std::vector<Client*> left;
  protected:
    Clients();
    ~Clients();
    void append(Client client);
    //static info(&Clients clients); //client needs to be casted as player
};