var IDs = [0, 0, 0, 0, 0, 0];

class Player {
    constructor(name, socket_id) {
        this.name = name;
        for (let i = 0; i < IDs.length; i++) {
            if (IDs[i] == 0) {
                IDs[i] = 1;
                this.id = i;
                break;
            }
        }
        this.socket_id = socket_id;
        this.points = 0;
        this.guesses = 0;
        this.hand = [];
        this.index = 0;
        this.tricks_won = 0;
    }
}

module.exports.Player = Player;
module.exports.IDs = IDs;