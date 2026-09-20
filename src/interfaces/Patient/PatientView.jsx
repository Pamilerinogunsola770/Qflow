import {
  FaCheck,
  FaClock,
  FaLocationDot,
  FaPersonWalking,
  FaStethoscope,
} from "react-icons/fa6";
import { useQFlow, VISIT_STATUS } from "../../context/QFlowContext";

function PatientView({ visitId = "visit-1001" }) {
  const { visits, getServicePoint, getOrderedQueue, getWaitMinutes } =
    useQFlow();
  const visit = visits.find((item) => item.id === visitId) ?? visits[0];
  const servicePoint = visit
    ? getServicePoint(visit.currentServicePointId)
    : null;
  const queue = visit ? getOrderedQueue(visit.currentServicePointId) : [];
  const queueEntry = queue.find((entry) => entry.visitId === visit?.id);
  const peopleAhead = queueEntry
    ? queue.findIndex((entry) => entry.id === queueEntry.id)
    : 0;
  const waitMinutes = queueEntry ? getWaitMinutes(queueEntry) : 0;
  const isCalled = visit?.currentStatus === VISIT_STATUS.CALLED;
  const isServing = visit?.currentStatus === VISIT_STATUS.SERVING;

  if (!visit)
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        No active visit found.
      </main>
    );

  const statusLabel = isCalled
    ? "Called - proceed now"
    : isServing
      ? "Being served"
      : visit.currentStatus[0].toUpperCase() + visit.currentStatus.slice(1);
  const statusMessage = isCalled
    ? `Please proceed to ${servicePoint?.room ?? "the service desk"} now.`
    : isServing
      ? "Your care team is with you now."
      : "We will call your ticket when it is your turn.";

  return (
    <main className="min-h-screen bg-slate-50 font-[Trebuchet_MS,Segoe_UI,sans-serif] text-slate-900">
      <div className="mx-auto min-h-screen w-full max-w-190 bg-white px-5 py-6 sm:px-14 sm:py-7">
        <header className="flex items-center gap-3 border-b border-slate-200 pb-5">
          <div
            className="grid size-10.5 place-items-center rounded-xl bg-teal-700 text-[22px] font-extrabold text-white"
            aria-hidden="true"
          >
            Q
          </div>
          <div>
            <p className="m-0 text-xs font-extrabold uppercase tracking-[0.09em] text-slate-500">
              Patient queue
            </p>
            <p className="m-0 mt-0.5 text-sm font-bold text-[#16324F]">
              Riverside Health Centre
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-extrabold text-green-600">
            <span
              className="size-2 rounded-full bg-green-600"
              aria-hidden="true"
            />
            Live
          </span>
        </header>

        <section
          className="px-0 pb-7 pt-11 text-center"
          aria-labelledby="patient-ticket-heading"
        >
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.09em] text-slate-500">
            Your ticket
          </p>
          <h1
            id="patient-ticket-heading"
            className="m-1 text-[clamp(76px,19vw,148px)] font-extrabold leading-[0.95] tracking-[-0.06em] text-[#16324F]"
          >
            {visit.ticketNumber}
          </h1>
          <p className="m-0 mt-3.5 text-lg text-slate-500">
            Hello, {visit.patientName.split(" ")[0]}
          </p>
        </section>

        <section
          className={`flex items-center gap-4 rounded-2xl border p-5 ${isCalled ? "border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgb(37_99_235/18%)]" : "border-sky-200 bg-blue-50 text-blue-900"}`}
          aria-live="polite"
          aria-label={`Visit status: ${statusLabel}`}
        >
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-white/70 text-[22px]">
            {isCalled ? (
              <FaPersonWalking aria-hidden="true" />
            ) : isServing ? (
              <FaStethoscope aria-hidden="true" />
            ) : (
              <FaClock aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="m-0 text-[22px] font-extrabold max-[480px]:text-[19px]">
              {statusLabel}
            </p>
            <p className="m-0 mt-1 text-[15px] leading-[1.45]">
              {statusMessage}
            </p>
          </div>
        </section>

        <section
          className="border-b border-slate-200 py-7"
          aria-label="Visit details"
        >
          <div className="flex items-center gap-3.5">
            <span className="grid size-10.5 shrink-0 place-items-center rounded-xl bg-teal-100 text-2xl font-bold text-teal-700">
              <FaLocationDot aria-hidden="true" />
            </span>
            <div>
              <p className="m-0 text-xs font-extrabold uppercase tracking-[0.09em] text-slate-500">
                Where to go
              </p>
              <p className="m-0 mt-0.5 text-xl font-extrabold text-slate-900">
                {servicePoint?.name ?? "Care team"}
              </p>
              <p className="m-0 mt-0.5 text-sm text-slate-500">
                {servicePoint?.room ?? "Please ask at reception"}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="m-0 text-xs font-extrabold uppercase tracking-[0.09em] text-slate-500">
                People ahead
              </p>
              <p className="m-0 mt-1 text-[32px] font-extrabold leading-tight text-[#16324F]">
                {peopleAhead}
              </p>
              <p className="m-0 mt-0.5 text-sm text-slate-500">
                {peopleAhead === 1 ? "person" : "people"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="m-0 text-xs font-extrabold uppercase tracking-[0.09em] text-slate-500">
                Estimated wait
              </p>
              <p className="m-0 mt-1 text-[32px] font-extrabold leading-tight text-[#16324F]">
                {waitMinutes === 0 ? "Now" : `${waitMinutes} min`}
              </p>
              <p className="m-0 mt-0.5 text-sm text-slate-500">
                Based on live queue
              </p>
            </div>
          </div>
        </section>

        <section
          className="flex items-start gap-3.5 py-7"
          aria-labelledby="patient-next-step"
        >
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-green-100 text-xl font-black text-green-600">
            <FaCheck aria-hidden="true" />
          </div>
          <div>
            <p className="m-0 text-xs font-extrabold uppercase tracking-[0.09em] text-slate-500">
              What next?
            </p>
            <h2
              id="patient-next-step"
              className="m-1 text-[21px] text-slate-900"
            >
              {isCalled ? "Walk to your service point" : "Stay nearby"}
            </h2>
            <p className="m-0 text-[15px] leading-6 text-slate-500">
              {isCalled
                ? `Show ticket ${visit.ticketNumber} when you arrive.`
                : "Keep this page open. We will update you when your turn is called."}
            </p>
          </div>
        </section>
        <footer className="flex justify-between gap-4 border-t border-slate-200 pt-5 text-xs text-slate-500 max-[480px]:flex-col">
          <p className="m-0">Need help? Ask at reception.</p>
          <p className="m-0">Ticket {visit.ticketNumber} is live</p>
        </footer>
      </div>
    </main>
  );
}

export default PatientView;
