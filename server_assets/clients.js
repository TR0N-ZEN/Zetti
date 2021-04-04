const Client = require('./client').Client;

class Clients
{
	constructor(size, list = [])
	{
		this.list = list;
		this.ids = new Array(size);
		this.left = [];
		for (let i = 0; i < this.ids.length; i++) { this.ids[i] = 0; }
	}
	append(client)
	{
		this.list.push(client);
	}
	static info(clients)
	{
		let array = [];
		console.table(clients);
		for (let i = 0; i < clients.length; i++)
		{
			array.push(clients[i].info());
		}
		return array;
	}
}

module.exports.Clients = Clients;