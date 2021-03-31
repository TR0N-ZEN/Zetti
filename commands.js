function SetRounds (playingfield, rounds) { playingfield.total_rounds = rounds; }

function eval_command(string, socket, playingfield)
{
	let word = string.split(" ");
	let Verb = word[0];
	let Noun = word[1];
	let Value = word[2];
	if(Verb == "Set" && Noun == "Rounds") { SetRounds(playingfield, Value); }
	if(Verb == "Get" && Noun == "Rounds") { socket.emit("MessageFromServer", `Server: In total u have ${playingfield.total_rounds} to play.`); }
}