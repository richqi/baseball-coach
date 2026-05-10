'use client';

import { Calendar, ChevronRight, Play } from 'lucide-react';

export default function AnalysisHistory({ history, onSelect }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="history-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar size={24} color="var(--primary)" />
        Recent Sessions
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {history.map((entry) => (
          <div 
            key={entry.id} 
            className="card glass-panel history-card" 
            onClick={() => onSelect(entry)}
            style={{ cursor: 'pointer', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
          >
            <div style={{ position: 'relative', height: '160px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
              <video 
                src={entry.videoUrl} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Play size={40} color="white" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>{entry.result.summary.split('.')[0]}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{entry.timestamp}</p>
              </div>
              <ChevronRight size={20} color="var(--text-secondary)" />
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .history-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary);
          box-shadow: 0 10px 30px rgba(0, 240, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
