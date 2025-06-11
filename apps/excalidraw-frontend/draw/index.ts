import { HTTP_BACKEND } from "@/config";
import axios from "axios";

type Shape = {
    type : "rect",
    x: number,
    y: number,
    width: number,
    height: number
} | {
    type: "circle",
    centerX: number,
    centerY: number,
    radius : number
}

export async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  let existingShapes : Shape[] = await getExistingShapes(roomId);

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if(message.type == "chat"){
      const parsedShape = JSON.parse(message.message);
      existingShapes.push(parsedShape.shape);
      clearCanvas(existingShapes, canvas, ctx);
    }

  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0)";

  clearCanvas(existingShapes, canvas, ctx);
  let clicked = false;
  let startX = 0;
  let startY = 0;
  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
    // console.log(e.clientY)
  });
  canvas.addEventListener("mouseup", (e) => {
    clicked = false;
     let width = e.clientX - startX;
      let height = e.clientY - startY;

      let shape:Shape = {
        type: "rect",
        x: startX,
        y: startY,
        width: width,
        height : height
      };
      existingShapes.push(shape);

      socket.send(JSON.stringify({
        type: "chat",
        message: JSON.stringify({
          shape
        }),
        roomId
      }))
    });
    canvas.addEventListener("mousemove", (e) => {
      if (clicked) {
        let width = e.clientX - startX;
        let height = e.clientY - startY;
        
        clearCanvas(existingShapes, canvas, ctx);
      ctx.strokeStyle = "rgba(255, 255, 255)";
      ctx.strokeRect(startX, startY, width, height);
    }
  });
}

function clearCanvas(existingShapes: Shape[],canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  existingShapes.map((shape, index)=> {
    if(shape.type == "rect"){
      ctx.strokeStyle = "rgba(255, 255, 255)";
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  })
}


async function getExistingShapes(roomId: string){
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const messages = (await res).data.messages;

    const shapes = messages.map((x: {message: string}) => {
      const messageData = JSON.parse(x.message);
      return messageData.shape;
    })

    return shapes;
}