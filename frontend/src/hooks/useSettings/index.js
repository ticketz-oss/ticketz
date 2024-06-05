import api, { openApi } from "../../services/api";

const useSettings = () => {

    const getAll = async (params) => {
        const { data } = await api.request({
            url: '/settings',
            method: 'GET',
            params
        });
        return data;
    }

    const update = async (data) => {
        const { data: responseData } = await api.request({
            url: `/settings/${data.key}`,
            method: 'PUT',
            data
        });
        return responseData;
    }
    
    const getPublicSetting = async (key) => {
        const { data } = await openApi.request({
            url: `/public-settings/${key}`,
            method: 'GET'
        });
        return data;
    }

    return {
		  getAll,
		  getPublicSetting,
      update
    }
}

export default useSettings;