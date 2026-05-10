import HelpdeskTickets from "@/components/modules/ict/HelpdeskTickets";

export default function TicketsPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">IT Helpdesk</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola tiket permintaan bantuan teknis IT</p>
      </div>
      <HelpdeskTickets />
    </div>
  );
}
