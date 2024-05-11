import api from "../../services/api";

const useDashboard = () => {

    const find = async (params) => {
      try {
        const { data } = await api.request({
            url: `/dashboard`,
            method: 'GET',
            params
        });
        return data;
      } catch (error) {
        return null;
      }
    }

    return {
        find
    }
}

export default useDashboard;