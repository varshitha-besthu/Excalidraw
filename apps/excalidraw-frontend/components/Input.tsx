import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { type, placeholder, onChange }: {
    type: string;
    placeholder: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  },
  ref: React.Ref<HTMLInputElement>
) {
  return (
    <div className="border-2 m-2 rounded-lg px-4 py-2">
      <input
        type={type}
        ref={ref}
        placeholder={placeholder}
        onChange={onChange}
        className="outline-none w-full"
      />
    </div>
  );
});

export default Input;
