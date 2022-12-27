const socket = io("/oversight");

const game_1 = $('#game_1 > ul');
const game_2 = $('#game_2 > ul');

socket.on('game_1', (/*string*/message) => {
  game_1.list.append($('<li>').text(message));
});
socket.on('game_2', (/*string*/message) => {
  game_2.list.append($('<li>').text(message));
});