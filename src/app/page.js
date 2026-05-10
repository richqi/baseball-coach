'use client';

import { useState } from 'react';
import VideoUploader from '@/components/VideoUploader';
import AnalysisDashboard from '@/components/AnalysisDashboard';

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (file, previewUrl) => {
    setAnalyzing(true);
    setAnalysisResult(null);
    setVideoUrl(previewUrl);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze video');
      }

      const data = await response.json();
      setAnalysisResult(data);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <main className="app-container">
      <section className="hero-section">
        <h1 className="hero-title">AI Baseball Coach</h1>
        <p className="hero-subtitle">
          Upload your batting or pitching motion and let Gemini multimodal AI 
          analyze your mechanics and provide professional-grade feedback.
        </p>
      </section>

      {!analysisResult && !analyzing && (
        <VideoUploader onAnalyze={handleAnalyze} />
      )}

      {analyzing && (
        <div className="loader-container glass-panel">
          <div className="spinner"></div>
          <h3 className="loading-text">Analyzing your motion...</h3>
          <p className="loading-subtext">Our AI coach is reviewing every frame. This might take a moment.</p>
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--error)' }}>
          <h3 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Analysis Failed</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => setError(null)} style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      )}

      {analysisResult && !analyzing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Analysis Results</h2>
            <button className="btn-primary" onClick={() => setAnalysisResult(null)} style={{ marginTop: 0 }}>
              Analyze New Video
            </button>
          </div>
          <AnalysisDashboard videoUrl={videoUrl} analysis={analysisResult} />
        </div>
      )}
    </main>
  );
}
