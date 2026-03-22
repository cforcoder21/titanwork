# Smart Emergency Response Platform 🚑

A comprehensive, real-time emergency dispatch and monitoring system built for **Hackerz Street 4.0**. This interconnected platform seamlessly links patients, ambulance drivers, and hospital administration through a unified, live-updating dashboard to drastically reduce, predict, and manage emergency response times.

---

## 🌟 Key Perspectives

The application is divided into three interconnected, real-time views:

### 1. Patient View 🧍
* **Instant Onboarding**: Quick location lock via live GPS capture or manual secure selection, seamlessly linked with the user's phone number.
* **One-Tap SOS**: A highly prominent panic button to instantly dispatch the nearest available ambulance based on the specific medical emergency (Cardiac Arrest, Stroke, Trauma, etc., or Custom).
* **Live Vital Monitoring**: Real-time mock display of incoming patient vitals (Heart Rate, Blood Pressure, SpO2) simulated during transit.
* **Map Status**: Clear visibility of the assigned ambulance unit driving toward the pickup location.

### 2. Driver View 🚑
* **Active Mission Dashboard**: Displays the exact assigned emergency details, patient contact info, and critical P1 severity status.
* **Real-Time Telemetry**: Live UI showing current speed, remaining distance, and ETA updating tick-by-tick.
* **Turn-by-Turn Navigation**: Integrated map routing to perfectly guide the driver exactly from the pickup location to their designated hospital bay.

### 3. Hospital Command 🏥
* **Citywide Emergency Grid**: A bird's-eye map view of the 5km coverage zone, actively tracking all deployed units and their routes.
* **Resource Management**: Live tracking of available ICU Beds, ER Bays, and Operating Rooms to determine whether to accept or divert an incoming ambulance.
* **Incoming Units Log**: A dynamic triage queue tracking incoming patients, their exact age/severity, and estimated arrival times, allowing staff to prepare the appropriate bays precisely when the ambulance hits the perimeter.

---

## 🚀 Built-in Demo & Simulation Engine
Features a built-in simulation mode that:
1. Randomly generates city-wide medical incidents.
2. Identifies the nearest available ambulance to pick up the patient.
3. Automatically evaluates hospital bed availability within a 0-15km radius (or randomized distances if required) to seamlessly route units.
4. Visualizes the exact driving paths on the Leaflet map in real-time to demonstrate the platform's capabilities without manual intervention!

---

## 🛠️ Tech Stack
* **Frontend Component Library**: React.js with beautiful Tailwind CSS gradients, blurs, and animations.
* **Mapping Engine**: Leaflet & React-Leaflet
* **Icons**: Lucide React
* **Build Tool**: Vite

---

## 📥 Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **View the Application:**
   Open `http://localhost:5173` in your browser.

---

## 📸 Screenshots

*(You can place your actual screenshot files in an `assets/` folder and name them accordingly to render them natively on GitHub!)*

### Patient Onboarding & Verification
![Patient Onboarding](./assets/onboarding.png)

### Driver Active Mission UI
![Driver View](./assets/driver.png)

### Hospital Administration Dashboard
![Hospital Command](./assets/hospital.png)
