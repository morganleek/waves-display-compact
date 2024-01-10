import Axios from "axios";

const axios = Axios.create({
	baseURL: window.location.origin,
	// headers: {
	// 	"X-Requested-With": "XMLHttpRequest",
	// },
	// withCredentials: true,
});

export default axios;