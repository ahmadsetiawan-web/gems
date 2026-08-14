import { type ReactNode } from "react";

type AlertProps = {
  variant: "success" | "error" | "warning" | "info";
  children: ReactNode;
};

const variantStyles: Record<AlertProps["variant"], string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function Alert({ variant, children }: AlertProps) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${variantStyles[variant]}`}>
      {children}
    </div>
  );
}
