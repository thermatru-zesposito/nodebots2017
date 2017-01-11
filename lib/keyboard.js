'use strict';
var kp = require('keypress');
var ACTIVE = true;
var STEPS = 2;

/**
 * Translates key presses to commands
 **/
var keypress = function (ch, key) {
    if (ACTIVE && key) {
        switch (key) {
            case 'w':
            case 'up':
                forward();
                break;
            case 's':
            case 'down':
                back();
                break;
            case 'a':
            case 'left':
                left();
                break;
            case 'd':
            case 'right':
                right();
                break;
            case 'escape':
                stop();
                exit();
                break;
            default:
                break;
        }
    }
};

function cooldown() {
  ACTIVE = false;
  setTimeout(function () {
    ACTIVE = true;
  }, STEPS * 12);
}

// These functions are for stopping and moving the car with a little workaround specific to the Feather HUZZAH board and Johnny-Five. Leave these as they are.
function forward() {
    leftWheel.fwd(0);
    rightWheel.fwd(0);
    currentaction = "fd";
    console.log("Forward!");
}
function back() {
    leftWheel.rev(-1);
    rightWheel.rev(-1);
    currentaction = "back";
    console.log("Back!");
}
function stop() {
    leftWheel.rev(0); // This makes the car stop.
    rightWheel.rev(0);
    currentaction = "stopped";
    console.log("Stop!");
}
function left() {
    leftWheel.rev(0);
    rightWheel.fwd(0);
    currentaction = "lt";
    console.log("Left!");
}
function right() {
    leftWheel.fwd(0);
    rightWheel.rev(0);
    currentaction = "rt";
    console.log("Right!");
}
function exit() {
    currentaction = "offline";
    process.stdin.pause();
    process.exit();
    cooldown();
}


module.exports = keypress;