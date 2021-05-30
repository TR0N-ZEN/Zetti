var socket = io();
$(function () {
    socket.on('ServerMessage', function (message) {
        $('.chat').append($('<p>').text(message));
    });
    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('ClientMessage', $('#message').val());
        $('#message').val('');
        return false;
    });
});