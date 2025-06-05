"use client"

import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";

export function useSocket(){
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNWQxNTZhZS05MDA0LTQxOWQtYjIxYi1iZjAzNDFjNzg3YzMiLCJpYXQiOjE3NDkxNDM5MDJ9.hsGCocg4w22FllBzW2isfYZ9LOkP5qd6Zq3l5H2gvWA`);
        ws.onopen = () => {
            setLoading(false)
            setSocket(ws)
        }
    }, [])

    return {socket, loading}
 }