const Client = require('./client').Client;

class Clients
{
	constructor(size)
	{
		this.list = [];
		this.ids = new Array(size);
		this.left = [];
		for (let i = 0; i < this.ids.length; i++) { this.ids[i] = 0; }
	}
	append(client)
	{
		this.list.push(client);
	}
	static info(clients_list)
	{
		let array = [];
		console.table(clients_list);
		for (let i = 0; i < clients_list.length; i++)
		{
			array.push(clients_list[i].info());
		}
		return array;
	}
}

module.exports.Clients = Clients;