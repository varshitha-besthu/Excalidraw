
import { timeStamp } from "console";
import { getExistingShapes } from "./http";
import { Tool } from "@/components/Canvas";
import { parse } from "path";
type Shape = {
    id ?: number,
    type : "rect";
    x : number;
    y : number;
    width : number;
    height: number;
} | {
    id ?:number,
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    id ?:number,
    type: "pencil";
    pencilPath: {x: number, y: number, drag: boolean}[];
} | {
    id ?:number,
    type: "arrow";
    startX : number,
    startY : number,
    endX : number,
    endY : number
} | {
    id ?:number,
    type : "eraser"
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
    private endX = 0;
    private endY = 0;
    private pencilPath : {x:number, y: number, drag: boolean}[] = []
    
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
        console.log(this.existingShapes);
        if(!this.ctx){
            return;
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));

        this.clearCanvas();
    }
    
    setTool(tool : "circle" | "pencil" | "rect" | "arrow" | "eraser"){
        this.selectedTool = tool;
    }
    initHandlers(){
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message)
                this.existingShapes.push(parsedShape.shape)
            }
            if (message.type === "updatedShapes") {
                // console.log("updated shapes" , this.existingShapes);
                console.log("updated Shape", message.updatedShapes);
                this.existingShapes = []
                for(let i = 0; i < message.updatedShapes.length; i++){
                    // console.log(JSON.parse(message.updatedShapes[i].message).shape)
                    this.existingShapes.push(JSON.parse(message.updatedShapes[i].message).shape)
                }
                // this.existingShapes = message.updatedShapes.shape;
            }
            this.clearCanvas();
        }
    }
    destroy(){
        this.canvas.removeEventListener("mousedown", this.MouseDownHandler)
        this.canvas.removeEventListener("mouseup", this.MouseUpHandler)
        this.canvas.removeEventListener("mousemove", this.MouseMoveHandler)
    }
    clearCanvas(){
        if(!this.ctx){
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = "rgba(255, 255, 255)"
        this.existingShapes.map((s) => {
            //@ts-ignore
            let shape;
            //@ts-ignore
            if(!s.shape){
                shape = s
            }else{
                //@ts-ignore
                shape = s.shape
            }
            if (shape.type === "rect") {
                this.ctx.beginPath()
                this.ctx.roundRect(shape.x, shape.y, shape.width, shape.height, [5]);
                this.ctx.stroke()
                this.ctx.closePath()
            } else if(shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            }else if (shape.type === "pencil") {
                this.ctx.lineJoin = "round";
                this.ctx.lineCap = "round";
                this.ctx.beginPath();
                for (let i = 0; i < shape.pencilPath.length; i++) {
                    const point = shape.pencilPath[i];
                    if (point.drag && i > 0) {
                        this.ctx.moveTo(shape.pencilPath[i - 1].x, shape.pencilPath[i - 1].y);
                    } else {
                        this.ctx.moveTo(point.x - 1, point.y);
                    }
                    this.ctx.lineTo(point.x, point.y);
                }
                this.ctx.stroke();
                this.ctx.closePath();
            }else if(shape.type === "arrow"){
                let headlen = 10; 
                let dx = shape.endX - shape.startX;
                let dy = shape.endY - shape.startY;
                let angle = Math.atan2(dy, dx);
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.lineTo(shape.endX - headlen * Math.cos(angle - Math.PI / 6), shape.endY - headlen * Math.sin(angle - Math.PI / 6));
                this.ctx.moveTo(shape.endX, shape.endY);
                this.ctx.lineTo(shape.endX - headlen * Math.cos(angle + Math.PI / 6), shape.endY - headlen * Math.sin(angle + Math.PI / 6));
                this.ctx.stroke()
                this.ctx.closePath()
            }

        })
    }
    MouseDownHandler = (e: MouseEvent) => {
        this.clicked = true
        this.startX = e.offsetX
        this.startY = e.offsetY 
        if(this.selectedTool === "pencil"){
            this.pencilPath = [{x: e.offsetX,y: e.offsetY, drag:false}];
            this.ctx.lineJoin = "round"
            this.ctx.lineCap = "round"
            this.ctx.beginPath();
            this.ctx.moveTo(e.offsetX, e.offsetY);
            this.ctx.stroke()
        }
    }
    MouseUpHandler = (e: MouseEvent) => {
         this.clicked = false
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;
            let shape: Shape | null = null;
            if (this.selectedTool === "rect") {
                shape = {
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    height,
                    width
                }
            } else if (this.selectedTool === "circle") {
                const radius = Math.max(width, height) / 2;
                shape = {
                    type: "circle",
                    radius: radius,
                    centerX: this.startX + radius,
                    centerY: this.startY + radius,
                }
            }else if(this.selectedTool === "pencil"){
                shape = {
                    type:"pencil",
                    pencilPath: this.pencilPath
                }
                this.ctx.closePath();
                this.pencilPath = [];

            }else if(this.selectedTool === "arrow"){
                shape = {
                    type : "arrow",
                    startX : this.startX,
                    startY : this.startY,
                    endX : this.endX,
                    endY : this.endY
                }
            }else if(this.selectedTool === "eraser"){
                // alert("fuck off")
            }

            if (!shape) {
                console.log("shape is empty")
                return;
            }

            this.existingShapes.push(shape);
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({
                    shape: shape
                }),
                roomId: this.roomId,
            }))
            console.log(this.existingShapes)
    }
    MouseMoveHandler = (e: MouseEvent) => {
         if (this.clicked) {
                const width = e.clientX - this.startX;
                const height = e.clientY - this.startY;
                this.endX = e.clientX;
                this.endY = e.clientY;
                const x = e.offsetX;
                const y = e.offsetY;
                this.clearCanvas();
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                if (this.selectedTool === "rect") {
                    this.ctx.beginPath()
                    this.ctx.roundRect(this.startX, this.startY, width, height, [5]);  
                    this.ctx.stroke() 
                    this.ctx.closePath()
                } else if (this.selectedTool === "circle") {
                    const radius = Math.max(width, height) / 2;
                    const centerX = this.startX + radius;
                    const centerY = this.startY + radius;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();                
                }else if (this.selectedTool === "pencil") {
                    this.pencilPath.push({ x, y, drag: true });
                    this.ctx.beginPath();
                    this.ctx.lineCap = "round";
                    for (let i = 0; i < this.pencilPath.length; i++) {
                        const point = this.pencilPath[i];
                        if (point.drag && i > 0) {
                            this.ctx.moveTo(this.pencilPath[i - 1].x, this.pencilPath[i - 1].y);
                        } else {
                            this.ctx.moveTo(point.x - 1, point.y);
                        }
                        this.ctx.lineTo(point.x, point.y);
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();

                }else if(this.selectedTool === "arrow"){
                    let headlen = 10; 
                    let dx = this.endX - this.startX;
                    let dy = this.endY - this.startY;
                    let angle = Math.atan2(dy, dx);
                    this.ctx.beginPath()
                    this.ctx.moveTo(this.startX, this.startY);
                    this.ctx.lineTo(this.endX, this.endY);
                    this.ctx.lineTo(this.endX - headlen * Math.cos(angle - Math.PI / 6), this.endY - headlen * Math.sin(angle - Math.PI / 6));
                    this.ctx.moveTo(this.endX, this.endY);
                    this.ctx.lineTo(this.endX - headlen * Math.cos(angle + Math.PI / 6), this.endY - headlen * Math.sin(angle + Math.PI / 6));
                    this.ctx.stroke()
                    this.ctx.closePath()
                }else if(this.selectedTool === "eraser"){
                    let x = e.clientX;
                    let y = e.clientY;
                    this.existingShapes = this.existingShapes.filter((s) => {
                        //@ts-ignore
                        let shape;
                        //@ts-ignore
                        if(!s.shape){
                            shape = s
                            // alert("here s is shape")
                        }else{
                            //@ts-ignore
                            // alert("here s is not shape")
                            shape = s.shape
                        }

                        if (shape.type === "rect") {
                             const left = Math.min(shape.x, shape.x + shape.width);
                            const right = Math.max(shape.x, shape.x + shape.width);
                            const top = Math.min(shape.y, shape.y + shape.height);
                            const bottom = Math.max(shape.y, shape.y + shape.height);

                            const inX = x >= left && x <= right;
                            const inY = y >= top && y <= bottom;
                            if(!(inX && inY)){
                                return true;
                            }
                            //@ts-ignore
                            this.deleteShape(s.id);
                            return false;
                        }

                        else if (shape.type === "circle") {
                            const dx = x - shape.centerX;
                            const dy = y - shape.centerY;
                            if((dx * dx + dy * dy > shape.radius * shape.radius)){
                                return true
                            }
                            //@ts-ignore
                            this.deleteShape(s.id);
                            // alert("deleting the circle ")/
                            return false
                        }

                        else if (shape.type === "pencil") {
                            const eraserRadius = 5;
                            //@ts-ignore
                            const isNearAnyPoint = shape.pencilPath.some((point) => {
                                const dx = x - point.x;
                                const dy = y - point.y;
                                return dx * dx + dy * dy <= eraserRadius * eraserRadius;
                            });
                            if(isNearAnyPoint){

                                //@ts-ignore
                                this.deleteShape(s.id);
                                return false;
                            }
                            return true;
                        }

                        else if (shape.type === "arrow") {
                            const minX = Math.min(shape.startX, shape.endX);
                            const maxX = Math.max(shape.startX, shape.endX);
                            const minY = Math.min(shape.startY, shape.endY);
                            const maxY = Math.max(shape.startY, shape.endY);

                            const isInside = x >= minX && x <= maxX && y >= minY && y <= maxY;
                            if(!isInside){
                                return true;
                            }
                            //@ts-ignore
                            this.deleteShape(s.id);
                            return false;
                        }

                        return true; 
                    });
                    this.clearCanvas()

                }

            }
    }
    deleteShape(id: number | null){
        if(id == null){
            return
        }
        this.socket.send(JSON.stringify({
                type: "delete",
                message: JSON.stringify({
                    id: id
                }),
                roomId: this.roomId,
        }))

        
        
    }
    initMouseHandlers(){
        this.canvas.addEventListener("mousedown", this.MouseDownHandler)
        this.canvas.addEventListener("mouseup", this.MouseUpHandler)
        this.canvas.addEventListener("mousemove", this.MouseMoveHandler)
    }

}