import api, { openApi } from "../../services/api";
import { Mutex } from 'async-mutex';

const cachedSettingsMutex = new Mutex();

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

    const getSetting = async (key, defaultValue = "") => {
      const { data } = await api.request({
        url: `/settings/${key}`,
        method: 'GET'
      });

      if (!data) {
        return defaultValue;
      }
            
      sessionStorage.setItem(key, JSON.stringify(data));
      sessionStorage.setItem(`${key}_timestamp`, Date.now());
      
      return data;
    }
    
    const getCachedSetting = async (key, defaultValue = "") => {
      return await cachedSettingsMutex.runExclusive(() => {
        const cached = sessionStorage.getItem(key);
        const timestamp = sessionStorage.getItem(`${key}_timestamp`);
        if (cached) {
          // check if timestamp is older than 10 minutes
          if (timestamp && (Date.now() - timestamp > 10 * 60 * 1000)) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_timestamp`);
          } else {
            return JSON.parse(cached);
          }
        }
        return getSetting(key, defaultValue);
      });
    }

    return {
		  getAll,
		  getPublicSetting,
		  getSetting,
      getCachedSetting,
      update
    }
}

export default useSettings;