"use client"
import axios from "axios";
import { useState } from "react";
import { BACKEND_URL } from "../config";
import { useRouter } from "next/navigation";

export default function SignUp(){

    const handleOnClick = async() => {
        try{
            const response = await axios.post(`${BACKEND_URL}/signup`, {
                username: username,
                password: password,
                name: name
            })
            console.log(response)
            router.push("/signin");
        }catch(e){
            console.log(e);
        }   
    }
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    return(
        <div style={{
            display: "flex",
            justifyContent:"center",
            alignItems: "center",
            height:"100vh",
            width:"100vw"
        }}>
            <input type="text" style={{padding: 10}} placeholder="username" onChange={(e) => setUsername(e.target.value)} />
            <input type="password" style={{padding: 10}} placeholder="password" onChange={(e) => setPassword(e.target.value)}/>
            <input type="text" style={{padding: 10}} placeholder="name" onChange={(e) => setName(e.target.value)}/>

            <button style={{padding: 10}} onClick={handleOnClick}>Signup</button>
        </div>
    )
}