import api from "../../services/api";

const useQuickMessages = () => {

    const save = async (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          if (data[key]) {
            formData.append(key, data[key]);
          }
        });
      
        const { data: responseData } = await api.request({
            url: '/quick-messages',
            method: 'POST',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return responseData;
    }

    const update = async (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          if (data[key]) {
            formData.append(key, data[key]);
          }
        });
      
        const { data: responseData } = await api.request({
            url: `/quick-messages/${data.id}`,
            method: 'PUT',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return responseData;
    }

    const deleteRecord = async (id) => {
        const { data } = await api.request({
            url: `/quick-messages/${id}`,
            method: 'DELETE'
        });
        return data;
    }

    const list = async () => {
        const { data } = await api.request({
            url: '/quick-messages/list',
            method: 'GET',
        });
        return data;
    }

    return {
        save,
        update,
        deleteRecord,
        list
    }
}

export default useQuickMessages;