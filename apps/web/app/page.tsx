"use client"
import { useState } from "react";
import styles from "./page.module.css";
import {useRouter} from "next/navigation";

export default function Home() {
  const [slug, setSlug] = useState("")
  const router = useRouter();
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100vw",
    }}>
      <input type="text" style = {{padding: 10}}  placeholder="roomId" onChange={(e) => setSlug(e.target.value)}/>
      <button onClick={() =>{
        router.push(`/room/${slug}`)
      }} style = {{padding: 10}}>
        Join room
      </button>
    </div>
  );
}
