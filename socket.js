import { io } from "socket.io-client";

const URL = "http://10.145.192.186:8000";
const socket = io(URL, { autoConnect: false });

export default socket;