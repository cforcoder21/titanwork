import { useEffect, useRef, useState } from "react";
import {
  ambulances as ambulanceSeed,
  hospitals as hospitalSeed,
  incidents as incidentSeed,
  createIncidentRecord,
  cycleStatusByTick,
  randomInRange
} from "../data/simulate";

export function useSimulation() {
  const [ambulances, setAmbulances] = useState(ambulanceSeed);
  const [hospitals, setHospitals] = useState(hospitalSeed);
  const [incidents, setIncidents] = useState(incidentSeed);
  const incidentCounterRef = useRef(1);

  useEffect(() => {
    const movementInterval = setInterval(() => {
      const tick = Math.floor(Date.now() / 1000);
      setAmbulances((prev) =>
        prev.map((unit, index) => {
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
        })
      );
    }, 2000);

    const hospitalInterval = setInterval(() => {
      setHospitals((prev) =>
        prev.map((hospital) => ({
          ...hospital,
          beds: Math.max(0, Math.min(24, hospital.beds + Math.floor(randomInRange(-1, 2)))),
          icuBeds: Math.max(0, Math.min(6, hospital.icuBeds + Math.floor(randomInRange(-1, 2)))),
          erBays: Math.max(1, Math.min(5, hospital.erBays + Math.floor(randomInRange(-1, 2))))
        }))
      );
    }, 15000);

    const incidentCountdown = setInterval(() => {
      setIncidents((prev) =>
        prev.map((incident) => ({
          ...incident,
          eta: Math.max(0, incident.eta - 1)
        }))
      );
    }, 1000);

    return () => {
      clearInterval(movementInterval);
      clearInterval(hospitalInterval);
      clearInterval(incidentCountdown);
    };
  }, []);

  const triggerIncident = (emergencyType, patientLocation) => {
    const incidentId = incidentCounterRef.current;
    incidentCounterRef.current += 1;

    const next = createIncidentRecord(emergencyType, ambulances, hospitals, incidentId, patientLocation);
    setIncidents((prev) => [next.incident, ...prev]);

    setHospitals((prev) =>
      prev.map((hospital) =>
        hospital.name === next.assignedHospital.name
          ? {
              ...hospital,
              beds: Math.max(0, hospital.beds - 1),
              incoming: hospital.incoming + 1
            }
          : hospital
      )
    );

    setAmbulances((prev) =>
      prev.map((unit) =>
        unit.name === next.assignedUnit.name
          ? {
              ...unit,
              status: "dispatched",
              speed: Math.max(unit.speed, 48)
            }
          : unit
      )
    );

    return {
      incidentId: next.incident.id,
      ambulanceId: next.assignedUnit.name,
      etaMinutes: Math.ceil(next.incident.initialEta / 60),
      initialEtaSeconds: next.incident.initialEta,
      hospitalName: next.assignedHospital.name,
      hospitalDistanceBand: next.incident.hospitalDistanceBand,
      distanceKm: next.incident.distanceKm,
      pickupAddress: next.incident.pickupAddress,
      pickupLocation: { lat: next.incident.lat, lng: next.incident.lng },
      patientDetails: next.incident.patientDetails,
      route: next.route,
      incidentCoord: { lat: next.incident.lat, lng: next.incident.lng },
      destinationCoord: { lat: next.assignedHospital.lat, lng: next.assignedHospital.lng }
    };
  };

  return {
    ambulances,
    hospitals,
    incidents,
    triggerIncident
  };
}
