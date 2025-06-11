"use client"

import { initDraw } from "@/draw";
import { useEffect, useRef } from "react";

export default function Canvas({roomId, socket} : {roomId: string, socket: WebSocket}){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if(canvasRef.current != null){
            initDraw(canvasRef.current, roomId, socket)
        }

    }, [canvasRef]) 

    return <div>
        <canvas ref = {canvasRef} width={2000} height = {1080}></canvas>
    </div>
}