'use strict';

// CHANGE THESE THREE VARIABLES! //
var deviceHost = "192.168.16.183" // This is the IP address shown in Arduino IDE Serial Monitor after uploading Firmata
var deviceID = 'DaBlurr'; // This is the deviceID you entered in iothub-explorer
var deviceKey = 'sJ2vPbDUKGxbRnoeo+SJnPS4w/Pw+qugZdl8jDJaraU='; // This is the primary key returned by iothub-explorer

// Node modules - Don't modify
var moment = require('moment');
var EtherPortClient = require("etherport-client").EtherPortClient;
var Firmata = require("firmata");
var five = require("johnny-five");
var Protocol = require('azure-iot-device-amqp').Amqp;
var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;
var keypress = require('keypress');

// Setup - Don't modify
var board = new five.Board({
    io: new Firmata(new EtherPortClient({ host: deviceHost, port: 3030 })),
    timeout: 30000
});
var connectionString = 'HostName=huzzahbots.azure-devices.net;DeviceId=' + deviceID + ';SharedAccessKey=' + deviceKey + '';
var client = Client.fromConnectionString(connectionString, Protocol);
var currentaction = "offline";

board.on('ready', function () {
    letsPlay();
    var connectCallback = function (err) {
        if (err) { console.error('Your device is not connected to the web dashboard. Could not connect: ' + err.message); } 
        else {
            console.log('Client connected');
            client.on('message', function (msg) {
                currentaction = "home";
                console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
                client.complete(msg, printResultFor('completed'));
            });
            client.on('error', function (err) {
                currentaction = "offline";
                console.error(err.message);
            });
            client.on('disconnect', function () {
                currentaction = "offline";
                client.removeAllListeners();
                client.open(connectCallback);
            });
        }
    };
    client.open(connectCallback);
});

function printResultFor(op) {
    return function printResult(err, res) {
        if (err) console.log(op + ' error: ' + err.toString());
        if (res) console.log(op + ' status: ' + res.constructor.name);
    };
}

function letsPlay() {
    var scalar = 256; // Friction coefficient
    var actioncounter = 0;
    var newcommand = "H()";
    var speed = 255;
    var wheels = {
        leftWheel: new five.Motor({ pins: [5, 12], invertPWM: false }),
        rightWheel: new five.Motor({ pins: [4, 14], invertPWM: false }),

        stop: function () {
            stop();
        },
        forward: function () {
            forward();
        },
        left: function () {
            left();
        },
        right: function () {
            right();
        },
        reverse: function () {
            reverse();
        },
        off: function () {
            currentaction = "X";
            setTimeout(process.exit, 1000);
        }
    };

    wheels.stop();

    console.log("Keys: cursor keys or ASWD for movement. Escape or Spacebar to stop.");

    //stdin.on("keypress", function (chunk, key) {
    //    if (!key) return;

    //    switch (key.name) {
    //        case 'up':
    //        case 'w':
    //            wheels.forward();
    //            break;

    //        case 'down':
    //        case 's':
    //            wheels.back();
    //            break;

    //        case 'left':
    //        case 'a':
    //            wheels.left();
    //            break;

    //        case 'right':
    //        case 'd':
    //            wheels.right();
    //            break;

    //        case 'space':
    //        case 'escape':
    //            wheels.stop();
    //            break;

    //        case 'q':
    //            wheels.off();
    //            break;

    //        default: break;
    //    }
    //});

    function actionSender() {
        var distance = 0;
        Math.round(actioncounter);
        var now = moment.now();
        switch (currentaction) {
            case 'F':
            case 'B':
                var a = (now - actioncounter) * 0.18 * speed / scalar;
                newcommand = "" + currentaction + "(" + a + ")";
                distance = a;
                break;
            case 'R':
            case 'L':
                var a = (now - actioncounter) * 0.18 * speed / scalar;
                newcommand = "" + currentaction + "(" + a + ")";
                distance = 0;
                break;
            case 'H':
                newcommand = "H()";
                distance = 0;
                break;
            default:
                newcommand = "F(0)";
                distance = 0;
                break;
        }
        distance = distance.toString();
        var data = JSON.stringify({ deviceId: deviceID, command: newcommand, distance: distance });
        var message = new Message(data);
        console.log('Sending message: ' + message.getData());
        client.sendEvent(message, printResultFor('send'));
        actioncounter = moment.now();
    }

////////////////////////////////////////////////////////////////

    function SetInitialTrim() {
    }
// Write your Johnny-Five code here!
    

///////////////////////////////////////////////////////////////

    // These functions are for stopping and moving the car with a little workaround specific to the Feather HUZZAH board and Johnny-Five. Leave these as they are.
    function forward() {
        wheels.leftWheel.fwd(0);
        wheels.rightWheel.fwd(0);
        currentaction = "F";
        console.log("Forward!");
    }
    function reverse() {
        wheels.leftWheel.rev(1);
        wheels.rightWheel.rev(1);
        currentaction = "B";
        console.log("Reverse!");
    }
    function stop() {
        wheels.leftWheel.rev(0); // This makes the car stop.
        wheels.rightWheel.rev(0);
        currentaction = "S";
        console.log("Stop!");
    }
    function left() {
        wheels.leftWheel.rev(0);
        wheels.rightWheel.fwd(0);
        currentaction = "L";
        console.log("Left!");
    }
    function right() {
        wheels.leftWheel.fwd(0);
        wheels.rightWheel.rev(0);
        currentaction = "R";
        console.log("Right!");
    }
    function exit() {
        currentaction = "X";
        setTimeout(process.exit, 1000);
    }

// This is the code for controlling car actions from the command line
    var keyMap = {
        'up': forward,
        'left': left,
        'right': right,
        'back': reverse,
        'space': stop,
        'q': exit
    };

    var stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("keypress", function (chunk, key) {
        if (!key || !keyMap[key.name]) return;
        actionSender();
        keyMap[key.name]();
    });
}
