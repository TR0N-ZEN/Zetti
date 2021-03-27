var IDs = [0, 0, 0, 0, 0, 0];

class Player extends Client {
	constructor(name, socket_id) {
		super(socket_id)
		this.name = name;
		this.points = 0;
		this.guess = 0;
		this.hand = [];
		this.index = 0;
		this.tricks_won = 0;
		this.id = Player.getID(IDs);
	}
	static getID(ids) {
		for (let i = 0; i < ids.length; i++)
		{
			if (ids[i] == 0)
			{
				ids[i] = 1;
				return i;
			}
		}
	}
	static index_by_socket_id (socket_id, playerList){
  	for (let index = 0; index < playerList.length; index++) {
     if ( playerList[index].socket_id == socket_id ) { return index; }
    }
  }
    static delete_by_socket_id(socket_id, playerList) {
    	let index = this.index_by_socket_id(socket_id, playerList);
      if (typeof(index) !== 'undefined') {
          playerList.splice(index, 1);
          return true;
      }
      return false;
    }
    static index_by_id (player_id, playerList) {
      for (let index = 0; index < playerList.length; index++) {
				if ( playerList[index].id == player_id ) { return index; }
      }
    }
    static delete_by_id (id, playerList) //maybe need to delete keyword 'static'
		{
        let index = this.index_by_id(id, playerList);
        if (typeof(index) !== 'undefined')
        {
            playerList.splice(index, 1);
            return true;
        }
        return false;
    }
}

module.exports.Player = Player;
module.exports.IDs = IDs;