var Message = require('azure-iot-device').Message;

module.exports = class Filter {
  constructor(threshold) {
    this.temperatureThreshold = threshold;
  }

  filterMessage(message) {
    var messageBytes = message.getBytes();
    var messageStr = messageBytes.toString('utf8');

    let messageObject = JSON.parse(messageStr);
    if (messageObject &&  messageObject.machine.temperature < this.temperatureThreshold)
    {
        return null;
    }

    var filteredMessage = new Message(messageBytes);
    filteredMessage.contentType = message.contentType || 'application/json';
    filteredMessage.contentEncoding = message.contentEncoding || 'utf-8';

    message.properties.propertyList.forEach(prop => {
        filteredMessage.properties.add(prop['key'], prop['value']);
    });

    filteredMessage.properties.add('MessageType', 'Alert');
    return filteredMessage;
  }

  setThreshold(value) {
    this.temperatureThreshold = value;
  }
};
