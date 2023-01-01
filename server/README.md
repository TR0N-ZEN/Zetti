# README


## get it running (on linux)

If the server is installed on an alpine container do some of the following:

```sh
apk update
apk add nodejs git

adduser zetti
su zetti
cd ~

git clone git@github.com:TR0N-ZEN/Zetti.git
cd ~/Zetti/server/
npm install
node main.js server

```


## architecture

I stop descriibing this because maintaining it in parallel to the code costs fkn time.  
Using vscode u can use shortcut **Focus Breadcrumbs** to observe the structure of datatypes.  

```mermaid
classDiagram
  class Zetti {
    + game_io : socket
    + clients : clients
    + already_voted : int[]
    + game_is_running : boolean
    + field : field
    + take_next_guess()
    + go_on()
    + clear_game()
    + distribute_cards(amount_per_player, deck, players)
    + take_guesses(players, starter_index, playingfield) int
    + to_serve(trick) string
    + best_card(trick,trmup) int
    + play_trick(players, trick_starter, trick) int
    + play_round(players, playingfieldm, round, trmup, trick)
    + showresumee(players)
    + game(players, playingfield, round)
    + CardtoPlayingstack(color, number, player_id) int
    + changeCSS(element_selector, property, value, player_id, player_socket)
}

  class Client {
    + socket
  }

  class Player {
    + name : string
    + points : int
    + guess : int
    + tricks_won : int
    + hand : card[]
    + id : int
    + info() player
    + prep_for_round(player)$
    + getID(int[])$ int
    + update_points(player)$
    + by_id(int, player[])$
    + update_points_branchless(player)$
    + index_by_socket_id(int, players)$ int
    + delete_by_socket_id(int, players)$ boolean
    + index_by_id(int,players)$ int
    + delete_by_id(int,players)$ boolean
  }

  class Clients {
    + append()
    + info()$ object[]
  }

  class Players {
    + list : player[]
    + update_points(players)$
    + prep_for_round(players)$
  }

  class Card {
    + color
    + number
  }

  class Field {
    + deck
    + card_pos_on_stack 
    + shuffle() int
  }

  class Zetti_field {
    + trick
    + total_rounds
    + cardIndex
    + colors
  }

  Client <|-- Player
  Field <|-- Zetti_field
  Zetti_field o-- Card
  Clients <|-- Players
  Zetti o-- Players
  Zetti o-- Zetti_field
  Players *-- Player
```