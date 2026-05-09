import Topbar from "@/components/shared/Topbar";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Laporan" />
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <p className="font-medium">Modul Laporan</p>
            <p className="text-sm">Segera hadir — Instruksi berikutnya akan melengkapi modul ini.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
