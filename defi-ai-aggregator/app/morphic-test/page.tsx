'use client';

import { useState } from 'react';
import Link from 'next/link';
import MorphicTest from '@/components/MorphicTest';
import { ChevronLeftIcon, CheckCircleIcon, XCircleIcon, FileIcon } from 'lucide-react';

export default function MorphicTestPage() {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSuccess = () => {
    setTestResult({
      success: true,
      message: 'Morphic integration test successful!'
    });
  };

  const handleError = (error: Error) => {
    setTestResult({
      success: false,
      message: `Error: ${error.message}`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
            
            {testResult && (
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                testResult.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                {testResult.success ? (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                ) : (
                  <XCircleIcon className="h-4 w-4 mr-2" />
                )}
                {testResult.message}
              </div>
            )}
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h1 className="text-2xl font-bold text-blue-300 mb-2">Morphic Integration Test</h1>
            <p className="text-gray-400 mb-6">
              This page tests whether the Morphic configuration and environment are correctly set up in your project.
            </p>
            
            <div className="mb-8">
              <MorphicTest onSuccess={handleSuccess} onError={handleError} />
            </div>
            
            <div className="border-t border-gray-800 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-blue-300 mb-4">Integration Notes</h2>
              
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start">
                    <FileIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-300 mb-1">Required Environment Variables</h3>
                      <p className="text-gray-400 mb-2">
                        Make sure you have the following environment variables set in your <code>.env.local</code> file:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        <li><code>OPENAI_API_KEY</code> - Required for AI completions</li>
                        <li><code>ANTHROPIC_API_KEY</code> - Optional, for Claude models</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start">
                    <FileIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-300 mb-1">Path Aliases</h3>
                      <p className="text-gray-400 mb-2">
                        Check your <code>tsconfig.json</code> for proper path aliases configuration:
                      </p>
                      <pre className="bg-black/30 p-2 rounded text-xs overflow-x-auto">
{`"paths": {
  "@/*": ["./*"],
  "@/components/*": ["./components/*", "./morphic/components/*"],
  "@/lib/*": ["./lib/*", "./morphic/lib/*"]
}`}
                      </pre>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start">
                    <FileIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-300 mb-1">Next Steps</h3>
                      <p className="text-gray-400">
                        Once this test passes, you can integrate the full Morphic functionality into your Advanced Research feature.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 