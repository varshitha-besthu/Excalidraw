import { Ribbon } from "lucide-react";
import { getExistingShapes } from "./http";
import { Tool } from "@/components/Canvas";
import { EventHandler } from "react";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export class Game{
    private canvas: HTMLCanvasElement
    private ctx:CanvasRenderingContext2D 
    private existingShapes: Shape[]
    private socket: WebSocket;
    private roomId: string;
    private clicked:boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool:Tool = "circle"
    constructor(canvas: HTMLCanvasElement, roomId: string, socket:WebSocket){
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = []
        this.roomId = roomId
        this.socket = socket
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    async init(){
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();
    }
    setTool(tool : "circle" | "pencil" | "rect"){
        this.selectedTool = tool;
    }
    initHandlers(){
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message)
                this.existingShapes.push(parsedShape.shape)
                this.clearCanvas();
            }
        }
    }
    destroy(){
        this.canvas.removeEventListener("mousedown", this.MouseDownHandler)
        this.canvas.removeEventListener("mouseup", this.MouseUpHandler)
        this.canvas.removeEventListener("mousemove", this.MouseMoveHandler)
    }
    clearCanvas(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShapes.map((shape) => {
            if (shape.type === "rect") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if(shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            }
        })
    }
    MouseDownHandler = (e: MouseEvent) => {
        this.clicked = true
            this.startX = e.clientX
            this.startY = e.clientY 
    }
    MouseUpHandler = (e: MouseEvent) => {
         this.clicked = false
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;

            
            let shape: Shape | null = null;
            if (this.selectedTool === "rect") {
                console.log("rectanle")
                shape = {
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    height,
                    width
                }
            } else if (this.selectedTool === "circle") {
                console.log("circle")
                const radius = Math.max(width, height) / 2;
                shape = {
                    type: "circle",
                    radius: radius,
                    centerX: this.startX + radius,
                    centerY: this.startY + radius,
                }
            }

            if (!shape) {
                return;
            }

            this.existingShapes.push(shape);

            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({
                    shape
                }),
                roomId: this.roomId,
            }))
    }
    MouseMoveHandler = (e: MouseEvent) => {
         if (this.clicked) {
                const width = e.clientX - this.startX;
                const height = e.clientY - this.startY;
                this.clearCanvas();
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                if (this.selectedTool === "rect") {
                    this.ctx.strokeRect(this.startX, this.startY, width, height);   
                } else if (this.selectedTool === "circle") {
                    const radius = Math.max(width, height) / 2;
                    const centerX = this.startX + radius;
                    const centerY = this.startY + radius;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();                
                }
            }
    }
    initMouseHandlers(){
        this.canvas.addEventListener("mousedown", this.MouseDownHandler)
        this.canvas.addEventListener("mouseup", this.MouseUpHandler)
        this.canvas.addEventListener("mousemove", this.MouseMoveHandler)
    }

}