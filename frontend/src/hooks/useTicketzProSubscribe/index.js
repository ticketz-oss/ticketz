import { AxiosError } from "axios";
import api from "../../services/api";

const useTicketzProSubscribe = () => {

    const ticketzProSubscribe = async (data) => {
      try {
        const { data: responseData } = await api.request({
            url: `/ticketzPro/subscribe`,
            method: 'POST',
            data
        });
        return responseData;
      } catch (error) {
        if (error instanceof AxiosError) {
          throw new Error(error.response.data.message);
        }
      }
    }

    return {
        ticketzProSubscribe
    }
}

export default useTicketzProSubscribe;