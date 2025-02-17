const proxyConfigSchema = [
  {
    name: "enabled",
    title: "Enable Proxy",
    description: "Enable or disable proxy settings.",
    type: "checkbox",
    required: true,
  },
  null,
  {
    name: "type",
    title: "Proxy Type",
    description: "Select the proxy type.",
    type: "select",
    options: [
      { value: "http", label: "HTTP" },
      { value: "https", label: "HTTPS" },
      { value: "socks5", label: "SOCKS5" },
    ],
    required: true,
  },
  null,
  {
    name: "host",
    title: "Proxy Host",
    description: "Enter the proxy server hostname or IP address.",
    type: "text",
    lgWidth: 6,
    required: true,
  },
  {
    name: "port",
    title: "Proxy Port",
    description: "Enter the proxy server port.",
    type: "text",
    lgWidth: 2,
    required: true,
  },
  null,
  {
    name: "username",
    title: "Username",
    description: "Enter the proxy authentication username (if required).",
    type: "text",
    required: false,
  },
  {
    name: "password",
    title: "Password",
    description: "Enter the proxy authentication password (if required).",
    type: "text",
    required: false,
  },
];

export default proxyConfigSchema;
