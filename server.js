var http  = require('http');

var fs    = require('fs');

var path  = require('path');

var mime  = require('mime');

var cache = {};

function send404(response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found.');
  response.end();
}


function sendFile(response, filePath, fileContents) {
  response.writeHead(
	200, {"content-type": mime.lookup(path.basename(filePath))} );
  response.end(fileContents);
}


 /*
 The next helper determines whether or not a file is cached and, if so, serves it.
 If a file isn’t cached, it’s read from disk and served. If the file doesn’t exist,
 an HTTP 404 error is returned as a response.
 */
function serveStatic(response, cache, absPath) {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);
    } else {
        fs.exists(absPath, function(exists) {
            if (exists) {
                fs.readFile(absPath, function(err, data) {
                    if (err) {
                        send404(response);
                    } else {
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }});
            } else {
                send404(response);
            }
        });
    }
}

/*
 For the HTTP server, an anonymous function is provided as an argument to create-
 Server, acting as a callback that defines how each HTTP request should be handled.
  The callback function accepts two arguments: request and response.
  When the call- back executes, the HTTP server will populate these arguments with objects that,
  respectively, allow you to work out the details of the request and send back a response.
 */
var server = http.createServer(function(request, response) {
    var filePath = false;

    if (request.url == '/') {
        filePath = 'public/index.html';
    } 

    else {
        filePath = 'public' + request.url;
    }

    var absPath = './' + filePath;

    serveStatic(response, cache, absPath);


});


server.listen(3000, function() {
          console.log("Server listening on port 3000.");
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server);

