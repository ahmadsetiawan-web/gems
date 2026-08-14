"use client";

import Button from "@/components/ui/Button";

export default function PrintButton() {
  return (
    <Button onClick={() => window.print()}>Cetak / Print</Button>
  );
}
