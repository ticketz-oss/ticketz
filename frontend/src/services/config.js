const config = loadJSON('/config.json');

function loadJSON(filePath) {
  // Load json file;
  var json = loadTextFileAjaxSync(filePath, "application/json");
  // Parse json
  return JSON.parse(json);
}   

// Load text with Ajax synchronously: takes path to file and optional MIME type
function loadTextFileAjaxSync(filePath, mimeType)
{
  var xmlhttp=new XMLHttpRequest();
  xmlhttp.open("GET",filePath,false);
  if (mimeType != null) {
    if (xmlhttp.overrideMimeType) {
      xmlhttp.overrideMimeType(mimeType);
    }
  }
  xmlhttp.send();
  if (xmlhttp.status === 200 && xmlhttp.readyState === 4 )
  {
    return xmlhttp.responseText;
  }
  else {
    // TODO Throw exception
    return null;
  }
}

export function getBackendURL() {
  return config.REACT_APP_BACKEND_URL || (config.BACKEND_PROTOCOL ?? "https") + "://" + (config.BACKEND_HOST) + ":" + (config.BACKEND_PORT ?? 443);
}

export default config;
