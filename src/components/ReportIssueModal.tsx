/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ward, Complaint } from '../types';
import { AlertCircle, Camera, MapPin, Sparkles, X, Loader } from 'lucide-react';

interface ReportIssueModalProps {
  wards: Ward[];
  onClose: () => void;
  onReportSubmitted: (complaint: Complaint) => void;
  userId: string;
  userName: string;
}

const PHOTO_MOCKS = [
  { id: 'img-pothole', label: '📸 Pothole crater', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'img-garbage', label: '📸 Wet waste heaps', url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'img-sewage', label: '📸 Sewage leak', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'img-lights', label: '📸 Dark alley', url: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
];

export default function ReportIssueModal({ wards, onClose, onReportSubmitted, userId, userName }: ReportIssueModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Roads' | 'Water Supply' | 'Garbage/Sanitation' | 'Street Lights' | 'Health/Sewage' | 'Education' | 'Other'>('Roads');
  const [ward, setWard] = useState(wards[0]?.name || 'Ward 1 - Downtown');
  const [lat, setLat] = useState('12.9716');
  const [lng, setLng] = useState('77.5946');
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Please fill out the title and description of your complaint.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          ward,
          created_by: userId,
          created_by_name: userName,
          image: selectedPhoto,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit report. Please try again.");
      }

      const newComplaint = await res.json();
      onReportSubmitted(newComplaint);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  return (
    <div id="report-issue-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div id="report-issue-modal-content" className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div id="modal-header" className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-800">Submit New Smart Complaint</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">AI automatically routes & prioritizes your ticket</p>
            </div>
          </div>
          <button id="close-report-modal-btn" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {isSubmitting ? (
          <div id="submitting-ai-loader-panel" className="flex flex-col items-center justify-center p-12 text-center space-y-4 flex-1">
            <div className="relative">
              <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
              <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-display font-semibold text-slate-800 text-sm">Gemini AI Analysis Engines Running</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mx-auto">
                Classifying category, assessing mood, evaluating severity score, and building department resolution paths...
              </p>
            </div>
          </div>
        ) : (
          <form id="new-complaint-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-left">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Complaint Title</label>
              <input
                id="complaint-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Briefly state the issue (e.g. Broken water valve leaking on Main Ave)"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Board Portfolio</label>
                <select
                  id="complaint-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none text-xs"
                >
                  <option value="Roads">Roads & Potholes</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Garbage/Sanitation">Garbage & Sanitation</option>
                  <option value="Street Lights">Street Lights</option>
                  <option value="Health/Sewage">Sewage & Public Health</option>
                  <option value="Education">Education Facilities</option>
                  <option value="Other">Other Issues</option>
                </select>
              </div>

              {/* Ward */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Target Ward</label>
                <select
                  id="complaint-ward-select"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none text-xs"
                >
                  {wards.map((w) => (
                    <option key={w.id} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Detailed Description</label>
              <textarea
                id="complaint-description-textarea"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what is happening, exact location landmarks, safety hazards, and impact on local residents..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Geolocation selector (simulation) */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-150">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 pb-1.5 border-b border-slate-200">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Simulated GIS Location Coordinates</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400">Latitude:</span>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded font-mono text-[10px] bg-white mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Longitude:</span>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded font-mono text-[10px] bg-white mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Simulated on-ground Photos */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Simulated Issue Photograph</span>
              </label>
              <div id="photo-mocks-row" className="grid grid-cols-4 gap-2">
                {PHOTO_MOCKS.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedPhoto(selectedPhoto === photo.url ? '' : photo.url)}
                    className={`relative aspect-video rounded-lg border overflow-hidden group hover:border-indigo-300 transition cursor-pointer ${
                      selectedPhoto === photo.url ? 'ring-2 ring-indigo-600 border-transparent' : 'border-slate-200'
                    }`}
                  >
                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                      <span className="text-[8px] text-white font-semibold truncate w-full">{photo.label.split(' ')[1]}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                id="cancel-report-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="submit-complaint-btn"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Analyze & Submit Complaint</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
