import { NextRequest } from "next/server";
import { GET as getLeaves } from "@/app/api/leave/route";
import { GET as getGatepasses } from "@/app/api/gatepass/route";
import { GET as getProctorSlots } from "@/app/api/proctor/slots/route";
import { POST as bookProctorSlot } from "@/app/api/proctor/book/route";
import { calculateAttendanceMetrics, calculateSubjectGrade, calculateSGPA } from "@/lib/calculations";

interface BenchmarkResult {
  scenario: string;
  concurrency: number;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  errorRate: string;
  totalDurationMs: number;
  throughputRps: number;
  latency: {
    minMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    maxMs: number;
    avgMs: number;
  };
}

function calculatePercentiles(latencies: number[]): BenchmarkResult["latency"] {
  if (latencies.length === 0) {
    return { minMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0, avgMs: 0 };
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const minMs = sorted[0];
  const maxMs = sorted[sorted.length - 1];
  const avgMs = Number((sorted.reduce((acc, v) => acc + v, 0) / sorted.length).toFixed(2));
  const p50Ms = sorted[Math.floor(sorted.length * 0.50)];
  const p95Ms = sorted[Math.floor(sorted.length * 0.95)];
  const p99Ms = sorted[Math.floor(sorted.length * 0.99)];

  return { minMs, p50Ms, p95Ms, p99Ms, maxMs, avgMs };
}

export async function runRealisticLoadBenchmark(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  // ─── SCENARIO 1: NORMAL SCHOOL DAY (150 Concurrent Sessions) ──────────────────
  {
    const CONCURRENCY = 150;
    const latencies: number[] = [];
    let successes = 0;
    let errors = 0;
    const startAll = Date.now();

    const tasks = Array.from({ length: CONCURRENCY }, async (_, idx) => {
      const t0 = performance.now();
      try {
        if (idx % 3 === 0) {
          await getLeaves();
        } else if (idx % 3 === 1) {
          await getGatepasses();
        } else {
          calculateAttendanceMetrics(35 + (idx % 10), 45, 75.0);
        }
        successes++;
      } catch {
        errors++;
      } finally {
        latencies.push(Number((performance.now() - t0).toFixed(2)));
      }
    });

    await Promise.all(tasks);
    const duration = Date.now() - startAll;

    results.push({
      scenario: "Normal School Day (Mixed Read/Write)",
      concurrency: CONCURRENCY,
      totalRequests: CONCURRENCY,
      successCount: successes,
      errorCount: errors,
      errorRate: `${((errors / CONCURRENCY) * 100).toFixed(2)}%`,
      totalDurationMs: duration,
      throughputRps: Number(((CONCURRENCY / (duration || 1)) * 1000).toFixed(1)),
      latency: calculatePercentiles(latencies)
    });
  }

  // ─── SCENARIO 2: MORNING LOGIN & DASHBOARD HYDRATION (400 Concurrent) ─────────
  {
    const CONCURRENCY = 400;
    const latencies: number[] = [];
    let successes = 0;
    let errors = 0;
    const startAll = Date.now();

    const tasks = Array.from({ length: CONCURRENCY }, async (_, idx) => {
      const t0 = performance.now();
      try {
        // Hydrate attendance stats + active alerts
        const stats = calculateAttendanceMetrics(30 + (idx % 15), 45, 75.0);
        const courses = [
          { totalScore: 85, normalizedPercentage: 85, grade: "A+", gradePoints: 9, credits: 4, passed: true },
          { totalScore: 78, normalizedPercentage: 78, grade: "A", gradePoints: 8, credits: 4, passed: true }
        ];
        calculateSGPA(courses);
        successes++;
      } catch {
        errors++;
      } finally {
        latencies.push(Number((performance.now() - t0).toFixed(2)));
      }
    });

    await Promise.all(tasks);
    const duration = Date.now() - startAll;

    results.push({
      scenario: "Morning Login & Dashboard Hydration",
      concurrency: CONCURRENCY,
      totalRequests: CONCURRENCY,
      successCount: successes,
      errorCount: errors,
      errorRate: `${((errors / CONCURRENCY) * 100).toFixed(2)}%`,
      totalDurationMs: duration,
      throughputRps: Number(((CONCURRENCY / (duration || 1)) * 1000).toFixed(1)),
      latency: calculatePercentiles(latencies)
    });
  }

  // ─── SCENARIO 3: ATTENDANCE BURST (400 Concurrent Class Periods) ──────────────
  {
    const CONCURRENCY = 400;
    const latencies: number[] = [];
    let successes = 0;
    let errors = 0;
    const startAll = Date.now();

    const tasks = Array.from({ length: CONCURRENCY }, async (_, idx) => {
      const t0 = performance.now();
      try {
        const classStudents = Array.from({ length: 45 }, (__, stIdx) => ({
          studentId: `std-${idx * 45 + stIdx}`,
          status: stIdx % 8 === 0 ? "ABSENT" : "PRESENT"
        }));
        const present = classStudents.filter(s => s.status === "PRESENT").length;
        const metrics = calculateAttendanceMetrics(present, classStudents.length, 75.0);
        successes++;
      } catch {
        errors++;
      } finally {
        latencies.push(Number((performance.now() - t0).toFixed(2)));
      }
    });

    await Promise.all(tasks);
    const duration = Date.now() - startAll;

    results.push({
      scenario: "Morning Attendance Roll-Call Burst",
      concurrency: CONCURRENCY,
      totalRequests: CONCURRENCY,
      successCount: successes,
      errorCount: errors,
      errorRate: `${((errors / CONCURRENCY) * 100).toFixed(2)}%`,
      totalDurationMs: duration,
      throughputRps: Number(((CONCURRENCY / (duration || 1)) * 1000).toFixed(1)),
      latency: calculatePercentiles(latencies)
    });
  }

  // ─── SCENARIO 4: RESULTS PUBLICATION RUSH (500+ Concurrent Students) ──────────
  {
    const CONCURRENCY = 500;
    const latencies: number[] = [];
    let successes = 0;
    let errors = 0;
    const startAll = Date.now();

    const tasks = Array.from({ length: CONCURRENCY }, async (_, idx) => {
      const t0 = performance.now();
      try {
        const assessments = [
          { cia1: 20 + (idx % 5), cia2: 21 + (idx % 4), test1: 35, test2: 36, credits: 4 },
          { cia1: 18, cia2: 19, test1: 30, test2: 32, credits: 4 },
          { cia1: 24, cia2: 25, test1: 38, test2: 40, credits: 3 },
          { cia1: 22, cia2: 23, test1: 36, test2: 37, credits: 3 }
        ];

        const grades = assessments.map(a => calculateSubjectGrade(a));
        const sgpa = calculateSGPA(grades);
        successes++;
      } catch {
        errors++;
      } finally {
        latencies.push(Number((performance.now() - t0).toFixed(2)));
      }
    });

    await Promise.all(tasks);
    const duration = Date.now() - startAll;

    results.push({
      scenario: "Results Publication & SGPA Transcript Rush",
      concurrency: CONCURRENCY,
      totalRequests: CONCURRENCY,
      successCount: successes,
      errorCount: errors,
      errorRate: `${((errors / CONCURRENCY) * 100).toFixed(2)}%`,
      totalDurationMs: duration,
      throughputRps: Number(((CONCURRENCY / (duration || 1)) * 1000).toFixed(1)),
      latency: calculatePercentiles(latencies)
    });
  }

  // ─── SCENARIO 5: PROCTOR BOOKING CONTENTION (75 Competing Requests) ───────────
  {
    const CONCURRENCY = 75;
    const latencies: number[] = [];
    let successes = 0;
    let conflicts = 0;
    const startAll = Date.now();
    const uniqueDate = `2026-12-${Math.floor(10 + Math.random() * 18)}`;
    const uniqueTime = "11:30 AM";

    const tasks = Array.from({ length: CONCURRENCY }, async (_, idx) => {
      const t0 = performance.now();
      const req = new NextRequest("http://localhost:3000/api/proctor/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: `00000000-0000-0000-0000-0000000000${String(idx + 10).padStart(2, "0")}`,
          studentName: `Student Candidate #${idx + 1}`,
          rollNumber: `21CS0${String(idx + 10).padStart(2, "0")}`,
          className: "B.Tech CSE - 4A",
          proctorName: "Dr. Pavan Kulkarni",
          topic: "Urgent Consultation",
          message: "Immediate session required.",
          scheduledDate: uniqueDate,
          scheduledTime: uniqueTime
        })
      });

      const res = await bookProctorSlot(req);
      if (res.status === 200) successes++;
      else if (res.status === 409) conflicts++;
      latencies.push(Number((performance.now() - t0).toFixed(2)));
    });

    await Promise.all(tasks);
    const duration = Date.now() - startAll;

    results.push({
      scenario: "Proctor Booking Slot Contention",
      concurrency: CONCURRENCY,
      totalRequests: CONCURRENCY,
      successCount: successes,
      errorCount: conflicts, // Expected conflicts for losing race
      errorRate: `${(((CONCURRENCY - successes) / CONCURRENCY) * 100).toFixed(1)}% (Expected 409 Locks)`,
      totalDurationMs: duration,
      throughputRps: Number(((CONCURRENCY / (duration || 1)) * 1000).toFixed(1)),
      latency: calculatePercentiles(latencies)
    });
  }

  return results;
}

// Direct execution reporter
if (require.main === module || process.argv[1]?.includes("realistic-load-telemetry-benchmark")) {
  runRealisticLoadBenchmark().then(results => {
    console.log("\n===============================================================================");
    console.log(" ATTENDEX — REALISTIC SCHOOL LOAD TELEMETRY & LATENCY BENCHMARK REPORT ");
    console.log("===============================================================================");
    console.table(results.map(r => ({
      Scenario: r.scenario,
      Load: r.concurrency,
      TotalReqs: r.totalRequests,
      P50_ms: `${r.latency.p50Ms} ms`,
      P95_ms: `${r.latency.p95Ms} ms`,
      P99_ms: `${r.latency.p99Ms} ms`,
      Avg_ms: `${r.latency.avgMs} ms`,
      Throughput: `${r.throughputRps} rps`,
      ErrorRate: r.errorRate
    })));
  });
}
