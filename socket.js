import { io } from "socket.io-client";

const URL = "http://10.145.206.139:8000";
const socket = io(URL, { autoConnect: false });

export default socket;