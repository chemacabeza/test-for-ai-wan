import React, { useState } from 'react';
import { createTextToVideoJob } from '../services/api';

const MODELS = [
  { id: 'wan-2.6', label: 'Wan 2.6', url: 'https://fal.ai/models/fal-ai/wan/v2.6/text-to-video' },
  { id: 'wan-2.2-a14b', label: 'Wan 2.2-A14B', url: 'https://fal.ai/models/fal-ai/wan/v2.2-a14b/text-to-video' },
  { id: 'kling-v2.5-turbo', label: 'Kling v2.5 Turbo Pro', url: 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video' },
  { id: 'ltx-2-19b', label: 'LTX-2 19B', url: 'https://fal.ai/models/fal-ai/ltx-2-19b/text-to-video' },
  { id: 'pixverse-v5', label: 'PixVerse v5', url: 'https://fal.ai/models/fal-ai/pixverse/v5/text-to-video' },
];

const ASPECT_RATIOS = ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16', '9:21'];
const RESOLUTIONS = ['1080p', '720p'];
const DURATIONS = [5, 10, 15];

const SAMPLE_PROMPTS = [
  'A lone astronaut walks across a glowing alien landscape at dusk, with twin moons rising on the horizon. Cinematic, photoreal, 4K.',
  'Cherry blossom petals drift in slow motion through a quiet Japanese garden. Soft morning light, warm golden haze, 24fps cinematic.',
  'An arctic fox trots across a frozen tundra under a vivid Northern Lights display. Wildlife documentary style, detailed fur texture.',
];

export default function TextToVideoForm({ onJobCreated }) {
  const [form, setForm] = useState({
    model: 'wan-2.6',
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

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const selectedModel = MODELS.find((m) => m.id === form.model) || MODELS[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const job = await createTextToVideoJob({
        ...form,
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

      {/* Model */}
      <div className="form-group">
        <label htmlFor="t2v-model">
          Model&nbsp;
          <a href={selectedModel.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: 'var(--accent-1)', textDecoration: 'none' }}>
            ↗ fal.ai
          </a>
        </label>
        <select id="t2v-model" value={form.model} onChange={(e) => set('model', e.target.value)}>
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

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
        <input
          id="t2v-neg"
          type="text"
          value={form.negativePrompt}
          onChange={(e) => set('negativePrompt', e.target.value)}
          placeholder="low quality, blurry, artifacts..."
          maxLength={500}
        />
      </div>

      <div className="form-row">
        {/* Aspect Ratio */}
        <div className="form-group">
          <label htmlFor="t2v-aspect">Aspect Ratio</label>
          <select id="t2v-aspect" value={form.aspectRatio} onChange={(e) => set('aspectRatio', e.target.value)}>
            {ASPECT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Resolution */}
        <div className="form-group">
          <label htmlFor="t2v-res">Resolution</label>
          <select id="t2v-res" value={form.resolution} onChange={(e) => set('resolution', e.target.value)}>
            {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        {/* Duration */}
        <div className="form-group">
          <label htmlFor="t2v-dur">Duration</label>
          <select id="t2v-dur" value={form.duration} onChange={(e) => set('duration', e.target.value)}>
            {DURATIONS.map((d) => <option key={d} value={d}>{d} seconds</option>)}
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
