
import { getExistingShapes } from "./http";
import { Tool, Color } from "@/components/Canvas";
import { parse } from "path";
type Shape = {
    id ?: number,
    type : "rect";
    x : number;
    y : number;
    width : number;
    height: number;
    roomId: number
} | {
    id ?:number,
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
    roomId: number

} | {
    id ?:number,
    type: "pencil";
    pencilPath: {x: number, y: number, drag: boolean}[];
    roomId: number

} | {
    id ?:number,
    type: "arrow";
    startX : number,
    startY : number,
    endX : number,
    endY : number
    roomId: number

} | {
    id ?:number,
    type : "eraser"
    roomId: number

} | {
    id?: "number",
    type : "panning"
    roomId: number

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
    private scale = 1;
    private originX = 0;
    private originY = 0;
    private isDragging = false;
    private panStartX = 0;
    private panStartY = 0;
    private deletedShapes : Number[] = []

    private pencilPath : {x:number, y: number, drag: boolean}[] = []
    
    private selectedTool:Tool = "circle"
    private selectedColor:Color = "white"
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
        // await new Promise((resolve) => requestAnimationFrame(resolve));

        this.clearCanvas();
    }
    
    setTool(tool : "circle" | "pencil" | "rect" | "arrow" | "eraser" | "panning" ){
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
        if(this.selectedTool === "panning"){
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before clearing
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
             this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.setTransform(this.scale, 0, 0, this.scale, this.originX, this.originY);
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
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
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
        const transformedX = (e.offsetX - this.originX) / this.scale;
        const transformedY = (e.offsetY - this.originY) / this.scale;
        this.clicked = true
        this.startX = transformedX
        this.startY = transformedY
        if(this.selectedTool == "panning"){
             this.isDragging = true;
            this.panStartX = e.offsetX - this.originX;
            this.panStartY = e.offsetY - this.originY;
            this.clearCanvas();
            return;
        }
       
        this.startY = transformedY 
        if(this.selectedTool === "pencil"){
            this.pencilPath = [{x: transformedX,y: transformedY, drag:false}];
            this.ctx.lineJoin = "round"
            this.ctx.lineCap = "round"
            this.ctx.beginPath();
            this.ctx.moveTo(transformedX, transformedY);
            this.ctx.stroke()
        }
    }
    MouseUpHandler = (e: MouseEvent) => {
            const transformedX = (e.offsetX - this.originX) / this.scale;
            const transformedY = (e.offsetY - this.originY) / this.scale;
            this.clicked = false
            const width = transformedX - this.startX;
            const height = transformedY - this.startY;
            let shape: Shape | null = null;
            if (this.selectedTool === "rect") {
                shape = {
                    id:this.generateTemporaryId(),
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    height,
                    width,
                    roomId: Number(this.roomId)
                }
            } else if (this.selectedTool === "circle") {
                const radius = Math.max(width, height) / 2;
                shape = {
                    id:this.generateTemporaryId(),

                    type: "circle",
                    radius: radius,
                    centerX: this.startX + width/2,
                    centerY: this.startY + height/2,
                    roomId: Number(this.roomId)
                    
                }
            }else if(this.selectedTool === "pencil"){
                shape = {
                    id:this.generateTemporaryId(),

                    type:"pencil",
                    pencilPath: this.pencilPath,
                    roomId: Number(this.roomId)

                }
                this.ctx.closePath();
                this.pencilPath = [];

            }else if(this.selectedTool === "arrow"){
                shape = {
                    id:this.generateTemporaryId(),

                    type : "arrow",
                    startX : this.startX,
                    startY : this.startY,
                    endX : transformedX,
                    endY : transformedY,
                    roomId: Number(this.roomId)

                }
            }else if(this.selectedTool === "eraser"){
                // alert("fuck off")
                this.clearCanvas();
                return;
            }else if(this.selectedTool === "panning"){
                this.isDragging = false
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
            console.log("clearing the canvas bruh!! ")
            this.clearCanvas()
    }
    generateTemporaryId() {
        const base = Math.floor(Date.now() / 1000); // current timestamp in seconds
        const randomBits = Math.floor(Math.random() * 100000); // 0 to 99,999
        const id = base % 100000 * 100000 + randomBits;

        // Ensure it's under 2_147_483_647
        return id % 2147483647;
    }

    MouseMoveHandler = (e: MouseEvent) => {
    const transformedX = (e.offsetX - this.originX) / this.scale;
    const transformedY = (e.offsetY - this.originY) / this.scale;

    if (this.isDragging) {
        this.originX = e.offsetX - this.panStartX;
        this.originY = e.offsetY - this.panStartY;
        this.clearCanvas(); // full repaint after pan
        return;
    }

    if (this.clicked && this.selectedTool !== "panning") {
        const width = transformedX - this.startX;
        const height = transformedY - this.startY;
        this.endX = transformedX;
        this.endY = transformedY;
        const x = transformedX;
        const y = transformedY;

        this.ctx.clearRect(
            -this.originX / this.scale,
            -this.originY / this.scale,
            this.canvas.width / this.scale,
            this.canvas.height / this.scale
        );

        // // 👇 Redraw all existing shapes during preview
        this.existingShapes.forEach((s) => {
            //@ts-ignore
            const shape = s.shape ?? s;
            if (!shape) return;

            this.ctx.beginPath();
            if (shape.type === "rect") {
                this.ctx.roundRect(shape.x, shape.y, shape.width, shape.height, [5]);
            } else if (shape.type === "circle") {
                this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
            } else if (shape.type === "pencil") {
                this.ctx.lineJoin = "round";
                this.ctx.lineCap = "round";
                for (let i = 0; i < shape.pencilPath.length; i++) {
                    const point = shape.pencilPath[i];
                    if (point.drag && i > 0) {
                        this.ctx.moveTo(shape.pencilPath[i - 1].x, shape.pencilPath[i - 1].y);
                    } else {
                        this.ctx.moveTo(point.x - 1, point.y);
                    }
                    this.ctx.lineTo(point.x, point.y);
                }
            } else if (shape.type === "arrow") {
                const dx = shape.endX - shape.startX;
                const dy = shape.endY - shape.startY;
                const angle = Math.atan2(dy, dx);
                const headlen = 10;
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.lineTo(
                    shape.endX - headlen * Math.cos(angle - Math.PI / 6),
                    shape.endY - headlen * Math.sin(angle - Math.PI / 6)
                );
                this.ctx.moveTo(shape.endX, shape.endY);
                this.ctx.lineTo(
                    shape.endX - headlen * Math.cos(angle + Math.PI / 6),
                    shape.endY - headlen * Math.sin(angle + Math.PI / 6)
                );
            }
            this.ctx.stroke();
            this.ctx.closePath();
        });
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        if (this.selectedTool === "rect") {
            this.ctx.beginPath();
            this.ctx.roundRect(this.startX, this.startY, width, height, [5]);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (this.selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (this.selectedTool === "pencil") {
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
        } else if (this.selectedTool === "arrow") {
            const dx = this.endX - this.startX;
            const dy = this.endY - this.startY;
            const angle = Math.atan2(dy, dx);
            const headlen = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(this.endX, this.endY);
            this.ctx.lineTo(
                this.endX - headlen * Math.cos(angle - Math.PI / 6),
                this.endY - headlen * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(this.endX, this.endY);
            this.ctx.lineTo(
                this.endX - headlen * Math.cos(angle + Math.PI / 6),
                this.endY - headlen * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
            this.ctx.closePath();
        }else if(this.selectedTool === "eraser"){
            let x = transformedX;
            let y = transformedY;
            // this.clearCanvas()
            console.log("Existing Shapes", this.existingShapes);
            this.existingShapes.forEach((s) => {
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
                    if((inX && inY)){
                        console.log(s);
                        
                        //@ts-ignore
                        // this.deleteShape(s.id);
                        this.deletedShapes.push(s.id)
                    }
                }

                else if (shape.type === "circle") {
                    const dx = x - shape.centerX;
                    const dy = y - shape.centerY;
                    if(!(dx * dx + dy * dy > shape.radius * shape.radius)){
                        console.log(s);

                        //@ts-ignore
                        // this.deleteShape(s.id);
                        this.deletedShapes.push(s.id)

                    }
                    
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
                        console.log(s);
                        //@ts-ignore
                        // this.deleteShape(s.id);
                        this.deletedShapes.push(s.id)

                    }
                }

                else if (shape.type === "arrow") {
                    const minX = Math.min(shape.startX, shape.endX);
                    const maxX = Math.max(shape.startX, shape.endX);
                    const minY = Math.min(shape.startY, shape.endY);
                    const maxY = Math.max(shape.startY, shape.endY);

                    const isInside = x >= minX && x <= maxX && y >= minY && y <= maxY;
                    if(isInside){
                        console.log(s);

                        //@ts-ignore
                        // this.deleteShape(s.id);
                        this.deletedShapes.push(s.id)

                    }
                }
                
            });
            this.deleteShape(this.deletedShapes);
            this.clearCanvas()
        }
    }
    };
    deleteShape(deletedShapes : Number[]){
        if(deletedShapes == null){
            return
        }
        this.existingShapes = this.existingShapes.filter(
            //@ts-ignore
            s => !deletedShapes.includes(s.id!)
        );

        this.socket.send(JSON.stringify({
                type: "delete",
                message: JSON.stringify({
                    deletedShapes: deletedShapes
                }),
                roomId: this.roomId,
        }))
        this.clearCanvas();
    }
    MouseWheel = (e:  WheelEvent) => {
        if(this.selectedTool === "panning"){
            e.preventDefault();
            const scaleAmount = 0.1;
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;

            const zoom = e.deltaY < 0 ? 1 + scaleAmount : 1 - scaleAmount;

            this.originX = mouseX - (mouseX - this.originX) * zoom;
            this.originY = mouseY - (mouseY - this.originY) * zoom;
            this.scale *= zoom;
        }
        
        this.clearCanvas();
    }
    initMouseHandlers(){
        this.canvas.addEventListener("mousedown", this.MouseDownHandler)
        this.canvas.addEventListener("mouseup", this.MouseUpHandler)
        this.canvas.addEventListener("mousemove", this.MouseMoveHandler)
        this.canvas.addEventListener("wheel",this.MouseWheel )
    }

}