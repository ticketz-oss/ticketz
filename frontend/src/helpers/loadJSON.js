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

var loadJSON = function(filePath) {
  try {
	// Load json file;
	var json = loadTextFileAjaxSync(filePath, "application/json");
	// Parse json
	return JSON.parse(json);
  } catch (e) {
	return null;
  }
}   

export { loadJSON };
