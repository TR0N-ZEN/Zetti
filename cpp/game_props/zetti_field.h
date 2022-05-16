#include "card.h"
#include "card_field.h"

#include <iostream>
#include <vector>

class Zetti_Field : public Card_Field
{
  public:
    int total_rounds;
    int cardIndex = 0;
    Zetti_Field(int Stack_size, std::vector<Card>* Cards, int player_count);
};