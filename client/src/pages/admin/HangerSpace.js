import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './HangerSpace.css';
import { listHangerSpaces, seedHangerGrid, setHangerSpaceStatus, bulkSetHangerSpaceStatus } from '../../services/adminService';

const ROWS = ['D','E','F','G','H','I','J','K','L'];

const HangerSpace = () => {
  const [slots, setSlots] = useState([]);
  const [bulk, setBulk] = useState({ block: 'B', status: 'vacant' });
  const [bulkRange, setBulkRange] = useState({ block: 'B', fromCol: 1, toCol: 10, status: 'vacant' });
  const [loading, setLoading] = useState(false);

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 1, max = 10) => {
    if (value === '') return '';
    const num = parseInt(value);
    if (isNaN(num) || num < min || num > max) return '';
    return value;
  };

  const statusMap = useMemo(() => {
    const m = new Map();
    slots.forEach(slot => {
      m.set(`${slot.block}-${slot.row}-${slot.col}`, slot.status);
    });
    return m;
  }, [slots]);

  const stats = useMemo(() => ({
    total: slots.length,
    occupied: slots.filter(s => s.status === 'occupied').length
  }), [slots]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listHangerSpaces();
      setSlots(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ensureSeed = useCallback(async () => {
    if (slots.length === 0) {
      await seedHangerGrid();
      await load();
    }
  }, [slots.length]);

  useEffect(() => { load(); }, []);
  useEffect(() => { ensureSeed(); }, [ensureSeed]);

  const handleSlotClick = async (block, row, col) => {
    const slot = slots.find(s => s.block === block && s.row === row && s.col === col);
    if (!slot) return;

    const choice = window.prompt(
      `Set status for ${block}${row}${col}:\n1) Vacant\n2) Occupied\n3) Empty Barrel\n4) Complete Bill\n\nEnter 1-4:`,
      '1'
    );
    
    const statusMap = { '1': 'vacant', '2': 'occupied', '3': 'empty_barrel', '4': 'complete_bill' };
    const newStatus = statusMap[choice];
    if (!newStatus) return;

    try {
      await setHangerSpaceStatus(slot._id, newStatus, '');
      await load();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const applyBulk = async () => {
    const ids = slots.filter(s => s.block === bulk.block).map(s => s._id);
    if (!ids.length || !window.confirm(`Set ${ids.length} slots in Block ${bulk.block} to ${bulk.status}?`)) return;
    
    try {
      await bulkSetHangerSpaceStatus(ids, bulk.status);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const applyRange = async () => {
    const from = Math.max(1, Number(bulkRange.fromCol));
    const to = Math.max(from, Number(bulkRange.toCol));
    const ids = slots.filter(s => s.block === bulkRange.block && s.col >= from && s.col <= to).map(s => s._id);
    if (!ids.length || !window.confirm(`Set ${ids.length} slots to ${bulkRange.status}?`)) return;
    
    try {
      await bulkSetHangerSpaceStatus(ids, bulkRange.status);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="hanger-container">
      <div className="hanger-header">
        <div className="header-info">
          <h2>Hanger Free Space</h2>
          <p>Storage space management</p>
        </div>
        <div className="header-stats">
          <span>Total: {stats.total}</span>
          <span>Occupied: {stats.occupied}</span>
        </div>
        <div className="header-actions">
          <button onClick={load} disabled={loading}>Reload</button>
          <button onClick={async () => { await seedHangerGrid(); await load(); }}>Seed Grid</button>
        </div>
      </div>

      <div className="hanger-grid">
        <div className="grid-header">
          <div className="spacer"></div>
          <div className="column-labels-container">
            {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(col => (
              <div key={col} className="col-label">{col}</div>
            ))}
          </div>
          <div className="spacer"></div>
        </div>

        <div className="grid-body">
          <div className="row-labels left">
            {ROWS.map(r => <div key={r}>{r}</div>)}
          </div>

          <div className="block-container">
            {['A', 'B'].map(block => (
              <div key={block} className="hanger-block">
                {ROWS.map(row => (
                  <div key={row} className="hanger-row">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(col => {
                      const status = statusMap.get(`${block}-${row}-${col}`) || 'vacant';
                      return (
                        <div
                          key={col}
                          className={`slot ${status}`}
                          onClick={() => handleSlotClick(block, row, col)}
                          title={`${block}${row}${col} - ${status}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="row-labels right">
            {ROWS.map(r => <div key={r}>{r}</div>)}
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="control-card">
          <h3>Block Fill</h3>
          <div className="control-inputs">
            <select value={bulk.block} onChange={e => setBulk({...bulk, block: e.target.value})}>
              <option value="A">Block A</option>
              <option value="B">Block B</option>
            </select>
            <select value={bulk.status} onChange={e => setBulk({...bulk, status: e.target.value})}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="empty_barrel">Empty Barrel</option>
              <option value="complete_bill">Complete Bill</option>
            </select>
            <button onClick={applyBulk}>Apply</button>
          </div>
        </div>

        <div className="control-card">
          <h3>Column Range</h3>
          <div className="control-inputs">
            <select value={bulkRange.block} onChange={e => setBulkRange({...bulkRange, block: e.target.value})}>
              <option value="A">Block A</option>
              <option value="B">Block B</option>
            </select>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={bulkRange.fromCol} 
              onChange={e => {
                const validated = validateNumberInput(e.target.value, 1, 10);
                setBulkRange({...bulkRange, fromCol: validated === '' ? 1 : parseInt(validated)});
              }}
              placeholder="From"
            />
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={bulkRange.toCol} 
              onChange={e => {
                const validated = validateNumberInput(e.target.value, 1, 10);
                setBulkRange({...bulkRange, toCol: validated === '' ? 10 : parseInt(validated)});
              }}
              placeholder="To"
            />
            <select value={bulkRange.status} onChange={e => setBulkRange({...bulkRange, status: e.target.value})}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="empty_barrel">Empty Barrel</option>
              <option value="complete_bill">Complete Bill</option>
            </select>
            <button onClick={applyRange}>Apply Range</button>
          </div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><span className="slot vacant"></span> Vacant</div>
        <div className="legend-item"><span className="slot occupied"></span> Occupied</div>
        <div className="legend-item"><span className="slot empty_barrel"></span> Empty Barrel</div>
        <div className="legend-item"><span className="slot complete_bill"></span> Complete Bill</div>
      </div>
    </div>
  );
};

export default HangerSpace;
