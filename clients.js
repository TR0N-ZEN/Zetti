class Clients
{
	constructor(size)
	{
		this.list = new Array(size);
		this.ids = new Array(size);
		this.left = [];
		for (e in this.ids) { e = 0 }
	}
	append(client) {
		this.list.push(client);
	}
}

module.exports.Clients = Clients;