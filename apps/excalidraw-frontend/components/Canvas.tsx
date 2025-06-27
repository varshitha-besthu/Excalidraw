"use client"

import { useEffect, useRef, useState } from "react";
import { IconButton } from "./iconButton";
import { ArrowUpIcon, Circle, Eraser, Hand, LineChart, MousePointer, Pencil, RectangleHorizontalIcon, Sidebar } from "lucide-react";
import { Game } from "@/draw/Game";
export type Tool = "circle" | "rect" | "pencil" | "arrow" | "eraser"| "panning" | "selection";
export type Color = "white" | "red" | "yellow" | "blue" | "purple" | "green";
import {motion} from "motion/react";
export default function Canvas({ roomId, socket }: { roomId: string, socket: WebSocket }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");
    const [selectedColor, setSelectedColor] = useState<Color>("white");
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
        game?.setColor(selectedColor);
    }, [selectedTool, game,selectedColor])
    return <div style={{
        height: "100vh",
        overflow: "hidden"
    }}>
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="bg-black"></canvas>
        <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool}/>
        <SideBar selectedColor={selectedColor} setSelectedColor={setSelectedColor}/>
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
                <IconButton activated={selectedTool == "selection"} icon={<MousePointer />} onClick={() => {setSelectedTool("selection")}} />
            </div>
        </div>
    )
}

function SideBar({ selectedColor, setSelectedColor}: {
    selectedColor: Color,
    setSelectedColor : (c: Color) => void
}){
    return (
        <div className="fixed top-1/3 left-4">
            <motion.div whileHover={{scale:1.12}} className="w-[28px] h-[28px] rounded-full text-white bg-red-500 hover:border-2 hover:border-red-300" onClick={()=>setSelectedColor("red")}></motion.div>
            <motion.div whileHover={{scale:1.12}} className="w-[28px] h-[28px] rounded-full text-white bg-yellow-500 mt-1 hover:border-2 hover:border-yellow-300" onClick={()=>setSelectedColor("yellow")}></motion.div>
            <motion.div whileHover={{scale:1.12}} className="w-[28px] h-[28px] rounded-full text-white bg-blue-500 mt-1 hover:border-2 hover:border-blue-300" onClick={()=>setSelectedColor("blue")}></motion.div>
            <motion.div  whileHover={{scale:1.12}} className="w-[28px] h-[28px] rounded-full text-white bg-white mt-1 hover:border-2 hover:border-neutral-500" onClick={()=>setSelectedColor("white")}></motion.div>
            <motion.div whileHover={{scale:1.12}} className="w-[28px] h-[28px] rounded-full text-white bg-green-500 mt-1 hover:border-2 hover:border-green-300" onClick={()=>setSelectedColor("green")}></motion.div>
            <motion.div whileHover={{scale:1.12}} className="w-[28px] h-[28px] rounded-full text-white bg-purple-500 mt-1 hover:border-2 hover:border-purple-300" onClick={()=>setSelectedColor("purple")}></motion.div>
        </div>
    )

}