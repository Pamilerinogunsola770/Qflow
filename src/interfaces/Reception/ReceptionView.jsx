import { useMemo, useState } from "react";
import { FaMagnifyingGlass, FaUserPlus } from "react-icons/fa6";
import { PRIORITY, useQFlow, VISIT_STATUS } from "../../context/QFlowContext";

const statusStyles = {
  waiting: "bg-amber-100 text-amber-800",
  called: "bg-blue-100 text-blue-800",
  serving: "bg-green-100 text-green-800",
  completed: "bg-slate-100 text-slate-600",
};

function ReceptionView() {
  const { visits, servicePoints, checkInPatient } = useQFlow();
  const [name, setName] = useState("");
  const [servicePointId, setServicePointId] = useState("triage");
  const [search, setSearch] = useState("");
  const [lastTicket, setLastTicket] = useState("");
  const activeVisits = visits.filter(
    (visit) =>
      visit.currentStatus !== VISIT_STATUS.COMPLETED &&
      visit.currentStatus !== VISIT_STATUS.CANCELLED &&
      visit.currentStatus !== VISIT_STATUS.SKIPPED,
  );
  const filteredVisits = useMemo(
    () =>
      activeVisits.filter((visit) =>
        `${visit.ticketNumber} ${visit.patientName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [activeVisits, search],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    const ticket = `Q-${String(visits.length + 101).padStart(3, "0")}`;
    checkInPatient({
      patientName: name,
      servicePointId,
      ticketNumber: ticket,
      priority: PRIORITY.NORMAL,
    });
    setLastTicket(ticket);
    setName("");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-10">
        <header className="mb-7 border-b border-slate-200 pb-6">
          <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-teal-700">
            Front desk
          </p>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-[#16324F]">
            Reception
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Check patients in and locate their current visit without exposing
            clinical information.
          </p>
        </header>
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            aria-labelledby="check-in-heading"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-teal-100 text-teal-700">
                <FaUserPlus aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="check-in-heading"
                  className="m-0 text-lg font-extrabold text-[#16324F]"
                >
                  Manual check-in
                </h2>
                <p className="m-0 mt-1 text-xs text-slate-500">
                  Priority is confirmed by care staff.
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">
                Patient name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  placeholder="Enter patient name"
                  required
                />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                First service point
                <select
                  value={servicePointId}
                  onChange={(event) => setServicePointId(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
                >
                  <option value="">Choose service point</option>
                  {servicePoints.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name} · {point.room}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="w-full rounded-lg bg-teal-700 px-4 py-3 font-bold text-white hover:bg-teal-800"
              >
                Check in patient
              </button>
            </form>
            {lastTicket && (
              <p className="mt-5 rounded-lg bg-teal-50 p-4 text-sm text-teal-900">
                Checked in successfully. Ticket <strong>{lastTicket}</strong> is
                ready.
              </p>
            )}
          </section>
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            aria-labelledby="active-visits-heading"
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-slate-500">
                  Today
                </p>
                <h2
                  id="active-visits-heading"
                  className="m-0 text-lg font-extrabold text-[#16324F]"
                >
                  Active visits{" "}
                  <span className="text-sm font-semibold text-slate-400">
                    {activeVisits.length}
                  </span>
                </h2>
              </div>
              <label className="relative block sm:w-64">
                <FaMagnifyingGlass
                  className="absolute left-3 top-3.5 text-slate-400"
                  aria-hidden="true"
                />
                <span className="sr-only">Search active visits</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-700"
                  placeholder="Search ticket or name"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-155 text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-bold">Ticket</th>
                    <th className="px-3 py-3 font-bold">Patient</th>
                    <th className="px-3 py-3 font-bold">Current stage</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVisits.map((visit) => {
                    const point = servicePoints.find(
                      (item) => item.id === visit.currentServicePointId,
                    );
                    return (
                      <tr key={visit.id}>
                        <td className="px-3 py-3 font-extrabold text-[#16324F]">
                          {visit.ticketNumber}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {visit.patientName}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {point?.name ?? "Unknown"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[visit.currentStatus] ?? statusStyles.completed}`}
                          >
                            {visit.currentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredVisits.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-500">
                  No visits match this search.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default ReceptionView;
