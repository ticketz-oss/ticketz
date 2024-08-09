import api from "../../services/api";

const useTicketzProStatus = () => {

    const ticketzProStatus = async (params) => {
      try {
        const { data } = await api.request({
            url: `/ticketzPro/status`,
            method: 'GET',
            params
        });
        return data;
      } catch (error) {
        return null;
      }
    }

    return {
        ticketzProStatus
    }
}

export default useTicketzProStatus;