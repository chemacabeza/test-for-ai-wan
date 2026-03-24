import React, { useState } from 'react';
import { createTextToVideoJob } from '../services/api';

// Per-model constraints sourced from fal.ai API docs (March 2026)
const MODELS = [
  {
    id: 'wan-2.6',
    label: 'Wan 2.6',
    url: 'https://fal.ai/models/fal-ai/wan/v2.6/text-to-video',
    durations: [5, 10, 15],
    aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16'],
  },
  {
    id: 'wan-2.2-a14b',
    label: 'Wan 2.2-A14B',
    url: 'https://fal.ai/models/fal-ai/wan/v2.2-a14b/text-to-video',
    durations: [5, 10, 15],
    aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16'],
  },
  {
    id: 'kling-v2.5-turbo',
    label: 'Kling v2.5 Turbo Pro',
    url: 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
    durations: [5, 10],
    aspectRatios: ['16:9', '9:16', '1:1'],
  },
  {
    id: 'ltx-2-19b',
    label: 'LTX-2 19B',
    url: 'https://fal.ai/models/fal-ai/ltx-2-19b/text-to-video',
    durations: [5, 10, 15],  // sent as num_frames on the backend
    aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16'],
  },
  {
    id: 'pixverse-v5',
    label: 'PixVerse v5',
    url: 'https://fal.ai/models/fal-ai/pixverse/v5/text-to-video',
    durations: [5, 8],
    aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16'],
  },
  {
    id: 'offline-ms-1.7b',
    label: 'Offline CPU (damo-ms-1.7b)',
    url: 'http://localhost:8088',
    durations: [4],
    aspectRatios: ['1:1'],
  },
];

const SAMPLE_PROMPTS = [
  'A lone astronaut walks across a glowing alien landscape at dusk, with twin moons rising on the horizon. Cinematic, photoreal, 4K.',
  'Cherry blossom petals drift in slow motion through a quiet Japanese garden. Soft morning light, warm golden haze, 24fps cinematic.',
  'An arctic fox trots across a frozen tundra under a vivid Northern Lights display. Wildlife documentary style, detailed fur texture.',
];

export default function TextToVideoForm({ onJobCreated }) {
  const [isOffline, setIsOffline] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('wan-2.6');
  const [form, setForm] = useState({
    prompt: '',
    negativePrompt: '',
    aspectRatio: '16:9',
    resolution: '1080p',
    duration: 5,
    enablePromptExpansion: true,
    multiShots: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const availableModels = MODELS.filter(m => isOffline ? m.id === 'offline-ms-1.7b' : m.id !== 'offline-ms-1.7b');
  const model = availableModels.find((m) => m.id === selectedModelId) || availableModels[0];

  React.useEffect(() => {
    if (isOffline) {
      setSelectedModelId('offline-ms-1.7b');
      setForm(f => ({ ...f, duration: 4, aspectRatio: '1:1' }));
    } else {
      if (selectedModelId === 'offline-ms-1.7b') {
        setSelectedModelId('wan-2.6');
        setForm(f => ({ ...f, duration: 5, aspectRatio: '16:9' }));
      }
    }
  }, [isOffline, selectedModelId]);

  const handleModelChange = (newId) => {
    const next = availableModels.find((m) => m.id === newId) || availableModels[0];
    setSelectedModelId(newId);
    // Clamp duration and aspect ratio to what the new model supports
    setForm((f) => ({
      ...f,
      duration: next.durations.includes(Number(f.duration)) ? f.duration : next.durations[0],
      aspectRatio: next.aspectRatios.includes(f.aspectRatio) ? f.aspectRatio : next.aspectRatios[0],
    }));
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const job = await createTextToVideoJob({
        ...form,
        model: model.id,
        duration: Number(form.duration),
      });
      setSuccess(true);
      onJobCreated(job);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.errors ||
        err.message ||
        'Failed to create job'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-error">
          ⚠️ {typeof error === 'object' ? JSON.stringify(error) : error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          ✅ Job submitted! It will appear in the gallery below shortly.
        </div>
      )}

      {/* Online/Offline Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 600, color: isOffline ? '#a5b4fc' : '#e2e8f0', transition: '0.3s' }}>
            {isOffline ? '🔌 Offline Inference Mode' : '🌐 Cloud API Mode'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isOffline ? 'Runs locally on your CPU (Free, Slower)' : 'Powered by Fal.ai Cloud (Ultra Fast)'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsOffline(!isOffline)}>
          <div style={{ position: 'relative', width: '52px', height: '28px', backgroundColor: isOffline ? 'rgba(99,120,255,0.7)' : 'rgba(255,255,255,0.1)', borderRadius: '34px', transition: '0.3s ease' }}>
            <div style={{ position: 'absolute', top: '4px', left: isOffline ? '28px' : '4px', width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      {/* Model */}
      {!isOffline && (
        <div className="form-group">
          <label htmlFor="t2v-model">
            Model&nbsp;
            <a href={model.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.75rem', color: 'var(--accent-1)', textDecoration: 'none' }}>
              ↗ fal.ai
            </a>
          </label>
          <select id="t2v-model" value={selectedModelId} onChange={(e) => handleModelChange(e.target.value)}>
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      )}
      {isOffline && (
        <div className="form-group">
          <label>Selected Model</label>
          <div style={{ padding: '12px 16px', background: 'rgba(99,120,255,0.1)', border: '1px solid rgba(99,120,255,0.3)', borderRadius: '8px', color: '#a5b4fc', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤖</span> {model.label}
          </div>
        </div>
      )}

      {/* Prompt */}
      <div className="form-group">
        <label htmlFor="t2v-prompt" className="required">Prompt</label>
        <textarea
          id="t2v-prompt"
          value={form.prompt}
          onChange={(e) => set('prompt', e.target.value)}
          placeholder="Describe the video you want to generate..."
          required
          maxLength={3000}
        />
        <div className="form-hint">{form.prompt.length}/3000 characters.
          Try: <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--accent-1)', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}
            onClick={() => set('prompt', SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)])}
          >random example ✨</button>
        </div>
      </div>

      {/* Negative Prompt */}
      <div className="form-group">
        <label htmlFor="t2v-neg">Negative Prompt</label>
        <textarea
          id="t2v-neg"
          value={form.negativePrompt}
          onChange={(e) => set('negativePrompt', e.target.value)}
          placeholder="low quality, blurry, artifacts..."
          maxLength={3000}
          rows={3}
        />
        <div className="form-hint">{form.negativePrompt.length}/3000 characters</div>
      </div>

      <div className="form-row">
        {/* Aspect Ratio */}
        <div className="form-group">
          <label htmlFor="t2v-aspect">Aspect Ratio</label>
          <select id="t2v-aspect" value={form.aspectRatio} onChange={(e) => set('aspectRatio', e.target.value)}>
            {model.aspectRatios.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Resolution */}
        <div className="form-group">
          <label htmlFor="t2v-res">Resolution</label>
          <select id="t2v-res" value={form.resolution} onChange={(e) => set('resolution', e.target.value)}>
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        {/* Duration */}
        <div className="form-group">
          <label htmlFor="t2v-dur">Duration</label>
          <select id="t2v-dur" value={form.duration} onChange={(e) => set('duration', e.target.value)}>
            {model.durations.map((d) => <option key={d} value={d}>{d} seconds</option>)}
          </select>
        </div>

        {/* Options */}
        <div className="form-group" style={{ justifyContent: 'flex-end', gap: '12px' }}>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.enablePromptExpansion}
              onChange={(e) => set('enablePromptExpansion', e.target.checked)} />
            <span style={{ fontSize: '0.85rem' }}>Prompt expansion (LLM)</span>
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.multiShots}
              onChange={(e) => set('multiShots', e.target.checked)} />
            <span style={{ fontSize: '0.85rem' }}>Multi-shot narrative</span>
          </label>
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading || !form.prompt.trim()}>
        {loading ? (
          <><div className="spinner" /> Submitting...</>
        ) : (
          '🎬 Generate Video'
        )}
      </button>
    </form>
  );
}
