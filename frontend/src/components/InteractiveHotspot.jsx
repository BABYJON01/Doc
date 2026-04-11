import React, { useState, useRef, useEffect } from 'react';

const InteractiveHotspot = ({ imageUrl, hotSpots, onHotspotSelect, onImageClick }) => {
  const containerRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1, height: 1 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Example hotSpots format:
  // [{ id: 1, x: 50, y: 30, radius: 20, label: "Tizza bo'g'imi darzi" }]
  // Coordinates are percentages relative to image dimensions

  const handleImageLoad = (e) => {
    setImageLoaded(true);
    setImageDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
  };

  const handleContainerClick = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPositionsPercentage = ((e.clientX - rect.left) / rect.width) * 100;
    const yPositionsPercentage = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (onImageClick) {
      onImageClick({ x: xPositionsPercentage, y: yPositionsPercentage });
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto glass-card overflow-hidden group p-4">
      {/* Container */}
      <div 
        ref={containerRef} 
        className="relative w-full h-auto cursor-crosshair rounded-xl overflow-hidden shadow-inner bg-slate-900 border border-slate-700/50"
        onClick={handleContainerClick}
      >
        {/* Placeholder if image loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-400">
            <i className="fa-solid fa-spinner fa-spin text-3xl"></i>
          </div>
        )}

        {/* Medical Image */}
        <img 
          src={imageUrl} 
          alt="Medical Scan" 
          className={`w-full h-auto object-contain transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
        />

        {/* Render existing Hotspots */}
        {imageLoaded && hotSpots?.map((spot) => (
          <div 
            key={spot.id}
            onClick={(e) => {
              e.stopPropagation();
              if (onHotspotSelect) onHotspotSelect(spot);
            }}
            className="absolute hotspot-point z-10 cursor-pointer group/spot transition-transform hover:scale-110"
            style={{ 
              left: `${spot.x}%`, 
              top: `${spot.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* The pulsing circle */}
            <div className="w-8 h-8 rounded-full bg-blue-500/40 border-2 border-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.6)]">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            </div>
            
            {/* Tooltip */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/spot:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-600 pointer-events-none z-20">
              {spot.label}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-t border-l border-slate-600 transform rotate-45"></div>
            </div>
          </div>
        ))}

        {/* Hover Crosshairs Overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="mt-4 flex justify-between items-center bg-slate-800 text-slate-300 px-4 py-3 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3">
              <i className="fa-solid fa-microscope text-blue-400"></i>
              <span className="text-sm font-medium">Radiologik Diagnostika Rejimi</span>
          </div>
          <div className="text-xs text-slate-500">
              Uskuna: Interaktiv Hotspot (Med-Zukkoo)
          </div>
      </div>
    </div>
  );
};

export default InteractiveHotspot;
