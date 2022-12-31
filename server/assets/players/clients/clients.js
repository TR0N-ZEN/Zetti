const Client = require('./client').Client;

class Clients
{

  constructor(size, list = [])
  {
    // list of pointers to clients
    this.list = list;
    
    // array, in js arrays are not fixed size, that contains identifying integers
    this.ids = new Array(size);
    
    // clients that left the pool of clients stored in this.list
    this.left = [];
    for (let i = 0; i < this.ids.length; i++) { this.ids[i] = 0; }
  }

  /**
   * 
   * @param {object} client 
   */
  append(client)
  {
    this.list.push(client);
  }
  
  /**
   * Return array of info about each player referenced in the clients array
   * @param {object[]} clients 
   * @returns {object[]} info about clients
   */
  static info(clients)
  {
    let array = [];
    for (let i = 0; i < clients.length; i++)
    {
      array.push(clients[i].info());
    }
    return array;
  }

}

module.exports.Clients = Clients;