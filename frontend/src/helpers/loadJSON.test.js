let request;
let loadJSON;
const originalXHR = global.XMLHttpRequest;

beforeEach(() => {
  jest.resetModules();
  request = {
    open: jest.fn(),
    send: jest.fn(),
    overrideMimeType: jest.fn(),
    status: 200,
    readyState: 4,
    responseText: '{"BACKEND_PATH":"/backend"}'
  };
  global.XMLHttpRequest = jest.fn(() => request);
  loadJSON = require("./loadJSON").loadJSON;
});

afterEach(() => {
  global.XMLHttpRequest = originalXHR;
});

test("deduplicates successful config reads within one page load", () => {
  const first = loadJSON("/config.json");
  expect(loadJSON("/config.json")).toBe(first);
  expect(first.BACKEND_PATH).toBe("/backend");
  expect(request.send).toHaveBeenCalledTimes(1);
  loadJSON("/config-dev.json");
  expect(request.send).toHaveBeenCalledTimes(2);
});

test.each(["network", "http", "json", "null"])(
  "does not cache a failed or empty %s config response",
  failure => {
    if (failure === "network")
      request.send.mockImplementationOnce(() => {
        throw new Error("offline");
      });
    if (failure === "http") request.status = 503;
    if (failure === "json") request.responseText = "broken json";
    if (failure === "null") request.responseText = "null";
    expect(loadJSON("/config.json")).toBeNull();
    request.status = 200;
    request.responseText = '{"BACKEND_PATH":"/new-backend"}';
    expect(loadJSON("/config.json").BACKEND_PATH).toBe("/new-backend");
    expect(request.send).toHaveBeenCalledTimes(2);
  }
);

test("a new page/module reads updated runtime configuration", () => {
  loadJSON("/config.json");
  jest.resetModules();
  request.responseText = '{"BACKEND_PATH":"/updated"}';
  expect(require("./loadJSON").loadJSON("/config.json").BACKEND_PATH).toBe(
    "/updated"
  );
  expect(request.send).toHaveBeenCalledTimes(2);
});
