'use client';

import { useState, useEffect } from 'react';
import VideoUploader from '@/components/VideoUploader';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import AnalysisHistory from '@/components/AnalysisHistory';

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('baseball_coach_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (result, videoUrl) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      result,
      videoUrl,
    };
    const updatedHistory = [newEntry, ...history].slice(0, 10); // Keep last 10
    setHistory(updatedHistory);
    localStorage.setItem('baseball_coach_history', JSON.stringify(updatedHistory));
  };

  const handleAnalyze = async (file, previewUrl) => {
    setAnalyzing(true);
    setProgress(0);
    setAnalysisResult(null);
    setVideoUrl(previewUrl);
    setError(null);

    // Simulated progress bar logic
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) return prev + Math.random() * 5;
        return prev;
      });
    }, 1000);

    try {
      setStatusMessage('Uploading video to coach...');
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

      setStatusMessage('Coach is reviewing your mechanics...');
      const data = await response.json();
      
      setProgress(100);
      setAnalysisResult(data);
      saveToHistory(data, previewUrl);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setAnalyzing(false);
    }
  };

  const handleSelectHistory = (entry) => {
    setAnalysisResult(entry.result);
    setVideoUrl(entry.videoUrl);
    setShowHistory(false);
  };

  return (
    <main className="app-container">
      <section className="hero-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="hero-title">AI Baseball Coach</h1>
            <p className="hero-subtitle">
              Upload your batting or pitching motion and let Gemini multimodal AI 
              analyze your mechanics and provide professional-grade feedback.
            </p>
          </div>
          {!analyzing && history.length > 0 && (
            <button 
              className="btn-secondary" 
              onClick={() => setShowHistory(!showHistory)}
              style={{ padding: '0.5rem 1rem' }}
            >
              {showHistory ? 'Back to Upload' : `History (${history.length})`}
            </button>
          )}
        </div>
      </section>

      {showHistory ? (
        <AnalysisHistory history={history} onSelect={handleSelectHistory} />
      ) : (
        <>
          {!analysisResult && !analyzing && (
            <VideoUploader onAnalyze={handleAnalyze} />
          )}

          {analyzing && (
            <div className="loader-container glass-panel" style={{ padding: '3rem' }}>
              <div className="spinner"></div>
              <h3 className="loading-text" style={{ marginTop: '2rem' }}>{statusMessage}</h3>
              <div className="progress-bar-container" style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '2rem', overflow: 'hidden' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${progress}%`, 
                    height: '100%', 
                    background: 'var(--primary)', 
                    boxShadow: '0 0 15px var(--primary)',
                    transition: 'width 0.5s ease' 
                  }}
                ></div>
              </div>
              <p className="loading-subtext" style={{ marginTop: '1rem' }}>
                {progress < 40 ? 'Securing your video file...' : 
                 progress < 80 ? 'Analyzing frame-by-frame body mechanics...' : 
                 'Syncing high-fidelity 3D animations...'}
              </p>
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
        </>
      )}
    </main>
  );
}
