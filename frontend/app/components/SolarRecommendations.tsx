// components/SolarRecommendations.tsx
import React, { useState, useEffect } from 'react';
import { DollarSign, Zap, Award, Phone, Mail, Globe, CheckCircle, Building2, MapPin, Loader2, AlertCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
interface PanelRecommendation {
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
}

interface InstallerRecommendation {
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
}

interface SolarRecommendationsProps {
  finalizedLayoutId: Id<'finalizedLayouts'> | null;
  savedProjectId: Id<'savedProjects'> | null;
  location: {
    city: string;
    country: string;
    lat?: number;
    lon?: number;
  };
  systemSpecs: {
    totalPanels: number;
    systemSizeKw: number;
    estimatedAnnualProductionKwh: number;
  };
  analysis?: {
    orientation: number | string;
    layout: string;
    sunAnalysis?: string;
    shadowAnalysis?: string;
  };
}

const SolarRecommendations: React.FC<SolarRecommendationsProps> = ({
  finalizedLayoutId,
  savedProjectId,
  location,
  systemSpecs,
  analysis,
}) => {
  const [budget, setBudget] = useState({ min: 10000, max: 30000, currency: 'USD' });
  const [selectedPanelIndex, setSelectedPanelIndex] = useState<number | null>(null);
  const [selectedInstallerIndex, setSelectedInstallerIndex] = useState<number | null>(null);
  const [selectedInstallerIsLocal, setSelectedInstallerIsLocal] = useState<boolean>(true);
  const [showBudgetInput, setShowBudgetInput] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingRecommendation, setSavingRecommendation] = useState<string | null>(null);
  const unsavePanelRecommendation = useMutation(api.savedRecommendations.unsavePanelRecommendation);
const unsaveInstallerRecommendation = useMutation(api.savedRecommendations.unsaveInstallerRecommendation);
  const [recommendations, setRecommendations] = useState<{
    panels: PanelRecommendation[];
    localInstallers: InstallerRecommendation[];
    globalInstallers: InstallerRecommendation[];
    budgetAnalysis: {
      isRealistic: boolean;
      notes: string;
      recommendations: string;
    };
  } | null>(null);

  // Mutations and Queries
  const saveUserSolution = useMutation(api.recommendations.saveUserSolution);
  const savePanelRecommendation = useMutation(api.savedRecommendations.savePanelRecommendation);
  const saveInstallerRecommendation = useMutation(api.savedRecommendations.saveInstallerRecommendation);
  
  const existingSolution = useQuery(
    api.recommendations.getUserSolution,
    finalizedLayoutId ? { finalizedLayoutId } : savedProjectId ? { savedProjectId } : 'skip'
  );

  const fetchRecommendations = async () => {
    if (budget.min >= budget.max) {
      alert('Maximum budget must be greater than minimum budget');
      return;
    }

    setLoading(true);
    setError(null);
    setShowBudgetInput(false);

    try {
      const response = await fetch('/api/get-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          budget,
          systemSpecs,
          analysis,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRecommendations(result.recommendations);
      } else {
        setError(result.error || 'Failed to get recommendations');
        setShowBudgetInput(true);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to fetch recommendations. Please try again.');
      setShowBudgetInput(true);
    } finally {
      setLoading(false);
    }
  };

  // Save individual panel recommendation
  const handleSavePanelRecommendation = async (panel: PanelRecommendation) => {
    setSavingRecommendation(`panel-${panel.name}`);
    try {
      await savePanelRecommendation({
        finalizedLayoutId: finalizedLayoutId ?? undefined,
        savedProjectId: savedProjectId ?? undefined,
        panelData: panel,
      });
      alert(`✓ ${panel.name} saved to your recommendations!`);
    } catch (error) {
      console.error('Error saving panel:', error);
      alert(error instanceof Error ? error.message : 'Failed to save panel recommendation');
    } finally {
      setSavingRecommendation(null);
    }
  };

  // Save individual installer recommendation
  const handleSaveInstallerRecommendation = async (installer: InstallerRecommendation) => {
    setSavingRecommendation(`installer-${installer.company}`);
    try {
      await saveInstallerRecommendation({
        finalizedLayoutId: finalizedLayoutId ?? undefined,
        savedProjectId: savedProjectId ?? undefined,
        installerData: installer,
      });
      alert(`✓ ${installer.company} saved to your recommendations!`);
    } catch (error) {
      console.error('Error saving installer:', error);
      alert(error instanceof Error ? error.message : 'Failed to save installer recommendation');
    } finally {
      setSavingRecommendation(null);
    }
  };
  // Unsave individual panel recommendation
const handleUnsavePanelRecommendation = async (panel: PanelRecommendation) => {
    setSavingRecommendation(`panel-${panel.name}`);
    try {
      await unsavePanelRecommendation({
        panelName: panel.name,
        panelManufacturer: panel.manufacturer,
      });
      alert(`✓ ${panel.name} removed from your saved recommendations`);
    } catch (error) {
      console.error('Error unsaving panel:', error);
      alert(error instanceof Error ? error.message : 'Failed to unsave panel recommendation');
    } finally {
      setSavingRecommendation(null);
    }
  };
  // Unsave individual installer recommendation
const handleUnsaveInstallerRecommendation = async (installer: InstallerRecommendation) => {
    setSavingRecommendation(`installer-${installer.company}`);
    try {
      await unsaveInstallerRecommendation({
        installerCompany: installer.company,
        installerEmail: installer.email,
      });
      alert(`✓ ${installer.company} removed from your saved recommendations`);
    } catch (error) {
      console.error('Error unsaving installer:', error);
      alert(error instanceof Error ? error.message : 'Failed to unsave installer recommendation');
    } finally {
      setSavingRecommendation(null);
    }
  };
  const handleSaveSolution = async () => {
    if (!finalizedLayoutId) {
      alert('Please finalize your layout first');
      return;
    }

    if (selectedPanelIndex === null && selectedInstallerIndex === null) {
      alert('Please select at least a panel type or an installer');
      return;
    }

    const layoutId = finalizedLayoutId;

    setSaving(true);
    try {
      const selectedPanel = selectedPanelIndex !== null ? recommendations?.panels[selectedPanelIndex] : null;
      const selectedInstaller = selectedInstallerIndex !== null 
        ? (selectedInstallerIsLocal 
            ? recommendations?.localInstallers[selectedInstallerIndex]
            : recommendations?.globalInstallers[selectedInstallerIndex])
        : null;

      await saveUserSolution({
        finalizedLayoutId: layoutId,
        savedProjectId: savedProjectId !== null ? savedProjectId : undefined,
        userBudget: budget,
        panelDetails: selectedPanel ? {
          name: selectedPanel.name,
          type: selectedPanel.type,
          manufacturer: selectedPanel.manufacturer,
          powerRating: selectedPanel.powerRating,
          quantity: systemSpecs.totalPanels,
          totalCost: selectedPanel.totalCost,
        } : undefined,
        installerDetails: selectedInstaller ? {
          name: selectedInstaller.name,
          company: selectedInstaller.company,
          contact: selectedInstaller.email,
          estimatedCost: selectedInstaller.estimatedCost,
        } : undefined,
      });
      
      alert('Solution saved successfully! Your selected installer will be notified.');
    } catch (error) {
      console.error('Error saving solution:', error);
      alert('Failed to save solution: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (showBudgetInput) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-500" />
          Set Your Budget
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter your budget range to get AI-powered personalized recommendations for solar panels and installers.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Budget (USD)</label>
            <input
              type="number"
              value={budget.min}
              onChange={(e) => setBudget({ ...budget, min: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Maximum Budget (USD)</label>
            <input
              type="number"
              value={budget.max}
              onChange={(e) => setBudget({ ...budget, max: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="30000"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Tip:</strong> Your system requires {systemSpecs.totalPanels} panels 
              ({systemSpecs.systemSizeKw} kW). Typical costs range from $15,000-$35,000 including installation.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting AI Recommendations...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Get AI-Powered Recommendations
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Analyzing Your Requirements...</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Our AI is finding the best solar panels and installers for your location and budget
        </p>
      </div>
    );
  }

  if (!recommendations) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Budget Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="font-medium">
              Budget: ${budget.min.toLocaleString()} - ${budget.max.toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => setShowBudgetInput(true)}
            className="text-sm text-green-500 hover:text-green-600"
          >
            Change
          </button>
        </div>
      </div>

      {/* Budget Analysis */}
      {recommendations.budgetAnalysis && (
        <div className={`rounded-lg shadow-lg p-6 border ${
          recommendations.budgetAnalysis.isRealistic
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {recommendations.budgetAnalysis.isRealistic ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            Budget Analysis
          </h3>
          <p className="text-sm mb-2">{recommendations.budgetAnalysis.notes}</p>
          <p className="text-sm font-medium">{recommendations.budgetAnalysis.recommendations}</p>
        </div>
      )}

      {/* Recommended Panel Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          AI-Recommended Solar Panel Types
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Based on your system requirements, budget, and location
        </p>

        {recommendations.panels.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No panel recommendations available. Try adjusting your budget.
          </p>
        ) : (
          <div className="space-y-4">
            {recommendations.panels.map((panel, index) => (
  <PanelCard
    key={index}
    panel={panel}
    systemSpecs={systemSpecs}
    isSelected={selectedPanelIndex === index}
    onSelect={() => setSelectedPanelIndex(index)}
    onSave={() => handleSavePanelRecommendation(panel)}
    onUnsave={() => handleUnsavePanelRecommendation(panel)}
    isSaving={savingRecommendation === `panel-${panel.name}`}
  />
))}
          </div>
        )}
      </div>

      {/* Recommended Installers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-500" />
          AI-Recommended Solar Installers
        </h3>

        <div className="space-y-6">
          {/* Local Installers */}
          {recommendations.localInstallers.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-500" />
                Local Installers in {location.city}, {location.country}
              </h4>
              <div className="space-y-3">
                {recommendations.localInstallers.map((installer, index) => (
                  <InstallerCard
                    key={index}
                    installer={installer}
                    isSelected={selectedInstallerIndex === index && selectedInstallerIsLocal}
                    onSelect={() => {
                      setSelectedInstallerIndex(index);
                      setSelectedInstallerIsLocal(true);
                    }}
                    onSave={() => handleSaveInstallerRecommendation(installer)}
onUnsave={() => handleUnsaveInstallerRecommendation(installer)}
isSaving={savingRecommendation === `installer-${installer.company}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Global Installers */}
          {recommendations.globalInstallers.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Global Installers (Available Worldwide)
              </h4>
              <div className="space-y-3">
                {recommendations.globalInstallers.map((installer, index) => (
                  <InstallerCard
                    key={index}
                    installer={installer}
                    isSelected={selectedInstallerIndex === index && !selectedInstallerIsLocal}
                    onSelect={() => {
                      setSelectedInstallerIndex(index);
                      setSelectedInstallerIsLocal(false);
                    }}
                    onSave={() => handleSaveInstallerRecommendation(installer)}
onUnsave={() => handleUnsaveInstallerRecommendation(installer)}
isSaving={savingRecommendation === `installer-${installer.company}`}
                  />
                ))}
              </div>
            </div>
          )}

          {recommendations.localInstallers.length === 0 && recommendations.globalInstallers.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No installer recommendations available. Please try adjusting your budget or contact us for assistance.
            </p>
          )}
        </div>
      </div>

      {/* Save Solution Button */}
      {(selectedPanelIndex !== null || selectedInstallerIndex !== null) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSaveSolution}
            disabled={saving || (!finalizedLayoutId && !savedProjectId)}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Finalize & Save Solution
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Your selected installer will be notified and will contact you for next steps
          </p>
        </div>
      )}

      {/* Existing Solution Display */}
      {existingSolution && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="font-semibold text-green-700 dark:text-green-300 mb-2">
            ✓ Solution Saved
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Status: {existingSolution.status.replace(/_/g, ' ')}
          </p>
          {existingSolution.totalProjectCost && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Estimated Total: ${existingSolution.totalProjectCost.toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
const PanelCard: React.FC<{
    panel: PanelRecommendation;
    systemSpecs: { totalPanels: number };
    isSelected: boolean;
    onSelect: () => void;
    onSave: () => void;
    onUnsave: () => void;
    isSaving: boolean;
  }> = ({ panel, systemSpecs, isSelected, onSelect, onSave, onUnsave, isSaving }) => {
    const [localSaved, setLocalSaved] = useState(false);
    
    // Query to check if this panel is already saved
    const savedPanel = useQuery(api.savedRecommendations.getSavedRecommendation, {
      type: 'panel',
      panelName: panel.name,
      panelManufacturer: panel.manufacturer,
    });
  
    // Update local state when query result changes
    useEffect(() => {
      setLocalSaved(!!savedPanel);
    }, [savedPanel]);
  
    const isSaved = localSaved;
  
    const handleSaveClick = async () => {
      if (isSaved) {
        await onUnsave();
        setLocalSaved(false); // Immediately update UI
      } else {
        await onSave();
        setLocalSaved(true); // Immediately update UI
      }
    };
  
    return (
      <div
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          isSelected
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-lg">{panel.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{panel.manufacturer}</p>
          </div>
          <div className="flex items-center gap-2">
            {isSelected && (
              <CheckCircle className="w-6 h-6 text-green-500" />
            )}
  
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveClick();
              }}
              disabled={isSaving}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isSaved
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isSaved ? 'Removing...' : 'Saving...'}</span>
                </>
              ) : isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  <span>UNSAVE</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>SAVE</span>
                </>
              )}
            </button>
          </div>
        </div>
  
        {/* Rest of the component remains the same */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <p className="text-xs text-gray-500">Type</p>
            <p className="font-medium capitalize">{panel.type}</p>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <p className="text-xs text-gray-500">Efficiency</p>
            <p className="font-medium">{panel.efficiency}%</p>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <p className="text-xs text-gray-500">Power Rating</p>
            <p className="font-medium">{panel.powerRating}W</p>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <p className="text-xs text-gray-500">Warranty</p>
            <p className="font-medium">{panel.warranty} years</p>
          </div>
        </div>
  
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded mb-3">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            Est. Total Cost: ${panel.totalCost.toLocaleString()}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            ${panel.pricePerPanel.min}-${panel.pricePerPanel.max} per panel • {systemSpecs.totalPanels} panels needed
          </p>
        </div>
  
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{panel.description}</p>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">✓ Pros:</p>
            <ul className="text-xs space-y-1">
              {panel.pros.map((pro, i) => (
                <li key={i} className="text-gray-600 dark:text-gray-400">• {pro}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">✗ Cons:</p>
            <ul className="text-xs space-y-1">
              {panel.cons.map((con, i) => (
                <li key={i} className="text-gray-600 dark:text-gray-400">• {con}</li>
              ))}
            </ul>
          </div>
        </div>
  
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Why Recommended:</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">{panel.reasoning}</p>
        </div>
  
        <div className="flex flex-wrap gap-2 mt-3">
          {panel.bestFor.map((use, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
            >
              {use}
            </span>
          ))}
        </div>
      </div>
    );
  };
// Installer Card Component
const InstallerCard: React.FC<{
    installer: InstallerRecommendation;
    isSelected: boolean;
    onSelect: () => void;
    onSave: () => void;
    onUnsave: () => void;
    isSaving: boolean;
  }> = ({ installer, isSelected, onSelect, onSave, onUnsave, isSaving }) => {
    const [localSaved, setLocalSaved] = useState(false);
    
    // Query to check if this installer is already saved
    const savedInstaller = useQuery(api.savedRecommendations.getSavedRecommendation, {
      type: 'installer',
      installerCompany: installer.company,
      installerEmail: installer.email,
    });
  
    // Update local state when query result changes
    useEffect(() => {
      setLocalSaved(!!savedInstaller);
    }, [savedInstaller]);
  
    const isSaved = localSaved;
  
    const handleSaveClick = async () => {
      if (isSaved) {
        await onUnsave();
        setLocalSaved(false); // Immediately update UI
      } else {
        await onSave();
        setLocalSaved(true); // Immediately update UI
      }
    };
  
    return (
      <div
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h5 className="font-semibold flex items-center gap-2">
              {installer.company}
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">{installer.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {isSelected && (
              <CheckCircle className="w-6 h-6 text-blue-500" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveClick();
              }}
              disabled={isSaving}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isSaved
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isSaved ? 'Removing...' : 'Saving...'}</span>
                </>
              ) : isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Unsave</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
  
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-yellow-500" />
            <span>{installer.rating.toFixed(1)} ⭐</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {installer.yearsInBusiness} years exp.
          </div>
        </div>
  
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {installer.description}
        </p>
  
        <div className="flex flex-wrap gap-2 mb-3">
          {installer.certifications.slice(0, 3).map((cert, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
            >
              {cert}
            </span>
          ))}
        </div>
  
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded mb-3">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            Estimated Project Cost: ${installer.estimatedCost.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Budget Range: ${installer.budgetRange.min.toLocaleString()} - ${installer.budgetRange.max.toLocaleString()}
          </p>
        </div>
  
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded mb-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Why Recommended:</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">{installer.reasoning}</p>
        </div>
  
        <div className="flex gap-3 text-sm">
          <a
            href={`mailto:${installer.email}`}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
          
          <a
            href={`tel:${installer.phone}`}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
          {installer.website && (
            <a
              href={installer.website.startsWith('http') ? installer.website : `https://${installer.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4" />
              Website
            </a>
          )}
        </div>
      </div>
    );
  };

export default SolarRecommendations;