import React, { useState } from 'react';
import { X, DollarSign, Loader2, Zap, AlertCircle } from 'lucide-react';

type GeneratedRecommendations = {
  panels: Array<{
    name: string;
    type: 'monocrystalline' | 'polycrystalline' | 'thin-film';
    manufacturer: string;
    efficiency: number;
    powerRating: number;
    warranty: number;
    pricePerPanel: { min: number; max: number; currency: string };
    totalCost: number;
    description: string;
    pros: string[];
    cons: string[];
    bestFor: string[];
    reasoning: string;
  }>;
  localInstallers: Array<{
    name: string;
    company: string;
    email: string;
    phone: string;
    website?: string;
    isLocal: boolean;
    serviceArea: string;
    rating: number;
    yearsInBusiness: number;
    projectsCompleted: number;
    certifications: string[];
    services: string[];
    budgetRange: { min: number; max: number; currency: string };
    description: string;
    specializations: string[];
    estimatedCost: number;
    reasoning: string;
  }>;
  globalInstallers: Array<{
    name: string;
    company: string;
    email: string;
    phone: string;
    website?: string;
    isLocal: boolean;
    serviceArea: string;
    rating: number;
    yearsInBusiness: number;
    projectsCompleted: number;
    certifications: string[];
    services: string[];
    budgetRange: { min: number; max: number; currency: string };
    description: string;
    specializations: string[];
    estimatedCost: number;
    reasoning: string;
  }>;
  budgetAnalysis: {
    isRealistic: boolean;
    notes: string;
    recommendations: string;
  };
};

type RecommendationsGeneratorProps = {
  isOpen: boolean;
  onClose: () => void;
  project: {
    _id: string;
    name: string;
    location: {
      city: string;
      country: string;
      lat?: number;
      lon?: number;
    };
    analysis?: {
      totalPanels: number;
      totalPowerKw: number;
      orientation: number | string;
      layout: string;
      annualProduction: number;
      sunAnalysis?: string;
      shadowAnalysis?: string;
    };
    systemSpecs?: {
      totalPanels: number;
      systemSizeKw: number;
      estimatedAnnualProductionKwh: number;
    };
  };
  projectType: 'saved' | 'finalized';
  onRecommendationsGenerated: (recommendations: GeneratedRecommendations) => void;
};

const RecommendationsGenerator: React.FC<RecommendationsGeneratorProps> = ({
  isOpen,
  onClose,
  project,
  projectType,
  onRecommendationsGenerated,
}) => {
  const [budget, setBudget] = useState({ min: 10000, max: 30000 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const systemSpecs = projectType === 'finalized' 
    ? project.systemSpecs 
    : {
        totalPanels: project.analysis?.totalPanels || 0,
        systemSizeKw: project.analysis?.totalPowerKw || 0,
        estimatedAnnualProductionKwh: project.analysis?.annualProduction || 0,
      };

  const handleGenerate = async () => {
    if (budget.min >= budget.max) {
      setError('Maximum budget must be greater than minimum budget');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/get-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: project.location,
          budget: { ...budget, currency: 'USD' },
          systemSpecs,
          analysis: project.analysis,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onRecommendationsGenerated(result.recommendations);
        onClose();
      } else {
        setError(result.error || 'Failed to get recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to fetch recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-lg w-full border border-orange-500/30 shadow-2xl shadow-orange-500/20">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-yellow-500 p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="pr-12">
            <h2 className="text-2xl font-bold text-white mb-2">Generate Recommendations</h2>
            <p className="text-white/80 text-sm">
              Set your budget for AI-powered panel and installer recommendations
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* Project Info */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="text-sm text-slate-400 mb-1">Generating for:</div>
            <div className="font-semibold text-white">{project.name}</div>
            <div className="text-sm text-slate-300 mt-1">
              {project.location.city}, {project.location.country}
            </div>
          </div>

          {/* System Info */}
          <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-sm font-semibold text-blue-400 mb-2">System Requirements:</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Panels:</span>
                <div className="font-medium text-white">{systemSpecs?.totalPanels}</div>
              </div>
              <div>
                <span className="text-slate-400">Size:</span>
                <div className="font-medium text-white">{systemSpecs?.systemSizeKw} kW</div>
              </div>
              <div>
                <span className="text-slate-400">Production:</span>
                <div className="font-medium text-white">{systemSpecs?.estimatedAnnualProductionKwh.toLocaleString()} kWh/yr</div>
              </div>
            </div>
          </div>

          {/* Budget Inputs */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Minimum Budget (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={budget.min}
                  onChange={(e) => setBudget({ ...budget, min: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  placeholder="10000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Maximum Budget (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={budget.max}
                  onChange={(e) => setBudget({ ...budget, max: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  placeholder="30000"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Zap className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-300">
                <strong>Tip:</strong> Typical costs for a {systemSpecs?.systemSizeKw} kW system 
                range from $15,000-$35,000 including installation.
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsGenerator;