var express = require("express");
//Server nodejs
var http = require('http'),
    fs = require('fs'),
    index = fs.readFileSync(__dirname + '/index.html');
dashboard = fs.readFileSync(__dirname + '/mockdash.html');
fakeboard = fs.readFileSync(__dirname + '/fakeboard.html')



//Server port
var port = 6882;

//Web server
var app = express();
var server = http.createServer(app);

//Game Engine socket
var gameEngineSocketID;

//Device socket
var clientSocketID;

//Dashboard socket
var dashboardSocketID;

//Fake board socket
var fakeBoardSocketID;

var io = require('socket.io').listen(server);

io.on('connection', function (socket) {
    socket.emit('welcome', { message: 'Welcome!', id: socket.id });

    socket.on('init_engine', function(data, callback) {
        console.log('Engine is connected. Id is ' + data.id);
        console.log(data);
        gameEngineSocketID = data.id;
        callback();
    });

    socket.on('init_dashboard', function(data) {
        console.log('dashboard is connected');
        dashboardSocketID = data.id;
    });

    socket.on('init_client', function(data) {
        console.log('client is connected');
        clientSocketID = data.id;
    });

    socket.on('init_fake_board', function(data) {
        console.log('fake board is connected');
        fakeBoardSocketID = data.id;
    });

    /*socket.on('request', function(data, callback) {
     io.sockets.connected[gameEngineSocketID].emit('request', data, function(response) {
     callback(response);
     });
     });*/

    socket.on('getState', function(data, callback) {
        handleStandardRequest('getState', data, callback);
    });

    socket.on('nextTurn', function(data, callback) {
        handleRequestAndNotifyDashboard('nextTurn', data, callback);
    });

    socket.on('moveActionPawn', function(data, callback) {
        handleRequestAndNotifyDashboard('moveActionPawn', data, callback);
    });

    socket.on('solveEmergency', function(data, callback) {
        handleRequestAndNotifyDashboard('solveEmergency', data, callback);
    });

    socket.on('takeResources', function(data, callback) {
        handleRequestAndNotifyDashboard('takeResources', data, callback);
    });

    socket.on('useBonusCard', function(data, callback) {
        handleRequestAndNotifyDashboard('useBonusCard', data, callback);
    });

    socket.on('buildStronghold', function(data, callback) {
        handleRequestAndNotifyDashboard('buildStronghold', data, callback);
    });

    socket.on('getCurrentTurn', function(data, callback) {
        handleStandardRequest('getCurrentTurn', data, callback);
    });

    socket.on('getAdjacentLocations', function(data, callback) {
        handleStandardRequest('getAdjacentLocations', data, callback);
    });

    socket.on('getEmergencies', function(data, callback) {
        handleStandardRequest('getEmergencies', data, callback);
    });

    socket.on('getTransports', function(data, callback) {
        handleStandardRequest('getTransports', data, callback);
    });

    socket.on('getStrongholdInfo', function(data, callback) {
        handleStandardRequest('getStrongholdInfo', data, callback);
    });

    socket.on('moveTransportPawn', function(data, callback) {
        handleRequestAndNotifyDashboard('moveTransportPawn', data, callback);
    });

    socket.on('chooseProductionCard', function(data, callback) {
        handleChooseProductionCard('chooseProductionCard', data, callback);
    });

    function handleRequestAndNotifyDashboard(requestName, data, callback) {
        console.log("Request received. Name: " + requestName + ", \nData:");
        console.log(data);
        //Route the request to the appropriate method
        request(requestName, data, function(response) {
            responseJ = JSON.parse(response);
            logString = responseJ.logString;
            success = responseJ.success;
            stateRequest = {"requestName": "getState"};
            //Request the state to send to the dashboard
            sendUpdateToDashboard(response, function() {
                callback(response);
            });
        });
    }

    function sendMessage(socketID, messageName, data) {
        if (io.sockets.connected[socketID] != undefined) {
            io.sockets.connected[socketID].emit(messageName, data);
        }
    }

    function sendUpdateToDashboard(response, callback) {
        //Request the state to send to the dashboard
        request("getState", {}, function(getStateResponse) {
            //Send the state to the dashboard
            newResponse = {};
            newResponse.state = JSON.parse(getStateResponse);
            newResponse.response = JSON.parse(response);
            console.log(newResponse);
            //io.sockets.connected[dashboardSocketID].emit('update', newResponse);
            sendMessage(dashboardSocketID, 'update', newResponse);

            //var commandToSend = arduinoLedCommand(newResponse.state);
            //TODO send command to board

            callback();
        })
    }

    function handleChooseProductionCard(requestName, data, callback) {
        dataJ = data;
        cardIndex = dataJ.cardIndex;
        handleStandardRequest("chooseProductionCard", data, function(response) {
            responseJ = JSON.parse(response);
            request("getState", {}, function(getStateResponse) {
                stateResponseJ = JSON.parse(getStateResponse);
                currentTurnJ = stateResponseJ.currentTurn;
                //If the production cards have been selected, notify the device so it can show the production group
                //interface.
                if (responseJ.success && currentTurnJ.state === "MOVE_TRANSPORT_PAWN") {
                    sendMessage(clientSocketID, 'productionStateChanged', {});
                }
                newResponse = {};
                newResponse.state = stateResponseJ;
                newResponse.response = responseJ;
                newResponse.cardIndex = cardIndex;
                sendMessage(dashboardSocketID, 'chooseProductionCard', newResponse);
            });
            callback(response);
        });
    }
    /*
     function handleNextTurn(requestName, data, callback) {
     //Close all pending popup messages
     closePendingPopups();
     console.log("Request received. Name: " + requestName + ", \nData:");
     console.log(data);
     //Route the next turn request to the appropriate method
     request(requestName, data, function(response) {
     responseJ = JSON.parse(response);
     logString = responseJ.logString;
     success = responseJ.success;
     stateRequest = {"requestName": "getState"};
     //Request the new game state that will be sent to the dashboard
     request("getState", {}, function(getStateResponse) {
     currentTurn = JSON.parse(getStateResponse).currentTurn.type;
     newResponse = {"success": success, "logString": logString, "state": getStateResponse};
     onNewTurn(currentTurn, newResponse)
     });
     callback(response);
     });
     }
     function onNewTurn(currentTurn, dashboardResponse) {
     if (currentTurn === "EventTurn") {
     //If it is an event turn, send a popup message to the dashboard
     io.sockets.connected[dashboardSocketID].emit('popupMessage', {"logString": logString}, function() {
     //Send the new state to the dashboard
     io.sockets.connected[dashboardSocketID].emit('update', dashboardResponse)
     })
     } else if (currentTurn === "ProductionTurn") {
     //Get the state of the Production Turn
     request("getCurrentTurn", {}, function(turnResponse) {
     turnResponseJ = JSON.parse(turnResponse);
     if (turnResponseJ.state === "CHOOSE_PRODUCTION_CARDS") {
     //If the production group must choose the cards, the dashboard must show them in a popup
     io.sockets.connected[dashboardSocketID].emit('productionCards', turnResponseJ.cards, function() {
     //Send the new state to the dashboard
     io.sockets.connected[dashboardSocketID].emit('update', dashboardResponse)
     })
     }
     });
     } else {
     //Send the new state to the dashboard
     io.sockets.connected[dashboardSocketID].emit('update', dashboardResponse)
     }
     }
     */
    function handleStandardRequest(requestName, data, callback) {
        console.log("Request received. Name: " + requestName + ", \nData:");
        console.log(data);
        request(requestName, data, callback);
    }

    function request(requestName, data, callback) {
        console.log("requestName " + requestName + ", data " + data);
        if(typeof data == 'string')
            var reqData = JSON.parse(data);
        else {
            var reqData = {};
            reqData = data;
        }
        //Add the request name to the JSON request data
        reqData["requestName"] = requestName;
        //Send the new request object to the game engine
        console.log("reqData " + reqData );
        io.sockets.connected[gameEngineSocketID].emit('request', reqData, function(response) {
            callback(response);
        });
    }
});

app.get('/', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

app.use(express.static(__dirname +'/public'));
app.get('/dashboard', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(dashboard);
});

app.get('/fakeboard', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(fakeboard);
});

fs = require('fs');
try {
    var xmlConfiguration = fs.readFileSync('./configuration.xml', 'utf8');
    var DOMParser = require('xmldom').DOMParser;
} catch(err) {
    console.log("Configuration file not found.");
    var xmlConfiguration = null;
}

setupGlobalVariables(xmlConfiguration);

function setupGlobalVariables(xmlConfigurationFile) {
    if (xmlConfiguration != null) {
        console.log("Setting up global game variables...");
        gravityLevelsArray = setupGravityLevels(xmlConfigurationFile);
        ledEmergencyMap = setupLedEmergencyMap(xmlConfigurationFile);
        setupBoardSettings(xmlConfigurationFile);
    }
}

function setupGravityLevels(xmlConfigurationFile) {
    var parser = new DOMParser();
    var xmlParser = parser.parseFromString(xmlConfigurationFile, "text/xml");

    var gravityLevels = xmlParser.getElementsByTagName("gravityLevels")[0];
    var levels = gravityLevels.getElementsByTagName("level");
    var gravityLevelsArray = [];
    for (var i = 0; i < levels.length; i++) {
        var colorCode = levels[i].getElementsByTagName("colorCode")[0].textContent;
        gravityLevelsArray.push(colorCode);
    }

    return gravityLevelsArray;
}

function setupLedEmergencyMap(xmlConfigurationFile) {
    var parser = new DOMParser();
    var xmlParser = parser.parseFromString(xmlConfigurationFile, "text/xml");
    var areas = xmlParser.getElementsByTagName("area");
    var locations = [];

    for (var i = 0; i < areas.length; i++) {
        locations.push(areas[i].getElementsByTagName("location")[0]);
    }

    var ledEmergencyMap = [[]];
    for (var i = 0; i < locations.length; i++) {
        var locationName = locations[i].getElementsByTagName("name")[0].textContent;
        var emergencyArray = [];
        var leds = locations[i].getElementsByTagName("leds")[0].getElementsByTagName("led");

        var number = "";
        var emergency = "";
        for (var j = 0; j < leds.length; j++) {
            number = leds[j].getElementsByTagName("number")[0].textContent;
            emergency = leds[j].getElementsByTagName("emergency")[0].textContent;
            emergencyArray[emergency] = number;
            emergencyArray;
        }
        ledEmergencyMap[locationName] = emergencyArray;
    }

    return ledEmergencyMap;
}

function setupBoardSettings(xmlConfigurationFile) {
    var parser = new DOMParser();
    var xmlParser = parser.parseFromString(xmlConfigurationFile, "text/xml");
    var configuration =  xmlParser.getElementsByTagName("arduinoBoardSettings")[0];
    ipBoard = configuration.getElementsByTagName("ip")[0].textContent;
    ledNumber = configuration.getElementsByTagName("ledNumber")[0].textContent;
    commandCode = configuration.getElementsByTagName("commandCode")[0].textContent;
    ledCommandCode = configuration.getElementsByTagName("ledCommandCode")[0].textContent;
    soundCommandCode = configuration.getElementsByTagName("soundCommandCode")[0].textContent;
}

function arduinoLedCommand(gameState) {
    //var json = JSON.parse(gameState);

    //get the location list from JSON
    var locations = gameState['gameState']['gameMap']['locations'];

    /*
     create a dictionary with 2 key:
     first key is location name (contain a dictionary),
     second key is emergency name and contain the emergency level
     */
    var mapLocationLedColor = {};

    //extract location list
    for(var i = 0; i < locations.length; i++) {

        var loc =  locations[i]['emergencyLevels'];
        var tempDictionary = {}; //just for simplify code, can be deleted

        //in dhe location insert the pair emergency_name : emergency_level
        for (var j = 0; j < loc.length; j++) {
            tempDictionary[loc[j]['emergency']] = loc[j]['level'];
        }

        mapLocationLedColor[locations[i]['name']] = tempDictionary;
    }

    //initialization string to send at arduino
    var ledCommandArdino =  commandCode + ledCommandCode;
    for(var i = 0; i < ledNumber; i++) {
        ledCommandArdino += "0";
    }
    ledCommandArdino += commandCode;


    //set led colors using map association and emergency
    for(var loc in mapLocationLedColor){
        for (var emergency in mapLocationLedColor[loc]){
            //change default value in the ledCommandArdino if exist the led in the map
            if(ledMap[loc][emergency]){
                ledCommandArdino[ledEmergencyMap[loc][emergency]] = mapLocationLedColor[loc][emergency];
            }
        }
    }

    return ledCommandArdino;
}

server.listen(port);
console.log('Server is listening on port ' + port);