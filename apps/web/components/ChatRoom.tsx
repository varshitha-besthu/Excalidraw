import axios from "axios";
import { BACKEND_URL } from "../app/config";
import { useSocket } from "../hooks/useSocket";
import { ChatRoomClient } from "./ChatRoomClient";

async function getChats(roomId : string) {
    const messages = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
    return messages.data.messages;
}

export async function ChatRoom({roomId} :{roomId: string}){
     const messages = await getChats(roomId);
    return <ChatRoomClient id={roomId} messages={messages}/>
}