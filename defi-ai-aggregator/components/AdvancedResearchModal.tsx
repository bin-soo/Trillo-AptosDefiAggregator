'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, BeakerIcon, DocumentTextIcon, LinkIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface AdvancedResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdvancedResearchData) => void;
}

export interface AdvancedResearchData {
  query: string;
  researchType: 'comprehensive' | 'technical' | 'competitor' | 'custom';
  sources: string[];
  depth: 'basic' | 'deep' | 'expert';
  customInstructions?: string;
}

export default function AdvancedResearchModal({ isOpen, onClose, onSubmit }: AdvancedResearchModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [formData, setFormData] = useState<AdvancedResearchData>({
    query: '',
    researchType: 'comprehensive',
    sources: ['web', 'aptos_docs', 'defi_protocols'],
    depth: 'deep',
    customInstructions: '',
  });

  // Handle animation and mounting
  useEffect(() => {
    setIsMounted(true);
    if (isOpen) {
      setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log the data being submitted
    console.log("Submitting research data:", formData);
    
    // Make sure all required fields have values
    const dataToSubmit = {
      ...formData,
      query: formData.query.trim(),
      researchType: formData.researchType || 'comprehensive',
      sources: formData.sources.length ? formData.sources : ['web', 'aptos_docs'],
      depth: formData.depth || 'deep',
    };
    
    onSubmit(dataToSubmit);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSourceToggle = (source: string) => {
    setFormData(prev => {
      const newSources = prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source];
      return { ...prev, sources: newSources };
    });
  };

  if (!isMounted || !isOpen) return null;

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
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Research Query */}
          <div className="space-y-2">
            <label htmlFor="query" className="block text-sm font-medium text-gray-300">
              Research Question
            </label>
            <input
              type="text"
              id="query"
              name="query"
              value={formData.query}
              onChange={handleChange}
              required
              placeholder="What specific topic do you want to research?"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
            />
          </div>
          
          {/* Research Type */}
          <div className="space-y-2">
            <label htmlFor="researchType" className="block text-sm font-medium text-gray-300">
              Research Type
            </label>
            <select
              id="researchType"
              name="researchType"
              value={formData.researchType}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
            >
              <option value="comprehensive">Comprehensive Analysis</option>
              <option value="technical">Technical Deep-Dive</option>
              <option value="competitor">Protocol Comparison</option>
              <option value="custom">Custom Research</option>
            </select>
          </div>
          
          {/* Sources */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Research Sources
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSourceToggle('web')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  formData.sources.includes('web')
                    ? 'bg-purple-900/30 border-purple-600 text-purple-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                <LinkIcon className="h-5 w-5" />
                <span>Web Search</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleSourceToggle('aptos_docs')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  formData.sources.includes('aptos_docs')
                    ? 'bg-blue-900/30 border-blue-600 text-blue-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5" />
                <span>Aptos Docs</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleSourceToggle('defi_protocols')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  formData.sources.includes('defi_protocols')
                    ? 'bg-green-900/30 border-green-600 text-green-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                <AcademicCapIcon className="h-5 w-5" />
                <span>DeFi Protocols</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleSourceToggle('aptos_code')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  formData.sources.includes('aptos_code')
                    ? 'bg-yellow-900/30 border-yellow-600 text-yellow-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>Move Code</span>
              </button>
            </div>
          </div>
          
          {/* Research Depth */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Research Depth
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, depth: 'basic' }))}
                className={`px-3 py-2 rounded-lg border ${
                  formData.depth === 'basic'
                    ? 'bg-blue-900/30 border-blue-600 text-blue-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                Basic
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, depth: 'deep' }))}
                className={`px-3 py-2 rounded-lg border ${
                  formData.depth === 'deep'
                    ? 'bg-purple-900/30 border-purple-600 text-purple-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                Deep
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, depth: 'expert' }))}
                className={`px-3 py-2 rounded-lg border ${
                  formData.depth === 'expert'
                    ? 'bg-red-900/30 border-red-600 text-red-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                Expert
              </button>
            </div>
          </div>
          
          {/* Custom Instructions (shown only if Custom Research is selected) */}
          {formData.researchType === 'custom' && (
            <div className="space-y-2">
              <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-300">
                Custom Instructions
              </label>
              <textarea
                id="customInstructions"
                name="customInstructions"
                value={formData.customInstructions}
                onChange={handleChange}
                rows={4}
                placeholder="Enter specific instructions for your research. For example: Compare the governance models of top 3 Aptos DeFi protocols..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500"
            >
              Start Research
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 