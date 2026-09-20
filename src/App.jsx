import { useState } from "react";
import FacilityOverview from "./interfaces/Overview/FacilityOverview";
import PatientView from "./interfaces/Patient/PatientView";
import ReceptionView from "./interfaces/Reception/ReceptionView";
import StaffView from "./interfaces/Staff/StaffView";

function App() {
  const [view, setView] = useState("patient");

  const views = {
    patient: <PatientView />,
    staff: <StaffView />,
    reception: <ReceptionView />,
    overview: <FacilityOverview />,
  };

  return (
    <>
      <nav
        className="fixed right-4 top-4 z-10 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        aria-label="Prototype views"
      >
        {Object.keys(views).map((viewName) => (
          <button
            key={viewName}
            type="button"
            onClick={() => setView(viewName)}
            className={`rounded-md px-3 py-2 text-xs font-bold capitalize ${view === viewName ? "bg-teal-700 text-white" : "text-slate-600"}`}
          >
            {viewName}
          </button>
        ))}
      </nav>
      {views[view]}
    </>
  );
}

export default App;
