"use client"

import { useEffect, useRef, useState } from "react";
import { IconButton } from "./iconButton";
import { ArrowUpIcon, Circle, Eraser, Hand, LineChart, Pencil, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "@/draw/Game";
export type Tool = "circle" | "rect" | "pencil" | "arrow" | "eraser"| "panning";
export type Color = "white" | "red" | "yellow" | "blue" | "purple" | "green";
export default function Canvas({ roomId, socket }: { roomId: string, socket: WebSocket }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");
    const [game, setGame] = useState<Game>();
    

    useEffect(() => {
        if (canvasRef.current != null) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);
            return (() => {
                g.destroy()
            })
        }
    }, [canvasRef])
    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game])
    return <div style={{
        height: "100vh",
        overflow: "hidden"
    }}>
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="bg-black"></canvas>
        <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool}/>
    </div>
}



function Topbar({ selectedTool, setSelectedTool }: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void;
}) {
    return (
        <div className="fixed top-10 left-1/3 ">
            <div className="flex gap-2 bg-neutral-800 px-4 py-2 rounded-2xl">
                <IconButton activated={selectedTool == "pencil"} icon={<Pencil />} onClick={() => { setSelectedTool("pencil") }} />
                <IconButton activated={selectedTool == "rect"} icon={<RectangleHorizontalIcon />} onClick={() => { setSelectedTool("rect") }} />
                <IconButton activated={selectedTool == "circle"} icon={<Circle />} onClick={() => { setSelectedTool("circle") }} />
                <IconButton activated={selectedTool == "arrow"} icon={<ArrowUpIcon />} onClick={() => setSelectedTool("arrow")} />
                <IconButton activated={selectedTool == "eraser"} icon={<Eraser />} onClick={() => setSelectedTool("eraser")} />
                <IconButton activated={selectedTool == "panning"} icon={<Hand />} onClick={() => setSelectedTool("panning")} />
            </div>
        </div>
    )
}
