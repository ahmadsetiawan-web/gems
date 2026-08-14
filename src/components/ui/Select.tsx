import { type SelectHTMLAttributes, type ReactNode } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
};

export default function Select({
  label,
  id,
  name,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? name;

  return (
    <div>
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
