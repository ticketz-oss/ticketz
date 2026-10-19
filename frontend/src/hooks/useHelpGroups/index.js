import api from "../../services/api";

/**
 * CRUD dos cards da Central de Ajuda (super admin) e leitura pública do tenant.
 */
const useHelpGroups = () => {
  // Todos os públicos — é o que a grade do admin precisa enxergar.
  const list = async () => {
    const { data } = await api.request({
      url: "/help-groups",
      method: "GET"
    });
    return data;
  };

  // Cards visíveis para o tenant, já com as contagens de conteúdo.
  const listPublic = async () => {
    const { data } = await api.request({
      url: "/helps/list",
      method: "GET"
    });
    return data;
  };

  const showPublic = async groupId => {
    const { data } = await api.request({
      url: `/helps/groups/${groupId}`,
      method: "GET"
    });
    return data;
  };

  const save = async data => {
    const { data: responseData } = await api.request({
      url: "/help-groups",
      method: "POST",
      data
    });
    return responseData;
  };

  const update = async data => {
    const { data: responseData } = await api.request({
      url: `/help-groups/${data.id}`,
      method: "PUT",
      data
    });
    return responseData;
  };

  const remove = async id => {
    const { data } = await api.request({
      url: `/help-groups/${id}`,
      method: "DELETE"
    });
    return data;
  };

  const reorder = async items => {
    const { data } = await api.request({
      url: "/help-groups/reorder",
      method: "PUT",
      data: { items }
    });
    return data;
  };

  return {
    list,
    listPublic,
    showPublic,
    save,
    update,
    remove,
    reorder
  };
};

export default useHelpGroups;
