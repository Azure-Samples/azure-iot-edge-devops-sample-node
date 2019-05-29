const Filter = require("./filter");
const assert = require("assert");
var Message = require("azure-iot-device").Message;

function createMessage(temperature) {
  var messageStr = `{"machine":{"temperature":${temperature},"pressure":0}, "ambient":{"temperature":0,"humidity":0},"timeCreated":"${new Date().toISOString()}"}`;
  message = new Message(messageStr);
  return message;
}

it("should filter values temperature larger than threshold", function() {
  const filter = new Filter(25);
  const source = createMessage(25 - 1);
  const result = filter.filterMessage(source);
  assert.equal(result, null);
});

it("should not filter values temperature less than threshold", function() {
  const filter = new Filter(25);
  const source = createMessage(25 + 1);
  const result = filter.filterMessage(source);
  assert.equal("Alert", result.properties.getValue("MessageType"));
});

it("filter larger than threshold and copy additional property", function() {
  const expected = "customTestValue";
  const filter = new Filter(25);
  const source = createMessage(25 + 1);
  source.properties.add("customTestKey", expected);
  const result = filter.filterMessage(source);
  assert.equal(expected, result.properties.getValue("customTestKey"));
});
