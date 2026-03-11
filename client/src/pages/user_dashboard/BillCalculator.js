import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

// Bill Calculator: amount = latexVolume (L) * (DRC%/100) * marketRate
// Fetch marketRate from combined endpoint; fallback to latest/admin or default.
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BillCalculator = () => {
  const location = useLocation();
  const [volume, setVolume] = useState('');
  const [drc, setDrc] = useState('');
  const [marketRate, setMarketRate] = useState('');
  const [rateErr, setRateErr] = useState('');

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0, max = Infinity) => {
    if (value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) return '';
    return value;
  };

  const computed = useMemo(() => {
    const v = parseFloat(volume);
    const d = parseFloat(drc);
    const r = parseFloat(marketRate);
    if (isNaN(v) || isNaN(d) || isNaN(r)) return 0;
    return +(v * (d / 100) * r).toFixed(2);
  }, [volume, drc, marketRate]);

  // Prefill from URL query params if provided
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qVol = params.get('volume');
    const qDrc = params.get('drc');
    const qRate = params.get('rate');
    if (qVol != null) setVolume(qVol);
    if (qDrc != null) setDrc(qDrc);
    if (qRate != null) setMarketRate(qRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRate = async () => {
    setRateErr('');
    try {
      // Try combined latex today endpoint
      const res = await axios.get(`${API}/api/rates/latex/today`);
      const markets = res.data?.market?.markets || {};
      // Prefer Kottayam, then Kochi, else any numeric
      const preferred = ['Kottayam', 'Kochi'];
      let rate = null;
      for (const k of preferred) {
        if (typeof markets[k] === 'number') { rate = markets[k]; break; }
      }
      if (rate == null) {
        const values = Object.values(markets).filter(v => typeof v === 'number');
        rate = values.length ? values[0] : null;
      }
      if (rate == null && res.data?.admin?.marketRate) {
        rate = res.data.admin.marketRate;
      }
      if (rate == null) {
        throw new Error('Live rate not available');
      }
      setMarketRate(String(rate));
    } catch (e) {
      setRateErr(e.response?.data?.message || e.message);
      // Fallback to latest published admin rate
      try {
        const latest = await axios.get(`${API}/api/rates/published/latest`);
        if (latest.data?.marketRate) {
          setMarketRate(String(latest.data.marketRate));
          return;
        }
      } catch (_) {}
      // Final fallback default
      setMarketRate(prev => prev || '120');
    }
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h2>Bill Calculator</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        <label>
          Latex Volume (L)
          <input type="number" min={0} step="0.01" value={volume} onChange={(e) => {
            const validated = validateNumberInput(e.target.value, 0);
            setVolume(validated);
          }} />
        </label>
        <label>
          DRC (%)
          <input type="number" min={0} max={100} step="0.01" value={drc} onChange={(e) => {
            const validated = validateNumberInput(e.target.value, 0, 100);
            setDrc(validated);
          }} />
        </label>
        <label>
          Market Rate (per kg of DRC)
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" min={0} step="0.01" value={marketRate} onChange={(e) => {
              const validated = validateNumberInput(e.target.value, 0);
              setMarketRate(validated);
            }} />
            <button className="btn" type="button" onClick={loadRate}>Use Live Rate</button>
          </div>
          {rateErr && <div style={{ color: '#fca5a5' }}>{rateErr}</div>}
        </label>
        <div>
          <strong>Estimated Amount:</strong> {computed} (currency)
        </div>
      </div>
    </div>
  );
};

export default BillCalculator;