import { Card, CardContent } from "@/components/ui/card";
export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
          <p className="font-semibold text-gray-700">Segera hadir</p>
          <p className="text-sm">Modul ini sedang dalam pengembangan.</p>
        </CardContent>
      </Card>
    </div>
  );
}
