import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { api } from '../api';
import { User, MeetingRecord, AttendanceEntry } from '../types';
import jsPDF from 'jspdf';
import {
  Calendar,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  Users,
  IndianRupee,
  Building,
  Save,
  Printer,
} from 'lucide-react';

interface MeetingMinutesManagerProps {
  groupId: string;
  groupName: string;
  members: User[];
}

export const MeetingMinutesManager: React.FC<MeetingMinutesManagerProps> = ({
  groupId,
  groupName,
  members,
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);

  // New Meeting Form
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('Weekly Group Savings & Micro-Credit Assessment');
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [savingsCollected, setSavingsCollected] = useState<string>('2000');
  const [resolutions, setResolutions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await api.getMeetings();
      // Filter for this group or show all if super admin
      const groupMeetings = user?.role === 'SUPER_ADMIN' ? data : data.filter((m) => m.group_id === groupId);
      setMeetings(groupMeetings);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [groupId]);

  // Initialize attendance for all members
  useEffect(() => {
    const initial: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    members.forEach((m) => {
      initial[m.id] = 'PRESENT';
    });
    setAttendance(initial);
  }, [members]);

  const handleAttendanceToggle = (memberId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendance((prev) => ({ ...prev, [memberId]: status }));
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);

      const attendanceList: AttendanceEntry[] = members.map((m) => ({
        user_id: m.id,
        user_name: m.name,
        status: attendance[m.id] || 'PRESENT',
      }));

      await api.createMeeting({
        group_id: groupId,
        date: meetingDate,
        topic: topic.trim(),
        attendance: attendanceList,
        total_savings_collected: Number(savingsCollected) || 0,
        resolutions: resolutions.trim(),
      });

      setMessage('Meeting Minutes & Member Attendance successfully recorded!');
      await fetchMeetings();
      setTimeout(() => {
        setShowNewMeetingModal(false);
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate & Download Official PDF Report using jsPDF
  const exportMeetingPdf = (meeting: MeetingRecord) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [11, 25, 44]; // Deep Navy
    const accentColor = [5, 150, 105]; // Emerald

    // Header Title
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MAGALIR KUZHU MANAGEMENT SYSTEM', 105, 12, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Meeting Minutes (MoM) & Attendance Record', 105, 20, { align: 'center' });

    // Group Information Box
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Self-Help Group: ${meeting.group_name}`, 14, 38);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Meeting: ${meeting.date}`, 14, 45);
    doc.text(`Recorded By: ${meeting.created_by_name}`, 120, 45);
    doc.text(`Topic / Agenda: ${meeting.topic}`, 14, 52);
    doc.text(`Total Savings Deposited: Rs. ${meeting.total_savings_collected.toLocaleString('en-IN')}`, 120, 52);

    // Horizontal Rule
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 57, 196, 57);

    // Attendance Summary
    const presentCount = meeting.attendance.filter((a) => a.status === 'PRESENT').length;
    const absentCount = meeting.attendance.filter((a) => a.status === 'ABSENT').length;
    const lateCount = meeting.attendance.filter((a) => a.status === 'LATE').length;
    const totalMembers = meeting.attendance.length;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. Member Attendance Register', 14, 65);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Attendance Rate: ${totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0}% (${presentCount} Present, ${absentCount} Absent, ${lateCount} Late out of ${totalMembers} total)`,
      14,
      71
    );

    // Attendance Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 75, 182, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('#', 18, 80);
    doc.text('Member Full Name', 30, 80);
    doc.text('Attendance Status', 130, 80);

    let y = 88;
    meeting.attendance.forEach((att, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(`${idx + 1}.`, 18, y);
      doc.text(att.user_name, 30, y);

      if (att.status === 'PRESENT') {
        doc.setTextColor(5, 150, 105);
        doc.text('PRESENT', 130, y);
      } else if (att.status === 'ABSENT') {
        doc.setTextColor(225, 29, 72);
        doc.text('ABSENT', 130, y);
      } else {
        doc.setTextColor(217, 119, 6);
        doc.text('LATE', 130, y);
      }
      doc.setTextColor(30, 41, 59);

      // Light row border
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 2, 196, y + 2);
      y += 7;
    });

    // Resolutions Section
    y += 6;
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. Collective Decisions & Resolutions Passed', 14, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitResolutions = doc.splitTextToSize(
      meeting.resolutions || 'No formal resolutions recorded for this meeting.',
      180
    );
    doc.text(splitResolutions, 14, y);
    y += splitResolutions.length * 5 + 15;

    // Signatures
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Group Admin Signature', 24, y);
    doc.text('Super Admin / Central Auditor', 125, y);

    doc.setDrawColor(148, 163, 184);
    doc.line(20, y - 5, 80, y - 5);
    doc.line(120, y - 5, 185, y - 5);

    // Save PDF
    const filename = `MoM_${meeting.group_name.replace(/\s+/g, '_')}_${meeting.date}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>{t.meetingMinutes}</span>
          </h3>
          <p className="text-xs text-slate-400">
            {language === 'ta'
              ? 'வாராந்திர வருகைப்பதிவு, சேமிப்பு தொகை மற்றும் தீர்மானங்களை பதிவு செய்து PDF அறிக்கையாக பதிவிறக்குக.'
              : 'Record attendance, weekly savings deposits, and export official MoM reports.'}
          </p>
        </div>

        <button
          onClick={() => setShowNewMeetingModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow inline-flex items-center space-x-1.5 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'ta' ? '+ புதிய கூட்ட குறிப்பு' : '+ Record New Meeting'}</span>
        </button>
      </div>

      {meetings.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs border border-slate-800 rounded-xl">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-white">No Meeting Minutes logged yet</p>
          <p className="mt-1">
            Log weekly member attendance, savings, and collective resolutions to generate PDF reports.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((m) => {
            const present = m.attendance.filter((a) => a.status === 'PRESENT').length;
            const absent = m.attendance.filter((a) => a.status === 'ABSENT').length;
            const late = m.attendance.filter((a) => a.status === 'LATE').length;

            return (
              <div
                key={m.id}
                className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700">
                  <div>
                    <h4 className="text-sm font-bold text-white">{m.topic}</h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{m.date}</span>
                      <span className="text-slate-600">·</span>
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.group_name}</span>
                      <span className="text-slate-600">·</span>
                      <span>By {m.created_by_name}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => exportMeetingPdf(m)}
                    className="px-3.5 py-1.5 bg-slate-700 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow inline-flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{t.downloadPdf}</span>
                  </button>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Total Savings:</span>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">
                      ₹{m.total_savings_collected.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Present:</span>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">{present}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Absent:</span>
                    <div className="font-bold text-rose-400 text-sm mt-0.5">{absent}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Late:</span>
                    <div className="font-bold text-amber-400 text-sm mt-0.5">{late}</div>
                  </div>
                </div>

                {/* Resolutions preview */}
                {m.resolutions && (
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">Decisions & Resolutions: </span>
                    <span className="italic">{m.resolutions}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RECORD NEW MEETING MODAL */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center">
                <Calendar className="w-5 h-5 text-emerald-400 mr-2" />
                <span>{t.recordMeeting}</span>
              </h3>
              <button
                onClick={() => setShowNewMeetingModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {message && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg">
                {message}
              </div>
            )}

            <form onSubmit={handleSaveMeeting} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Meeting Date</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {t.totalSavings}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={savingsCollected}
                    onChange={(e) => setSavingsCollected(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Topic / Agenda</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              {/* Attendance Checklist */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Member Attendance Register ({members.length} Members)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const currentStatus = attendance[m.id] || 'PRESENT';
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between"
                      >
                        <span className="font-semibold text-white">{m.name}</span>
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => handleAttendanceToggle(m.id, 'PRESENT')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.present}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceToggle(m.id, 'ABSENT')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.absent}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceToggle(m.id, 'LATE')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.late}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolutions */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {t.resolutionsNotes}
                </label>
                <textarea
                  rows={3}
                  value={resolutions}
                  onChange={(e) => setResolutions(e.target.value)}
                  placeholder="e.g. Approved micro-loan application for Smt. Lakshmi for tailoring supplies; scheduled next meeting for next Friday."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMeetingModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save & Prepare PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
