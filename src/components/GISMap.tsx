/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Complaint, Ward } from '../types';
import { MapPin, Layers, RefreshCw, Eye, SlidersHorizontal, Info } from 'lucide-react';

interface GISMapProps {
  complaints: Complaint[];
  wards: Ward[];
  onSelectComplaint?: (complaint: Complaint) => void;
  selectedComplaintId?: string;
}

// Convert simulated lat/lng from Bangalore range [12.95 - 13.0, 77.55 - 77.65] to SVG coordinates [0 - 1000, 0 - 600]
function latLngToXY(lat: number, lng: number): { x: number; y: number } {
  const minLat = 12.95;
  const maxLat = 13.0;
  const minLng = 77.55;
  const maxLng = 77.65;

  const x = ((lng - minLng) / (maxLng - minLng)) * 800 + 100;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * 400 + 100; // Invert Y for screen space

  return { x, y };
}

export default function GISMap({ complaints, wards, onSelectComplaint, selectedComplaintId }: GISMapProps) {
  const [hoveredWard, setHoveredWard] = useState<Ward | null>(null);
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [mapMode, setMapMode] = useState<'markers' | 'heatmap'>('markers');
  const [showBoundaries, setShowBoundaries] = useState(true);

  // Ward SVG Paths definitions
  const wardPaths = useMemo(() => [
    {
      id: 'w-1',
      name: 'Ward 1 - Downtown',
      path: 'M 100,100 L 450,80 L 400,280 L 250,320 L 80,250 Z',
      color: 'rgba(59, 130, 246, 0.08)',
      hoverColor: 'rgba(59, 130, 246, 0.18)',
      stroke: '#3b82f6',
      center: { x: 230, y: 190 },
    },
    {
      id: 'w-2',
      name: 'Ward 2 - Metro Heights',
      path: 'M 450,80 L 820,100 L 880,280 L 550,300 L 400,280 Z',
      color: 'rgba(168, 85, 247, 0.08)',
      hoverColor: 'rgba(168, 85, 247, 0.18)',
      stroke: '#a855f7',
      center: { x: 620, y: 180 },
    },
    {
      id: 'w-3',
      name: 'Ward 3 - Green Valley',
      path: 'M 80,250 L 250,320 L 300,520 L 100,550 Z',
      color: 'rgba(34, 197, 94, 0.08)',
      hoverColor: 'rgba(34, 197, 94, 0.18)',
      stroke: '#22c55e',
      center: { x: 180, y: 400 },
    },
    {
      id: 'w-4',
      name: 'Ward 4 - Industry Park',
      path: 'M 250,320 L 550,300 L 600,450 L 400,500 L 300,520 Z',
      color: 'rgba(234, 179, 8, 0.08)',
      hoverColor: 'rgba(234, 179, 8, 0.18)',
      stroke: '#eab308',
      center: { x: 420, y: 410 },
    },
    {
      id: 'w-5',
      name: 'Ward 5 - Lakeside',
      path: 'M 550,300 L 880,280 L 850,550 L 600,450 Z',
      color: 'rgba(14, 165, 233, 0.08)',
      hoverColor: 'rgba(14, 165, 233, 0.18)',
      stroke: '#0ea5e9',
      center: { x: 720, y: 420 },
    },
  ], []);

  // Filter complaints based on select filters
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchWard = selectedWardFilter === 'All' || c.ward === selectedWardFilter;
      const matchCat = selectedCategoryFilter === 'All' || c.category === selectedCategoryFilter;
      return matchWard && matchCat;
    });
  }, [complaints, selectedWardFilter, selectedCategoryFilter]);

  // Status colors for indicators
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-rose-500 border-rose-200 text-rose-500';
      case 'Accepted': return 'bg-amber-500 border-amber-200 text-amber-500';
      case 'Resolved': return 'bg-emerald-500 border-emerald-200 text-emerald-500';
      case 'Escalated': return 'bg-purple-600 border-purple-200 text-purple-600';
      default: return 'bg-slate-400 border-slate-200 text-slate-400';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'stroke-rose-600 fill-rose-100 animate-pulse';
      case 'High': return 'stroke-orange-500 fill-orange-500';
      case 'Medium': return 'stroke-amber-400 fill-amber-400';
      default: return 'stroke-blue-400 fill-blue-400';
    }
  };

  return (
    <div id="gis-platform-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Map Control and Canvas */}
      <div id="gis-map-canvas-card" className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
        {/* Map Header Controls */}
        <div id="map-controls-header" className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-left">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-semibold text-lg text-slate-800">GIS Smart Map Visualizer</h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              id="map-mode-markers-btn"
              onClick={() => setMapMode('markers')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                mapMode === 'markers'
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'
              }`}
            >
              Complaint Markers
            </button>
            <button
              id="map-mode-heatmap-btn"
              onClick={() => setMapMode('heatmap')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                mapMode === 'heatmap'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'
              }`}
            >
              Severity Heatmap
            </button>
            <button
              id="toggle-boundaries-btn"
              onClick={() => setShowBoundaries(!showBoundaries)}
              className={`px-3 py-1.5 rounded-lg font-medium border transition ${
                showBoundaries
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-white text-slate-400 border-slate-150'
              }`}
            >
              Boundaries: {showBoundaries ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* The Map Stage */}
        <div id="svg-map-stage" className="relative bg-slate-50 border border-slate-100 rounded-xl overflow-hidden aspect-[8/5] md:aspect-[16/10] flex-1">
          {/* Legend Overlay */}
          <div id="map-legend" className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-2.5 rounded-lg shadow-sm border border-slate-100 z-10 text-[10px] space-y-1">
            <div className="font-semibold text-slate-700 mb-1">Status Legend:</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>Pending</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>Accepted</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>Escalated</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Resolved</div>
          </div>

          {/* Interactive SVG */}
          <svg
            id="gis-svg-element"
            viewBox="0 0 960 600"
            className="w-full h-full select-none"
          >
            {/* Background grids */}
            <defs>
              <pattern id="mapGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(203, 213, 225, 0.25)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mapGrid)" />

            {/* Render Ward Polygons */}
            {showBoundaries && wardPaths.map((w) => {
              const matchedWard = wards.find((ward) => ward.name === w.name);
              const isSelected = selectedWardFilter === w.name;
              
              return (
                <g key={w.id}>
                  <path
                    d={w.path}
                    fill={isSelected ? w.hoverColor : w.color}
                    stroke={w.stroke}
                    strokeWidth={isSelected ? 3 : 1.5}
                    strokeDasharray={isSelected ? 'none' : '4,4'}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => matchedWard && setHoveredWard(matchedWard)}
                    onMouseLeave={() => setHoveredWard(null)}
                    onClick={() => setSelectedWardFilter(selectedWardFilter === w.name ? 'All' : w.name)}
                  />
                  {/* Ward Label */}
                  <text
                    x={w.center.x}
                    y={w.center.y}
                    textAnchor="middle"
                    className="fill-slate-500 font-display font-medium text-xs pointer-events-none opacity-80"
                  >
                    {w.name.split(' - ')[1]}
                  </text>
                </g>
              );
            })}

            {/* Heatmap blur circles if mode is Heatmap */}
            {mapMode === 'heatmap' && (
              <g id="heatmap-overlay-layer">
                {filteredComplaints.map((c) => {
                  const { x, y } = latLngToXY(c.latitude, c.longitude);
                  // Critical has bigger/warmer heat size
                  const radius = c.priority === 'Critical' ? 70 : c.priority === 'High' ? 50 : 30;
                  const color = c.priority === 'Critical' ? 'rgba(239, 68, 68, 0.45)' : c.priority === 'High' ? 'rgba(249, 115, 22, 0.35)' : 'rgba(234, 179, 8, 0.25)';
                  return (
                    <circle
                      key={`heat-${c.id}`}
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={color}
                      filter="blur(16px)"
                      className="transition-all duration-500 pointer-events-none"
                    />
                  );
                })}
              </g>
            )}

            {/* Complaint Markers */}
            {mapMode === 'markers' && filteredComplaints.map((c) => {
              const { x, y } = latLngToXY(c.latitude, c.longitude);
              const isSelected = selectedComplaintId === c.id;

              return (
                <g
                  key={`marker-${c.id}`}
                  className="cursor-pointer group transition-all duration-300"
                  onClick={() => onSelectComplaint && onSelectComplaint(c)}
                >
                  {/* Selector Ring */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="16"
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="2"
                      className="animate-ping"
                    />
                  )}

                  {/* Marker Pin Base */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? '8' : '6'}
                    className={`transition-all duration-300 ${
                      c.status === 'Resolved' ? 'fill-emerald-500 stroke-white' :
                      c.status === 'Accepted' ? 'fill-amber-500 stroke-white' :
                      c.status === 'Escalated' ? 'fill-purple-600 stroke-white' : 'fill-rose-500 stroke-white'
                    }`}
                    strokeWidth="1.5"
                    shadow-sm="true"
                  />

                  {/* Tiny center core */}
                  <circle
                    cx={x}
                    cy={y}
                    r="2"
                    fill="white"
                  />

                  {/* Quick hovering label */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <rect
                      x={x - 80}
                      y={y - 45}
                      width="160"
                      height="34"
                      rx="4"
                      fill="#0f172a"
                      opacity="0.9"
                    />
                    <text
                      x={x}
                      y={y - 32}
                      textAnchor="middle"
                      fill="white"
                      className="font-sans font-semibold text-[9px]"
                    >
                      {c.title.length > 25 ? `${c.title.substring(0, 22)}...` : c.title}
                    </text>
                    <text
                      x={x}
                      y={y - 20}
                      textAnchor="middle"
                      fill="#94a3b8"
                      className="font-mono text-[8px]"
                    >
                      Score: {c.ai_analysis?.priority_score || 50} | {c.category}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Ward Hover Info Tooltip */}
          {hoveredWard && (
            <div id="ward-hover-tooltip" className="absolute bottom-3 right-3 bg-slate-900/95 text-white p-3 rounded-xl shadow-lg border border-slate-800 z-10 max-w-xs transition-opacity animate-fade-in text-xs space-y-1">
              <div className="font-display font-semibold text-sm text-blue-400">{hoveredWard.name}</div>
              <div>District: <span className="text-slate-300">{hoveredWard.district}</span></div>
              <div>Population: <span className="text-slate-300">{hoveredWard.population.toLocaleString()}</span></div>
              <div>Annual Budget: <span className="text-emerald-400 font-semibold">₹{hoveredWard.budget} Lakhs</span></div>
              <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>Click to filter complaints</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Filter Sidebar */}
      <div id="gis-sidebar-filters" className="space-y-4">
        {/* Quick Filter Box */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-display font-semibold text-sm text-slate-700 pb-2 border-b border-slate-100 text-left">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Interactive Filters</span>
          </div>

          {/* Ward Filter Select */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-medium">Select Ward Boundary:</label>
            <select
              id="ward-filter-dropdown"
              value={selectedWardFilter}
              onChange={(e) => setSelectedWardFilter(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Wards (Show All)</option>
              {wards.map((w) => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter Select */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-medium">Complaint Category:</label>
            <select
              id="category-filter-dropdown"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="Roads">Roads & Potholes</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Garbage/Sanitation">Garbage & Sanitation</option>
              <option value="Street Lights">Street Lights</option>
              <option value="Health/Sewage">Sewage & Public Health</option>
              <option value="Education">Education Facilities</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Stat counters */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-center">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Matched</div>
              <div id="matched-filter-count" className="text-lg font-bold text-slate-700 font-display">{filteredComplaints.length}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Avg. Priority</div>
              <div className="text-lg font-bold text-indigo-600 font-display">
                {filteredComplaints.length > 0
                  ? Math.round(filteredComplaints.reduce((acc, curr) => acc + (curr.ai_analysis?.priority_score || 50), 0) / filteredComplaints.length)
                  : 0}
              </div>
            </div>
          </div>
        </div>

        {/* List inside sidebar matching filtered markers */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col h-[280px]">
          <div className="font-display font-semibold text-xs text-slate-600 uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-100">
            On-Ground Markers
          </div>
          <div id="filtered-markers-scroller" className="overflow-y-auto flex-1 space-y-2 pr-1 text-xs">
            {filteredComplaints.length === 0 ? (
              <div className="text-slate-400 text-center py-8">No markers matching this criteria.</div>
            ) : (
              filteredComplaints.map((c) => (
                <div
                  key={`list-item-${c.id}`}
                  onClick={() => onSelectComplaint && onSelectComplaint(c)}
                  className={`p-2 rounded-lg border transition text-left cursor-pointer hover:bg-slate-50 ${
                    selectedComplaintId === c.id
                      ? 'bg-indigo-50/50 border-indigo-200'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-semibold text-slate-700 line-clamp-1">{c.title}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${c.status === 'Resolved' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                    <span>{c.ward.split(' - ')[1]}</span>
                    <span className="font-semibold text-indigo-600 bg-indigo-50 px-1 rounded">Score: {c.ai_analysis?.priority_score || 50}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
