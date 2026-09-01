"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt, Download, CreditCard, CheckCircle2, ShieldCheck, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FeeLedgerModalProps {
  studentName?: string;
  studentRoll?: string;
  triggerButton?: React.ReactElement;
}

export function FeeLedgerModal({
  studentName = "Rahul Deshmukh",
  studentRoll = "21CS042",
  triggerButton
}: FeeLedgerModalProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const feeItems = [
    { title: "Academic Semester Tuition (Semester 8)", amount: "₹ 62,500", status: "Paid", txId: "TXN-88219401", date: "Jul 15, 2026" },
    { title: "End-Semester Examination Registration", amount: "₹ 2,400", status: "Paid", txId: "TXN-88401923", date: "Aug 02, 2026" },
    { title: "Advanced Computing & AI Lab Facility", amount: "₹ 8,000", status: "Paid", txId: "TXN-88401924", date: "Aug 02, 2026" },
    { title: "Institutional Library & Journal Access", amount: "₹ 1,500", status: "Paid", txId: "TXN-88401925", date: "Aug 02, 2026" },
  ];

  const handleDownloadReceipt = () => {
    setDownloading(true);
    toast.loading("Generating Official Tax Invoice & Clearance...");

    setTimeout(() => {
      const doc = new jsPDF() as any;
      
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("OFFICIAL FEE RECEIPT & NO-DUES CLEARANCE", 105, 28, { align: "center" });

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 38, 182, 28, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Student: ${studentName}`, 20, 48);
      doc.text(`Roll Number: ${studentRoll}`, 20, 56);
      doc.text(`Clearance Status: ALL DUES PAID`, 120, 48);
      doc.text(`Invoice No: INV-2026-${studentRoll}`, 120, 56);

      const tableData = feeItems.map(f => [f.title, f.amount, f.status, f.txId, f.date]);

      autoTable(doc, {
        startY: 72,
        head: [['Particulars', 'Amount', 'Status', 'Transaction Ref', 'Date']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 5 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(10);
      doc.text("Total Paid: ₹ 74,400 (Rupees Seventy Four Thousand Four Hundred Only)", 14, finalY);
      doc.text("Institutional Finance Division — Authorized Digital Stamp", 14, finalY + 12);

      doc.save(`FeeClearance_${studentRoll}.pdf`);
      setDownloading(false);
      toast.dismiss();
      toast.success("Fee Clearance Certificate Downloaded!");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        triggerButton || (
          <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Fee Ledger</span>
          </Button>
        )
      } />

      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 bg-white border border-slate-200 text-slate-900 shadow-2xl custom-scrollbar">
        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> No Outstanding Dues
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Academic Year 2026-27</span>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Institutional Fee &amp; Dues Ledger
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          {/* Student Overview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Candidate Name</p>
              <h3 className="text-sm font-bold text-slate-900">{studentName} ({studentRoll})</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Total Semester Paid</p>
              <p className="text-base font-bold text-emerald-600">₹ 74,400</p>
            </div>
          </div>

          {/* Fee Items List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Transaction Breakdown</h4>
            <div className="space-y-2">
              {feeItems.map((item) => (
                <div key={item.title} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{item.txId} • Paid on {item.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900">{item.amount}</span>
                    <span className="block text-[10px] font-bold text-emerald-600 uppercase">Paid ✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
            >
              Close
            </Button>
            <Button
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className="h-10 px-5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? "Compiling..." : "Download Official Certificate"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
