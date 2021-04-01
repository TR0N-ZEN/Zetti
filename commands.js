function SetRounds(number, playingfield, io) { playingfield.total_rounds = number; GetRounds(playingfield, io); }
function GetRounds(playingfield, io) { io.emit("MessageFromServer", `Server: In total u have ${playingfield.total_rounds} to play.`); }
function eval_command(string, io, playingfield)
{
	let word = string.split(" ");
	let Verb = word[0];
	let Noun = word[1];
	let Value = word[2];
	if(Verb == "Set" && Noun == "Rounds") { SetRounds(Value, playingfield, io); }
	if(Verb == "Get" && Noun == "Rounds") { GetRounds(playingfield, io); }
}

module.exports.eval_command = eval_command;