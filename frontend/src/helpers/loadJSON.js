// Load text with Ajax synchronously: takes path to file and optional MIME type
function loadTextFileAjaxSync(filePath, mimeType) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  if (mimeType != null) {
    if (xmlhttp.overrideMimeType) {
      xmlhttp.overrideMimeType(mimeType);
    }
  }
  xmlhttp.send();
  if (xmlhttp.status === 200 && xmlhttp.readyState === 4) {
    return xmlhttp.responseText;
  } else {
    // TODO Throw exception
    return null;
  }
}

// Runtime configuration is immutable for this page load, not across deploys.
// Multiple imports must not repeat synchronous, main-thread-blocking requests.
const loadedJSON = new Map();

var loadJSON = function (filePath) {
  if (loadedJSON.has(filePath)) return loadedJSON.get(filePath);
  try {
    // Load json file;
    var json = loadTextFileAjaxSync(filePath, "application/json");
    // Parse json
    const data = JSON.parse(json);
    if (data !== null) loadedJSON.set(filePath, data);
    return data;
  } catch (e) {
    return null;
  }
};

export { loadJSON };
