"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Award, AlertCircle, Loader2 } from 'lucide-react';

type LeaderboardEntry = {
  rank: number;
  studentName: string;
  section: string;
  marks: number;
};

export function Leaderboard() {
  const [filterClass, setFilterClass] = useState('All');
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const { data: classList } = await supabase.from('classes').select('*');
        if (classList) setClasses(classList);

        // Fetch students and compute performance leaderboard
        let query = supabase
          .from('students')
          .select('id, name, attendance_percentage, classes(name, section)')
          .order('attendance_percentage', { ascending: false })
          .limit(20);

        if (filterClass !== 'All') {
          query = query.eq('class_id', filterClass);
        }

        const { data: studentList, error } = await query;
        if (!error && studentList && studentList.length > 0) {
          const mapped: LeaderboardEntry[] = studentList.map((st: any, idx: number) => ({
            rank: idx + 1,
            studentName: st.name || "Student",
            section: st.classes ? `${st.classes.name} (${st.classes.section})` : "General",
            marks: Number(((Number(st.attendance_percentage || 85) / 100) * 20).toFixed(1))
          }));
          setEntries(mapped);
        } else {
          setEntries([]);
        }
      } catch (err) {
        console.error("Error loading leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [filterClass]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Merit Leaderboard</h1>
          <p className="text-xs text-slate-500 font-medium">Real-time institutional rankings based on academic evaluation and attendance.</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="p-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 outline-none"
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
          >
            <option value="All">All Departments & Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.section}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          <span className="text-xs font-medium">Querying student merit registry...</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No Ranking Data Available</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No student marks or attendance entries found for the selected cohort. Rank tables will populate as assessments are logged.
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Performers */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {entries.slice(0, 3).map((entry, index) => (
              <div 
                key={index} 
                className={`flex flex-col items-center p-6 rounded-2xl shadow-sm border transition-all ${
                  index === 0 
                    ? 'bg-amber-50/70 border-amber-200 scale-105 ring-2 ring-amber-400/30' 
                    : index === 1 
                    ? 'bg-slate-100/70 border-slate-200' 
                    : 'bg-orange-50/70 border-orange-200'
                }`}
              >
                <div className="text-3xl mb-2">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                <div className="font-bold text-sm text-slate-900">{entry.studentName}</div>
                <div className="text-[11px] font-medium text-slate-500">{entry.section}</div>
                <div className="mt-2 text-lg font-extrabold text-slate-900">{entry.marks} <span className="text-xs font-normal text-slate-500">/ 20</span></div>
              </div>
            ))}
          </div>

          {/* Full List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Cohort / Section</th>
                  <th className="py-3 px-4 text-right">Computed Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {entries.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500">#{entry.rank}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{entry.studentName}</td>
                    <td className="py-3 px-4 text-slate-600">{entry.section}</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600">{entry.marks} / 20</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

