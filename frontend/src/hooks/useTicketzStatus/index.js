import api from "../../services/api";

const useTicketzStatus = () => {

    const ticketzStatus = async (params) => {
      try {
        const { data } = await api.request({
            url: `/ticketz/status`,
            method: 'GET',
            params
        });
        return data;
      } catch (error) {
        return null;
      }
    }

    return {
        ticketzStatus
    }
}

export default useTicketzStatus;