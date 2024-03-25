import { io } from "socket.io-client";

const URL = "http://192.168.152.216:8000";
const socket = io(URL, { autoConnect: false });

export default socket;