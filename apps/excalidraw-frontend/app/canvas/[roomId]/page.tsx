

import RoomCanvas from "@/components/RoomCanvas";
import { initDraw } from "@/draw";
import { useEffect, useRef } from "react"
import { start } from "repl";


export default async function CanvasPage({params}: {
    params: {
        roomId: string
    }
}){
    const roomId = (await params).roomId; 
    console.log(roomId);

   return <RoomCanvas roomId={roomId}/>
    
}