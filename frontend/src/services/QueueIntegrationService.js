import api from "./api";

const QueueIntegrationService = {
  findAll: async (params) => {
    const { data } = await api.get("/queue-integrations", { params });
    return data;
  },

  findById: async (id) => {
    const { data } = await api.get(`/queue-integrations/${id}`);
    return data;
  },

  findByQueue: async (queueId) => {
    const { data } = await api.get("/queue-integrations", {
      params: { queueId },
    });
    return data;
  },

  create: async (integration) => {
    const { data } = await api.post("/queue-integrations", integration);
    return data;
  },

  update: async (id, integration) => {
    const { data } = await api.put(`/queue-integrations/${id}`, integration);
    return data;
  },
  
  testConnection: async (webhookUrl) => {
    const { data } = await api.post("/queue-integrations/test", { webhookUrl });
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/queue-integrations/${id}`);
    return data;
  },
};

export default QueueIntegrationService;
