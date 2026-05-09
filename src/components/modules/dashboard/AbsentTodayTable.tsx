"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserX } from "lucide-react";

type AbsentRecord = {
  id: string;
  name: string;
  classroom: string;
  status: "SAKIT" | "IZIN" | "ALFA";
  notes: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  SAKIT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IZIN: "bg-blue-100 text-blue-800 border-blue-200",
  ALFA: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  SAKIT: "Sakit",
  IZIN: "Izin",
  ALFA: "Alfa",
};

export default function AbsentTodayTable() {
  const [data, setData] = useState<AbsentRecord[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/absent-today")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData([]));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">Siswa Tidak Hadir Hari Ini</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {data === null ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <UserX className="h-8 w-8 opacity-30" />
            <p className="text-sm">Semua siswa hadir hari ini!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.classroom}</p>
                </div>
                <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_STYLES[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
