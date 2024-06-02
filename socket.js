import { io } from "socket.io-client";

const URL = `${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}`;
const socket = io(URL, { autoConnect: false });

export default socket;