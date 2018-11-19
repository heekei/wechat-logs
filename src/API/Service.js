import axios from 'axios';

export const chatlog = (count, vm) => {
    return axios.get("/api/chatlog", {
        params: {
            userId: "3051726979@chatroom",
            count: count || vm.count
        }
    });
}