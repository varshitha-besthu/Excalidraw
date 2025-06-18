"use client"
import { token, WS_URl } from "@/config";
import { useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";
import { json } from "stream/consumers";

export default function RoomCanvas({roomId} : {roomId: string}){

    const [socket, setSocket] = useState<WebSocket | null>();

    useEffect(() => {
        const ws = new WebSocket(`${WS_URl}?token=${token}`);
        
        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }))
        }
    }, [])
    if(!socket){
        return <div>It is still loading....</div>
    }

    return <Canvas roomId={roomId} socket= {socket}/>
    
} 