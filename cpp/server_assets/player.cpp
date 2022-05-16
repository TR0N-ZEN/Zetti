#include "../game_props/card.h"
#include "client.h"
#include "player.h"

#ifdef DEBUG
void log(Player& player, short unsigned int mode)
{
  std::cout << "Player '" << player.name << "':" << std::endl;
  switch(mode)
  {
    case 1:
      std::cout << "\tguess: " << player.guess << std::endl;
      std::cout << "\ttricks_won: " << player.tricks_won << std::endl;
      break;
    case 2:
      std::cout << "\tpoints: " << player.points << std::endl;
      break;
    case 3:
      std::cout << "\tpoints: " << player.points << std::endl;
      std::cout << "\tguess: " << player.guess << std::endl;
      std::cout << "\ttricks_won: " << player.tricks_won << std::endl;
      break;
    default:
      break;
  }
};
#endif

Player::Player(/*socket, */std::vector<short unsigned int>& Ids, std::string Name, short int Points, short unsigned int Guess, short unsigned int Tricks_won, std::vector<Card*> Hand) : Client(Ids)
{
  name = Name;
  points = Points;
  guess = Guess;
  tricks_won = Tricks_won;
  hand = Hand;
};

void Player::update_points(Player& player)
{
  short int delta = player.guess - player.tricks_won;
  short int points_delta = 0;
  points_delta += (delta == 0)*(20 + player.tricks_won*10);
  points_delta -= (delta != 0)*(delta*10);
  player.points += points_delta;
  // resetting player attributes for next round
  player.guess = 0;
  player.tricks_won = 0;
};
