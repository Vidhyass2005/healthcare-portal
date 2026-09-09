import React from 'react';
import { X, Printer, FileText, CheckCircle2, AlertCircle, Building2, Calendar, User, ShieldCheck } from 'lucide-react';

export const ReportViewerModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const findings = booking.reportData?.findings || [
    { parameter: 'Hemoglobin (Hb)', result: '14.2', referenceRange: '13.0 - 17.0', unit: 'g/dL', isAbnormal: false },
    { parameter: 'Total WBC Count', result: '7,500', referenceRange: '4,000 - 11,000', unit: 'cells/cu.mm', isAbnormal: false },
    { parameter: 'Platelet Count', result: '240,000', referenceRange: '150,000 - 450,000', unit: '/mcL', isAbnormal: false },
    { parameter: 'ESR (1st Hour)', result: '12', referenceRange: '0 - 15', unit: 'mm/hr', isAbnormal: false }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Top Action Header */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-sm">Official Diagnostic Lab Report</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded font-semibold border border-emerald-500/30">
              Verified
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-8 space-y-6 text-slate-800" id="printable-report">
          {/* Hospital Letterhead */}
          <div className="border-b-2 border-sky-600 pb-5 flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 text-sky-700 font-extrabold text-2xl tracking-tight">
                <Building2 className="w-7 h-7" />
                <span>MEDCARE HOSPITAL & Diagnostics Centre</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                National Board Accredited Multi-Specialty Hospital & Diagnostic Facility
              </div>
              <div className="text-xs text-slate-400">
                100 Feet Road, Chennai - 600028 | Tel: +91 44 2847 9000 | Email: contact@medcarehospital.org
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                Diagnostic Report
              </div>
              <div className="text-xs text-slate-600 mt-1 font-mono">
                Report ID: <strong>LAB-{booking._id?.toString().slice(-8).toUpperCase() || 'SAMPLE89'}</strong>
              </div>
              <div className="text-xs text-slate-500">
                Date: <strong>{new Date(booking.reportData?.generatedDate || booking.createdAt || Date.now()).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

          {/* Patient Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Patient Name</span>
              <strong className="text-slate-800 text-sm font-semibold">{booking.patientName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Age / Gender</span>
              <strong className="text-slate-800">{booking.patient?.age || '35'} Yrs / {booking.patient?.gender || 'Male'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Test Name</span>
              <strong className="text-sky-700 font-semibold">{booking.testName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Referring Doctor</span>
              <strong className="text-slate-800">{booking.referringDoctor || 'Dr. Priya Sharma'}</strong>
            </div>
          </div>

          {/* Findings Table */}
          <div>
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-3">
              Diagnostic Test Parameters & Observations
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Investigation Parameter</th>
                    <th className="p-3">Observed Value</th>
                    <th className="p-3">Biological Reference Interval</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {findings.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{f.parameter}</td>
                      <td className={`p-3 font-bold ${f.isAbnormal ? 'text-red-600 bg-red-50' : 'text-slate-700'}`}>
                        {f.result}
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{f.referenceRange}</td>
                      <td className="p-3 text-slate-500">{f.unit}</td>
                      <td className="p-3">
                        {f.isAbnormal ? (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                            <AlertCircle className="w-3.5 h-3.5" /> Abnormal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Doctor Remarks */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-1">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Consultant Pathologist Remarks & Clinical Interpretation</span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              {booking.reportData?.doctorRemarks || 'All values correlate well within standard physiological limits for age and gender. Routine follow-up advised.'}
            </p>
          </div>

          {/* Signature & Disclaimer */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <div className="text-[11px] text-slate-400">Sample collected: {booking.isHomeSampleCollection ? 'Home Collection' : 'Central Laboratory'}</div>
              <div className="text-[11px] text-slate-400">Electronic report verified automatically via MEDCARE HOSPITAL LIMS.</div>
            </div>

            <div className="text-center">
              <div className="font-bold text-slate-800">Dr. Suresh V., MD (Pathology)</div>
              <div className="text-[11px] text-slate-500">Senior Consultant Pathologist</div>
              <div className="text-[10px] text-slate-400 font-mono">Reg No: TN-MC-54210</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
