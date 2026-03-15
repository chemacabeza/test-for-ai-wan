import React, { useState, useRef } from 'react';
import { createImageToVideoJob } from '../services/api';

const RESOLUTIONS = ['1080p', '720p'];
const DURATIONS   = [5, 10, 15];

export default function ImageToVideoForm({ onJobCreated }) {
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
  const [uploadMode, setUploadMode] = useState('url'); // 'url' | 'file'
  const [dragOver, setDragOver]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(false);
  const fileRef = useRef(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleFileChange = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      set('imageUrl', e.target.result); // base64 data URI for fal.ai
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
                  Drag & drop or click to select an image
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
          placeholder="Describe how you want the image to animate... (e.g., 'gentle breeze, leaves swaying, camera slowly zooming out')"
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
            {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="i2v-dur">Duration</label>
          <select id="i2v-dur" value={form.duration} onChange={(e) => set('duration', e.target.value)}>
            {DURATIONS.map((d) => <option key={d} value={d}>{d} seconds</option>)}
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
