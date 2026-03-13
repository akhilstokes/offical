import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './HangerSpace.css';
import { listHangerSpaces, seedHangerGrid, setHangerSpaceStatus, bulkSetHangerSpaceStatus } from '../../services/adminService';

const ROWS = ['D','E','F','G','H','I','J','K','L'];
// Column letters correspond to the grid columns (D-M)
const COLUMN_LETTERS = Array.from({ length: 10 }, (_, i) => String.fromCharCode('D'.charCodeAt(0) + i));

const HangerSpace = () => {
  const [slots, setSlots] = useState([]);
  const [bulk, setBulk] = useState({ block: 'B', status: 'vacant' });
  const [bulkRange, setBulkRange] = useState({ block: 'B', fromCol: COLUMN_LETTERS[0], toCol: COLUMN_LETTERS[COLUMN_LETTERS.length - 1], status: 'vacant' });
  const [highlightRange, setHighlightRange] = useState(null);
  const [loading, setLoading] = useState(false);

  const letterToCol = (letter) => {
    const idx = COLUMN_LETTERS.indexOf(letter);
    return idx >= 0 ? idx + 1 : 1;
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
    // Highlight the selected range instead of changing status/colors.
    setHighlightRange({
      block: bulkRange.block,
      fromCol: bulkRange.fromCol,
      toCol: bulkRange.toCol
    });
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
            {COLUMN_LETTERS.map(col => (
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
                          className={`slot ${status}${highlightRange && highlightRange.block === block && col >= letterToCol(highlightRange.fromCol) && col <= letterToCol(highlightRange.toCol) ? ' in-range' : ''}`}
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
            <select
              value={bulkRange.fromCol}
              onChange={e => setBulkRange({...bulkRange, fromCol: e.target.value})}
            >
              {COLUMN_LETTERS.map(letter => (
                <option key={letter} value={letter}>{letter}</option>
              ))}
            </select>
            <select
              value={bulkRange.toCol}
              onChange={e => setBulkRange({...bulkRange, toCol: e.target.value})}
            >
              {COLUMN_LETTERS.map(letter => (
                <option key={letter} value={letter}>{letter}</option>
              ))}
            </select>
            <select value={bulkRange.status} onChange={e => setBulkRange({...bulkRange, status: e.target.value})}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="empty_barrel">Empty Barrel</option>
              <option value="complete_bill">Complete Bill</option>
            </select>
            <button onClick={applyRange}>Apply Range</button>
            {highlightRange && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#cbd5e1' }}>
                Highlighting {highlightRange.block} columns {highlightRange.fromCol}–{highlightRange.toCol}
                <button
                  style={{
                    marginLeft: '10px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #64748b',
                    background: 'transparent',
                    color: '#cbd5e1',
                    cursor: 'pointer'
                  }}
                  onClick={() => setHighlightRange(null)}
                >
                  Clear
                </button>
              </div>
            )}
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
