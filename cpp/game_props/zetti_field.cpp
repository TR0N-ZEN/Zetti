#include "zetti_field.h"

Zetti_Field::Zetti_Field(int Stack_size, std::vector<Card>* Cards, int player_count) : Card_Field(60, Stack_size, Cards)
{
  total_rounds = 60 / player_count;
  std::deque<Card*>* trick = &playing_stack;
  for (std::string color : Card::colors)
  {
    for (int i = 1; i < 14; i++)
    {
      cards->push_back(Card(color, i));
    }
  }
  for (int i = 0; i < 4; i++) { cards->push_back(Card("Z", i)); }
  for (int i = 0; i < 4; i++) { cards->push_back(Card("N", i)); }
}