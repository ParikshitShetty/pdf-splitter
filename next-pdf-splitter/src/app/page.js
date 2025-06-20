"use client"

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [urls, setUrls] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch('/api/split', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    setUrls(result);
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧾 PDF Splitter</h1>
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '400px' }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          required
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            padding: '0.6rem 1.2rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {loading ? 'Splitting...' : 'Split PDF'}
        </button>
      </form>

      {urls && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <a href={urls.labelUrl} download="label.pdf" style={linkStyle}>📄 Download Label PDF</a>
          <a href={urls.invoiceUrl} download="invoice.pdf" style={linkStyle}>📄 Download Invoice PDF</a>
        </div>
      )}
    </div>
  );
}

const linkStyle = {
  backgroundColor: '#f5f5f5',
  padding: '0.8rem 1.2rem',
  border: '1px solid #ccc',
  borderRadius: '4px',
  textDecoration: 'none',
  color: '#333',
  display: 'inline-block',
  width: '100%',
  textAlign: 'center',
};
