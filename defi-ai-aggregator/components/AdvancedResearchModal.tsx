'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, BeakerIcon, MagnifyingGlassIcon, AcademicCapIcon, GlobeAltIcon, DocumentTextIcon, HashtagIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface AdvancedResearchData {
  query: string;
  researchType: 'web' | 'academic' | 'code' | 'defi' | 'comprehensive';
  sources: string[];
  depth: 'basic' | 'detailed' | 'exhaustive';
  customInstructions?: string;
  useMorphic?: boolean; // New property to choose the research engine
}

interface AdvancedResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdvancedResearchData) => void;
}

export default function AdvancedResearchModal({ isOpen, onClose, onSubmit }: AdvancedResearchModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [formData, setFormData] = useState<AdvancedResearchData>({
    query: '',
    researchType: 'comprehensive',
    sources: ['web'],
    depth: 'detailed',
    customInstructions: '',
    useMorphic: true // Default to using Morphic
  });

  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
    
    // Add animation delay
    if (isOpen) {
      setTimeout(() => {
        setAnimateIn(true);
      }, 10);
    } else {
      setAnimateIn(false);
    }
    
    // Handle escape key to close modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleClose = () => {
    setAnimateIn(false);
    setTimeout(onClose, 300); // Wait for animation to finish
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleSourceToggle = (source: string) => {
    setFormData(prev => {
      const sources = prev.sources.includes(source) 
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source];
        
      // Ensure at least one source is selected
      return {
        ...prev,
        sources: sources.length ? sources : ['web']
      };
    });
  };

  // Don't render anything during SSR
  if (!isMounted) return null;
  
  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl transition-all duration-300 ${
          animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <BeakerIcon className="h-6 w-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Advanced Research</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Query */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Research Query</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.query}
                onChange={(e) => setFormData({...formData, query: e.target.value})}
                placeholder="Enter your research question..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          {/* Research Engine */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Research Engine</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, useMorphic: true})}
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                  formData.useMorphic 
                    ? 'bg-purple-900/40 border-purple-500 text-purple-300' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <AcademicCapIcon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Morphic</div>
                  <div className="text-xs opacity-70">Advanced AI with enhanced search and chat capabilities</div>
                </div>
                {formData.useMorphic && <CheckIcon className="h-5 w-5 ml-auto text-purple-400" />}
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({...formData, useMorphic: false})}
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                  !formData.useMorphic 
                    ? 'bg-blue-900/40 border-blue-500 text-blue-300' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <BeakerIcon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Default</div>
                  <div className="text-xs opacity-70">Basic research with our default AI</div>
                </div>
                {!formData.useMorphic && <CheckIcon className="h-5 w-5 ml-auto text-blue-400" />}
              </button>
            </div>
          </div>
          
          {/* Research Type */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Research Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, researchType: 'comprehensive'})}
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                  formData.researchType === 'comprehensive' 
                    ? 'bg-blue-900/40 border-blue-500 text-blue-300' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <GlobeAltIcon className="h-5 w-5" />
                <span>Comprehensive</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({...formData, researchType: 'defi'})}
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                  formData.researchType === 'defi' 
                    ? 'bg-green-900/40 border-green-500 text-green-300' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <HashtagIcon className="h-5 w-5" />
                <span>DeFi Specific</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({...formData, researchType: 'academic'})}
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                  formData.researchType === 'academic' 
                    ? 'bg-yellow-900/40 border-yellow-500 text-yellow-300' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <AcademicCapIcon className="h-5 w-5" />
                <span>Academic</span>
              </button>
            </div>
          </div>
          
          {/* Information Sources */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Information Sources</label>
            <div className="flex flex-wrap gap-2">
              {['web', 'docs', 'code', 'news', 'community'].map(source => (
                <button
                  key={source}
                  type="button"
                  onClick={() => handleSourceToggle(source)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.sources.includes(source)
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-500'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Research Depth */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Research Depth</label>
            <div className="flex flex-col space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.depth === 'basic'}
                  onChange={() => setFormData({...formData, depth: 'basic'})}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-700 bg-gray-800 rounded"
                />
                <span className="text-gray-300">Basic (Quick overview)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.depth === 'detailed'}
                  onChange={() => setFormData({...formData, depth: 'detailed'})}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-700 bg-gray-800 rounded"
                />
                <span className="text-gray-300">Detailed (Comprehensive analysis)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.depth === 'exhaustive'}
                  onChange={() => setFormData({...formData, depth: 'exhaustive'})}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-700 bg-gray-800 rounded"
                />
                <span className="text-gray-300">Exhaustive (Deep, thorough investigation)</span>
              </label>
            </div>
          </div>
          
          {/* Custom Instructions */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Custom Instructions (Optional)</label>
            <textarea
              value={formData.customInstructions}
              onChange={(e) => setFormData({...formData, customInstructions: e.target.value})}
              placeholder="Add any specific focus areas or requirements..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-24"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 flex items-center space-x-2"
            >
              <BeakerIcon className="h-5 w-5" />
              <span>Start Research</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 