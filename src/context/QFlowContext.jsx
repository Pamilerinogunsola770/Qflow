import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

export const VISIT_STATUS = {
  WAITING: "waiting",
  CALLED: "called",
  SERVING: "serving",
  COMPLETED: "completed",
  SKIPPED: "skipped",
  CANCELLED: "cancelled",
};

export const PRIORITY = {
  NORMAL: "normal",
  URGENT: "urgent",
  EMERGENCY: "emergency",
};

const priorityRank = {
  [PRIORITY.EMERGENCY]: 0,
  [PRIORITY.URGENT]: 1,
  [PRIORITY.NORMAL]: 2,
};

const activeVisitStatuses = [
  VISIT_STATUS.WAITING,
  VISIT_STATUS.CALLED,
  VISIT_STATUS.SERVING,
];
const activeQueueStatuses = [VISIT_STATUS.WAITING];
const channelName = "qflow-live-actions";

const initialState = {
  servicePoints: [
    {
      id: "triage",
      name: "Triage",
      type: "triage",
      room: "Room 02",
      averageServiceMinutes: 15,
      available: true,
      activeVisitId: "visit-1001",
      activeQueue: ["queue-1002"],
    },
    {
      id: "consultation",
      name: "Consultation",
      type: "consultation",
      room: "Room 05",
      averageServiceMinutes: 20,
      available: true,
      activeVisitId: "visit-1003",
      activeQueue: ["queue-1004"],
    },
    {
      id: "lab",
      name: "Laboratory",
      type: "laboratory",
      room: "Room 07",
      averageServiceMinutes: 12,
      available: true,
      activeVisitId: null,
      activeQueue: [],
    },
    {
      id: "pharmacy",
      name: "Pharmacy",
      type: "pharmacy",
      room: "Counter 01",
      averageServiceMinutes: 8,
      available: true,
      activeVisitId: null,
      activeQueue: [],
    },
  ],
  visits: [
    {
      id: "visit-1001",
      patientName: "Amina Okafor",
      ticketNumber: "A-104",
      priority: PRIORITY.NORMAL,
      currentStatus: VISIT_STATUS.CALLED,
      currentServicePointId: "triage",
      checkedInAt: "2026-09-20T08:42:00.000Z",
      completedAt: null,
      visitedServicePointIds: ["triage"],
    },
    {
      id: "visit-1002",
      patientName: "Jon Bell",
      ticketNumber: "A-105",
      priority: PRIORITY.URGENT,
      currentStatus: VISIT_STATUS.WAITING,
      currentServicePointId: "triage",
      checkedInAt: "2026-09-20T08:47:00.000Z",
      completedAt: null,
      visitedServicePointIds: ["triage"],
    },
    {
      id: "visit-1003",
      patientName: "Maya Patel",
      ticketNumber: "B-021",
      priority: PRIORITY.NORMAL,
      currentStatus: VISIT_STATUS.SERVING,
      currentServicePointId: "consultation",
      checkedInAt: "2026-09-20T08:35:00.000Z",
      completedAt: null,
      visitedServicePointIds: ["triage", "consultation"],
    },
    {
      id: "visit-1004",
      patientName: "Theo Martin",
      ticketNumber: "B-022",
      priority: PRIORITY.EMERGENCY,
      currentStatus: VISIT_STATUS.WAITING,
      currentServicePointId: "consultation",
      checkedInAt: "2026-09-20T08:49:00.000Z",
      completedAt: null,
      visitedServicePointIds: ["triage", "consultation"],
    },
  ],
  queueEntries: [
    {
      id: "queue-1001",
      visitId: "visit-1001",
      servicePointId: "triage",
      priority: PRIORITY.NORMAL,
      status: VISIT_STATUS.CALLED,
      joinedAt: "2026-09-20T08:42:00.000Z",
      calledAt: "2026-09-20T08:53:00.000Z",
      serviceStartedAt: null,
      serviceEndedAt: null,
    },
    {
      id: "queue-1002",
      visitId: "visit-1002",
      servicePointId: "triage",
      priority: PRIORITY.URGENT,
      status: VISIT_STATUS.WAITING,
      joinedAt: "2026-09-20T08:47:00.000Z",
      calledAt: null,
      serviceStartedAt: null,
      serviceEndedAt: null,
    },
    {
      id: "queue-1003",
      visitId: "visit-1003",
      servicePointId: "consultation",
      priority: PRIORITY.NORMAL,
      status: VISIT_STATUS.SERVING,
      joinedAt: "2026-09-20T08:35:00.000Z",
      calledAt: "2026-09-20T08:56:00.000Z",
      serviceStartedAt: "2026-09-20T08:57:00.000Z",
      serviceEndedAt: null,
    },
    {
      id: "queue-1004",
      visitId: "visit-1004",
      servicePointId: "consultation",
      priority: PRIORITY.EMERGENCY,
      status: VISIT_STATUS.WAITING,
      joinedAt: "2026-09-20T08:49:00.000Z",
      calledAt: null,
      serviceStartedAt: null,
      serviceEndedAt: null,
    },
  ],
  logs: [],
};

const now = () => new Date().toISOString();
const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const visitFor = (state, visitId) =>
  state.visits.find((visit) => visit.id === visitId);
const servicePointFor = (state, servicePointId) =>
  state.servicePoints.find((point) => point.id === servicePointId);
const entryFor = (state, visitId, servicePointId) =>
  state.queueEntries.find(
    (entry) =>
      entry.visitId === visitId &&
      entry.servicePointId === servicePointId &&
      activeVisitStatuses.includes(entry.status),
  ) ??
  state.queueEntries.find(
    (entry) =>
      entry.visitId === visitId && entry.servicePointId === servicePointId,
  );
const updateById = (items, id, changes) =>
  items.map((item) => (item.id === id ? { ...item, ...changes } : item));
const without = (items, value) => items.filter((item) => item !== value);

function addLog(state, visitId, action, servicePointId, timestamp) {
  return {
    ...state,
    logs: [
      ...state.logs,
      {
        id: createId("log"),
        visitId,
        action,
        servicePointId,
        timestamp,
      },
    ],
  };
}

function updateServicePointQueue(servicePoints, servicePointId, activeQueue) {
  return servicePoints.map((point) =>
    point.id === servicePointId ? { ...point, activeQueue } : point,
  );
}

function updateServicePointOccupancy(
  servicePoints,
  servicePointId,
  activeVisitId,
) {
  return servicePoints.map((point) =>
    point.id === servicePointId ? { ...point, activeVisitId } : point,
  );
}

function orderedActiveQueue(state, servicePointId) {
  const point = servicePointFor(state, servicePointId);
  if (!point) return [];

  return point.activeQueue
    .map((entryId) =>
      entryFor(
        state,
        state.queueEntries.find((entry) => entry.id === entryId)?.visitId,
        servicePointId,
      ),
    )
    .filter((entry) => entry && activeQueueStatuses.includes(entry.status))
    .sort(
      (a, b) =>
        priorityRank[a.priority] - priorityRank[b.priority] ||
        a.joinedAt.localeCompare(b.joinedAt),
    );
}

function activeQueueContainsVisit(state, visitId) {
  return state.servicePoints.some((point) =>
    point.activeQueue.some((entryId) =>
      state.queueEntries.some(
        (entry) => entry.id === entryId && entry.visitId === visitId,
      ),
    ),
  );
}

function reducer(state, action) {
  const timestamp = now();

  switch (action.type) {
    case "CHECK_IN": {
      const point = servicePointFor(state, action.servicePointId);
      if (!point || !point.available || !action.patientName?.trim())
        return state;

      const visitId = createId("visit");
      const queueEntryId = createId("queue");
      const ticketNumber =
        action.ticketNumber?.trim() ||
        `Q-${String(state.visits.length + 101).padStart(3, "0")}`;
      const visit = {
        id: visitId,
        patientName: action.patientName.trim(),
        ticketNumber,
        priority: PRIORITY.NORMAL,
        currentStatus: VISIT_STATUS.WAITING,
        currentServicePointId: action.servicePointId,
        checkedInAt: timestamp,
        completedAt: null,
        visitedServicePointIds: [action.servicePointId],
      };
      const queueEntry = {
        id: queueEntryId,
        visitId,
        servicePointId: action.servicePointId,
        priority: PRIORITY.NORMAL,
        status: VISIT_STATUS.WAITING,
        joinedAt: timestamp,
        calledAt: null,
        serviceStartedAt: null,
        serviceEndedAt: null,
      };

      if (
        state.visits.some(
          (item) =>
            item.ticketNumber === ticketNumber &&
            activeVisitStatuses.includes(item.currentStatus),
        ) ||
        activeQueueContainsVisit(state, visitId)
      ) {
        return state;
      }

      const next = {
        ...state,
        visits: [...state.visits, visit],
        queueEntries: [...state.queueEntries, queueEntry],
        servicePoints: updateServicePointQueue(
          state.servicePoints,
          action.servicePointId,
          [...point.activeQueue, queueEntryId],
        ),
      };
      return addLog(
        next,
        visitId,
        "checked-in",
        action.servicePointId,
        timestamp,
      );
    }

    case "CALL_PATIENT": {
      const point = servicePointFor(state, action.servicePointId);
      if (!point || !point.available || point.activeVisitId) return state;

      const orderedQueue = orderedActiveQueue(state, action.servicePointId);
      const entry = action.visitId
        ? orderedQueue.find((item) => item.visitId === action.visitId)
        : orderedQueue[0];
      if (!entry) return state;

      const visit = visitFor(state, entry.visitId);
      if (!visit || visit.currentStatus !== VISIT_STATUS.WAITING) return state;

      const next = {
        ...state,
        visits: updateById(state.visits, entry.visitId, {
          currentStatus: VISIT_STATUS.CALLED,
        }),
        queueEntries: updateById(state.queueEntries, entry.id, {
          status: VISIT_STATUS.CALLED,
          calledAt: timestamp,
        }),
        servicePoints: updateServicePointOccupancy(
          updateServicePointQueue(
            state.servicePoints,
            action.servicePointId,
            without(point.activeQueue, entry.id),
          ),
          action.servicePointId,
          entry.visitId,
        ),
      };
      return addLog(
        next,
        entry.visitId,
        "called",
        action.servicePointId,
        timestamp,
      );
    }

    case "START_SERVICE": {
      const point = servicePointFor(state, action.servicePointId);
      const visit = visitFor(state, action.visitId);
      const entry = entryFor(state, action.visitId, action.servicePointId);
      if (
        !point ||
        !visit ||
        !entry ||
        point.activeVisitId !== action.visitId ||
        visit.currentStatus !== VISIT_STATUS.CALLED ||
        entry.status !== VISIT_STATUS.CALLED
      ) {
        return state;
      }

      const next = {
        ...state,
        visits: updateById(state.visits, action.visitId, {
          currentStatus: VISIT_STATUS.SERVING,
        }),
        queueEntries: updateById(state.queueEntries, entry.id, {
          status: VISIT_STATUS.SERVING,
          serviceStartedAt: timestamp,
        }),
      };
      return addLog(
        next,
        action.visitId,
        "service-started",
        action.servicePointId,
        timestamp,
      );
    }

    case "UPDATE_PRIORITY": {
      if (!Object.values(PRIORITY).includes(action.priority)) return state;
      const visit = visitFor(state, action.visitId);
      const entry = entryFor(state, action.visitId, action.servicePointId);
      if (
        !visit ||
        !entry ||
        ![VISIT_STATUS.WAITING, VISIT_STATUS.CALLED].includes(
          visit.currentStatus,
        )
      ) {
        return state;
      }

      const next = {
        ...state,
        visits: updateById(state.visits, action.visitId, {
          priority: action.priority,
        }),
        queueEntries: updateById(state.queueEntries, entry.id, {
          priority: action.priority,
        }),
      };
      return addLog(
        next,
        action.visitId,
        "priority-updated",
        action.servicePointId,
        timestamp,
      );
    }

    case "ROUTE_PATIENT": {
      const visit = visitFor(state, action.visitId);
      const currentPoint = servicePointFor(
        state,
        action.currentSpId ?? action.fromServicePointId,
      );
      const nextPoint = servicePointFor(
        state,
        action.nextSpId ?? action.toServicePointId,
      );
      const currentServicePointId =
        action.currentSpId ?? action.fromServicePointId;
      const nextServicePointId = action.nextSpId ?? action.toServicePointId;
      const currentEntry = entryFor(
        state,
        action.visitId,
        currentServicePointId,
      );

      if (
        !visit ||
        !currentPoint ||
        !nextPoint ||
        !currentEntry ||
        currentPoint.id === nextPoint.id ||
        !nextPoint.available ||
        ![VISIT_STATUS.CALLED, VISIT_STATUS.SERVING].includes(
          visit.currentStatus,
        ) ||
        ![VISIT_STATUS.CALLED, VISIT_STATUS.SERVING].includes(
          currentEntry.status,
        ) ||
        (currentPoint.activeVisitId &&
          currentPoint.activeVisitId !== action.visitId) ||
        activeQueueContainsVisit(state, action.visitId)
      ) {
        return state;
      }

      const nextEntry = {
        id: createId("queue"),
        visitId: action.visitId,
        servicePointId: nextServicePointId,
        priority: visit.priority,
        status: VISIT_STATUS.WAITING,
        joinedAt: timestamp,
        calledAt: null,
        serviceStartedAt: null,
        serviceEndedAt: null,
      };
      const next = {
        ...state,
        visits: updateById(state.visits, action.visitId, {
          currentStatus: VISIT_STATUS.WAITING,
          currentServicePointId: nextServicePointId,
          visitedServicePointIds: [
            ...new Set([...visit.visitedServicePointIds, nextServicePointId]),
          ],
        }),
        queueEntries: [
          ...updateById(state.queueEntries, currentEntry.id, {
            status: VISIT_STATUS.COMPLETED,
            serviceEndedAt: timestamp,
          }),
          nextEntry,
        ],
        servicePoints: updateServicePointOccupancy(
          updateServicePointQueue(
            updateServicePointQueue(
              state.servicePoints,
              currentServicePointId,
              without(currentPoint.activeQueue, currentEntry.id),
            ),
            nextServicePointId,
            [...nextPoint.activeQueue, nextEntry.id],
          ),
          currentServicePointId,
          null,
        ),
      };
      return addLog(
        next,
        action.visitId,
        "routed",
        nextServicePointId,
        timestamp,
      );
    }

    case "COMPLETE_VISIT": {
      const point = servicePointFor(state, action.servicePointId);
      const visit = visitFor(state, action.visitId);
      const entry = entryFor(state, action.visitId, action.servicePointId);
      if (
        !point ||
        !visit ||
        !entry ||
        point.activeVisitId !== action.visitId ||
        visit.currentStatus !== VISIT_STATUS.SERVING ||
        entry.status !== VISIT_STATUS.SERVING
      ) {
        return state;
      }

      const next = {
        ...state,
        visits: updateById(state.visits, action.visitId, {
          currentStatus: VISIT_STATUS.COMPLETED,
          completedAt: timestamp,
        }),
        queueEntries: updateById(state.queueEntries, entry.id, {
          status: VISIT_STATUS.COMPLETED,
          serviceEndedAt: timestamp,
        }),
        servicePoints: updateServicePointOccupancy(
          updateServicePointQueue(
            state.servicePoints,
            action.servicePointId,
            without(point.activeQueue, entry.id),
          ),
          action.servicePointId,
          null,
        ),
      };
      return addLog(
        next,
        action.visitId,
        "completed",
        action.servicePointId,
        timestamp,
      );
    }

    case "SKIP_PATIENT":
    case "CANCEL_VISIT": {
      const point = servicePointFor(state, action.servicePointId);
      const visit = visitFor(state, action.visitId);
      const entry = entryFor(state, action.visitId, action.servicePointId);
      const status =
        action.type === "SKIP_PATIENT"
          ? VISIT_STATUS.SKIPPED
          : VISIT_STATUS.CANCELLED;
      if (
        !point ||
        !visit ||
        !entry ||
        ![VISIT_STATUS.WAITING, VISIT_STATUS.CALLED].includes(
          visit.currentStatus,
        ) ||
        entry.status !== visit.currentStatus
      ) {
        return state;
      }

      const next = {
        ...state,
        visits: updateById(state.visits, action.visitId, {
          currentStatus: status,
          completedAt: timestamp,
        }),
        queueEntries: updateById(state.queueEntries, entry.id, {
          status,
          serviceEndedAt: timestamp,
        }),
        servicePoints: updateServicePointOccupancy(
          updateServicePointQueue(
            state.servicePoints,
            action.servicePointId,
            without(point.activeQueue, entry.id),
          ),
          action.servicePointId,
          visit.currentStatus === VISIT_STATUS.CALLED
            ? null
            : point.activeVisitId,
        ),
      };
      return addLog(
        next,
        action.visitId,
        status,
        action.servicePointId,
        timestamp,
      );
    }

    default:
      return state;
  }
}

const QFlowContext = createContext(null);

export function QFlowProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const channelRef = useRef(null);
  const sourceId = useRef(createId("tab"));

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return undefined;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      if (event.data?.sourceId !== sourceId.current && event.data?.action) {
        dispatch(event.data.action);
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const send = (action) => {
    dispatch(action);
    channelRef.current?.postMessage({ sourceId: sourceId.current, action });
  };

  const value = useMemo(() => {
    const getServicePoint = (servicePointId) =>
      servicePointFor(state, servicePointId);
    const getVisit = (visitId) => visitFor(state, visitId);
    const getOrderedQueue = (servicePointId) =>
      orderedActiveQueue(state, servicePointId).map((entry) => ({
        ...entry,
        visit: getVisit(entry.visitId),
      }));
    const getQueuePosition = (visitId, servicePointId) => {
      const queue = getOrderedQueue(servicePointId);
      const entry = queue.find((item) => item.visitId === visitId);
      return entry ? queue.findIndex((item) => item.id === entry.id) : -1;
    };
    const getWaitMinutes = (entryOrVisitId, servicePointId) => {
      const visitId =
        typeof entryOrVisitId === "string"
          ? entryOrVisitId
          : entryOrVisitId.visitId;
      const visit = getVisit(visitId);
      const resolvedServicePointId =
        servicePointId ?? visit?.currentServicePointId;
      if (!resolvedServicePointId) return 0;
      const position = getQueuePosition(visitId, resolvedServicePointId);
      return position < 0
        ? 0
        : position *
            (getServicePoint(resolvedServicePointId)?.averageServiceMinutes ??
              0);
    };
    const activeVisits = state.visits.filter((visit) =>
      activeVisitStatuses.includes(visit.currentStatus),
    );
    const metrics = {
      totalActive: activeVisits.length,
      waiting: state.visits.filter(
        (visit) => visit.currentStatus === VISIT_STATUS.WAITING,
      ).length,
      serving: state.visits.filter(
        (visit) => visit.currentStatus === VISIT_STATUS.SERVING,
      ).length,
      completed: state.visits.filter(
        (visit) => visit.currentStatus === VISIT_STATUS.COMPLETED,
      ).length,
    };

    return {
      ...state,
      metrics,
      getServicePoint,
      getVisit,
      getOrderedQueue,
      getQueuePosition,
      getWaitMinutes,
      checkInPatient: (patient) => send({ type: "CHECK_IN", ...patient }),
      callPatient: (servicePointId, visitId) =>
        send({ type: "CALL_PATIENT", servicePointId, visitId }),
      startService: (servicePointId, visitId) =>
        send({ type: "START_SERVICE", servicePointId, visitId }),
      updatePriority: (servicePointId, visitId, priority) =>
        send({ type: "UPDATE_PRIORITY", servicePointId, visitId, priority }),
      routePatient: (visitId, currentSpId, nextSpId) =>
        send({ type: "ROUTE_PATIENT", visitId, currentSpId, nextSpId }),
      completeVisit: (servicePointId, visitId) =>
        send({ type: "COMPLETE_VISIT", servicePointId, visitId }),
      skipPatient: (servicePointId, visitId) =>
        send({ type: "SKIP_PATIENT", servicePointId, visitId }),
      cancelVisit: (servicePointId, visitId) =>
        send({ type: "CANCEL_VISIT", servicePointId, visitId }),
    };
  }, [state]);

  return (
    <QFlowContext.Provider value={value}>{children}</QFlowContext.Provider>
  );
}

export function useQFlow() {
  const context = useContext(QFlowContext);
  if (!context) throw new Error("useQFlow must be used within a QFlowProvider");
  return context;
}
