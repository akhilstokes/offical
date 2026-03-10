import React, { useEffect, useState } from 'react';

function ManagerFaultyBarrels() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/damages?status=open', {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load');
        setItems(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const assign = async (id, assignedTo) => {
    try {
      const res = await fetch(`/api/damages/${id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ assignedTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to assign');
      setItems(prev => prev.filter(x => x._id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2>Manager: Faulty/Damaged Barrels</h2>
        <p className="text-muted">Review open damage tickets and assign next steps.</p>
        {loading && <div>Loading...</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {!loading && !items.length && <div className="text-muted">No open damages.</div>}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Barrel</th>
                <th>Type</th>
                <th>Lumb %</th>
                <th>Remarks</th>
                <th>Reported</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it._id}>
                  <td>{it.barrelId}</td>
                  <td>{it.damageType}</td>
                  <td>{it.lumbPercent ?? '-'}</td>
                  <td>{it.remarks || '-'}</td>
                  <td>{it.createdAt ? new Date(it.createdAt).toLocaleString() : '-'}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm" onClick={() => assign(it._id, 'lumb-removal')}>Lumb Removal</button>
                      <button className="btn btn-sm" onClick={() => assign(it._id, 'repair')}>Repair</button>
                      <button className="btn btn-sm" onClick={() => assign(it._id, 'scrap')}>Scrap</button>
                      <button className="btn btn-sm" onClick={() => assign(it._id, 'inspection')}>Inspection</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManagerFaultyBarrels;
