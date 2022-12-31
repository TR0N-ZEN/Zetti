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

```mermaid
classDiagram
  class Zetti {
    + game_io
    + clients
    + already_voted
    + game_is_running
    + field
    + take_next_guess()
    + go_on()
    + game_io.on(...)
    + clear_game()
    + distribute_cards(...)
    + take_guesses(...)
    + to_serve(...)
    + best_card(trick,trmup)
    + play_trick(...)
    + play_round(...)
    + showresumee(...)
    + game(...)
    + CardtoPlayingstack(...)
    + changeCSS(...)
}

  class client {
    + 
  }
  class player {
    + 
  }
  class clients {
    + 
  }
  class players {
    + 
  }

  class card {
    + 
  }

  class field {
    + 
  }
  class zetti_field {
    + 
  }

```