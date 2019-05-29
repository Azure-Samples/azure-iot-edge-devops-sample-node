"use strict";

var Transport = require("azure-iot-device-mqtt").Mqtt;
var Client = require("azure-iot-device").ModuleClient;
var Message = require("azure-iot-device").Message;
var Filter = require("./filter");

const TEMP_THRESHOLD_KEY = "TemperatureThreshold";
const HEART_BEAT = "heartbeat";
let tempThreshold = 25;
let filter = new Filter(tempThreshold);

Client.fromEnvironment(Transport, function(err, client) {
  if (err) {
    throw err;
  } else {
    client.on("error", function(err) {
      throw err;
    });

    // connect to the Edge instance
    client.open(function(err) {
      if (err) {
        throw err;
      } else {
        console.log("IoT Hub module client initialized");

        // Act on input messages to the module.
        client.on("inputMessage", function(inputName, msg) {
          pipeMessage(client, inputName, msg);
        });

        client.getTwin(parseTwin);
        client.onMethod(HEART_BEAT, function(request, response) {
          console.log("Received method:" + HEART_BEAT);

          if (request.payload) {
            console.log("Payload:");
            console.dir(request.payload);
          }

          var messageStr = "Module [FilterModule] is Running";
          var heartbeatMessage = new Message(messageStr);

          client.sendOutputEvent(
            HEART_BEAT,
            heartbeatMessage,
            printResultFor(`Sent method response via event [${HEART_BEAT}]`)
          );

          response.send(200, null, function(err) {
            if (err) {
              console.log("failed sending method response: " + err);
            } else {
              console.log("successfully sent method response");
            }
          });
        });
      }
    });
  }
});

function parseTwin(err, twin) {
  if (err) {
    console.error("could not get twin" + err.message);
  } else {
    tempThreshold = twin.properties.desired[TEMP_THRESHOLD_KEY] || tempThreshold;
    filter.setThreshold(tempThreshold);
    twin.on("properties.desired", function(desiredProperty) {
      tempThreshold = desiredProperty[TEMP_THRESHOLD_KEY] || tempThreshold;
      filter.setThreshold(tempThreshold);
    });
  }
}

// This function just pipes the messages without any change.
function pipeMessage(client, inputName, message) {
  client.complete(message, printResultFor("Receiving message"));
  if (message) {
    try {
      let filteredMessage = filter.filterMessage(message);
      // If no message after filter, then don't pipe this message
      if (!filteredMessage) return;
      client.sendOutputEvent(
        "output1",
        filteredMessage,
        printResultFor("Sending received message")
      );
    } catch (e) {
      console.log(
        `Error happened when filter message, skip this message: ${message}`
      );
    }
  }
}

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
      console.log(op + " error: " + err.toString());
    }
    if (res) {
      console.log(op + " status: " + res.constructor.name);
    }
  };
}
