'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  event_metadata: any | null;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { showToast } = useToast();

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs', {
        params: { page: pageNum, page_size: 20 },
      });
      setLogs(res.data.items);
      setTotal(res.data.total);
      setPage(pageNum);
    } catch (err: any) {
      showToast('Failed to load audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <style>{`
        .logs-header {
          margin-bottom: 2rem;
        }
        .logs-header h1 {
          font-family: 'Libre Caslon Text', serif;
          font-size: 2rem;
          color: #f2ca50;
          margin-bottom: 0.5rem;
        }
        .logs-header p {
          color: rgba(153, 144, 124, 0.8);
          font-size: 0.95rem;
        }
        
        .logs-table-container {
          background: rgba(13, 8, 4, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .logs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        
        .logs-table th {
          background: rgba(212, 175, 55, 0.05);
          padding: 1rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #f2ca50;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        }
        
        .logs-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.05);
          color: #eae1d4;
          font-size: 0.85rem;
        }
        
        .logs-table tr:hover {
          background: rgba(212, 175, 55, 0.02);
        }

        .view-btn {
          background: rgba(212, 175, 55, 0.1);
          color: #f2ca50;
          border: 1px solid rgba(212, 175, 55, 0.2);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        
        .view-btn:hover {
          background: rgba(212, 175, 55, 0.2);
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
          color: #99907c;
          font-size: 0.85rem;
        }

        .page-btn {
          background: none;
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #f2ca50;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: #110804;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        
        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          color: #eae1d4;
          font-size: 0.85rem;
        }
        
        pre {
          background: rgba(0,0,0,0.5);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          overflow-x: auto;
        }
      `}</style>

      <div className="logs-header">
        <h1>Audit Logs</h1>
        <p>Immutable record of system events and security actions.</p>
      </div>

      <div className="logs-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#f2ca50' }}>Loading...</div>
        ) : (
          <>
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User ID</th>
                  <th>IP Address</th>
                  <th>Resource</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>
                      <span style={{ 
                        color: log.action.includes('FAILED') ? '#ff6b6b' : '#69db7c' 
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.user_id ? log.user_id.split('-')[0] + '...' : 'System'}</td>
                    <td>{log.ip_address || 'N/A'}</td>
                    <td>{log.resource ? \`\${log.resource} (\${log.resource_id || ''})\` : '-'}</td>
                    <td>
                      <button className="view-btn" onClick={() => setSelectedLog(log)}>View</button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No audit logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className="pagination">
              <span>Showing {logs.length} of {total} logs</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="page-btn" 
                  disabled={page === 1} 
                  onClick={() => fetchLogs(page - 1)}
                >
                  Prev
                </button>
                <button 
                  className="page-btn" 
                  disabled={page >= totalPages} 
                  onClick={() => fetchLogs(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: '#f2ca50' }}>Log Details: {selectedLog.action}</h3>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', color: '#99907c', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <strong>User Agent:</strong> {selectedLog.user_agent || 'N/A'}
              </div>
              <div>
                <strong>Event Metadata:</strong>
                {selectedLog.event_metadata ? (
                  <pre>{JSON.stringify(selectedLog.event_metadata, null, 2)}</pre>
                ) : (
                  <p style={{ color: '#99907c' }}>No additional metadata.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
