import React, { useState, useRef } from 'react';
import { createImageToVideoJob } from '../services/api';

const MODELS = [
  {
    id: 'wan-2.6',
    label: 'Wan 2.6',
    url: 'https://fal.ai/models/fal-ai/wan/v2.6/image-to-video',
    durations: [5, 10, 15],
    aspectRatios: ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16', '9:21'],
  },
  {
    id: 'wan-2.2-a14b',
    label: 'Wan 2.2-A14B',
    url: 'https://fal.ai/models/fal-ai/wan/v2.2-a14b/image-to-video',
    durations: [5, 10, 15],
    aspectRatios: ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16', '9:21'],
  },
  {
    id: 'kling-v2.5-turbo',
    label: 'Kling v2.5 Turbo Pro',
    url: 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
    durations: [5, 10],
    aspectRatios: ['16:9', '9:16', '1:1'],
  },
  {
    id: 'ltx-2-19b',
    label: 'LTX-2 19B',
    url: 'https://fal.ai/models/fal-ai/ltx-2-19b/image-to-video',
    durations: [5, 10, 15],
    aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16'],
  },
  {
    id: 'pixverse-v5',
    label: 'PixVerse v5',
    url: 'https://fal.ai/models/fal-ai/pixverse/v5/image-to-video',
    durations: [5, 8],
    aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16'],
  },
];

export default function ImageToVideoForm({ onJobCreated }) {
  const [selectedModelId, setSelectedModelId] = useState('wan-2.6');
  const [form, setForm] = useState({
    prompt: '',
    imageUrl: '',
    negativePrompt: '',
    resolution: '1080p',
    duration: 5,
    enablePromptExpansion: true,
    multiShots: false,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadMode, setUploadMode] = useState('url');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  const model = MODELS.find((m) => m.id === selectedModelId) || MODELS[0];

  const handleModelChange = (newId) => {
    const next = MODELS.find((m) => m.id === newId) || MODELS[0];
    setSelectedModelId(newId);
    setForm((f) => ({
      ...f,
      duration: next.durations.includes(Number(f.duration)) ? f.duration : next.durations[0],
    }));
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleFileChange = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      set('imageUrl', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.imageUrl) { setError('Please provide an image URL or upload an image.'); return; }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const job = await createImageToVideoJob({
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
      {error && <div className="alert alert-error">⚠️ {typeof error === 'object' ? JSON.stringify(error) : error}</div>}
      {success && <div className="alert alert-success">✅ Job submitted! It will appear in the gallery below shortly.</div>}

      {/* Model */}
      <div className="form-group">
        <label htmlFor="i2v-model">
          Model&nbsp;
          <a href={model.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: 'var(--accent-1)', textDecoration: 'none' }}>
            ↗ fal.ai
          </a>
        </label>
        <select id="i2v-model" value={selectedModelId} onChange={(e) => handleModelChange(e.target.value)}>
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Image Input Mode Toggle */}
      <div className="form-group">
        <label className="required">Source Image</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {['url', 'file'].map((m) => (
            <button key={m} type="button"
              onClick={() => { setUploadMode(m); setImagePreview(null); set('imageUrl', ''); }}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: '1px solid',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                borderColor: uploadMode === m ? 'var(--accent-1)' : 'var(--border)',
                background: uploadMode === m ? 'rgba(99,120,255,0.15)' : 'transparent',
                color: uploadMode === m ? 'var(--accent-1)' : 'var(--text-secondary)',
              }}>
              {m === 'url' ? '🔗 Image URL' : '📁 Upload File'}
            </button>
          ))}
        </div>

        {uploadMode === 'url' ? (
          <input type="text" value={form.imageUrl}
            onChange={(e) => { set('imageUrl', e.target.value); setImagePreview(e.target.value || null); }}
            placeholder="https://example.com/image.jpg" />
        ) : (
          <div
            className={`file-upload ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*"
              onChange={(e) => handleFileChange(e.target.files[0])} style={{ display: 'none' }} />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="file-upload-preview" />
            ) : (
              <>
                <span className="file-upload-icon">🖼️</span>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Drag &amp; drop or click to select an image
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>
                  JPEG, PNG, WEBP — up to 100MB
                </div>
              </>
            )}
          </div>
        )}
        {imagePreview && uploadMode === 'url' && (
          <img src={imagePreview} alt="Preview" className="file-upload-preview" onError={() => setImagePreview(null)} />
        )}
      </div>

      {/* Prompt */}
      <div className="form-group">
        <label htmlFor="i2v-prompt" className="required">Motion Prompt</label>
        <textarea id="i2v-prompt" value={form.prompt}
          onChange={(e) => set('prompt', e.target.value)}
          placeholder="Describe how you want the image to animate..."
          required maxLength={3000} />
        <div className="form-hint">{form.prompt.length}/3000 characters</div>
      </div>

      {/* Negative Prompt */}
      <div className="form-group">
        <label htmlFor="i2v-neg">Negative Prompt</label>
        <input id="i2v-neg" type="text" value={form.negativePrompt}
          onChange={(e) => set('negativePrompt', e.target.value)}
          placeholder="blurry, glitch, distortion..." maxLength={500} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="i2v-res">Resolution</label>
          <select id="i2v-res" value={form.resolution} onChange={(e) => set('resolution', e.target.value)}>
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="i2v-dur">Duration</label>
          <select id="i2v-dur" value={form.duration} onChange={(e) => set('duration', e.target.value)}>
            {model.durations.map((d) => <option key={d} value={d}>{d} seconds</option>)}
          </select>
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full"
        disabled={loading || !form.prompt.trim() || !form.imageUrl}>
        {loading ? <><div className="spinner" /> Submitting...</> : '🎞️ Animate Image'}
      </button>
    </form>
  );
}
