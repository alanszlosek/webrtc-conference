"use strict";

var http = require('http');
var WebSocketServer = require('websocket').server;

var connections = {};


// Output logging information to console

function log(text) {
  var time = new Date();

  console.log("[" + time.toLocaleTimeString() + "] " + text);
}

// Scans the list of users and see if the specified name is unique. If it is,
// return true. Otherwise, returns false. We want all users to have unique
// names.
function isUsernameUnique(name) {
  for (var id in connections) {
    if (connections[id].clientUsername === name) {
      return false;
      break;
    }
  }
  return true;
}


var config = {
    websocketBindAddress: '0.0.0.0',
    websocketBindPort: 10008
};

var httpServer = new http.Server();
httpServer.listen(config.websocketBindPort, config.websocketBindAddress);

var wsServer = new WebSocketServer({
      httpServer: httpServer
});

if (!wsServer) {
  log("ERROR: Unable to create WbeSocket server!");
}

// Set up a "connect" message handler on our WebSocket server. This is
// called whenever a user connects to the server's port using the
// WebSocket protocol.

wsServer.on('request', function(request) {
    // Accept the request and get a connection.
    var connection = request.accept("json", request.origin);

    // Set up a handler for the "message" event received over WebSocket. This
    // is a message sent by a client, and may be text to share with other
    // users, a private message (text or signaling) for one user, or a command
    // to the server.
    connection.on('message', function(message) {
        if (message.type !== 'utf8') {
        console.log('not utf8');
            return;
        }
        var rawMessage = message.utf8Data;
        log("Received Message: " + rawMessage);

        var msg = JSON.parse(rawMessage);
        msg.source = connection.clientID;
        switch(msg.type) {
            /*
            // Public, textual message
            case "message":
                // annotate with username
                msg.name = connect.username;
                msg.text = msg.text.replace(/(<([^>]+)>)/ig, "");
                // send to everyone else
                break;

            // Username change
            case "username":
                var nameChanged = false;
                var origName = msg.name;

                // Ensure the name is unique by appending a number to it
                // if it's not; keep trying that until it works.
                while (!isUsernameUnique(msg.name)) {
                    msg.name = origName + appendToMakeUnique;
                    appendToMakeUnique++;
                    nameChanged = true;
                }

                // If the name had to be changed, we send a "rejectusername"
                // message back to the user so they know their name has been
                // altered by the server.
                if (nameChanged) {
                var changeMsg = {
                    id: msg.id,
                    type: "rejectusername",
                    name: msg.name
                };
                connect.sendUTF(JSON.stringify(changeMsg));
                }

                // Set this connection's final username and send out the
                // updated user list to all users. Yeah, we're sending a full
                // list instead of just updating. It's horribly inefficient
                // but this is a demo. Don't do this in a real app.
                connect.username = msg.name;
                sendUserListToAll();
                sendToClients = false;  // We already sent the proper responses
                break;
                */
            default:
                // Likely a pass-through message
                if (msg.target && msg.target !== undefined && msg.target.length !== 0) {
                    // Relay to one peer
                    if (msg.target in connections) {
                        console.log('Relaying message to ' + msg.target);
                        connections[ msg.target ].sendUTF( JSON.stringify(msg) );
                    }
                } else {
                    // Relay to everyone
                    console.log('Broadcasting message to all');
                    for (var id in connections) {
                        connections[id].sendUTF( JSON.stringify(msg) );
                    }
                }
                break;
        }
    });

    connection.on('close', function(reason, description) {
        var id = connection.clientID;
        delete connections[id];

        // Build and output log output for close information.

        var logMessage = "Connection closed: " + connection.remoteAddress + " (" +
                            reason;
        if (description !== null && description.length !== 0) {
            logMessage += ": " + description;
        }
        logMessage += ")";
        log(logMessage);
    });


    // Add the new connection to our list of connections.

    log("Connection accepted from " + connection.remoteAddress + ".");

    var id = Date.now();
    connections[id] = connection;
    connection.clientID = id;
    // security issue
    connection.clientUsername = 'hello_' + id;

    var msg = {
        type: "you",
        id: connection.clientID,
        username: connection.clientUsername
    };
    connection.sendUTF(JSON.stringify(msg));
});

// Send userlist every 5 seconds
setInterval(
    function() {
        var peers = {};
        for (var id in connections) {
            peers[id] = {
                username: connections[id].clientUsername,
                muted: false
            };
        }
        var msg = {
            type: "userlist",
            users: peers
        };
        var rawMessage = JSON.stringify(msg);
        for (var id in connections) {
            connections[id].sendUTF(rawMessage);
        }
    },
    5000
);
