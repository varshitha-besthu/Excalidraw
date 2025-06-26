
import React from "react";

export function IconButton({ icon, onClick, activated }: {
    icon: React.ReactNode,
    onClick: () => void,
    activated: boolean
}) {
    return <div className={`pointer text-white rounded-2xl  ${activated ? "bg-violet-400" : "bg-neutal-800"} p-2 bg hover:bg-violet-400`} onClick={onClick} >
        {icon}
    </div >
}