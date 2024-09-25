
var getInitials = function(string) {
  if (!string) {
    return "";
  }

  let initials = "";

  var names = string.trim().split(' ');
  
  if (names.length > 0) {
    initials = Array.from(names[0])[0];
  }

  if (names.length > 1) {
    initials += Array.from(names[names.length - 1])[0];
  }

  if (!initials) {
    return "👤";
  }

  return initials.toUpperCase();
};

export { getInitials };
