import api from "../../services/api";

/**
 * CRUD dos conteúdos (vídeos e artigos) da Central de Ajuda.
 */
const useHelps = () => {
  const list = async params => {
    const { data } = await api.request({
      url: "/helps",
      method: "GET",
      params
    });
    return data;
  };

  const save = async data => {
    const { data: responseData } = await api.request({
      url: "/helps",
      method: "POST",
      data
    });
    return responseData;
  };

  const update = async data => {
    const { data: responseData } = await api.request({
      url: `/helps/${data.id}`,
      method: "PUT",
      data
    });
    return responseData;
  };

  const remove = async id => {
    const { data } = await api.request({
      url: `/helps/${id}`,
      method: "DELETE"
    });
    return data;
  };

  const reorder = async items => {
    const { data } = await api.request({
      url: "/helps/reorder",
      method: "PUT",
      data: { items }
    });
    return data;
  };

  return {
    list,
    save,
    update,
    remove,
    reorder
  };
};

export default useHelps;
