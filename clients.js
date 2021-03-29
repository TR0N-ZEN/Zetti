class Clients
{
	constructor(size)
	{
		this.list = [];
		this.ids = new Array(size);
		this.left = [];
		for (let i = 0; i < this.ids.length; i++) { this.ids[i] = 0; }
	}
	append(client) {
		this.list.push(client);
	}
}

module.exports.Clients = Clients;