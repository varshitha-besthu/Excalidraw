"use client"
import Link from "next/link";
import Button from "./Button";
import Input from "./Input";
export function AuthPage({ isSignin }: {
    isSignin: boolean
}) {
    return <div className="w-screen h-screen flex justify-center items-center">
        <div className="p-8 m-2 bg-white rounded text-black ">
            <div className="flex justify-center text-2xl font-bold">{isSignin? "Signin" : "Signup"}</div>
            <div>
                <Input type="text" placeholder="email" />
            </div>
            <div>
                <Input type="password" placeholder="password" />
            </div>
            <Link href={isSignin? "/" : "/signin"}>
                <Button>
                    {isSignin ? "Signin" : "Signup"}
                </Button>   
            </Link>
                
            
        </div>
    </div>
}