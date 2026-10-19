const LOCALHOST_HOSTNAMES = ["localhost", "127.0.0.1"];

export const isLocalhost = () => {
  return LOCALHOST_HOSTNAMES.includes(window.location.hostname);
};

export default isLocalhost;
