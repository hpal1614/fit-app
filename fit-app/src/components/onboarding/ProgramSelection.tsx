import React from 'react';
import { FileText, Brain, Library } from 'lucide-react';

interface ProgramSelectionProps {
  onChoosePdf: () => void;
  onChooseAI: () => void;
  onChooseBrowse: () => void;
  onBack?: () => void;
}

const Card: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void }>
  = ({ title, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left bg-white/10 backdrop-blur-lg rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-colors"
  >
    <div className="flex items-center space-x-4">
      <div className="p-3 rounded-lg bg-white/10 text-white">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold">{title}</h3>
        <p className="text-white/70 text-sm">{description}</p>
      </div>
    </div>
  </button>
);

export const ProgramSelection: React.FC<ProgramSelectionProps> = ({ onChoosePdf, onChooseAI, onChooseBrowse, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Choose Your Program Setup</h1>
            <p className="text-white/70">Import from trainer, generate with AI, or pick a proven template</p>
          </div>
          {onBack && (
            <button onClick={onBack} className="text-white/80 hover:text-white">Back</button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card
            title="Upload PDF"
            description="Have a trainer's plan? We'll convert it into a smart template"
            icon={<FileText className="w-6 h-6" />}
            onClick={onChoosePdf}
          />
          <Card
            title="AI Generate"
            description="Let AI create a personalized program for your goals"
            icon={<Brain className="w-6 h-6" />}
            onClick={onChooseAI}
          />
          <Card
            title="Browse Templates"
            description="Pick from proven community and pro templates"
            icon={<Library className="w-6 h-6" />}
            onClick={onChooseBrowse}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgramSelection;
