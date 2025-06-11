export default function Button({children} :{
    children: React.ReactNode;
}){

    return <div className="flex justify-center">
        <button className="bg-blue-400 px-16 py-4 rounded-2xl ">{children}</button>
    </div>
}