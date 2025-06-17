
import React from "react";

export function IconButton({ icon, onClick, activated }: {
    icon: React.ReactNode,
    onClick: () => void,
    activated: boolean
}) {
    return <div className={`pointer rounded-full border border-white ${activated ? "text-red-500" : "text-white"} p-2 bg-black hover:bg-gray-500`} onClick={onClick} >
        {icon}
    </div >
}