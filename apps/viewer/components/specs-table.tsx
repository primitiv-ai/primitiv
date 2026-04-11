"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import type { SpecRow } from "@/lib/load-specs";

type SortKey = "id" | "status" | "updatedAt";

interface SpecsTableProps {
  rows: SpecRow[];
}

export function SpecsTable({ rows }: SpecsTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDesc, setSortDesc] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? rows.filter(
          (row) => row.id.toLowerCase().includes(q) || row.title.toLowerCase().includes(q),
        )
      : rows;
    const sorted = [...matches].sort((a, b) => {
      const aVal = (a[sortKey] ?? "") as string;
      const bVal = (b[sortKey] ?? "") as string;
      return aVal.localeCompare(bVal);
    });
    return sortDesc ? sorted.reverse() : sorted;
  }, [rows, query, sortKey, sortDesc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortDesc(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Filter specs by ID or title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">
                <button
                  type="button"
                  onClick={() => toggleSort("id")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  ID <ArrowUpDown size={12} />
                </button>
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-40">
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Status <ArrowUpDown size={12} />
                </button>
              </TableHead>
              <TableHead className="w-48">Branch</TableHead>
              <TableHead className="w-40">
                <button
                  type="button"
                  onClick={() => toggleSort("updatedAt")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Updated <ArrowUpDown size={12} />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No specs match the filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/specs/${row.id}`} className="hover:underline">
                      {row.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/specs/${row.id}`} className="hover:underline">
                      {row.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.branch ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.updatedAt ? row.updatedAt.slice(0, 10) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
