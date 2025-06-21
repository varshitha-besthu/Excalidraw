import { MouseEventHandler } from "react";

export default function Button({children, onClick} :{
    children: React.ReactNode;
    onClick: MouseEventHandler
}){

    return <div className="flex justify-center">
        <button className="bg-blue-400 px-16 py-4 rounded-2xl hover:bg-blue-300" onClick={onClick}>{children}</button>
    </div>
}