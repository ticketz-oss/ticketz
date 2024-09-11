const generateSecureToken = function (length) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
};

export { generateSecureToken };
