# Outpatient Appointment Scheduling Portal with Clinical Priority Sorting, Blood Donation & Lab Booking System

A full-stack, enterprise-grade healthcare management application featuring intelligent clinical triage sorting, outpatient slot scheduling, blood donation & emergency donor matching, and lab test booking with real-time Socket.io synchronization.

---

## 🌟 Key Features

### 1. 🧠 Clinical Priority Scoring & Queue Engine
- **Scoring Algorithm**:
  $$\text{Priority Score} = (\text{Severity} \times 5) + (\text{Age Factor} \times 2) + (\text{Chronic Disease} \times 3) + \text{Emergency Override}$$
- **Severity Factor**: Severe (Weight 3), Moderate (Weight 2), Mild (Weight 1)
- **Age Risk Factor**: $\ge 65$ yrs (Weight 3), 45-64 yrs (Weight 2), $<45$ yrs (Weight 1)
- **Chronic Conditions**: Present (Weight 2), None (0)
- **Emergency Override**: Instantly gives $+100$ score boost, prioritizing the patient to Position #1 in the queue
- **Live Queue Position**: Real-time position tracking and dynamic wait time forecast (~15 mins/patient)

### 2. 📅 Outpatient Appointment Module
- Department-wise doctor lookup (Cardiology, Orthopedics, Neurology, General Medicine, Pediatrics)
- Slot-based booking system with concurrency protection against double booking
- Reschedule and cancellation workflows with instant slot release
- Real-time doctor availability status (`Available`, `In Consultation`, `On Leave`)

### 3. 🩸 Blood Donation & Emergency Matcher
- 90-day donation eligibility calculator (ensures minimum 3-month gap)
- Real-time inventory tracking for all 8 blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-) with low-stock alerts
- Smart Donor Matching based on compatible blood groups and city
- Emergency one-click blood broadcast dispatched to eligible donors & admins via Socket.io
- Lifetime donation log and printable/downloadable Digital Life Saver Certificate

### 4. 🧪 Lab Test Booking Module
- Searchable catalog of lab tests (CBC, Lipid Panel, MRI Brain, Chest X-Ray, HbA1c, LFT, ECG)
- Daily capacity management per test
- Home sample collection option (+₹150 phlebotomist visit)
- Link lab bookings directly to outpatient doctor consultations
- Pathologist-verified report generation with abnormal parameter highlighting and 1-click PDF printing
- AI symptom-to-test recommendation engine

### 5. 👥 Role-Based Portals
- **Patient Dashboard**: Live queue tracker, appointments history, diagnostic report viewer, blood requests
- **Doctor Dashboard**: Priority-sorted patient queue, consultation status updater, digital prescription writer, emergency blood requisition, medical history inspection
- **Admin Dashboard**: Chart.js analytics (Department Load, Peak Hours, Blood Inventory), user and doctor management, no-show detection
- **Blood Donor Dashboard**: 90-day eligibility indicator, live emergency alerts stream with 1-click pledge, lifetime donation certificates

### 6. 🌐 Multi-Language Support
- Full English and Tamil (`தமிழ்`) localization switcher across all UI modules.

nand.donor@gmail.com` / `Donor@123`


npm install
npm run dev      # Runs on http://localhost:5173
```

Open your browser at **`http://localhost:5173`** to access the application.
