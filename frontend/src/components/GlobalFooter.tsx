import React from 'react';

export default function GlobalFooter({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', ...style }}>
      <p style={{ fontSize: '0.75rem', color: '#99907c', margin: 0, textAlign: 'center' }}>
        © {new Date().getFullYear()} LuxeShake. All rights reserved. | Powered by <a href="https://mandell.tech" target="_blank" rel="noopener noreferrer" style={{ color: '#d4af37', textDecoration: 'none' }}>MandelTech</a>.
      </p>
    </div>
  );
}
