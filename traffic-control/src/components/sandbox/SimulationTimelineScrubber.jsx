import React, { useState, useEffect } from 'react';
import { trafficStore } from '../../services/trafficStore';

export default function SimulationTimelineScrubber({ cityId, onTimeChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(1.0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    return () => {
      trafficStore.pauseSimulation();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      trafficStore.pauseSimulation();
      setIsPlaying(false);
    } else {
      trafficStore.setSimulationSpeed(speed);
      trafficStore.startSimulation(cityId, (t) => {
        setCurrentTime(t);
        if (onTimeChange) onTimeChange(t);
      });
      setIsPlaying(true);
    }
  };

  const handleSliderChange = (newVal) => {
    const val = Number(newVal);
    setCurrentTime(val);
    trafficStore.simulationState.currentTimeHours = val;
    if (onTimeChange) onTimeChange(val);
  };

  const handleSpeedSelect = (multiplier) => {
    setSpeed(multiplier);
    trafficStore.setSimulationSpeed(multiplier);
  };

  const handleReset = () => {
    trafficStore.pauseSimulation();
    setIsPlaying(false);
    setCurrentTime(1.0);
    trafficStore.simulationState.currentTimeHours = 1.0;
    if (onTimeChange) onTimeChange(1.0);
  };

  return (
    <div className="simulation-scrubber-bar">
      {/* Play / Pause */}
      <button
        onClick={handleTogglePlay}
        className="btn btn-primary"
        style={{
          padding: '0.35rem 0.75rem',
          fontSize: '0.75rem',
          borderRadius: 'var(--radius-pill)',
        }}
      >
        <span>{isPlaying ? '⏸️ PAUSE' : '▶ PLAY'}</span>
      </button>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="btn btn-ghost"
        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
        title="Reset to T=1.0h"
      >
        ↺
      </button>

      {/* Time Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
          T = {currentTime.toFixed(1)}h / 3.0h
        </span>
        <span style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
          (Peak Curve)
        </span>
      </div>

      {/* Scrubber Range Input */}
      <input
        type="range"
        min="0.0"
        max="3.0"
        step="0.1"
        value={currentTime}
        onChange={(e) => handleSliderChange(e.target.value)}
        style={{ width: '160px', cursor: 'pointer' }}
      />

      {/* Speed Multiplier Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--color-surface-1)', padding: '2px', borderRadius: 'var(--radius-pill)' }}>
        {[1, 2, 5].map((s) => (
          <button
            key={s}
            onClick={() => handleSpeedSelect(s)}
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: speed === s ? 'var(--color-primary)' : 'transparent',
              color: speed === s ? '#ffffff' : 'var(--color-text-secondary)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
