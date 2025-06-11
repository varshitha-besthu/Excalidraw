export default function Input({type, placeholder} : {
    type: string,
    placeholder: string
}){
    return <div className="border-2 m-2 rounded-lg px-4 py-2">
        <input type={type} placeholder={placeholder}/>
    </div>
}