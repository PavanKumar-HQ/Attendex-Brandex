"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Receipt, 
  Download, 
  CheckCircle2, 
  CreditCard, 
  Clock, 
  ShieldCheck,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ParentFeesPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/ward", { cache: "no-store" })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          if (json.data.student) {
            setStudentName(json.data.student.name);
            setStudentRoll(json.data.student.roll_number);
          }
          if (json.data.fees) {
            setFees(json.data.fees);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = fees.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const handleDownloadCertificate = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF() as any;

      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("OFFICIAL FEE CLEARANCE & TUITION RECEIPT CERTIFICATE", 105, 28, { align: "center" });
      doc.text("ACADEMIC YEAR 2026 - 2027", 105, 34, { align: "center" });

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 42, 182, 30, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Student Name: ${studentName}`, 20, 52);
      doc.text(`University Reg No: ${studentRoll}`, 20, 60);

      doc.text(`Department: B.Tech Computer Science`, 110, 52);
      doc.text(`Account Status: 100% CLEARED (NO DUES)`, 110, 60);

      const tableRows = fees.map(f => [
        f.category,
        f.ref,
        f.date,
        `Rs. ${f.amount.toLocaleString()}`,
        "SUCCESS"
      ]);

      tableRows.push(["TOTAL TUITION SETTLED", "-", "-", `Rs. ${totalPaid.toLocaleString()}`, "PAID"]);

      autoTable(doc, {
        startY: 80,
        head: [['Fee Head', 'Transaction ID', 'Date', 'Amount', 'Payment Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("This receipt is electronically verified and qualifies for income tax deduction under Section 80C.", 14, finalY);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Finance Officer & Comptroller", 140, finalY + 20);

      doc.save(`FeeClearance_${studentRoll}.pdf`);
      toast.success("Official Fee Certificate Downloaded!");
    } catch {
      toast.error("Failed to export Fee Certificate.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Fee Details" showBack />

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Summary Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> All Dues Cleared
                </span>
                <span className="text-xs font-semibold text-slate-400">Reg: {studentRoll}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">College Fee Statement</h1>
              <p className="text-xs text-slate-500 font-medium">
                Verified financial transactions, tuition invoices, and tax clearance receipts for {studentName}.
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-3">
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Settled (Sem 8)</p>
                <p className="text-2xl font-bold text-slate-900">₹{totalPaid.toLocaleString()}</p>
              </div>

              <Button
                onClick={handleDownloadCertificate}
                disabled={isExporting}
                className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? "Compiling..." : "Official Certificate (PDF)"}</span>
              </Button>
            </div>
          </div>

          {/* Ledger Table */}
          <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Fee Breakdown &amp; Payment History</h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fee Component</th>
                    <th className="py-3 px-4">Reference ID</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {fees.map((fee, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{fee.category}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{fee.ref}</td>
                      <td className="py-3.5 px-4 text-slate-600">{fee.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">₹{fee.amount.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                          {fee.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
