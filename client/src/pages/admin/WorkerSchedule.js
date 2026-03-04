import React, { useEffect, useMemo, useState } from 'react';
import { listSchedules, upsertSchedule, updateScheduleAssignments, getScheduleByWeek } from '../../services/adminService';
import './WorkerSchedule.css';

// Helpers
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const sundayOf = (d) => {
  const dt = new Date(d);
  const day = dt.getDay();
  dt.setDate(dt.getDate() - day);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const WorkerSchedule = () => {
  const today = useMemo(() => new Date(), []);

  const [weekStart, setWeekStart] = useState(iso(sundayOf(today)));
  const [weekEnd, setWeekEnd] = useState(() => {
    const end = sundayOf(today);
    end.setDate(end.getDate() + 6);
    return iso(end);
  });
  
  // Get minimum allowed date (current week start)
  const minDate = useMemo(() => {
    const currentWeekStart = sundayOf(today);
    return iso(currentWeekStart);
  }, [today]);
  
  const [form, setForm] = useState({
    morningStart: '09:00',
    morningEnd: '17:00',
    eveningStart: '13:00',
    eveningEnd: '21:00',
  });
  const [assignments, setAssignments] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-calculate week end when week start changes
  useEffect(() => {
    if (weekStart) {
      const start = new Date(weekStart);
      start.setDate(start.getDate() + 6);
      setWeekEnd(iso(start));
    }
  }, [weekStart]);

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await listSchedules({});
      setList(Array.isArray(items) ? items : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const loadWeek = async () => {
    setError('');
    try {
      const data = await getScheduleByWeek(weekStart);
      if (data) {
        setForm({
          morningStart: data.morningStart || '09:00',
          morningEnd: data.morningEnd || '17:00',
          eveningStart: data.eveningStart || '13:00',
          eveningEnd: data.eveningEnd || '21:00',
        });
        setAssignments(
          Array.isArray(data.assignments)
            ? data.assignments.map((a) => ({ staff: a.staff, shiftType: a.shiftType }))
            : []
        );
      } else {
        setAssignments([]);
      }
    } catch {
      setAssignments([]);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const onUpsert = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await upsertSchedule({ weekStart, ...form, assignments });
      await fetchList();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Failed to save');
    }
  };

  const onAssignmentsSave = async () => {
    try {
      const current = await getScheduleByWeek(weekStart);
      if (!current?._id) throw new Error('Create the schedule first');
      await updateScheduleAssignments(current._id, assignments);
      await fetchList();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Failed to update assignments');
    }
  };

  const addAssignment = () => setAssignments((a) => [...a, { staff: '', shiftType: 'Morning' }]);
  const updateAssignment = (idx, key, val) =>
    setAssignments((a) => a.map((x, i) => (i === idx ? { ...x, [key]: val } : x)));
  const removeAssignment = (idx) => setAssignments((a) => a.filter((_, i) => i !== idx));

  const createNewSchedule = () => {
    // Reset to next week's Sunday
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextSunday = sundayOf(nextWeek);
    const nextSaturday = new Date(nextSunday);
    nextSaturday.setDate(nextSaturday.getDate() + 6);
    
    setWeekStart(iso(nextSunday));
    setWeekEnd(iso(nextSaturday));
    
    // Reset form to defaults
    setForm({
      morningStart: '09:00',
      morningEnd: '17:00',
      eveningStart: '13:00',
      eveningEnd: '21:00',
    });
    setAssignments([]);
    setError('');
  };

  return (
    <div className="worker-schedule-container">
      <div className="schedule-header">
        <h2>Worker Schedule</h2>
        <button type="button" onClick={createNewSchedule} className="btn-create-new">
          + Create New
        </button>
      </div>

      <form onSubmit={onUpsert}>
        {/* Week Selection */}
        <div className="week-section">
          <label>Select Week</label>
          <div className="date-inputs">
            <div>
              <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Start Date (Sunday)</label>
              <input 
                type="date" 
                value={weekStart} 
                min={minDate}
                onChange={(e) => setWeekStart(e.target.value)} 
                required
              />
            </div>
            <div>
              <label style={{ fontWeight: 'normal', fontSize: '13px' }}>End Date (Saturday)</label>
              <input 
                type="date" 
                value={weekEnd} 
                readOnly
                style={{ backgroundColor: '#e9ecef' }}
              />
            </div>
          </div>
          <div className="help-text">
            Only current week and future weeks are allowed. End date is automatically calculated.
          </div>
        </div>

        {/* Time Settings */}
        <div className="shift-times-section">
          <h3>Shift Times</h3>
          <div className="time-inputs">
            <div className="time-input-group">
              <label>Morning Start</label>
              <input
                type="time"
                value={form.morningStart}
                onChange={(e) => setForm((s) => ({ ...s, morningStart: e.target.value }))}
                required
              />
            </div>
            <div className="time-input-group">
              <label>Morning End</label>
              <input
                type="time"
                value={form.morningEnd}
                onChange={(e) => setForm((s) => ({ ...s, morningEnd: e.target.value }))}
                required
              />
            </div>
            <div className="time-input-group">
              <label>Evening Start</label>
              <input
                type="time"
                value={form.eveningStart}
                onChange={(e) => setForm((s) => ({ ...s, eveningStart: e.target.value }))}
                required
              />
            </div>
            <div className="time-input-group">
              <label>Evening End</label>
              <input
                type="time"
                value={form.eveningEnd}
                onChange={(e) => setForm((s) => ({ ...s, eveningEnd: e.target.value }))}
                required
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-save-schedule">
          Save Schedule
        </button>
      </form>

      <div className="assignments-section">
        <h3>Assignments</h3>
        <button type="button" onClick={addAssignment} className="btn-add-assignment">
          + Add Assignment
        </button>
        <div>
          {assignments.map((a, idx) => (
            <div key={idx} className="assignment-item">
              <input
                placeholder="Staff ID"
                value={a.staff}
                onChange={(e) => updateAssignment(idx, 'staff', e.target.value)}
              />
              <select 
                value={a.shiftType} 
                onChange={(e) => updateAssignment(idx, 'shiftType', e.target.value)}
              >
                <option>Morning</option>
                <option>Evening</option>
              </select>
              <button onClick={() => removeAssignment(idx)} type="button" className="btn-remove">
                Remove
              </button>
            </div>
          ))}
          {!assignments.length && <div className="no-assignments">No assignments</div>}
        </div>
        {assignments.length > 0 && (
          <button type="button" onClick={onAssignmentsSave} className="btn-save-assignments">
            Save Assignments
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="history-section">
        <h3>Schedule History</h3>
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : list.length > 0 ? (
          <div className="history-list">
            {list.map((s) => (
              <div key={s._id} className="history-item">
                <div className="history-item-week">Week: {iso(s.weekStart)}</div>
                <div className="history-item-times">
                  Morning: {s.morningStart} - {s.morningEnd} | Evening: {s.eveningStart} - {s.eveningEnd}
                </div>
                <div className="history-item-assignments">
                  Assignments: {s.assignments?.length || 0}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data-text">No schedules found</div>
        )}
      </div>
    </div>
  );
};

export default WorkerSchedule;
