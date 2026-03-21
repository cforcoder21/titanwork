import cors from "cors";
import express from "express";
import {
  ambulances as ambulanceSeed,
  hospitals as hospitalSeed,
  incidents as incidentSeed,
  createIncidentRecord,
  cycleStatusByTick,
  randomInRange
} from "../src/data/simulate.js";

const app = express();
const PORT = Number(process.env.PORT || 3002);

app.use(cors());
app.use(express.json());

const clone = (value) => JSON.parse(JSON.stringify(value));

let ambulances = clone(ambulanceSeed);
let hospitals = clone(hospitalSeed);
let incidents = clone(incidentSeed);
let incidentCounter = 1;

async function fetchRoadRoute(start, end) {
  const query = `${start[1]},${start[0]};${end[1]},${end[0]}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${query}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Routing service unavailable");
  const data = await response.json();
  const coordinates = data?.routes?.[0]?.geometry?.coordinates;
  if (!coordinates?.length) throw new Error("No route geometry returned");
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchRoadRouteWithRetry(start, end, retries = 2) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fetchRoadRoute(start, end);
    } catch {
      if (attempt === retries) {
        throw new Error("Road route fetch failed after retries");
      }
      // Small backoff prevents transient OSRM/network failures causing straight-line fallback.
      await sleep(180 * (attempt + 1));
    }
    attempt += 1;
  }

  throw new Error("Road route fetch failed");
}

function pathLength(path) {
  if (!path || path.length < 2) return 0;
  let total = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const [latA, lngA] = path[index];
    const [latB, lngB] = path[index + 1];
    total += Math.hypot(latB - latA, lngB - lngA);
  }
  return total;
}

function currentState() {
  return {
    ambulances,
    hospitals,
    incidents
  };
}

setInterval(() => {
  const tick = Math.floor(Date.now() / 1000);
  ambulances = ambulances.map((unit, index) => {
    const driftLat = randomInRange(-0.0012, 0.0012);
    const driftLng = randomInRange(-0.0012, 0.0012);
    const speed = Math.max(35, Math.min(72, unit.speed + Math.floor(randomInRange(-3, 4))));
    return {
      ...unit,
      lat: unit.lat + driftLat,
      lng: unit.lng + driftLng,
      speed,
      status: cycleStatusByTick(index, tick),
      heading: (unit.heading + Math.floor(randomInRange(-10, 11)) + 360) % 360
    };
  });
}, 2000);

setInterval(() => {
  hospitals = hospitals.map((hospital) => ({
    ...hospital,
    beds: Math.max(0, Math.min(24, hospital.beds + Math.floor(randomInRange(-1, 2)))),
    icuBeds: Math.max(0, Math.min(6, hospital.icuBeds + Math.floor(randomInRange(-1, 2)))),
    erBays: Math.max(1, Math.min(5, hospital.erBays + Math.floor(randomInRange(-1, 2))))
  }));
}, 15000);

setInterval(() => {
  incidents = incidents.map((incident) => ({
    ...incident,
    eta: Math.max(0, incident.eta - 1)
  }));
}, 1000);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "smart-emergency-response-backend" });
});

app.get("/api/state", (_req, res) => {
  res.json(currentState());
});

app.post("/api/incidents", async (req, res) => {
  const { emergencyType, patientLocation } = req.body || {};

  if (!emergencyType?.id || !emergencyType?.label || !emergencyType?.priority) {
    res.status(400).json({ error: "Invalid emergencyType payload" });
    return;
  }

  const next = createIncidentRecord(emergencyType, ambulances, hospitals, incidentCounter, patientLocation);
  incidentCounter += 1;

  let roadRoute = next.route;
  let pickupRatio = 0.5;
  try {
    const firstLeg = await fetchRoadRouteWithRetry(next.route[0], next.route[1]);
    const secondLeg = await fetchRoadRouteWithRetry(next.route[1], next.route[2]);
    const merged = [...firstLeg, ...secondLeg.slice(1)];
    if (merged.length > 2) {
      roadRoute = merged;
      const firstLegLength = pathLength(firstLeg);
      const secondLegLength = pathLength(secondLeg);
      const totalLength = firstLegLength + secondLegLength;
      pickupRatio = totalLength === 0 ? 0.5 : firstLegLength / totalLength;
    }
  } catch {
    roadRoute = next.route;
    pickupRatio = 0.5;
  }

  incidents = [
    {
      ...next.incident,
      roadRoute,
      pickupRatio,
      route: next.route
    },
    ...incidents
  ];

  hospitals = hospitals.map((hospital) =>
    hospital.name === next.assignedHospital.name
      ? {
          ...hospital,
          beds: Math.max(0, hospital.beds - 1),
          incoming: hospital.incoming + 1
        }
      : hospital
  );

  ambulances = ambulances.map((unit) =>
    unit.name === next.assignedUnit.name
      ? {
          ...unit,
          status: "dispatched",
          speed: Math.max(unit.speed, 48)
        }
      : unit
  );

  const dispatch = {
    incidentId: next.incident.id,
    ambulanceId: next.assignedUnit.name,
    dispatchedAt: Date.now(),
    etaMinutes: Math.ceil(next.incident.initialEta / 60),
    initialEtaSeconds: next.incident.initialEta,
    hospitalName: next.assignedHospital.name,
    hospitalDistanceBand: next.incident.hospitalDistanceBand,
    distanceKm: next.incident.distanceKm,
    driverName: next.assignedUnit.driver,
    conductorName: next.assignedUnit.conductor,
    medicalSupportName: next.assignedUnit.medicalSupport,
    supportContacts: {
      conductor: next.assignedUnit.conductorContact,
      medicalSupport: next.assignedUnit.medicalSupportContact
    },
    pickupAddress: next.incident.pickupAddress,
    pickupLocation: { lat: next.incident.lat, lng: next.incident.lng },
    patientDetails: next.incident.patientDetails,
    route: next.route,
    roadRoute,
    pickupRatio,
    incidentCoord: { lat: next.incident.lat, lng: next.incident.lng },
    destinationCoord: { lat: next.assignedHospital.lat, lng: next.assignedHospital.lng }
  };

  res.status(201).json({ dispatch, state: currentState() });
});

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

server.on("error", async (error) => {
  if (error?.code === "EADDRINUSE") {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/health`);
      if (response.ok) {
        console.log(`Backend already running on http://localhost:${PORT}`);
        process.exit(0);
        return;
      }
    } catch {
      // Fall through to hard failure when existing process is not our backend.
    }

    console.error(`Port ${PORT} is already in use by another process.`);
    process.exit(1);
    return;
  }

  console.error("Backend failed to start", error);
  process.exit(1);
});
