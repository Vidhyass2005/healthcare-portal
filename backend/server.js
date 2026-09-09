const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initSocket } = require('./services/socketService');

// Load environment variables
dotenv.config();

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
initSocket(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple PDF report simulation endpoint (renders a clean HTML/PDF printable view)
app.get('/api/lab/reports/:id/download', async (req, res) => {
  try {
    const LabBooking = require('./models/LabBooking');
    const booking = await LabBooking.findById(req.params.id)
      .populate('labTest')
      .populate('patient', 'name email phone age gender');

    if (!booking) {
      return res.status(404).send('Report not found');
    }

    const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Lab Report - ${booking.testName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
        .header { border-bottom: 3px solid #0284c7; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; }
        .hospital-name { font-size: 24px; font-weight: bold; color: #0369a1; }
        .badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-weight: 600; }
        .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
        th { background-color: #f1f5f9; color: #334155; }
        .abnormal { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b; text-align: center; }
        .sign { margin-top: 40px; display: flex; justify-content: flex-end; }
        .sign-box { text-align: center; width: 200px; border-top: 1px solid #94a3b8; padding-top: 6px; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: 600;">Print / Save as PDF</button>
      </div>
      <div class="header">
        <div>
          <div class="hospital-name">🏥 MEDCARE HOSPITAL & Diagnostics Centre</div>
          <div>Accredited Multi-Specialty Hospital, Pathology & Imaging Lab</div>
          <div>Phone: +91 44 2847 9000 | Email: contact@medcarehospital.org</div>
        </div>
        <div style="text-align: right;">
          <div class="badge">OFFICIAL LAB REPORT</div>
          <div style="font-size: 13px; margin-top: 8px;">Report ID: <strong>LAB-${booking._id.toString().slice(-8).toUpperCase()}</strong></div>
          <div style="font-size: 13px;">Date: <strong>${new Date(booking.reportData?.generatedDate || booking.createdAt).toLocaleDateString()}</strong></div>
        </div>
      </div>

      <div class="patient-box">
        <div><strong>Patient Name:</strong> ${booking.patientName}</div>
        <div><strong>Age / Gender:</strong> ${booking.patient?.age || '35'} Yrs / ${booking.patient?.gender || 'Male'}</div>
        <div><strong>Test Performed:</strong> ${booking.testName} (${booking.labTest?.category || 'Pathology'})</div>
        <div><strong>Referring Doctor:</strong> ${booking.referringDoctor || 'OPD Physician'}</div>
        <div><strong>Sample Type:</strong> ${booking.labTest?.sampleType || 'Blood'}</div>
        <div><strong>Collection Mode:</strong> ${booking.isHomeSampleCollection ? 'Home Sample Collection' : 'In-Clinic Phlebotomy'}</div>
      </div>

      <h3>Diagnostic Test Findings</h3>
      <table>
        <thead>
          <tr>
            <th>Investigation Parameter</th>
            <th>Observed Result</th>
            <th>Biological Reference Interval</th>
            <th>Units</th>
            <th>Interpretation</th>
          </tr>
        </thead>
        <tbody>
          ${(booking.reportData?.findings || [
            { parameter: 'Hemoglobin (Hb)', result: '14.2', referenceRange: '13.0 - 17.0', unit: 'g/dL', isAbnormal: false },
            { parameter: 'Total WBC Count', result: '7,500', referenceRange: '4,000 - 11,000', unit: 'cells/cu.mm', isAbnormal: false },
            { parameter: 'Platelet Count', result: '245,000', referenceRange: '150,000 - 450,000', unit: '/mcL', isAbnormal: false }
          ]).map(f => `
            <tr>
              <td><strong>${f.parameter}</strong></td>
              <td class="${f.isAbnormal ? 'abnormal' : ''}">${f.result}</td>
              <td>${f.referenceRange}</td>
              <td>${f.unit}</td>
              <td>${f.isAbnormal ? '<span style="color:red;">Abnormal</span>' : 'Within Normal Limits'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 25px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 6px;">
        <strong>Pathologist Remarks:</strong> ${booking.reportData?.doctorRemarks || 'All values correlate within standard physiological limits.'}
      </div>

      <div class="sign">
        <div class="sign-box">
          <strong>Dr. Suresh V., MD (Path)</strong><br />
          Consultant Pathologist
        </div>
      </div>

      <div class="footer">
        This is an authenticated electronic report from MEDCARE HOSPITAL Diagnostics Lab. Queries: contact@medcarehospital.org
      </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlReport);
  } catch (error) {
    res.status(500).send('Error generating report: ' + error.message);
  }
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/priority', require('./routes/priorityRoutes'));
app.use('/api/blood', require('./routes/bloodRoutes'));
app.use('/api/lab', require('./routes/labRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Healthcare Outpatient, Priority & Blood System'
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
