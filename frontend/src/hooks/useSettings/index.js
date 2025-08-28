import { useContext, useEffect } from "react";
import api, { openApi } from "../../services/api";
import { Mutex } from 'async-mutex';
import { SocketContext } from "../../context/Socket/SocketContext";

const cachedSettingsMutex = new Mutex();

const useSettings = () => {
    const get = async (key) => {
        const { data } = await api.request({
            url: `/settings/${key}`,
            method: 'GET'
        });
        return data;
    }

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

    const socketManager = useContext(SocketContext);

    useEffect(() => {
      if (!socketManager) return;

      const socket = socketManager.GetSocket();
      
      socket.on(`settings`, (data) => {
        if (data.key && data.value) {
          sessionStorage.setItem(data.key, JSON.stringify(data.value));
        }
      });
  
      return () => {
        socket.disconnect();
      };
    }, [socketManager]);
    
    return {
      get,
		  getAll,
		  getPublicSetting,
		  getSetting,
      getCachedSetting,
      update
    }
}

export default useSettings;