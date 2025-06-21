"use client";
import Button from "./Button";
import Input from "./Input";
import { useState } from "react";
import axios from "axios";
import { HTTP_BACKEND } from "@/config";
import { useRouter } from "next/navigation";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  async function handleOnClick() {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    const endpoint = isSignin ? "signin" : "signup";

    try {
      let res;
      if(isSignin){
        res = await axios.post(`${HTTP_BACKEND}/${endpoint}`, {
          username: email, 
          password,
        });
      }else{
         res = await axios.post(`${HTTP_BACKEND}/${endpoint}`, {
          username: email, 
          password,
          name:"pushpalatha"
        });
      }

      console.log("Response:", res.data);

      if (isSignin) {
        localStorage.setItem("token", res.data.token);
        router.push("/CreateRoom");
      } else {
        router.push("/signin");
      }
    } catch (err: any) {
      console.error("Authentication failed:", err?.response?.data || err.message);
      alert(err?.response?.data?.message || "Something went wrong");
    }
  }

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="p-8 m-2 bg-amber-200 rounded-2xl text-black border border-black">
        <div className="flex justify-center text-2xl font-bold mb-4">
          {isSignin ? "Signin" : "Signup"}
        </div>

        <div className="mb-4">
          <Input
            type="text"
            placeholder="Email"
            onChange= {(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <Input
            type="password"
            placeholder="Password"
            onChange ={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          />
        </div>

        <Button onClick={handleOnClick}>
          {isSignin ? "Signin" : "Signup"}
        </Button>
      </div>
    </div>
  );
}
