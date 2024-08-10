import api from "../../services/api";

const useTicketzProCheck = () => {

    const ticketzProCheck = async (params) => {
      try {
        const { data } = await api.request({
            url: `/ticketzPro/check`,
            method: 'GET',
            params
        });
        return data;
      } catch (error) {
        return null;
      }
    }

    return {
        ticketzProCheck
    }
}

export default useTicketzProCheck;