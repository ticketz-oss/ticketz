
var getInitials = function(string) {
  if (!string) {
    return "";
  }

  var names = string.split(' '),
    initials = Array.from(names[0])[0].toUpperCase();

  if (names.length > 1) {
    initials += Array.from(names[names.length - 1])[0].toUpperCase();
  }
  return initials;
};

export { getInitials };
