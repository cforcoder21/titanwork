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

export const DUMMY_PICKUP_LOCATIONS = [
  { id: "loc-01", label: "MI Road, Jaipur", lat: 26.9196, lng: 75.7983 },
  { id: "loc-02", label: "Malviya Nagar, Jaipur", lat: 26.8549, lng: 75.8097 },
  { id: "loc-03", label: "Vaishali Nagar, Jaipur", lat: 26.9118, lng: 75.7426 },
  { id: "loc-04", label: "Tonk Road, Jaipur", lat: 26.8467, lng: 75.8054 },
  { id: "loc-05", label: "Jhotwara, Jaipur", lat: 26.9467, lng: 75.7418 },
  { id: "loc-06", label: "Bapu Nagar, Jaipur", lat: 26.8924, lng: 75.8122 },
  { id: "loc-07", label: "Mansarovar, Jaipur", lat: 26.8566, lng: 75.7681 },
  { id: "loc-08", label: "C-Scheme, Jaipur", lat: 26.9134, lng: 75.7921 },
  { id: "loc-09", label: "Jagatpura, Jaipur", lat: 26.8296, lng: 75.8286 },
  { id: "loc-10", label: "Vidyadhar Nagar, Jaipur", lat: 26.9634, lng: 75.7787 },
  { id: "loc-11", label: "Sodala, Jaipur", lat: 26.8945, lng: 75.7696 },
  { id: "loc-12", label: "Raja Park, Jaipur", lat: 26.8987, lng: 75.8268 },
  { id: "loc-13", label: "Shyam Nagar, Jaipur", lat: 26.8899, lng: 75.7628 },
  { id: "loc-14", label: "Adarsh Nagar, Jaipur", lat: 26.9021, lng: 75.8242 },
  { id: "loc-15", label: "Pratap Nagar, Jaipur", lat: 26.8008, lng: 75.8237 },
  { id: "loc-16", label: "Gopalpura, Jaipur", lat: 26.8725, lng: 75.7904 },
  { id: "loc-17", label: "Ajmer Road, Jaipur", lat: 26.9148, lng: 75.7094 },
  { id: "loc-18", label: "Sanganer, Jaipur", lat: 26.8192, lng: 75.7796 },
  { id: "loc-19", label: "Sitapura, Jaipur", lat: 26.7823, lng: 75.8386 },
  { id: "loc-20", label: "Civil Lines, Jaipur", lat: 26.9061, lng: 75.7782 }
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
