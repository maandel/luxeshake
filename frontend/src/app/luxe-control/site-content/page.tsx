'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../lib/store/authStore';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');

export default function SiteContentPage() {
  const { showToast } = useToast();
  const role = useAuthStore(s => s.role);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    about_title: '',
    about_content: '',
    menu_title: '',
    menu_subtitle: '',
    location_title: '',
    location_subtitle: '',
    complaints_title: '',
    complaints_subtitle: ''
  });
  
  const [images, setImages] = useState({
    hero_image_url: '',
    hero_image_path: '',
    about_image_url: '',
    about_image_path: ''
  });

  const heroFileInput = useRef<HTMLInputElement>(null);
  const aboutFileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data } = await api.get('/site-content');
      setFormData({
        hero_title: data.hero_title,
        hero_subtitle: data.hero_subtitle,
        about_title: data.about_title,
        about_content: data.about_content,
        menu_title: data.menu_title,
        menu_subtitle: data.menu_subtitle,
        location_title: data.location_title,
        location_subtitle: data.location_subtitle,
        complaints_title: data.complaints_title,
        complaints_subtitle: data.complaints_subtitle
      });
      setImages({
        hero_image_url: data.hero_image_url,
        hero_image_path: data.hero_image_path,
        about_image_url: data.about_image_url,
        about_image_path: data.about_image_path
      });
    } catch (err) {
      showToast('Failed to load site content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/site-content', formData);
      showToast('Site content updated successfully', 'success');
      await fetchContent();
    } catch (err) {
      showToast('Failed to update content', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (section: 'hero' | 'about', file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    try {
      await api.post(`/site-content/image/${section}`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(`${section} image uploaded successfully`, 'success');
      await fetchContent();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Image upload failed', 'error');
    }
  };

  const renderImagePreview = (section: 'hero' | 'about') => {
    const url = section === 'hero' ? images.hero_image_url : images.about_image_url;
    const path = section === 'hero' ? images.hero_image_path : images.about_image_path;
    const src = path ? `${BACKEND}${path}` : url;
    
    return src ? (
      <img 
        src={src} 
        alt={`${section} preview`} 
        style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)' }}
      />
    ) : (
      <div style={{ width: '100%', height: '150px', background: 'rgba(212,175,55,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#99907c', border: '1px dashed rgba(212,175,55,0.2)' }}>
        No Image Uploaded
      </div>
    );
  };

  if (role !== 'superadmin') {
    return <div style={{ padding: '2rem', color: '#E57373' }}>Unauthorized Access</div>;
  }

  if (loading) {
    return <div style={{ padding: '2rem', color: '#99907c' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: '2rem', color: '#f2ca50', margin: '0 0 0.5rem 0' }}>Site Content</h1>
          <p style={{ color: '#99907c', margin: 0, fontSize: '0.9rem' }}>Manage the text and images on your public landing page.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{
            background: 'linear-gradient(135deg, #f2ca50 0%, #d4af37 100%)',
            color: '#1A0F0A',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(212,175,55,0.2)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <style>{`
        .section-card {
          background: rgba(22, 12, 8, 0.4);
          border: 1px solid rgba(212, 175, 55, 0.12);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .section-card h2 {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.25rem;
          color: #eae1d4;
          margin: 0 0 1.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid rgba(212,175,55,0.1);
          padding-bottom: 0.75rem;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #99907c;
          margin-bottom: 0.5rem;
        }
        .form-group input, .form-group textarea {
          width: 100%;
          background: rgba(13, 8, 4, 0.8);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: #eae1d4;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus {
          border-color: rgba(212, 175, 55, 0.5);
        }
        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }
        .upload-btn {
          background: rgba(212,175,55,0.08);
          border: 1px dashed rgba(212,175,55,0.4);
          color: #d4af37;
          border-radius: 8px;
          padding: 0.75rem;
          width: 100%;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
          margin-top: 0.75rem;
        }
        .upload-btn:hover {
          background: rgba(212,175,55,0.15);
          border-color: #d4af37;
        }
      `}</style>

      {/* Hero Section */}
      <div className="section-card">
        <h2><span className="material-symbols-outlined">image</span> Hero Section</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div className="form-group">
              <label>Hero Title</label>
              <input name="hero_title" value={formData.hero_title} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Hero Subtitle</label>
              <textarea name="hero_subtitle" value={formData.hero_subtitle} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#99907c', marginBottom: '0.5rem' }}>Background Image (Rec: 1920x1080)</label>
            {renderImagePreview('hero')}
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              ref={heroFileInput} 
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleImageUpload('hero', e.target.files[0]);
              }}
            />
            <button className="upload-btn" onClick={() => heroFileInput.current?.click()}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
              Upload New Hero Image
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="section-card">
        <h2><span className="material-symbols-outlined">menu_book</span> About Section</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div className="form-group">
              <label>About Title</label>
              <input name="about_title" value={formData.about_title} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>About Content</label>
              <textarea name="about_content" value={formData.about_content} onChange={handleChange} style={{ minHeight: '150px' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#99907c', marginBottom: '0.5rem' }}>About Image (Rec: 800x1000)</label>
            {renderImagePreview('about')}
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              ref={aboutFileInput} 
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleImageUpload('about', e.target.files[0]);
              }}
            />
            <button className="upload-btn" onClick={() => aboutFileInput.current?.click()}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
              Upload New About Image
            </button>
          </div>
        </div>
      </div>

      {/* Menu Header */}
      <div className="section-card">
        <h2><span className="material-symbols-outlined">restaurant_menu</span> Menu Header</h2>
        <div className="form-group">
          <label>Menu Title</label>
          <input name="menu_title" value={formData.menu_title} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Menu Subtitle</label>
          <input name="menu_subtitle" value={formData.menu_subtitle} onChange={handleChange} />
        </div>
      </div>

      {/* Location Header */}
      <div className="section-card">
        <h2><span className="material-symbols-outlined">location_on</span> Location Header</h2>
        <div className="form-group">
          <label>Location Title</label>
          <input name="location_title" value={formData.location_title} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Location Subtitle</label>
          <input name="location_subtitle" value={formData.location_subtitle} onChange={handleChange} />
        </div>
      </div>

      {/* Complaints Header */}
      <div className="section-card">
        <h2><span className="material-symbols-outlined">support_agent</span> Complaints Header</h2>
        <div className="form-group">
          <label>Complaints Title</label>
          <input name="complaints_title" value={formData.complaints_title} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Complaints Subtitle</label>
          <input name="complaints_subtitle" value={formData.complaints_subtitle} onChange={handleChange} />
        </div>
      </div>

    </div>
  );
}
