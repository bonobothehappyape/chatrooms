/*
These declarations allow the use of Socket.IO and initialize a number of variables that define chat state:
*/

var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

/*
 define the chat server function listen. This func- tion is invoked in server.js.
 It starts the Socket.IO server, limits the verbosity of Socket.IO’s logging to the console,
  and establishes how each incoming connection should be handled.
 */
exports.listen = function(server) {

    io = socketio.listen(server);

    io.set('log_level',1);

    io.sockets.on('connection',function(socket){
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

        joinRoom(socket, 'Lobby');

        handleMessageBroadcasting(socket, nickNames);

        handleNameChangeAttempts(socket, nickNames, namesUsed);

        handleRoomJoining(socket);

        socket.on('rooms', function() {
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);
    });

}

/*
 which handles the naming of new users.
  When a user first connects to the chat server, the user is placed in a chat room named Lobby,
  and assignGuestName is called to assign them a name to distinguish them from other users.
  Each guest name is essentially the word Guest followed by a number that incre- ments each time a new user connects.
  The guest name is stored in the nickNames variable for reference, associated with the internal socket ID.
  The guest name is also added to namesUsed, a variable in which names that are being used are stored.
 */

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {

    var name = 'Guest' + guestNumber;

    nickNames[socket.id] = name;

    socket.emit('nameResult', {
        success: true,
        name: name
    });

    namesUsed.push(name);
    return guestNumber + 1;
}