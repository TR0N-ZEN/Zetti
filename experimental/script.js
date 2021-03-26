
class a {
	constructor() {}
	static arr = [1, "3", "adwa", "4"];
	list() {
		a.arr.forEach((val, index) => { console.log(val); });
		for (let i = 0; i < a.arr.length; i++) { console.log(a.arr[i]); }
		for (e of a.arr) { console.log(e); }
	}
}

var b = new a();
console.log(a.arr);

b.list();
