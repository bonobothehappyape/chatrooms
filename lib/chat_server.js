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

    io.sockets.on('connection',function(socket){ //Define how each user connection will be handled
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed); //Assign user a guest name when they connect

        joinRoom(socket, 'Lobby');

        handleMessageBroadcasting(socket, nickNames); //Handle user messages, name-change attempts, and room creation/changes

        handleNameChangeAttempts(socket, nickNames, namesUsed);

        handleRoomJoining(socket);

        socket.on('rooms', function() { //Provide user with list of occupied rooms on request
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed); //Define cleanup logic for when user disconnects
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

function assignGuestName(socket, guestNumber, nicknames, namesUsed) {

    var name = 'Guest' + guestNumber; //Generate new guest name

    nicknames[socket.id] = name;

    socket.emit('nameResult', {
        success: true,
        name: name
    }); //Let user know their guest name

    namesUsed.push(name); //Note that guest name is now used
    return guestNumber + 1; //Increment counter used to generate guest names
}

/*
    handles logic related to a user joining a chat room.
    Having a user join a Socket.IO room is simple, requiring only a call to the join method of a socket object.
    The application then communicates related details to the user and other users in the same room.
    The application lets the user know what other users are in the room and lets these other users know that the user is now present.
*/
function joinRoom(socket, room){

    socket.join(room); //Make user join room

    currentRoom[socket.id] = room;

    socket.emit('joinResult', {room:room});

    //send message that user has joined and let user know they’re now in new room
    socket.broadcast.to(room).emit(

        'message',

        { text: nickNames[socket.id] + ' has joined ' + room + '.' }
    );


    var usersInRoom = io.sockets.clients(room);

    // if there are users in this room
    // Determine what other users are in same room as user
    if (usersInRoom.length > 1) {

        var usersInRoomSummary = 'Users currently in ' + room + ': ';

        for (var i in usersInRoom){

            var userSocketId = usersInRoom[i].id;

            if (userSocketId != socket.id) {
                if (i > 0) {
                    usersInRoomSummary+=', '; //create a string with the names separated with commas
                }
                usersInRoomSummary += nickNames[userSocketId];
            }

        }
        usersInRoomSummary += '.';
        socket.emit('message', {text: usersInRoomSummary}); //Send summary of other users in the room to the user
    }


}

function handleNameChangeAttempts(socket, nicknames, namesUsed) {

    socket.on('nameAttmept', function(name) {  //Add listener for nameAttempt events

        if (name.indexOf('Guest') == 0) {

            socket.emit('nameResult',
                {success: false, message: 'Names cannot begin with "Guest".'});

        } else { // register name, if not registered

            if (namesUsed.indexOf(name) == -1) {

                var previousName = nicknames[socket.id];

                var previousNameIndex = namesUsed.indexOf(previousName);

                namesUsed.push(name);

                nicknames[socket.id] = name;

                delete namesUsed[previousNameIndex];  //Remove previous name available to other clients

                socket.emit('nameResult', {
                    success: true,
                    name: name
                });

                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' is now known as ' + name + '.'
                });

            }

            else {

                socket.emit('nameResult', {  //Send error to client if name is already registered
                    success: false,
                    message: 'That name is already in use.'
                });

            }

        }

    });

}

/*
    the user emits an event indicating the room where the message is to be sent and the message text.
    The server then relays the message to all other users in the same room.
 */
function handleMessageBroadcasting(socket) {
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('message', { text: nickNames[socket.id] + ': ' + message.text
        }); });
}

/*
 allows a user to join an existing room or, if it doesn’t yet exist, to create it.
 */
function handleRoomJoining(socket) {
    socket.on('join', function(room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

/*
 remove a user’s nickname from nickNames and namesUsed when the user leaves the chat application:
 */
function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]); delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}