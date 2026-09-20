import {
  FaArrowTrendUp,
  FaClock,
  FaPeopleGroup,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { useQFlow, VISIT_STATUS } from "../../context/QFlowContext";

function Metric({ label, value, tone, icon: Icon }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-4 grid size-9 place-items-center rounded-lg ${tone}`}>
        <Icon aria-hidden="true" />
      </div>
      <p className="m-0 text-xs font-extrabold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="m-0 mt-1 text-3xl font-extrabold text-[#16324F]">{value}</p>
    </article>
  );
}

function FacilityOverview() {
  const { metrics, servicePoints, visits, getOrderedQueue, getWaitMinutes } =
    useQFlow();
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-10">
        <header className="mb-7 flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-teal-700">
              Facility command centre
            </p>
            <h1 className="m-0 text-3xl font-extrabold tracking-tight text-[#16324F]">
              Live facility overview
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Operational visibility across every independent service point.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-green-100 px-3 py-2 text-xs font-bold text-green-700 sm:self-auto">
            <span className="size-2 rounded-full bg-green-600" />
            Live updates enabled
          </span>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Total active"
            value={metrics.totalActive}
            tone="bg-teal-100 text-teal-700"
            icon={FaPeopleGroup}
          />
          <Metric
            label="Waiting"
            value={metrics.waiting}
            tone="bg-amber-100 text-amber-700"
            icon={FaClock}
          />
          <Metric
            label="Being served"
            value={metrics.serving}
            tone="bg-green-100 text-green-700"
            icon={FaArrowTrendUp}
          />
          <Metric
            label="Completed"
            value={metrics.completed}
            tone="bg-slate-100 text-slate-600"
            icon={FaPeopleGroup}
          />
        </div>
        <section
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="service-points-heading"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Queue health
              </p>
              <h2
                id="service-points-heading"
                className="m-0 text-xl font-extrabold text-[#16324F]"
              >
                Service points
              </h2>
            </div>
            <p className="m-0 text-xs text-slate-500">
              Congestion threshold: 3 waiting
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {servicePoints.map((point) => {
              const queue = getOrderedQueue(point.id);
              const wait = queue.length
                ? getWaitMinutes(queue[queue.length - 1])
                : 0;
              const congested = queue.length >= 3;
              const serving = visits.find(
                (visit) =>
                  visit.currentServicePointId === point.id &&
                  visit.currentStatus === VISIT_STATUS.SERVING,
              );
              return (
                <article
                  key={point.id}
                  className={`rounded-xl border p-4 ${congested ? "border-red-200 bg-red-50/40" : "border-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="m-0 font-extrabold text-[#16324F]">
                        {point.name}
                      </h3>
                      <p className="m-0 mt-1 text-sm text-slate-500">
                        {point.room} · {point.averageServiceMinutes} min average
                      </p>
                    </div>
                    {congested && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700">
                        <FaTriangleExclamation aria-hidden="true" />
                        Congested
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="m-0 text-2xl font-extrabold text-[#16324F]">
                        {queue.length}
                      </p>
                      <p className="m-0 text-[11px] text-slate-500">waiting</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="m-0 truncate text-sm font-bold text-[#16324F]">
                        {serving?.ticketNumber ?? "-"}
                      </p>
                      <p className="m-0 text-[11px] text-slate-500">
                        in service
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="m-0 text-2xl font-extrabold text-[#16324F]">
                        {wait}m
                      </p>
                      <p className="m-0 text-[11px] text-slate-500">
                        last wait
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="m-0 text-xl font-extrabold text-[#16324F]">
            Recent movement
          </h2>
          <div className="mt-4 divide-y divide-slate-100">
            {visits
              .slice(-5)
              .reverse()
              .map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <span className="font-extrabold text-[#16324F]">
                    {visit.ticketNumber}
                  </span>
                  <span className="text-slate-500">
                    {visit.visitedServicePointIds.length} service point
                    {visit.visitedServicePointIds.length === 1 ? "" : "s"}{" "}
                    visited
                  </span>
                  <span className="font-bold capitalize text-slate-600">
                    {visit.currentStatus}
                  </span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default FacilityOverview;
