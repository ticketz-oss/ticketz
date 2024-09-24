
var getInitials = function(string) {
  if (!string) {
    return "";
  }

  var names = string.trim().split(' '),
    initials = Array.from(names[0])[0];

  if (names.length > 1) {
    initials += Array.from(names[names.length - 1])[0];
  }
  return initials.toUpperCase();
};

export { getInitials };
