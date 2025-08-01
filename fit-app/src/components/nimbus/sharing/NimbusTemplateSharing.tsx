import React, { useState, useEffect } from 'react';
import { Share2, Download, Search, Star, Copy, Check } from 'lucide-react';
import { NimbusTemplateSharing as TemplateSharingService, NimbusSharedTemplate, NimbusWorkoutTemplate } from '../../../services/nimbus/NimbusTemplateSharing';

export const NimbusTemplateSharing: React.FC<{
  onTemplateImported: (template: NimbusWorkoutTemplate) => void;
}> = ({ onTemplateImported }) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'import'>('browse');
  const [publicTemplates, setPublicTemplates] = useState<NimbusSharedTemplate[]>([]);
  const [importCode, setImportCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const templateSharing = new TemplateSharingService();

  useEffect(() => {
    loadPublicTemplates();
  }, []);

  const loadPublicTemplates = async () => {
    try {
      const templates = await templateSharing.browsePublicTemplates();
      setPublicTemplates(templates);
    } catch (error) {
      console.error('Failed to load public templates:', error);
    }
  };

  const handleImportTemplate = async () => {
    if (!importCode.trim()) {
      setImportError('Please enter a share code');
      return;
    }

    setIsImporting(true);
    setImportError('');

    try {
      const template = await templateSharing.importSharedTemplate(importCode);
      onTemplateImported(template);
      setImportCode('');
      setActiveTab('browse');
    } catch (error) {
      setImportError(error.message || 'Failed to import template');
    } finally {
      setIsImporting(false);
    }
  };

  const copyShareCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="nimbus-template-sharing p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Share2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Workout Template Sharing
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Share your workout templates with the community or discover new ones
          </p>
        </div>

        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'browse'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Browse Templates</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'import'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Import Template</span>
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTemplates.map((template) => (
              <div key={template.shareCode} className="nimbus-glass rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      by {template.author}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    template.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    template.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {template.difficulty}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {template.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(template.rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      ({template.rating.toFixed(1)})
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {template.downloads} downloads
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => copyShareCode(template.shareCode)}
                    className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                  >
                    {copiedCode === template.shareCode ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {template.shareCode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'import' && (
          <div className="max-w-md mx-auto">
            <div className="nimbus-glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Import Shared Template
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Share Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter share code (e.g., NMB-ABC12345)"
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>

                {importError && (
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    {importError}
                  </div>
                )}

                <button
                  onClick={handleImportTemplate}
                  disabled={isImporting || !importCode.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Import Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 