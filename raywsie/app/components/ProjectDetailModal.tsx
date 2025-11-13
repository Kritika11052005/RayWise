import React from 'react';
import { X, MapPin, Zap, Sun, Calendar, Layers } from 'lucide-react';

type ProjectDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: {
    _id: string;
    name: string;
    description?: string;
    location: {
      city: string;
      country: string;
      lat?: number;
      lon?: number;
    };
    imageUrl?: string;
    renderedLayoutImage?: string; // Base64 image with panels
    polygonPoints?: Array<{ x: number; y: number }>;
    panelLayout?: Array<{ x: number; y: number; width: number; height: number; rotation: number }>;
    analysis?: {
      totalPanels: number;
      totalPowerKw: number;
      orientation: number | string;
      layout: string;
      annualProduction: number;
      recommendations: string;
      sunAnalysis?: string;
      shadowAnalysis?: string;
    };
    systemSpecs?: {
      totalPanels: number;
      systemSizeKw: number;
      estimatedAnnualProductionKwh: number;
      estimatedMonthlySavings: number;
      co2OffsetKgPerYear: number;
    };
    createdAt: number;
    status?: string;
    readyForInstallation?: boolean;
  };
  projectType: 'saved' | 'finalized';
};

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ isOpen, onClose, project, projectType }) => {
  if (!isOpen) return null;

  const isFinalized = projectType === 'finalized';
  const stats = isFinalized ? project.systemSpecs : {
    totalPanels: project.analysis?.totalPanels || 0,
    systemSizeKw: project.analysis?.totalPowerKw || 0,
    estimatedAnnualProductionKwh: project.analysis?.annualProduction || 0,
    estimatedMonthlySavings: Math.round((project.analysis?.annualProduction || 0) / 12 * 0.12),
    co2OffsetKgPerYear: Math.round((project.analysis?.annualProduction || 0) * 0.417),
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl max-w-5xl w-full border border-orange-500/30 shadow-2xl shadow-orange-500/20 my-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-yellow-500 p-6 rounded-t-2xl">
          <button
          aria-label="onclose"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="pr-12">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl font-bold text-white">{project.name}</h2>
              {isFinalized && (
                <span className="px-3 py-1 bg-green-500/20 border border-green-400 text-green-100 text-sm rounded-full font-medium">
                  ✓ Finalized
                </span>
              )}
              {!isFinalized && project.status === 'analyzed' && (
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-400 text-blue-100 text-sm rounded-full font-medium">
                  Analyzed
                </span>
              )}
              {!isFinalized && project.status === 'draft' && (
                <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-400 text-yellow-100 text-sm rounded-full font-medium">
                  Draft
                </span>
              )}
            </div>
            
            {project.description && (
              <p className="text-white/90 mb-3">{project.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{project.location.city}, {project.location.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Layout Image */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              Panel Layout Visualization
            </h3>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              {project.renderedLayoutImage ? (
                <img
                  src={project.renderedLayoutImage}
                  alt={`${project.name} layout`}
                  className="w-full rounded-lg border border-slate-600"
                />
              ) : project.imageUrl ? (
                <div className="relative">
                  <img
                    src={project.imageUrl}
                    alt={`${project.name}`}
                    className="w-full rounded-lg border border-slate-600"
                  />
                  <p className="text-center text-slate-400 text-sm mt-2">
                    Original image (panel layout not rendered)
                  </p>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No layout image available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* System Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-4">
              <div className="text-orange-400 text-sm font-medium mb-1">Total Panels</div>
              <div className="text-3xl font-bold text-white">{stats?.totalPanels}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
              <div className="text-green-400 text-sm font-medium mb-1">System Size</div>
              <div className="text-3xl font-bold text-white">{stats?.systemSizeKw} kW</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
              <div className="text-blue-400 text-sm font-medium mb-1">Annual Production</div>
              <div className="text-2xl font-bold text-white">{stats?.estimatedAnnualProductionKwh.toLocaleString()} kWh</div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="text-emerald-400 text-sm font-medium mb-1">Monthly Savings</div>
              <div className="text-3xl font-bold text-white">${stats?.estimatedMonthlySavings}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
              <div className="text-purple-400 text-sm font-medium mb-1">CO₂ Offset</div>
              <div className="text-2xl font-bold text-white">
                {typeof stats?.co2OffsetKgPerYear === 'number'
                  ? `${Math.round(stats.co2OffsetKgPerYear).toLocaleString()} kg/yr`
                  : '—'}
              </div>
            </div>
          </div>

          {/* Analysis Details */}
          {project.analysis && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Analysis Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">Optimal Orientation</div>
                  <div className="text-xl font-bold text-white">{project.analysis.orientation}°</div>
                </div>
                
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">Panel Layout</div>
                  <div className="text-xl font-bold text-white">{project.analysis.layout}</div>
                </div>
              </div>

              {project.analysis.sunAnalysis && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-semibold text-yellow-300">Sun Analysis</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{project.analysis.sunAnalysis}</p>
                </div>
              )}

              {project.analysis.shadowAnalysis && (
                <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-lg">🌓</div>
                    <h4 className="font-semibold text-purple-300">Shadow Analysis</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{project.analysis.shadowAnalysis}</p>
                </div>
              )}

              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg">💡</div>
                  <h4 className="font-semibold text-orange-300">AI Recommendations</h4>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{project.analysis.recommendations}</p>
              </div>
            </div>
          )}

          {/* Installation Status */}
          {isFinalized && (
            <div className="mt-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  {project.readyForInstallation ? (
                    <span className="text-2xl">✓</span>
                  ) : (
                    <span className="text-2xl">⏳</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {project.readyForInstallation ? 'Ready for Installation' : 'Under Review'}
                  </div>
                  <div className="text-sm text-slate-300">
                    {project.readyForInstallation 
                      ? 'This layout has been finalized and is ready for professional installation.'
                      : 'This layout is being reviewed by our experts and will be ready soon.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 rounded-b-2xl bg-slate-800/50">
          <button
            onClick={onClose}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;