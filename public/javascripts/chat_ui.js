/**
 * Created by dimitris on 23/05/15.
 */

/*
    will display untrusted text. It will sanitize text by transforming special characters into HTML entities
 */
function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}

/*
 will display trusted content created by the system rather than by other users.
 */
function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}


function processUserInput(chatApp, socket) {

    var message = $('#send-message').val();

    var systemMessage;

    if (message.charAt(0) == '/') { //If user input begins with slash, treat it as command

        systemMessage = chatApp.processCommand(message);

        if (systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }

    else { //Broadcast noncommand input to other users

        chatApp.sendMessage($('#room').text(), message);

        $('#messages').append(divEscapedContentElement(message));

        $('#messages').scrollTop($('#messages').prop('scrollHeight'));

    }

    $('#send-message').val('');

}


/*
 This code handles client-side initiation of Socket.IO event handling.
*/

var socket = io.connect();


$(document).ready(function() {

    var chatApp = new Chat(socket);

    socket.on('nameResult', function(result) { //Display results of a name-change attempt

        if (result.success) {
            message = 'You are now known as ' + result.name + '.';
        } else {
            message = result.message;
        }

        $('#messages').append(divSystemContentElement(message));

    });

    //Display results  of a room change
    socket.on('joinResult',function(message) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });

    //Display received messages
    socket.on('message', function (message) {
        var newElement = $('<div></div>').text(message.text); $('#messages').append(newElement);
    });


    socket.on('rooms', function(rooms) { //Display list of rooms available

        $('#room-list').empty();

        for(var room in rooms) {

            room = room.substring(1, room.length);

            if (room != '') {
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        $('#room-list div').click(function() { //Allow click of a room name to change to that room

            chatApp.processCommand('/join ' + $(this).text());

            $('#send-message').focus

        });
    });

    //Request list of rooms available intermittently
    setInterval(function() {
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();

    //Allow submitting the form to send a chat message
    $('#send-form').submit(function() {
        processUserInput(chatApp, socket);
        return false;
    });

});