import { DELHI_CENTER, DELHI_ADDRESSES } from "./constants.js";

const STATUS_CYCLE = ["available", "dispatched", "en-route"];

export const ambulances = [
  {
    id: 1,
    name: "AMB-01",
    lat: 26.9284,
    lng: 75.8031,
    status: "available",
    speed: 44,
    driver: "Arjun",
    conductor: "Aman",
    medicalSupport: "Nurse Priya",
    conductorContact: "+91 9516486334",
    medicalSupportContact: "+91 9516486335",
    heading: 72
  },
  {
    id: 2,
    name: "AMB-02",
    lat: 26.8962,
    lng: 75.7814,
    status: "en-route",
    speed: 51,
    driver: "Kabir",
    conductor: "Rajat",
    medicalSupport: "Paramedic Neha",
    conductorContact: "+91 9516486336",
    medicalSupportContact: "+91 9516486337",
    heading: 120
  },
  {
    id: 3,
    name: "AMB-03",
    lat: 26.9423,
    lng: 75.7719,
    status: "dispatched",
    speed: 48,
    driver: "Rehan",
    conductor: "Manav",
    medicalSupport: "Nurse Kavya",
    conductorContact: "+91 9516486338",
    medicalSupportContact: "+91 9516486339",
    heading: 204
  },
  {
    id: 4,
    name: "AMB-04",
    lat: 26.8738,
    lng: 75.8198,
    status: "available",
    speed: 41,
    driver: "Vihaan",
    conductor: "Rohit",
    medicalSupport: "Paramedic Isha",
    conductorContact: "+91 9516486340",
    medicalSupportContact: "+91 9516486341",
    heading: 310
  },
  {
    id: 5,
    name: "AMB-05",
    lat: 26.9105,
    lng: 75.7472,
    status: "available",
    speed: 46,
    driver: "Ishaan",
    conductor: "Kunal",
    medicalSupport: "Nurse Tania",
    conductorContact: "+91 9516486342",
    medicalSupportContact: "+91 9516486343",
    heading: 168
  }
];

export const hospitals = [
  { id: 1, name: "SMS Hospital Jaipur", lat: 26.9056, lng: 75.8137, beds: 18, icuBeds: 4, erBays: 3, incoming: 2 },
  { id: 2, name: "Fortis Escorts Jaipur", lat: 26.8736, lng: 75.7812, beds: 15, icuBeds: 3, erBays: 2, incoming: 1 },
  { id: 3, name: "RUHS Jaipur", lat: 26.8392, lng: 75.8059, beds: 21, icuBeds: 5, erBays: 4, incoming: 2 },
  { id: 4, name: "Mahatma Gandhi Hospital", lat: 26.7725, lng: 75.8365, beds: 25, icuBeds: 8, erBays: 5, incoming: 0 },
  { id: 5, name: "Narayana Multispeciality", lat: 26.8049, lng: 75.8233, beds: 12, icuBeds: 2, erBays: 2, incoming: 0 },
  { id: 6, name: "Apex Hospital", lat: 26.8533, lng: 75.8223, beds: 10, icuBeds: 3, erBays: 1, incoming: 1 },
  { id: 7, name: "Sanjeevani Hospital", lat: 26.8856, lng: 75.7674, beds: 8, icuBeds: 1, erBays: 2, incoming: 0 },
  { id: 8, name: "Monilek Hospital", lat: 26.8839, lng: 75.8213, beds: 14, icuBeds: 4, erBays: 2, incoming: 0 }
];

export const incidents = [];

export function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomDelhiCoordinate() {
  return {
    lat: DELHI_CENTER[0] + randomInRange(-0.04, 0.04),
    lng: DELHI_CENTER[1] + randomInRange(-0.04, 0.04)
  };
}

export function getRandomAddress() {
  return DELHI_ADDRESSES[Math.floor(Math.random() * DELHI_ADDRESSES.length)];
}

export function cycleStatusByTick(index, tick) {
  const phase = (Math.floor(tick / 10) + index) % STATUS_CYCLE.length;
  return STATUS_CYCLE[phase];
}

export function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

export function findNearestUnit(incidentCoord, unitList) {
  const sorted = [...unitList].sort(
    (a, b) =>
      haversineKm(incidentCoord.lat, incidentCoord.lng, a.lat, a.lng) -
      haversineKm(incidentCoord.lat, incidentCoord.lng, b.lat, b.lng)
  );
  const preferred = sorted.find((unit) => unit.status === "available");
  return preferred || sorted[0];
}

export function findNearestHospital(incidentCoord, hospitalList) {
  return [...hospitalList].sort(
    (a, b) =>
      haversineKm(incidentCoord.lat, incidentCoord.lng, a.lat, a.lng) -
      haversineKm(incidentCoord.lat, incidentCoord.lng, b.lat, b.lng)
  )[0];
}

export function findHospitalByBedAndRadius(incidentCoord, hospitalList) {
  const hospitalsWithDistance = hospitalList
    .map((hospital) => ({
      ...hospital,
      distanceFromIncidentKm: haversineKm(incidentCoord.lat, incidentCoord.lng, hospital.lat, hospital.lng)
    }))
    .sort((a, b) => a.distanceFromIncidentKm - b.distanceFromIncidentKm);

  const primaryBand = hospitalsWithDistance.filter(
    (hospital) => hospital.distanceFromIncidentKm <= 15 && hospital.beds > 0
  );

  if (primaryBand.length) {
    const randomHopitalIdx = Math.floor(Math.random() * primaryBand.length);
    return { hospital: primaryBand[randomHopitalIdx], selectionBand: "0-15km (Randomized)" };
  }

  const fallbackBand = hospitalsWithDistance.filter(
    (hospital) => hospital.distanceFromIncidentKm > 15 && hospital.distanceFromIncidentKm <= 30 && hospital.beds > 0
  );

  if (fallbackBand.length) {
    const randomHopitalIdx = Math.floor(Math.random() * fallbackBand.length);
    return { hospital: fallbackBand[randomHopitalIdx], selectionBand: "15-30km (Randomized)" };
  }

  return {
    hospital: hospitalsWithDistance[0] || findNearestHospital(incidentCoord, hospitalList),
    selectionBand: "nearest-any"
  };
}

export function createIncidentRecord(type, unitList, hospitalList, incidentId, patientLocation) {
  const incidentCoord = patientLocation
    ? { lat: patientLocation.lat, lng: patientLocation.lng }
    : randomDelhiCoordinate();
  const assignedUnit = findNearestUnit(incidentCoord, unitList);
  const hospitalSelection = patientLocation
    ? {
        hospital: findNearestHospital(incidentCoord, hospitalList),
        selectionBand: "nearest"
      }
    : findHospitalByBedAndRadius(incidentCoord, hospitalList);
  const assignedHospital = hospitalSelection.hospital;
  const etaSeconds = Math.floor(randomInRange(22, 46));
  const distance = haversineKm(incidentCoord.lat, incidentCoord.lng, assignedHospital.lat, assignedHospital.lng);

  const incident = {
    id: incidentId,
    type,
    lat: incidentCoord.lat,
    lng: incidentCoord.lng,
    priority: type.priority,
    timestamp: Date.now(),
    assignedUnit: assignedUnit.name,
    eta: etaSeconds,
    initialEta: etaSeconds,
    hospitalName: assignedHospital.name,
    distanceKm: Number(distance.toFixed(1)),
    hospitalDistanceBand: hospitalSelection.selectionBand,
    pickupAddress: patientLocation
      ? `Live GPS (${incidentCoord.lat.toFixed(4)}, ${incidentCoord.lng.toFixed(4)})`
      : getRandomAddress(),
    patientDetails: `${type.label} - Male 54`,
    patientContact: null  // set at dispatch time via useSimulation
  };

  return {
    incident,
    route: [
      [assignedUnit.lat, assignedUnit.lng],
      [incidentCoord.lat, incidentCoord.lng],
      [assignedHospital.lat, assignedHospital.lng]
    ],
    assignedUnit,
    assignedHospital
  };
}