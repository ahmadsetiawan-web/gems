import { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function Input({ label, id, name, ...props }: InputProps) {
  const inputId = id ?? name;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-slate-900"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className="mt-1 w-full rounded-lg border-2 border-slate-900 px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/50"
        {...props}
      />
    </div>
  );
}
