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


    socket.on('joinResult',function(message) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });

});