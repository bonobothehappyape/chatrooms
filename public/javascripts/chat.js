/**
 * Created by dimitris on 23/05/15.
 */

/*
 JavaScript prototype object that will process chat commands, send messages, and request room and nickname changes.
*/
var Chat = function(socket) {
    this.socket = socket;
};

/*
 function to send chat messages. Uses the javascript prototype.
 */
Chat.prototype.sendMessage = function(room, text) {
    var message = {
        room: room,
        text: text };
    this.socket.emit('message', message);
};

/*
 function to change rooms
 */
Chat.prototype.changeRoom = function(room) {
    this.socket.emit('join', {
        newRoom: room
    });
};

/*
 processing a chat command.
 Two chat commands are recognized: join for joining or creating a room and nick for changing one’s nickname.
 */
Chat.prototype.processCommand = function(command) {

    var words = command.split(' ');

    var command = words[0]
        .substring(1, words[0].length)
        .toLowerCase();  //Parse command from first word

    switch(command) {
        case 'join':
            words.shift();
            var room = words.join(' ');
            this.changeRoom(room);
            break;

        case 'nick':
            words.shift();
            var name = words.join(' ');
            this.socket.emit('nameAttempt', name);
            break;
        default:
            message = 'Unrecognized command.';
            break;
    }
    return message;
};

