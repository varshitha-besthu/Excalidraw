import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
const { prismaClient } = require("@repo/db/client");
const { JWT_SECRET } = require("@repo/be-common/src/index");
const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded == "string") {
      return null;
    }
    if (!decoded || !decoded.userId) {
      return null;
    }
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close();
    return null;
  }

  users.push({
    userId,
    rooms: [],
    // @ts-ignore
    ws,
  });
  ws.on("message", async function connection(data) {
    let parsedData;
    if (typeof data !== "string") {
      parsedData = JSON.parse(data.toString());
    } else {
      parsedData = JSON.parse(data); 
    }

    if (parsedData.type === "join_room") {
        //@ts-ignore
      const user = users.find((x) => x.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    if (parsedData.type === "leave_room") {
    //@ts-ignore
      const user = users.find((x) => x.ws === ws);
      if (!user) {
        return;
      }
      user.rooms = user?.rooms.filter((x) => x === parsedData.room);
    }

    console.log("message received");
   
    
    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      
      const message = parsedData.message;
      
     
      await prismaClient.chat.create({
        data: {
          roomId: Number(roomId),
          message : message,
          userId,
        },
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
            })
          );
        }
      });
    }
    if(parsedData.type === "delete"){
      //@ts-ignore
      const roomId = parsedData.roomId;
      try {
        const delItem = JSON.parse(parsedData.message);
        console.log("Trying to delete:", delItem);
        await prismaClient.chat.delete({
          where: {
            id: Number(delItem.id)
          }
        });
        let updatedShapes = await prismaClient.chat.findMany()
        console.log("updated Shapes from the ws-backend",updatedShapes)
        

        users.forEach((user) => {
          if (user.rooms.includes(roomId)) {
            user.ws.send(
              JSON.stringify({
                type: "updatedShapes",
                updatedShapes: updatedShapes,
                roomId: roomId,
              })
            );
          }
        });

      
      } catch (err) {
        console.error("Delete error:", err);
      }
            
    }

  });
});
