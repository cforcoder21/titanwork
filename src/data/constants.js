export const DELHI_CENTER = [26.9124, 75.7873];

export const EMERGENCY_TYPES = [
  { id: "cardiac", label: "Cardiac Arrest", icon: "Heart", priority: "P1" },
  { id: "trauma", label: "Severe Trauma", icon: "AlertTriangle", priority: "P2" },
  { id: "burn", label: "Burn", icon: "Flame", priority: "P2" },
  { id: "stroke", label: "Stroke", icon: "Brain", priority: "P1" },
  { id: "other", label: "Other", icon: "AlertTriangle", priority: "P2" }
];

export const DELHI_ADDRESSES = [
  "MI Road, Jaipur",
  "Malviya Nagar, Jaipur",
  "Vaishali Nagar, Jaipur",
  "Tonk Road, Jaipur",
  "Jhotwara, Jaipur",
  "Bapu Nagar, Jaipur",
  "Mansarovar, Jaipur",
  "C-Scheme, Jaipur"
];

export const HOSPITAL_NAMES = [
  "SMS Hospital Jaipur",
  "Fortis Escorts Jaipur",
  "RUHS Jaipur"
];

export const TRIAGE_QUEUE = [
  { id: "t1", priority: "P1", condition: "Cardiac Arrest", status: "CRITICAL", age: 54, eta: "04:20" },
  { id: "t2", priority: "P1", condition: "Stroke", status: "CRITICAL", age: 67, eta: "06:05" },
  { id: "t3", priority: "P2", condition: "Trauma", status: "URGENT", age: 29, eta: "09:40" },
  { id: "t4", priority: "P3", condition: "Fracture", status: "STABLE", age: 31, eta: "ON SITE" }
];
