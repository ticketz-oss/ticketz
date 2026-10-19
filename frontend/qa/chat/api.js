// This preview never contacts a real backend or sends a WhatsApp message.
let handleMessage = () => ({});
export const onMessage = handler => {
  handleMessage = handler;
};
const api = {
  put: async () => ({}),
  post: async (_, body) => ({ data: handleMessage(body) })
};
export default api;
