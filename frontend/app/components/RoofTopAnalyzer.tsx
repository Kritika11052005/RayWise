import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Square, MousePointer, Zap, RotateCcw, Download, Loader2, Check, X, MapPin, Map, ZoomIn, ZoomOut, Move, Save, CheckCircle, Trash2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import SolarRecommendations from './SolarRecommendations';
const RooftopAnalyzer = () => {
  type Point = { x: number; y: number };
  type Panel = { x: number; y: number; width: number; height: number; rotation: number };
  type Analysis = {
    totalPanels: number;
    totalPowerKw: number;
    orientation: number | string;
    layout: string;
    annualProduction: number;
    recommendations: string;
    sunAnalysis?: string;
    shadowAnalysis?: string;
  } | null;

  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawMode, setDrawMode] = useState<'click' | 'freehand'>('click');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<Analysis>(null);
  const [panelLayout, setPanelLayout] = useState<Panel[]>([]);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [location, setLocation] = useState<{ city: string; country: string; lat?: number; lon?: number } | null>(null);
  const [locationInput, setLocationInput] = useState<string>('');
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [fetchingMapImage, setFetchingMapImage] = useState<boolean>(false);
  const [imageSource, setImageSource] = useState<'upload' | 'map'>('upload');
  const [showImageSourceModal, setShowImageSourceModal] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [currentProjectId, setCurrentProjectId] = useState<Id<'savedProjects'> | null>(null);
  const [currentFinalizedId, setCurrentFinalizedId] = useState<Id<'finalizedLayouts'> | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [finalizing, setFinalizing] = useState<boolean>(false);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Convex mutations
  const saveProjectMutation = useMutation(api.savedProject.saveProject);
  const updateProjectMutation = useMutation(api.savedProject.updateProject);
  const deleteProjectMutation = useMutation(api.savedProject.deleteProject);
  const finalizeLayoutMutation = useMutation(api.finalizedLayouts.finalizeLayout);
  const deleteFinalizedLayoutMutation = useMutation(api.finalizedLayouts.deleteFinalizedLayout);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setPolygonPoints([]);
      setAnalysis(null);
      setPanelLayout([]);
      setImageSource('upload');
      setCurrentProjectId(null);
      setCurrentFinalizedId(null);
      resetZoomAndPan();
    }
  };

  // Reset zoom and pan
  const resetZoomAndPan = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetView = () => {
    resetZoomAndPan();
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(prev => Math.max(0.5, Math.min(5, prev + delta)));
  };

  // Detect user's location
  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            try {
              let geocodeSuccess = false;

              try {
                const googleResponse = await fetch('/api/reverse-geocode', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lat: latitude, lng: longitude })
                });

                if (googleResponse.ok) {
                  const googleData = await googleResponse.json();
                  if (googleData.success) {
                    setLocation({
                      city: googleData.address.city,
                      country: googleData.address.country,
                      lat: latitude,
                      lon: longitude
                    });
                    setLocationInput(googleData.address.formatted);
                    geocodeSuccess = true;
                  }
                }
              } catch (googleError) {
                console.warn('Google reverse geocoding failed, trying OpenStreetMap:', googleError);
              }

              if (!geocodeSuccess) {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                  {
                    headers: {
                      'User-Agent': 'RooftopAnalyzer/1.0'
                    }
                  }
                );
                const data = await response.json();

                const city = data.address.city || data.address.town || data.address.village || 'Unknown';
                const country = data.address.country || 'Unknown';

                setLocation({ city, country, lat: latitude, lon: longitude });
                setLocationInput(`${city}, ${country}`);
              }

              setDetectingLocation(false);

              if (imageSource === 'map') {
                await fetchSatelliteImage(latitude, longitude);
              }
            } catch (error) {
              console.error('Geocoding error:', error);
              setLocation({ city: 'Unknown', country: 'Unknown', lat: latitude, lon: longitude });
              setLocationInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              setDetectingLocation(false);

              if (imageSource === 'map') {
                await fetchSatelliteImage(latitude, longitude);
              }
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            alert('Unable to detect location. Please check:\n\n' +
              '✓ Location permissions are enabled for this site\n' +
              '✓ Your device has location services turned on\n\n' +
              'Or enter your location manually instead.');
            setDetectingLocation(false);
          }
        );
      } else {
        alert('Geolocation is not supported by your browser');
        setDetectingLocation(false);
      }
    } catch (error) {
      console.error('Location detection error:', error);
      setDetectingLocation(false);
    }
  };

  // Geocode location string to coordinates
  const geocodeLocation = async (locationStr: string): Promise<{ lat: number; lon: number; formatted?: string } | null> => {
    try {
      try {
        const googleResponse = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: locationStr })
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          if (googleData.success) {
            return {
              lat: googleData.coordinates.lat,
              lon: googleData.coordinates.lng,
              formatted: googleData.formatted_address
            };
          }
        }
      } catch (googleError) {
        console.warn('Google geocoding failed, trying OpenStreetMap:', googleError);
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'RooftopAnalyzer/1.0'
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          formatted: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Fetch satellite image from Google Maps
  const fetchSatelliteImage = async (lat?: number, lon?: number) => {
    const latitude = lat || location?.lat;
    const longitude = lon || location?.lon;

    if (!latitude || !longitude) {
      if (locationInput.trim()) {
        const coords = await geocodeLocation(locationInput);
        if (coords) {
          setLocation(prev => ({ ...prev!, lat: coords.lat, lon: coords.lon }));
          await fetchSatelliteImageWithCoords(coords.lat, coords.lon);
        } else {
          alert('Could not find coordinates for this location. Please try a more specific address.');
        }
      } else {
        alert('Please enter a location first');
      }
      return;
    }

    await fetchSatelliteImageWithCoords(latitude, longitude);
  };

  const fetchSatelliteImageWithCoords = async (lat: number, lon: number) => {
    setFetchingMapImage(true);
    try {
      const response = await fetch('/api/fetch-satellite-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          zoom: 20,
          width: 1024,
          height: 768
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch satellite image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);

      const file = new File([blob], 'satellite-image.png', { type: 'image/png' });
      setImage(file);
      setImageSource('map');
      setPolygonPoints([]);
      setAnalysis(null);
      setPanelLayout([]);
      setCurrentProjectId(null);
      setCurrentFinalizedId(null);
      setShowImageSourceModal(false);
      resetZoomAndPan();
      setFetchingMapImage(false);

    } catch (error) {
      console.error('Error fetching satellite image:', error);
      alert(`Failed to fetch satellite image: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try:\n- A different location\n- Uploading your own image instead`);
      setFetchingMapImage(false);
    }
  };

  // Manual location input
  const handleLocationSubmit = async () => {
    if (locationInput.trim()) {
      const parts = locationInput.split(',').map(s => s.trim());

      if (imageSource === 'map') {
        const coords = await geocodeLocation(locationInput);
        if (coords) {
          const city = parts[0] || coords.formatted?.split(',')[0] || 'Unknown';
          const country = parts[parts.length - 1] || coords.formatted?.split(',').pop()?.trim() || 'Unknown';

          setLocation({
            city,
            country,
            lat: coords.lat,
            lon: coords.lon
          });
          setLocationInput(coords.formatted || locationInput);
          setShowLocationModal(false);
          await fetchSatelliteImage(coords.lat, coords.lon);
        } else {
          alert('Could not find this location. Please try:\n\n' +
            '✓ Full address (e.g., "123 Main St, New York, NY, USA")\n' +
            '✓ City and country (e.g., "New Delhi, India")\n' +
            '✓ Specific landmark (e.g., "Eiffel Tower, Paris")\n\n' +
            'Or use the Auto-Detect Location button instead.');
        }
      } else {
        setLocation({
          city: parts[0] || 'Unknown',
          country: parts[1] || 'Unknown'
        });
        setShowLocationModal(false);
      }
    }
  };

  // Helper function to check if point is inside polygon
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Helper function to check if all corners of a rotated panel are inside polygon
  const isPanelInsidePolygon = (panel: Panel, polygon: Point[]): boolean => {
    const angleInRadians = (panel.rotation * Math.PI) / 180;
    const cos = Math.cos(angleInRadians);
    const sin = Math.sin(angleInRadians);

    const halfWidth = panel.width / 2;
    const halfHeight = panel.height / 2;

    const centerX = panel.x + halfWidth;
    const centerY = panel.y + halfHeight;

    const corners = [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight }
    ];

    const transformedCorners = corners.map(corner => ({
      x: centerX + (corner.x * cos - corner.y * sin),
      y: centerY + (corner.x * sin + corner.y * cos)
    }));

    return transformedCorners.every(corner => isPointInPolygon(corner, polygon));
  };

  // Helper function to draw a rotated rectangle (panel)
  const drawRotatedPanel = (ctx: CanvasRenderingContext2D, panel: Panel) => {
    ctx.save();

    const centerX = panel.x + panel.width / 2;
    const centerY = panel.y + panel.height / 2;
    ctx.translate(centerX, centerY);

    const angleInRadians = (panel.rotation * Math.PI) / 180;
    ctx.rotate(angleInRadians);

    const halfWidth = panel.width / 2;
    const halfHeight = panel.height / 2;

    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.fillRect(-halfWidth, -halfHeight, panel.width, panel.height);

    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1;
    ctx.strokeRect(-halfWidth, -halfHeight, panel.width, panel.height);

    ctx.restore();
  };

  // Convert screen coordinates to canvas coordinates with zoom and pan
  const screenToCanvas = (screenX: number, screenY: number, rect: DOMRect) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    const relX = (screenX - rect.left) * scaleX - canvasCenterX;
    const relY = (screenY - rect.top) * scaleY - canvasCenterY;

    const x = (relX - panOffset.x) / zoomLevel + canvasCenterX;
    const y = (relY - panOffset.y) / zoomLevel + canvasCenterY;

    return { x, y };
  };

  // Redraw canvas with image, polygon, and panel layout
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    ctx.translate(canvasCenterX + panOffset.x, canvasCenterY + panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-canvasCenterX, -canvasCenterY);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (polygonPoints.length > 0) {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3 / zoomLevel;
      ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';

      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      if (polygonPoints.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      polygonPoints.forEach((point, idx) => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5 / zoomLevel, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = `${12 / zoomLevel}px sans-serif`;
        ctx.fillText(String(idx + 1), point.x + 8 / zoomLevel, point.y - 8 / zoomLevel);
      });
    }

    if (panelLayout.length > 0 && polygonPoints.length > 2) {
      panelLayout.forEach(panel => {
        if (isPanelInsidePolygon(panel, polygonPoints)) {
          drawRotatedPanel(ctx, panel);
        }
      });
    }

    ctx.restore();
  }, [polygonPoints, panelLayout, zoomLevel, panOffset]);

  useEffect(() => {
    if (imageUrl && canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const img = imageRef.current;

      if (img && canvas) {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          redrawCanvas();
        };
      }
    }
  }, [imageUrl, redrawCanvas]);

  // Handle canvas click for point-based drawing
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning || isDragging) return;
    if (!isDrawing || drawMode !== 'click') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const coords = screenToCanvas(e.clientX, e.clientY, rect);
    setPolygonPoints([...polygonPoints, coords]);
  };

  // Handle freehand drawing and panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: screenX - panOffset.x, y: screenY - panOffset.y });
      return;
    }

    if (!isDrawing || drawMode !== 'freehand') return;

    setIsDragging(true);
    const coords = screenToCanvas(e.clientX, e.clientY, rect);
    setPolygonPoints([coords]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning) {
      setPanOffset({
        x: screenX - panStart.x,
        y: screenY - panStart.y
      });
      return;
    }

    if (!isDrawing || drawMode !== 'freehand' || !isDragging || polygonPoints.length === 0) return;

    const coords = screenToCanvas(e.clientX, e.clientY, rect);
    setPolygonPoints([...polygonPoints, coords]);
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isDragging) {
      setIsDragging(false);
      if (drawMode === 'freehand' && polygonPoints.length > 2) {
        const simplified = simplifyPolygon(polygonPoints, 10);
        setPolygonPoints(simplified);
      }
    }
  };

  // Simplify polygon by reducing points
  const simplifyPolygon = (points: Point[], tolerance: number): Point[] => {
    if (points.length < 3) return points;
    const simplified = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      const dist = Math.sqrt(
        Math.pow(points[i].x - simplified[simplified.length - 1].x, 2) +
        Math.pow(points[i].y - simplified[simplified.length - 1].y, 2)
      );
      if (dist > tolerance) {
        simplified.push(points[i]);
      }
    }
    simplified.push(points[points.length - 1]);
    return simplified;
  };

  useEffect(() => {
    if (imageUrl) {
      redrawCanvas();
    }
  }, [imageUrl, polygonPoints, panelLayout, redrawCanvas, zoomLevel, panOffset]);

  // Start drawing
  const startDrawing = (mode: 'click' | 'freehand') => {
    setDrawMode(mode);
    setIsDrawing(true);
    setPolygonPoints([]);
    setPanelLayout([]);
    setAnalysis(null);
  };

  // Clear drawing
  const clearDrawing = () => {
    setPolygonPoints([]);
    setPanelLayout([]);
    setAnalysis(null);
    setIsDrawing(false);
    redrawCanvas();
  };

  // Analyze with Gemini API
  const analyzeRooftop = async () => {
    if (!image || polygonPoints.length < 3) {
      alert('Please upload an image and draw a polygon area first');
      return;
    }

    if (!location) {
      setShowLocationModal(true);
      return;
    }

    setAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = async () => {
        const base64Image = reader.result;

        const payload = {
          image: base64Image,
          polygon: polygonPoints,
          imageWidth: canvasRef.current?.width ?? 0,
          imageHeight: canvasRef.current?.height ?? 0,
          location: location
        };

        const response = await fetch('/api/analyze-rooftop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
          // Ensure all numeric fields are properly typed
          const typedAnalysis = {
            ...result.analysis,
            totalPanels: Number(result.analysis.totalPanels),
            totalPowerKw: Number(result.analysis.totalPowerKw),
            orientation: typeof result.analysis.orientation === 'string'
              ? result.analysis.orientation
              : Number(result.analysis.orientation),
            annualProduction: Number(result.analysis.annualProduction),
          };

          setAnalysis(typedAnalysis);
          setPanelLayout(result.panelLayout);
        } else {
          alert('Analysis failed: ' + result.error);
        }
      };
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze rooftop. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Save Project
  const handleSaveProject = async () => {
    if (!location || !imageUrl || polygonPoints.length < 3) {
      alert('Please ensure you have:\n- Set a location\n- Uploaded/fetched an image\n- Drawn a polygon area');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    try {
      const projectName = prompt('Enter a name for this project:');
      if (!projectName) {
        setSaving(false);
        return;
      }

      const description = prompt('Enter a description (optional):') || undefined;

      if (currentProjectId) {
        // Update existing project
        await updateProjectMutation({
          projectId: currentProjectId,
          name: projectName,
          description,
          polygonPoints,
          analysis: analysis || undefined,
          panelLayout: panelLayout.length > 0 ? panelLayout : undefined,
        });
        alert('Project updated successfully!');
      } else {
        // Create new project
        const projectId = await saveProjectMutation({
          name: projectName,
          description,
          location,
          imageUrl,
          imageSource,
          polygonPoints,
          imageWidth: canvas.width,
          imageHeight: canvas.height,
          analysis: analysis || undefined,
          panelLayout: panelLayout.length > 0 ? panelLayout : undefined,
        });
        setCurrentProjectId(projectId);
        alert('Project saved successfully!');
      }
    } catch (error) {
      console.error('Save project error:', error);
      alert('Failed to save project: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Finalize Layout
  const handleFinalizeLayout = async () => {
    if (!location || !analysis || !panelLayout.length || polygonPoints.length < 3) {
      alert('Please complete the analysis before finalizing:\n- Set location\n- Draw polygon\n- Run AI analysis');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setFinalizing(true);
    try {
      const layoutName = prompt('Enter a name for this finalized layout:');
      if (!layoutName) {
        setFinalizing(false);
        return;
      }

      const description = prompt('Enter a description (optional):') || undefined;

      const finalizedId = await finalizeLayoutMutation({
        savedProjectId: currentProjectId ?? undefined,
        name: layoutName,
        description,
        location,
        imageUrl: imageUrl ?? undefined,
        polygonPoints,
        imageWidth: canvas.width,
        imageHeight: canvas.height,
        analysis,
        panelLayout,
      });

      setCurrentFinalizedId(finalizedId);
      alert('Layout finalized successfully! It has been saved for expert review and installation planning.');
    } catch (error) {
      console.error('Finalize layout error:', error);
      alert('Failed to finalize layout: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setFinalizing(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    if (!currentProjectId) {
      alert('No saved project to delete');
      return;
    }

    if (!confirm('Are you sure you want to delete this saved project? This cannot be undone.')) {
      return;
    }

    try {
      await deleteProjectMutation({ projectId: currentProjectId });
      setCurrentProjectId(null);
      alert('Project deleted successfully!');
    } catch (error) {
      console.error('Delete project error:', error);
      alert('Failed to delete project: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Delete Finalized Layout
  const handleDeleteFinalizedLayout = async () => {
    if (!currentFinalizedId) {
      alert('No finalized layout to delete');
      return;
    }

    if (!confirm('Are you sure you want to delete this finalized layout? This cannot be undone.')) {
      return;
    }

    try {
      await deleteFinalizedLayoutMutation({ layoutId: currentFinalizedId });
      setCurrentFinalizedId(null);
      alert('Finalized layout deleted successfully!');
    } catch (error) {
      console.error('Delete finalized layout error:', error);
      alert('Failed to delete finalized layout: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Download results
  const downloadResults = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'solar-panel-layout.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 dark:from-orange-600 dark:to-yellow-600 rounded-lg p-6 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">AI Rooftop Analyzer</h2>
        <p className="text-white/90">Upload your rooftop image or fetch satellite view, set your location, draw the installation area, and get AI-powered solar panel layout with sun analysis</p>
      </div>

      {/* Image Source Selection Modal */}
      {showImageSourceModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Get Rooftop Image</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose how you want to provide your rooftop image for analysis.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowImageSourceModal(false);
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white px-4 py-4 rounded-lg font-medium transition-colors shadow-md"
              >
                <Upload className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Upload Image</div>
                  <div className="text-xs text-white/90">Upload your own rooftop photo</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowImageSourceModal(false);
                  setImageSource('map');
                  setShowLocationModal(true);
                }}
                className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white px-4 py-4 rounded-lg font-medium transition-colors shadow-md"
              >
                <Map className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Fetch Satellite View</div>
                  <div className="text-xs text-white/90">Get image from map using location</div>
                </div>
              </button>

              <button
                onClick={() => setShowImageSourceModal(false)}
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Set Your Location</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {imageSource === 'map'
                ? 'Enter your location to fetch satellite imagery of your rooftop.'
                : 'Location helps AI analyze sun position, shadows, and optimal panel orientation for your area.'}
            </p>

            <div className="space-y-4">
              <button
                onClick={detectLocation}
                disabled={detectingLocation}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md"
              >
                {detectingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    Auto-Detect Location
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-foreground">OR</span>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Enter address (e.g., A-484, Sector 19, Noida, India)"
                  className="w-full px-4 py-2 bg-background border-b-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-foreground placeholder-muted-foreground"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Be specific for best results (street address, city, country)
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLocationSubmit}
                  disabled={!locationInput.trim() || fetchingMapImage || detectingLocation}
                  className="flex-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md"
                >
                  {fetchingMapImage || detectingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowLocationModal(false);
                    setImageSource('upload');
                  }}
                  disabled={fetchingMapImage || detectingLocation}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Display */}
      {location && (
        <div className="bg-card rounded-lg p-4 border  border-border flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            <span className="font-medium text-white">
              {location.city}, {location.country}
            </span>
            {location.lat && location.lon && (
              <span className="text-xs text-gray-300">
                ({location.lat.toFixed(6)}, {location.lon.toFixed(6)})
              </span>
            )}
            {imageSource === 'map' && (
              <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-1 rounded font-medium">
                Satellite View
              </span>
            )}
          </div>
          <button
            onClick={() => setShowLocationModal(true)}
            className="text-sm text-orange-400 hover:text-orange-300 font-medium"
          >
            Change
          </button>
        </div>
      )}

      {/* Upload Section */}
      {!imageUrl && (
        <div className="bg-card rounded-lg shadow-lg p-8 border-2 border-dashed border-border">
          <div className="text-center">
            <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-4">Get Started</h3>
            <p className="text-muted-foreground mb-4">Choose how you want to provide your rooftop image</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              aria-label="Upload rooftop image"
              className="hidden"
            />
            <button
              onClick={() => setShowImageSourceModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Choose Image Source
            </button>
          </div>
        </div>
      )}

      {/* Drawing and Analysis Section */}
      {imageUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Section */}
          <div className="lg:col-span-2 bg-card rounded-lg shadow-lg p-6 border border-border">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => startDrawing('click')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDrawing && drawMode === 'click'
                  ? 'bg-orange-500 dark:bg-orange-600 text-white shadow-md'
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                  }`}
              >
                <MousePointer className="w-4 h-4" />
                Click Points
              </button>
              <button
                onClick={() => startDrawing('freehand')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDrawing && drawMode === 'click'
                  ? 'bg-orange-500 dark:bg-orange-600 text-white shadow-md'
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                  }`}
              >
                <Square className="w-4 h-4" />
                Freehand Draw
              </button>
              <button
                onClick={clearDrawing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={() => {
                  setImageUrl(null);
                  setImage(null);
                  setLocation(null);
                  setLocationInput('');
                  setImageSource('upload');
                  setCurrentProjectId(null);
                  setCurrentFinalizedId(null);
                  clearDrawing();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                New Image
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="mb-4 flex items-center gap-2 bg-gray-100 dark:bg-slate-700/50 p-2 rounded-lg border border-gray-200 dark:border-slate-600">
              <button
                onClick={handleZoomOut}
                className="p-2 bg-white dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-lg transition-colors shadow-sm"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
              <button
                onClick={handleZoomIn}
                className="p-2 bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleResetView}
                className="p-2 bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
                title="Reset View"
              >
                <Move className="w-5 h-5" />
              </button>
            </div>

            <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-inner">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Rooftop"
                className="hidden"
              />
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                className={`w-full ${isPanning ? 'cursor-grab' : isDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
                style={{ maxHeight: '600px', objectFit: 'contain' }}
              />
            </div>

            {isDrawing && (
              <div className="mt-4 p-4 bg-card border-border rounded-lg">
                <p className="text-sm text-foreground">
                  {drawMode === 'click'
                    ? '🖱️ Click on the image to add points. Connect at least 3 points to form a polygon.'
                    : '🖊️ Click and drag to draw a freehand polygon around the installation area.'}
                </p>
                {polygonPoints.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Points added: {polygonPoints.length}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Hold Shift or use middle mouse button to pan. Use mouse wheel to zoom.
                </p>
              </div>
            )}



          </div>





          {/* Control Panel */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Analysis Controls</h3>

              <button
                onClick={analyzeRooftop}
                disabled={analyzing || polygonPoints.length < 3}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors mb-3"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze with AI
                  </>
                )}
              </button>

              {/* Project Management Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleSaveProject}
                  disabled={saving || !location || !imageUrl || polygonPoints.length < 3}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {currentProjectId ? 'Update Project' : 'Save Project'}
                    </>
                  )}
                </button>

                <button
                  onClick={handleFinalizeLayout}
                  disabled={finalizing || !analysis || panelLayout.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {finalizing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Finalize Layout
                    </>
                  )}
                </button>

                {panelLayout.length > 0 && (
                  <button
                    onClick={downloadResults}
                    className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Layout
                  </button>
                )}

                {/* Delete Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {currentProjectId && (
                    <button
                      onClick={handleDeleteProject}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Project
                    </button>
                  )}
                  {currentFinalizedId && (
                    <button
                      onClick={handleDeleteFinalizedLayout}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Finalized
                    </button>
                  )}
                </div>
              </div>

              {polygonPoints.length < 3 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Draw a polygon area to enable analysis
                </p>
              )}
            </div>

            {/* Analysis Results */}
            {analysis && (
              <div className="bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800 rounded-lg shadow-lg p-6 ">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <Check className="w-5 h-5 text-green-500" />
                  Analysis Results
                </h3>

                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-700/50 rounded-lg border border-amber-200 dark:border-amber-600">
                    <p className="text-xs text-foreground mb-1">Total Panels</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.totalPanels}</p>
                  </div>

                  <div className="p-3 p-3 bg-amber-50 dark:bg-amber-700/50 rounded-lg border border-amber-200 dark:border-amber-600">
                    <p className="text-xs text-foreground mb-1">Total Power Output</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analysis.totalPowerKw} kW</p>
                  </div>

                  <div className="p-3 p-3 bg-amber-50 dark:bg-amber-700/50 rounded-lg border border-amber-200 dark:border-amber-600">
                    <p className="text-xs text-foreground mb-1">Optimal Orientation</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{analysis.orientation}°</p>
                  </div>

                  <div className="p-3 p-3 bg-amber-50 dark:bg-amber-700/50 rounded-lg border border-amber-200 dark:border-amber-600">
                    <p className="text-xs text-foreground mb-1">Panel Layout</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{analysis.layout}</p>
                  </div>

                  <div className="p-3 p-3 bg-amber-50 dark:bg-amber-700/50 rounded-lg border border-amber-200 dark:border-amber-600">
                    <p className="text-xs text-foreground mb-1">Est. Annual Production</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{analysis.annualProduction} kWh</p>
                  </div>

                  {analysis.sunAnalysis && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-400">
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 font-semibold mb-2">☀️ Sun Analysis</p>
                      <p className="text-sm text-foreground">{analysis.sunAnalysis}</p>
                    </div>
                  )}

                  {analysis.shadowAnalysis && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold mb-2">🌓 Shadow Analysis</p>
                      <p className="text-sm text-foreground">{analysis.shadowAnalysis}</p>
                    </div>
                  )}

                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                    <p className="text-xs text-orange-700 dark:text-orange-300 font-semibold mb-2">💡 AI Recommendations</p>
                    <p className="text-sm text-foreground">{analysis.recommendations}</p>
                  </div>
                </div>

                {/* Show Recommendations Button in Sidebar */}
                {/* Show Recommendations Button in Sidebar */}
                {(currentProjectId || currentFinalizedId) && analysis && (
                  <button
                    onClick={() => setShowRecommendations(!showRecommendations)}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 dark:from-orange-600 dark:to-yellow-600 hover:from-orange-600 hover:to-yellow-600 dark:hover:from-orange-700 dark:hover:to-yellow-700 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md"
                  >
                    <Zap className="w-5 h-5" />
                    {showRecommendations ? 'Hide' : 'View'} Solar Solutions & Installers
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Solar Recommendations Section - Full Width Below Grid */}

      {showRecommendations && (currentProjectId || currentFinalizedId) && location && analysis && (
        <div className="mt-6">
          <SolarRecommendations
            finalizedLayoutId={currentFinalizedId}
            savedProjectId={currentProjectId}
            location={location}
            systemSpecs={{
              totalPanels: analysis.totalPanels,
              systemSizeKw: analysis.totalPowerKw,
              estimatedAnnualProductionKwh: analysis.annualProduction,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RooftopAnalyzer;