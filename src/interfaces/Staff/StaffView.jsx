import { useState } from "react";
import {
  FaArrowRight,
  FaCheck,
  FaPhone,
  FaPlay,
  FaRoute,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { PRIORITY, useQFlow, VISIT_STATUS } from "../../context/QFlowContext";

const priorityStyles = {
  [PRIORITY.NORMAL]: "bg-slate-100 text-slate-600",
  [PRIORITY.URGENT]: "bg-amber-100 text-amber-800",
  [PRIORITY.EMERGENCY]: "bg-red-100 text-red-700",
};

function StaffView({ defaultServicePointId = "triage" }) {
  const [servicePointId, setServicePointId] = useState(defaultServicePointId);
  const [routeTarget, setRouteTarget] = useState("");
  const {
    servicePoints,
    visits,
    getServicePoint,
    getOrderedQueue,
    getWaitMinutes,
    callPatient,
    startService,
    completeVisit,
    routePatient,
  } = useQFlow();
  const servicePoint = getServicePoint(servicePointId);
  const waitingQueue = getOrderedQueue(servicePointId);
  const currentVisit = visits.find(
    (visit) =>
      visit.currentServicePointId === servicePointId &&
      [VISIT_STATUS.CALLED, VISIT_STATUS.SERVING].includes(visit.currentStatus),
  );

  const handleRoute = () => {
    if (currentVisit && routeTarget) {
      routePatient(currentVisit.id, servicePointId, routeTarget);
      setRouteTarget("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-10">
        <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.12em] text-teal-700">
              QFlow operations
            </p>
            <h1 className="m-0 text-3xl font-extrabold tracking-tight text-[#16324F]">
              Service point dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Move patients through {servicePoint?.name ?? "your service point"}{" "}
              without losing the queue.
            </p>
          </div>
          <label className="flex min-w-52 flex-col gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            Service point
            <select
              value={servicePointId}
              onChange={(event) => setServicePointId(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            >
              {servicePoints.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.name} · {point.room}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            aria-labelledby="current-patient-heading"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-slate-500">
                  Now at {servicePoint?.room}
                </p>
                <h2
                  id="current-patient-heading"
                  className="m-0 text-xl font-extrabold text-[#16324F]"
                >
                  Current patient
                </h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                <span className="size-2 rounded-full bg-green-600" />
                Live
              </span>
            </div>
            {currentVisit ? (
              <div className="rounded-xl bg-[#16324F] p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-300">
                      {currentVisit.patientName}
                    </p>
                    <p className="mt-1 text-5xl font-extrabold tracking-tight">
                      {currentVisit.ticketNumber}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${priorityStyles[currentVisit.priority]}`}
                  >
                    {currentVisit.priority}
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      startService(servicePointId, currentVisit.id)
                    }
                    disabled={
                      currentVisit.currentStatus === VISIT_STATUS.SERVING
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                  >
                    <FaPlay aria-hidden="true" />
                    Start service
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      completeVisit(servicePointId, currentVisit.id)
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                  >
                    <FaCheck aria-hidden="true" />
                    Complete
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid min-h-48 place-items-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
                <FaPhone
                  className="mb-3 text-2xl text-slate-400"
                  aria-hidden="true"
                />
                <p className="font-bold text-slate-700">
                  No patient at this service point
                </p>
              </div>
            )}
            {currentVisit && (
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Route to
                  <select
                    value={routeTarget}
                    onChange={(event) => setRouteTarget(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-900"
                  >
                    <option value="">Choose next service point</option>
                    {servicePoints
                      .filter((point) => point.id !== servicePointId)
                      .map((point) => (
                        <option key={point.id} value={point.id}>
                          {point.name} · {point.room}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleRoute}
                  disabled={!routeTarget}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-teal-700 px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                >
                  <FaRoute aria-hidden="true" />
                  Route patient
                </button>
              </div>
            )}
          </section>

          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            aria-labelledby="waiting-queue-heading"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-amber-700">
                  Ordered by priority
                </p>
                <h2
                  id="waiting-queue-heading"
                  className="m-0 text-xl font-extrabold text-[#16324F]"
                >
                  Waiting queue
                </h2>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-800">
                {waitingQueue.length} waiting
              </span>
            </div>
            <div className="space-y-3">
              {waitingQueue.length === 0 && (
                <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
                  Queue is clear.
                </p>
              )}
              {waitingQueue.map((entry, index) => (
                <article
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-500">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-extrabold text-slate-900">
                        {entry.visit.ticketNumber}
                      </p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${priorityStyles[entry.visit.priority]}`}
                      >
                        {entry.visit.priority}
                      </span>
                    </div>
                    <p className="truncate text-sm text-slate-500">
                      {entry.visit.patientName} · {getWaitMinutes(entry)} min
                      estimated
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <FaTriangleExclamation
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>
                Estimated wait = patients ahead ×{" "}
                {servicePoint?.averageServiceMinutes ?? 0} minute average
                service time.
              </span>
            </div>
          </section>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
          <FaArrowRight aria-hidden="true" />
          Actions update the shared QFlow state immediately for patient,
          reception, and overview views.
        </div>
      </div>
    </main>
  );
}

export default StaffView;
