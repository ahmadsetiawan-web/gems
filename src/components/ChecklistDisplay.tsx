"use client";

import { useState } from "react";

type Item = { label: string; jumlah: number };

export default function ChecklistDisplay({
  items,
  defaultVisible = 5,
}: {
  items: Item[];
  defaultVisible?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, defaultVisible);

  return (
    <div className="mt-2 text-sm text-slate-500">
      <p className="font-medium text-slate-600">Kelengkapan dibawa:</p>
      <ul className="list-inside list-disc">
        {visible.map((item, i) => (
          <li key={i}>
            {item.label} ({item.jumlah})
          </li>
        ))}
      </ul>
      {items.length > defaultVisible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-blue-600 hover:underline"
        >
          {expanded ? "Tampilkan lebih sedikit" : `Lihat semua (${items.length})`}
        </button>
      )}
    </div>
  );
}
