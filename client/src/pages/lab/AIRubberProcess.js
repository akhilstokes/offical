import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import './AIRubberProcess.css';

const AIRubberProcess = () => {
  const [formData, setFormData] = useState({
    DRC: '',
    TSC: '',
    NH3: '',
    NRC: '',
    VFA: '',
    pH: '',
    KOH: '',
    MST: '',
    CU: '',
    MG: '',
    No_of_Barrels: '',
    Sludge: '',
    Odour: '',
    Colour: ''
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sampleInfo, setSampleInfo] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [tempLoading, setTempLoading] = useState(true);

  const ML_SERVICE_URL = process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:5001';

  // Fetch real-time temperature
  useEffect(() => {
    const fetchTemperature = async () => {
      try {
        // Using OpenWeatherMap API - you can replace with your preferred weather API
        // For Kerala, India (approximate location for rubber processing)
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=10.8505&longitude=76.2711&current_weather=true'
        );
        const data = await response.json();
        
        if (data.current_weather) {
          setTemperature({
            celsius: data.current_weather.temperature,
            fahrenheit: (data.current_weather.temperature * 9/5 + 32).toFixed(1),
            time: new Date().toLocaleTimeString('en-IN')
          });
        }
        setTempLoading(false);
      } catch (err) {
        console.error('Error fetching temperature:', err);
        setTempLoading(false);
      }
    };

    fetchTemperature();
    // Refresh temperature every 10 minutes
    const interval = setInterval(fetchTemperature, 600000);
    return () => clearInterval(interval);
  }, []);

  // Load data from Sample Check-In if available
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('ai_process_sample_data');
      if (storedData) {
        const sampleData = JSON.parse(storedData);
        setSampleInfo({
          sampleId: sampleData.sampleId,
          customerName: sampleData.customerName,
          receivedAt: sampleData.receivedAt
        });
        
        // Calculate average values from all barrels
        if (sampleData.barrels && sampleData.barrels.length > 0) {
          const avgDRC = sampleData.barrels.reduce((sum, b) => sum + (b.drc?.value || 0), 0) / sampleData.barrels.length;
          const avgTSC = sampleData.barrels.reduce((sum, b) => sum + (b.tsc?.value || 0), 0) / sampleData.barrels.length;
          const avgPH = sampleData.barrels.reduce((sum, b) => sum + (b.ph || 0), 0) / sampleData.barrels.length;
          
          setFormData(prev => ({
            ...prev,
            DRC: avgDRC.toFixed(2),
            TSC: avgTSC.toFixed(2),
            pH: avgPH.toFixed(1),
            No_of_Barrels: sampleData.barrels.length.toString()
          }));
        }
        
        // Clear the stored data after loading
        localStorage.removeItem('ai_process_sample_data');
      }
    } catch (err) {
      console.error('Error loading sample data:', err);
    }
  }, []);

  // Auto-calculate NRC when DRC or TSC changes
  useEffect(() => {
    const drc = parseFloat(formData.DRC) || 0;
    const tsc = parseFloat(formData.TSC) || 0;
    
    if (drc > 0 && tsc > 0) {
      const nrc = tsc - drc;
      setFormData(prev => ({
        ...prev,
        NRC: nrc.toFixed(2)
      }));
    }
  }, [formData.DRC, formData.TSC]);

  // Auto-update ammonia calculator when No_of_Barrels changes
  useEffect(() => {
    const barrels = formData.No_of_Barrels;
    if (barrels) {
      const conc = document.getElementById('barrelAmmoniaConc')?.value || 25;
      calculateBarrelAmmonia(barrels, conc);
    }
  }, [formData.No_of_Barrels]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          DRC: parseFloat(formData.DRC),
          TSC: parseFloat(formData.TSC),
          NH3: parseFloat(formData.NH3),
          NRC: parseFloat(formData.NRC),
          VFA: parseFloat(formData.VFA),
          pH: parseFloat(formData.pH),
          KOH: parseFloat(formData.KOH),
          MST: parseFloat(formData.MST),
          CU: parseFloat(formData.CU),
          MG: parseFloat(formData.MG),
          No_of_Barrels: parseInt(formData.No_of_Barrels),
          Sludge: formData.Sludge,
          Odour: formData.Odour,
          Colour: formData.Colour
        })
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to get prediction. Please ensure ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      DRC: '',
      TSC: '',
      NH3: '',
      NRC: '',
      VFA: '',
      pH: '',
      KOH: '',
      MST: '',
      CU: '',
      MG: '',
      No_of_Barrels: '',
      Sludge: '',
      Odour: '',
      Colour: ''
    });
    setResult(null);
    setError('');
  };

  const downloadReport = () => {
    if (!result) return;

    const doc = new jsPDF();
    const primaryColor = [102, 126, 234];
    const processColor = getProcessColor(result.recommended_process);
    
    // Convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [102, 126, 234];
    };
    
    const processRgb = hexToRgb(processColor);
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AI RUBBER PROCESS REPORT', 105, 20, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 105, 30, { align: 'center' });
    
    let yPos = 55;
    
    // Sample Information (if available)
    if (sampleInfo) {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SAMPLE INFORMATION', 20, yPos);
      doc.setLineWidth(0.5);
      doc.line(20, yPos + 2, 190, yPos + 2);
      
      yPos += 10;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Sample ID:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(sampleInfo.sampleId || 'N/A', 70, yPos);
      
      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Customer:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(sampleInfo.customerName || 'N/A', 70, yPos);
      
      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Date:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(sampleInfo.receivedAt).toLocaleDateString('en-IN'), 70, yPos);
      
      yPos += 15;
    }
    
    // Environmental Conditions (Temperature)
    if (temperature) {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ENVIRONMENTAL CONDITIONS', 20, yPos);
      doc.setLineWidth(0.5);
      doc.line(20, yPos + 2, 190, yPos + 2);
      
      yPos += 10;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Temperature:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${temperature.celsius}°C (${temperature.fahrenheit}°F)`, 70, yPos);
      
      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Recorded At:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(temperature.time, 70, yPos);
      
      yPos += 15;
    }
    
    // AI Recommendation
    doc.setFillColor(processRgb[0], processRgb[1], processRgb[2]);
    doc.rect(20, yPos, 170, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDED PROCESS', 105, yPos + 12, { align: 'center' });
    doc.setFontSize(16);
    doc.text(result.recommended_process, 105, yPos + 22, { align: 'center' });
    
    yPos += 40;
    
    // Confidence
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Model Confidence:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${(result.confidence * 100).toFixed(2)}%`, 70, yPos);
    
    yPos += 15;
    
    // Input Parameters
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INPUT PARAMETERS', 20, yPos);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 10;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    
    const params = [
      { label: 'DRC (Dry Rubber Content)', value: `${formData.DRC}%` },
      { label: 'TSC (Total Solid Content)', value: `${formData.TSC}%` },
      { label: 'NH3 (Ammonia)', value: `${formData.NH3}%` },
      { label: 'NRC (Non-Rubber Content)', value: `${formData.NRC}%` },
      { label: 'VFA (Volatile Fatty Acid)', value: formData.VFA },
      { label: 'pH Level', value: formData.pH },
      { label: 'KOH (Potassium Hydroxide)', value: formData.KOH },
      { label: 'MST (Mechanical Stability Time)', value: `${formData.MST}s` },
      { label: 'CU (Copper Content)', value: formData.CU },
      { label: 'MG (Magnesium Content)', value: formData.MG },
      { label: 'Number of Barrels', value: formData.No_of_Barrels },
      { label: 'Sludge Level', value: formData.Sludge },
      { label: 'Odour', value: formData.Odour },
      { label: 'Colour', value: formData.Colour }
    ];
    
    params.forEach((param, idx) => {
      if (idx > 0 && idx % 7 === 0) {
        yPos = 55;
        doc.addPage();
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(param.label + ':', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(param.value, 100, yPos);
      yPos += 7;
    });
    
    // Process Description
    if (yPos > 240) {
      doc.addPage();
      yPos = 30;
    } else {
      yPos += 10;
    }
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROCESS DESCRIPTION', 20, yPos);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 10;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const description = getProcessDescription(result.recommended_process);
    const splitDescription = doc.splitTextToSize(description, 170);
    doc.text(splitDescription, 20, yPos);
    
    yPos += 20;
    
    // Latex Quality Grading Section (Based on AI Process Result)
    const grading = calculateLatexGrade();
    const gradeRgb = hexToRgb(grading.gradeColor);
    
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LATEX QUALITY GRADE (AI PROCESS-BASED)', 20, yPos);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 12;
    
    // Grade Badge
    doc.setFillColor(gradeRgb[0], gradeRgb[1], gradeRgb[2]);
    doc.circle(40, yPos + 10, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(grading.grade, 40, yPos + 14, { align: 'center' });
    
    // Grade Details
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grade ${grading.grade}`, 60, yPos + 8);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(grading.gradeDescription, 60, yPos + 16);
    
    if (grading.basedOn === 'AI Process') {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Process: ${grading.recommendedProcess.replace(/_/g, ' ')}`, 60, yPos + 24);
      doc.setFont('helvetica', 'normal');
      doc.text(`Confidence: ${grading.confidence}% | DRC: ${grading.drcValue}%`, 60, yPos + 30);
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`DRC Value: ${grading.drcValue}%`, 60, yPos + 24);
    }
    
    yPos += 45;
    
    // Grading Criteria
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Grading Criteria (Based on AI Recommended Process):', 20, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text('• Grade A (Premium): Centrifugation, Concentrated Latex', 25, yPos);
    yPos += 5;
    doc.text('• Grade B (Standard): Creaming, Direct Use, Foam Production', 25, yPos);
    yPos += 5;
    doc.text('• Grade C (Basic): Evaporation, Block Rubber TSR Processing', 25, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'italic');
    doc.text('Note: Grade is determined by AI-recommended processing method', 25, yPos);
    
    yPos += 15;
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 277, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Holy Family Polymers - AI Laboratory System', 105, 287, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 190, 287, { align: 'right' });
    }
    
    const fileName = `AI_Process_Report_${sampleInfo?.sampleId || 'Sample'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getProcessColor = (process) => {
    const colors = {
      'Centrifugation': '#10b981',
      'Creaming': '#3b82f6',
      'Evaporation': '#f59e0b',
      'Direct Use': '#8b5cf6',
      'Block_Rubber_TSR_Processing': '#ef4444',
      'Concentrated_Latex': '#06b6d4',
      'Foam_Production': '#f97316'
    };
    return colors[process] || '#6b7280';
  };

  const getProcessDescription = (process) => {
    const descriptions = {
      'Centrifugation': 'High-speed separation process for premium quality latex',
      'Creaming': 'Natural separation using density differences',
      'Evaporation': 'Thermal concentration method for specific applications',
      'Direct Use': 'Ready for immediate application without further processing',
      'Block_Rubber_TSR_Processing': 'Technical Specified Rubber (TSR) block production',
      'Concentrated_Latex': 'Latex concentration for industrial applications',
      'Foam_Production': 'Specialized processing for foam rubber manufacturing'
    };
    return descriptions[process] || 'Processing recommendation';
  };

  // Latex Grading System based on AI Recommended Process
  const calculateLatexGrade = () => {
    // If no result yet, use DRC as fallback
    if (!result || !result.recommended_process) {
      const drc = parseFloat(formData.DRC) || 0;
      if (drc >= 50) {
        return {
          grade: 'A',
          gradeColor: '#10b981',
          gradeDescription: 'Premium Quality (DRC ≥ 50%)',
          drcValue: drc,
          basedOn: 'DRC'
        };
      } else if (drc >= 30) {
        return {
          grade: 'B',
          gradeColor: '#3b82f6',
          gradeDescription: 'Standard Quality (DRC 30-49.99%)',
          drcValue: drc,
          basedOn: 'DRC'
        };
      } else if (drc >= 17) {
        return {
          grade: 'C',
          gradeColor: '#f59e0b',
          gradeDescription: 'Basic Quality (DRC 17-29.99%)',
          drcValue: drc,
          basedOn: 'DRC'
        };
      } else {
        return {
          grade: 'Below Standard',
          gradeColor: '#ef4444',
          gradeDescription: 'Below Standard (DRC < 17%)',
          drcValue: drc,
          basedOn: 'DRC'
        };
      }
    }

    // Grade based on AI Recommended Process
    const process = result.recommended_process;
    const confidence = result.confidence * 100;
    const drc = parseFloat(formData.DRC) || 0;
    
    let grade, gradeColor, gradeDescription;
    
    // Premium processes (Grade A)
    if (process === 'Centrifugation' || process === 'Concentrated_Latex') {
      grade = 'A';
      gradeColor = '#10b981';
      gradeDescription = `Premium Quality - ${process.replace(/_/g, ' ')}`;
    }
    // Standard processes (Grade B)
    else if (process === 'Creaming' || process === 'Direct Use' || process === 'Foam_Production') {
      grade = 'B';
      gradeColor = '#3b82f6';
      gradeDescription = `Standard Quality - ${process.replace(/_/g, ' ')}`;
    }
    // Basic processes (Grade C)
    else if (process === 'Evaporation' || process === 'Block_Rubber_TSR_Processing') {
      grade = 'C';
      gradeColor = '#f59e0b';
      gradeDescription = `Basic Quality - ${process.replace(/_/g, ' ')}`;
    }
    // Default
    else {
      grade = 'B';
      gradeColor = '#3b82f6';
      gradeDescription = `Standard Quality - ${process.replace(/_/g, ' ')}`;
    }

    return {
      grade,
      gradeColor,
      gradeDescription,
      recommendedProcess: process,
      confidence: confidence.toFixed(1),
      drcValue: drc,
      basedOn: 'AI Process'
    };
  };

  // Ammonia Calculator Function
  const calculateAmmonia = (volume, concentration, latexVolume) => {
    const vol = parseFloat(volume) || 0;
    const conc = parseFloat(concentration) || 0;
    const latex = parseFloat(latexVolume) || 0;
    
    if (vol > 0 && conc > 0 && latex > 0) {
      // Calculate pure ammonia in kg
      // Formula: Volume (L) × Concentration (%) × Density (0.91 kg/L) / 100
      const pureAmmonia = (vol * conc * 0.91) / 100;
      
      // Calculate final NH3 percentage in latex
      // Total volume = latex volume + ammonia solution volume
      const totalVolume = latex + vol;
      // Assuming latex density ≈ 1 kg/L for simplification
      const finalNH3Percentage = (pureAmmonia / totalVolume) * 100;
      
      // Display results
      const resultsDiv = document.getElementById('ammoniaResults');
      const pureAmmoniaDiv = document.getElementById('pureAmmoniaResult');
      const finalNH3Div = document.getElementById('finalNH3Result');
      
      if (resultsDiv && pureAmmoniaDiv && finalNH3Div) {
        resultsDiv.style.display = 'block';
        pureAmmoniaDiv.textContent = `${pureAmmonia.toFixed(3)} kg`;
        finalNH3Div.textContent = `${finalNH3Percentage.toFixed(3)}%`;
      }
    }
  };

  // Barrel-based Ammonia Calculator (7L ammonia + 200L latex per barrel)
  const calculateBarrelAmmonia = (barrels, concentration) => {
    const numBarrels = parseInt(barrels) || 0;
    const conc = parseFloat(concentration) || 0;
    
    if (numBarrels > 0 && conc > 0) {
      // Standard: 7L ammonia solution per barrel, 200L latex per barrel
      const ammoniaPerBarrel = 7;
      const latexPerBarrel = 200;
      
      const totalAmmoniaVol = numBarrels * ammoniaPerBarrel;
      const totalLatexVol = numBarrels * latexPerBarrel;
      
      // Calculate pure ammonia in kg
      const pureAmmonia = (totalAmmoniaVol * conc * 0.91) / 100;
      
      // Calculate final NH3 percentage
      const totalVolume = totalLatexVol + totalAmmoniaVol;
      const finalNH3Percentage = (pureAmmonia / totalVolume) * 100;
      
      // Update NH3 in form data
      setFormData(prev => ({
        ...prev,
        NH3: finalNH3Percentage.toFixed(3)
      }));
      
      // Display results
      const resultsDiv = document.getElementById('barrelResults');
      const totalAmmoniaDiv = document.getElementById('totalAmmoniaVol');
      const totalLatexDiv = document.getElementById('totalLatexVol');
      const pureNH3Div = document.getElementById('barrelPureNH3');
      const finalNH3Div = document.getElementById('barrelFinalNH3');
      
      if (resultsDiv && totalAmmoniaDiv && totalLatexDiv && pureNH3Div && finalNH3Div) {
        resultsDiv.style.display = 'block';
        totalAmmoniaDiv.textContent = `${totalAmmoniaVol} L`;
        totalLatexDiv.textContent = `${totalLatexVol} L`;
        pureNH3Div.textContent = `${pureAmmonia.toFixed(3)} kg`;
        finalNH3Div.textContent = `${finalNH3Percentage.toFixed(3)}%`;
      }
    }
  };

  // KOH Number Calculator
  const calculateKOH = (volume, normality, weight) => {
    const v = parseFloat(volume) || 0;
    const n = parseFloat(normality) || 0;
    const w = parseFloat(weight) || 0;
    
    const weightErrorDiv = document.getElementById('kohWeightError');
    const resultsDiv = document.getElementById('kohResults');
    const kohNumberDiv = document.getElementById('kohNumberResult');
    
    // Validate weight range (5-17g)
    if (w > 0 && (w < 5 || w > 17)) {
      if (weightErrorDiv) {
        weightErrorDiv.style.display = 'block';
      }
      if (resultsDiv) {
        resultsDiv.style.display = 'none';
      }
      return;
    } else {
      if (weightErrorDiv) {
        weightErrorDiv.style.display = 'none';
      }
    }
    
    // Calculate KOH Number
    if (v > 0 && n > 0 && w >= 5 && w <= 10) {
      // Formula: KOH Number = (V × N × 56.1) / W
      const kohNumber = (v * n * 56.1) / w;
      
      if (resultsDiv && kohNumberDiv) {
        resultsDiv.style.display = 'block';
        kohNumberDiv.textContent = kohNumber.toFixed(3);
        
        // Auto-populate main form KOH field
        setFormData(prev => ({ ...prev, KOH: kohNumber.toFixed(3) }));
      }
    } else {
      if (resultsDiv) {
        resultsDiv.style.display = 'none';
      }
    }
  };

  // VFA Number Calculator
  const calculateVFA = (volume, normality, weight) => {
    const v = parseFloat(volume) || 0;
    const n = parseFloat(normality) || 0;
    const w = parseFloat(weight) || 0;
    
    const resultsDiv = document.getElementById('vfaResults');
    const vfaNumberDiv = document.getElementById('vfaNumberResult');
    
    // Calculate VFA Number
    if (v > 0 && n > 0 && w > 0) {
      // Formula: VFA = (V × N × 100) / W
      const vfaNumber = (v * n * 100) / w;
      
      if (resultsDiv && vfaNumberDiv) {
        resultsDiv.style.display = 'block';
        vfaNumberDiv.textContent = vfaNumber.toFixed(2);
        
        // Auto-populate main form VFA field
        setFormData(prev => ({ ...prev, VFA: vfaNumber.toFixed(2) }));
      }
    } else {
      if (resultsDiv) {
        resultsDiv.style.display = 'none';
      }
    }
  };

  // Copper (Cu) Concentration Calculator
  const calculateCu = (instrumentReading, dilutionFactor) => {
    const reading = parseFloat(instrumentReading) || 0;
    const factor = parseFloat(dilutionFactor) || 1;
    
    const resultsDiv = document.getElementById('cuResults');
    const cuConcentrationDiv = document.getElementById('cuConcentrationResult');
    
    // Calculate Cu Concentration
    if (reading > 0) {
      // Formula: Cu Concentration (ppm) = Instrument Reading × Dilution Factor
      const cuConcentration = reading * factor;
      
      if (resultsDiv && cuConcentrationDiv) {
        resultsDiv.style.display = 'block';
        cuConcentrationDiv.textContent = cuConcentration.toFixed(3);
        
        // Auto-populate main form CU field
        setFormData(prev => ({ ...prev, CU: cuConcentration.toFixed(3) }));
      }
    } else {
      if (resultsDiv) {
        resultsDiv.style.display = 'none';
      }
    }
  };

  // Magnesium (Mg) Concentration Calculator
  const calculateMg = (instrumentReading, dilutionFactor) => {
    const reading = parseFloat(instrumentReading) || 0;
    const factor = parseFloat(dilutionFactor) || 1;
    
    const resultsDiv = document.getElementById('mgResults');
    const mgConcentrationDiv = document.getElementById('mgConcentrationResult');
    
    // Calculate Mg Concentration
    if (reading > 0) {
      // Formula: Mg Concentration (ppm) = Instrument Reading × Dilution Factor
      const mgConcentration = reading * factor;
      
      if (resultsDiv && mgConcentrationDiv) {
        resultsDiv.style.display = 'block';
        mgConcentrationDiv.textContent = mgConcentration.toFixed(3);
        
        // Auto-populate main form MG field
        setFormData(prev => ({ ...prev, MG: mgConcentration.toFixed(3) }));
      }
    } else {
      if (resultsDiv) {
        resultsDiv.style.display = 'none';
      }
    }
  };

  return (
    <div className="ai-rubber-container">
      <div className="ai-rubber-header">
        <div className="header-icon">
          <i className="fas fa-brain"></i>
        </div>
        <div className="header-content">
          <h2>AI Rubber Process Recommendation</h2>
          <p>Get intelligent processing recommendations based on latex properties</p>
        </div>
        {/* Real-time Temperature Widget */}
        <div style={{
          marginLeft: 'auto',
          backgroundColor: 'white',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '12px 20px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
          minWidth: '180px'
        }}>
          {tempLoading ? (
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '12px' }}>Loading...</div>
            </div>
          ) : temperature ? (
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textAlign: 'center' }}>
                🌡️ Current Temperature
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6' }}>
                  {temperature.celsius}°C
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '4px' }}>
                {temperature.fahrenheit}°F | {temperature.time}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              Temp unavailable
            </div>
          )}
        </div>
      </div>

      {/* Sample Information Banner */}
      {sampleInfo && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '2px solid #10b981',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
        }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', color: '#065f46', fontSize: '16px', marginBottom: '4px' }}>
              Sample Data Loaded
            </div>
            <div style={{ color: '#047857', fontSize: '14px' }}>
              <strong>Sample ID:</strong> {sampleInfo.sampleId} | 
              <strong> Customer:</strong> {sampleInfo.customerName} | 
              <strong> Date:</strong> {new Date(sampleInfo.receivedAt).toLocaleDateString('en-IN')}
            </div>
            <div style={{ color: '#059669', fontSize: '13px', marginTop: '4px', fontStyle: 'italic' }}>
              DRC, TSC, pH, and barrel count have been automatically filled from sample check-in data
            </div>
          </div>
        </div>
      )}

      <div className="ai-rubber-content">
        <form onSubmit={handlePredict} className="ai-rubber-form">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="DRC">
                <span className="label-icon">📊</span>
                DRC (Dry Rubber Content) %
              </label>
              <input
                type="number"
                id="DRC"
                name="DRC"
                value={formData.DRC}
                onChange={handleChange}
                placeholder="e.g., 22"
                step="0.1"
                min="0"
                max="100"
                required
              />
              <span className="field-hint">Dry Rubber Content: 0-100%</span>
            </div>

            <div className="form-field">
              <label htmlFor="TSC">
                <span className="label-icon">📈</span>
                TSC (Total Solid Content) %
              </label>
              <input
                type="number"
                id="TSC"
                name="TSC"
                value={formData.TSC}
                onChange={handleChange}
                placeholder="e.g., 28"
                step="0.1"
                min="0"
                max="100"
                required
              />
              <span className="field-hint">Total Solid Content: 0-100%</span>
            </div>

            <div className="form-field">
              <label htmlFor="NH3">
                <span className="label-icon">⚗️</span>
                NH3 (Ammonia) % - Auto-Calculated
              </label>
              <input
                type="text"
                id="NH3"
                name="NH3"
                value={formData.NH3}
                readOnly
                placeholder="Auto-calculated from equation"
                style={{ 
                  backgroundColor: '#f0fdf4', 
                  fontWeight: '700', 
                  color: '#166534',
                  cursor: 'not-allowed',
                  fontSize: '16px',
                  border: '2px solid #10b981'
                }}
              />
              <span className="field-hint">Ammonia content (Auto-calculated)</span>
            </div>

            <div className="form-field">
              <label htmlFor="NRC">
                <span className="label-icon">🔬</span>
                NRC (Non-Rubber Content) % - Auto-Calculated
              </label>
              <input
                type="text"
                id="NRC"
                name="NRC"
                value={formData.NRC}
                readOnly
                placeholder="Auto-calculated (TSC - DRC)"
                style={{ 
                  backgroundColor: '#f0fdf4', 
                  fontWeight: '700', 
                  color: '#166534',
                  cursor: 'not-allowed',
                  fontSize: '16px',
                  border: '2px solid #10b981'
                }}
              />
              <span className="field-hint">Formula: NRC = TSC - DRC (Auto-calculated)</span>
            </div>

            <div className="form-field">
              <label htmlFor="VFA">
                <span className="label-icon">🧪</span>
                VFA (Volatile Fatty Acid)
              </label>
              <input
                type="number"
                id="VFA"
                name="VFA"
                value={formData.VFA}
                onChange={handleChange}
                placeholder="e.g., 0.15"
                step="0.01"
                min="0"
                required
              />
              <span className="field-hint">Volatile Fatty Acid level</span>
            </div>

            <div className="form-field">
              <label htmlFor="pH">
                <span className="label-icon">🔬</span>
                pH Level - Auto-Calculated
              </label>
              <input
                type="text"
                id="pH"
                name="pH"
                value={formData.pH}
                readOnly
                placeholder="Auto-calculated from equation"
                style={{ 
                  backgroundColor: '#f0fdf4', 
                  fontWeight: '700', 
                  color: '#166534',
                  cursor: 'not-allowed',
                  fontSize: '16px',
                  border: '2px solid #10b981'
                }}
              />
              <span className="field-hint">pH: 0-14 (Auto-calculated)</span>
            </div>

            <div className="form-field">
              <label htmlFor="KOH">
                <span className="label-icon">⚛️</span>
                KOH (Potassium Hydroxide) - Auto-Calculated
              </label>
              <input
                type="text"
                id="KOH"
                name="KOH"
                value={formData.KOH}
                readOnly
                placeholder="Auto-calculated from equation"
                style={{ 
                  backgroundColor: '#f0fdf4', 
                  fontWeight: '700', 
                  color: '#166534',
                  cursor: 'not-allowed',
                  fontSize: '16px',
                  border: '2px solid #10b981'
                }}
              />
              <span className="field-hint">KOH content (Auto-calculated)</span>
            </div>

            <div className="form-field">
              <label htmlFor="MST">
                <span className="label-icon">💧</span>
                MST (Mechanical Stability Time)
              </label>
              <input
                type="number"
                id="MST"
                name="MST"
                value={formData.MST}
                onChange={handleChange}
                placeholder="e.g., 400"
                step="1"
                min="0"
                required
              />
              <span className="field-hint">Stability time in seconds</span>
            </div>

            <div className="form-field">
              <label htmlFor="CU">
                <span className="label-icon">🔶</span>
                CU (Copper Content) - Auto-Calculated
              </label>
              <input
                type="text"
                id="CU"
                name="CU"
                value={formData.CU}
                readOnly
                placeholder="Auto-calculated from equation"
                style={{ 
                  backgroundColor: '#f0fdf4', 
                  fontWeight: '700', 
                  color: '#166534',
                  cursor: 'not-allowed',
                  fontSize: '16px',
                  border: '2px solid #10b981'
                }}
              />
              <span className="field-hint">Copper level (Auto-calculated)</span>
            </div>

            <div className="form-field">
              <label htmlFor="MG">
                <span className="label-icon">🔷</span>
                MG (Magnesium Content) - Auto-Calculated
              </label>
              <input
                type="text"
                id="MG"
                name="MG"
                value={formData.MG}
                readOnly
                placeholder="Auto-calculated from equation"
                style={{ 
                  backgroundColor: '#f0fdf4', 
                  fontWeight: '700', 
                  color: '#166534',
                  cursor: 'not-allowed',
                  fontSize: '16px',
                  border: '2px solid #10b981'
                }}
              />
              <span className="field-hint">Magnesium level (Auto-calculated)</span>
            </div>

            <div className="form-field">
              <label htmlFor="No_of_Barrels">
                <span className="label-icon">🛢️</span>
                Number of Barrels
              </label>
              <input
                type="number"
                id="No_of_Barrels"
                name="No_of_Barrels"
                value={formData.No_of_Barrels}
                onChange={handleChange}
                placeholder="e.g., 30"
                step="1"
                min="1"
                required
              />
              <span className="field-hint">Total barrel count</span>
            </div>

            <div className="form-field">
              <label htmlFor="Sludge">
                <span className="label-icon">🌊</span>
                Sludge Level
              </label>
              <select
                id="Sludge"
                name="Sludge"
                value={formData.Sludge}
                onChange={handleChange}
                required
                className="select-input"
              >
                <option value="">Select Sludge Level</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="None">None</option>
              </select>
              <span className="field-hint">Sludge classification</span>
            </div>

            <div className="form-field">
              <label htmlFor="Odour">
                <span className="label-icon">👃</span>
                Odour
              </label>
              <select
                id="Odour"
                name="Odour"
                value={formData.Odour}
                onChange={handleChange}
                required
                className="select-input"
              >
                <option value="">Select Odour</option>
                <option value="Strong">Strong</option>
                <option value="Moderate">Moderate</option>
                <option value="Mild">Mild</option>
                <option value="None">None</option>
              </select>
              <span className="field-hint">Odour intensity</span>
            </div>

            <div className="form-field">
              <label htmlFor="Colour">
                <span className="label-icon">🎨</span>
                Colour
              </label>
              <select
                id="Colour"
                name="Colour"
                value={formData.Colour}
                onChange={handleChange}
                required
                className="select-input"
              >
                <option value="">Select Colour</option>
                <option value="White">White</option>
                <option value="Cream">Cream</option>
                <option value="Yellowish">Yellowish</option>
                <option value="Light Brown">Light Brown</option>
                <option value="Brown">Brown</option>
                <option value="Dark Brown">Dark Brown</option>
              </select>
              <span className="field-hint">Visual color</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-predict"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="btn-icon">🤖</span>
                  Get Recommendation
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-reset"
              onClick={handleReset}
              disabled={loading}
            >
              🔄 Reset
            </button>
          </div>
        </form>

        {result && (
          <div className="result-container">
            <div className="result-header">
              <h3>🎯 AI Recommendation</h3>
            </div>

            <div 
              className="process-display" 
              style={{ borderColor: getProcessColor(result.recommended_process) }}
            >
              <div 
                className="process-badge" 
                style={{ background: getProcessColor(result.recommended_process) }}
              >
                <i className="fas fa-cogs"></i>
                {result.recommended_process}
              </div>
              <div className="process-description">
                {getProcessDescription(result.recommended_process)}
              </div>
              <div className="confidence-bar-container">
                <div className="confidence-label">
                  <span>Confidence Level</span>
                  <span className="confidence-value">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ 
                      width: `${result.confidence * 100}%`,
                      background: getProcessColor(result.recommended_process)
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="recommendation-details">
              <h4>📋 Process Details</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Recommended Process:</span>
                  <span className="detail-value">{result.recommended_process}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Model Confidence:</span>
                  <span className="detail-value">{(result.confidence * 100).toFixed(2)}%</span>
                </div>
                {temperature && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">🌡️ Temperature (Analysis Time):</span>
                      <span className="detail-value">{temperature.celsius}°C ({temperature.fahrenheit}°F)</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">⏰ Recorded At:</span>
                      <span className="detail-value">{temperature.time}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Latex Quality Grading Section */}
              {(() => {
                const grading = calculateLatexGrade();
                return (
                  <div style={{ marginTop: '30px' }}>
                    <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🏆</span> Latex Quality Grade (Based on AI Process Result)
                    </h4>
                    
                    {/* Grade Display */}
                    <div style={{
                      background: `linear-gradient(135deg, ${grading.gradeColor}15, ${grading.gradeColor}05)`,
                      border: `3px solid ${grading.gradeColor}`,
                      borderRadius: '16px',
                      padding: '32px',
                      boxShadow: `0 8px 24px ${grading.gradeColor}30`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '32px'
                    }}>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: grading.gradeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '56px',
                        fontWeight: '900',
                        color: 'white',
                        boxShadow: `0 8px 24px ${grading.gradeColor}60`,
                        flexShrink: 0
                      }}>
                        {grading.grade}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: grading.gradeColor, marginBottom: '12px' }}>
                          Grade {grading.grade}
                        </div>
                        <div style={{ fontSize: '18px', color: '#475569', marginBottom: '16px' }}>
                          {grading.gradeDescription}
                        </div>
                        {grading.basedOn === 'AI Process' && (
                          <>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '12px',
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                padding: '12px',
                                backgroundColor: 'white',
                                borderRadius: '10px',
                                border: '2px solid #e2e8f0'
                              }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                  Recommended Process
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>
                                  {grading.recommendedProcess.replace(/_/g, ' ')}
                                </div>
                              </div>
                              <div style={{
                                padding: '12px',
                                backgroundColor: 'white',
                                borderRadius: '10px',
                                border: '2px solid #e2e8f0'
                              }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                  AI Confidence
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: grading.gradeColor }}>
                                  {grading.confidence}%
                                </div>
                              </div>
                            </div>
                            <div style={{
                              padding: '12px',
                              backgroundColor: 'white',
                              borderRadius: '10px',
                              border: '2px solid #e2e8f0'
                            }}>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                DRC Value
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#334155' }}>
                                {grading.drcValue}%
                              </div>
                            </div>
                          </>
                        )}
                        {grading.basedOn === 'DRC' && (
                          <div style={{
                            padding: '16px',
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            border: '2px solid #e2e8f0'
                          }}>
                            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>
                              DRC Value:
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: grading.gradeColor }}>
                              {grading.drcValue}%
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                              Grading Thresholds: Grade A (≥50%) | Grade B (30-49.99%) | Grade C (17-29.99%)
                            </div>
                          </div>
                        )}
                        <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                          Grade A: Premium (Centrifugation, Concentrated Latex) | Grade B: Standard (Creaming, Direct Use, Foam) | Grade C: Basic (Evaporation, Block Rubber)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Download Report Button */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  onClick={downloadReport}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>📄</span>
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KOH Number Calculator Section */}
      <div className="info-section" style={{ backgroundColor: '#f3e8ff', border: '2px solid #a855f7' }}>
        <h4>⚛️ KOH Number Calculator</h4>
        <div className="info-content">
          <p style={{ marginBottom: '16px', color: '#6b21a8' }}>
            Calculate the KOH number of natural rubber latex using titration data.
          </p>
          
          <div style={{
            backgroundColor: '#ede9fe',
            border: '2px solid #8b5cf6',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '12px', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧪</span> KOH Number = (V × N × 56.1) / W
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#6b21a8', fontSize: '13px' }}>
                  Volume of Acid (V) - mL
                </label>
                <input
                  type="number"
                  id="kohVolume"
                  placeholder="e.g., 15.5"
                  step="0.01"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #8b5cf6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onChange={(e) => {
                    const volume = e.target.value;
                    const normality = document.getElementById('kohNormality').value;
                    const weight = document.getElementById('kohWeight').value;
                    calculateKOH(volume, normality, weight);
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#6b21a8', fontSize: '13px' }}>
                  Normality of Acid (N) - Fixed
                </label>
                <input
                  type="text"
                  id="kohNormality"
                  value="0.1"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #8b5cf6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '700',
                    backgroundColor: '#f5f3ff',
                    color: '#6b21a8',
                    cursor: 'not-allowed'
                  }}
                />
                <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px' }}>
                  Standard: 0.1 N (Fixed)
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#6b21a8', fontSize: '13px' }}>
                  Weight of Sample (W) - g (5-17g)
                </label>
                <input
                  type="number"
                  id="kohWeight"
                  placeholder="e.g., 7.5"
                  step="0.01"
                  min="5"
                  max="10"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #8b5cf6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onChange={(e) => {
                    const volume = document.getElementById('kohVolume').value;
                    const normality = document.getElementById('kohNormality').value;
                    const weight = e.target.value;
                    calculateKOH(volume, normality, weight);
                  }}
                />
                <div id="kohWeightError" style={{
                  color: '#dc2626',
                  fontSize: '12px',
                  marginTop: '4px',
                  fontWeight: '600',
                  display: 'none'
                }}>
                  ⚠️ Weight must be between 5g and 10g
                </div>
              </div>
            </div>
            <div id="kohResults" style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              display: 'none'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>KOH Number</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div id="kohNumberResult" style={{ fontWeight: '700', color: '#7c3aed', fontSize: '28px' }}>0.000</div>
                  <div style={{ fontSize: '20px', color: '#10b981' }} title="Value transferred to main form">🔒</div>
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', fontWeight: '600' }}>
                  ✓ Transferred to KOH field
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#ddd6fe', 
            borderRadius: '6px',
            fontSize: '13px',
            color: '#5b21b6'
          }}>
            <strong>Formula Explanation:</strong><br/>
            • V = Volume of standard acid used in titration (mL)<br/>
            • N = Normality of the acid<br/>
            • W = Weight of latex or serum sample (g)<br/>
            • 56.1 = Molecular weight of KOH<br/><br/>
            <strong>Sample Weight Range:</strong> 5-17g (positive decimals allowed)<br/>
            <strong>KOH Number:</strong> Indicates the amount of potassium hydroxide (in mg) required to neutralize the fatty acids in 1g of sample
          </div>
        </div>
      </div>

      {/* VFA Number Calculator Section */}
      <div className="info-section" style={{ backgroundColor: '#fef9c3', border: '2px solid #eab308' }}>
        <h4>🧬 VFA Number Calculator</h4>
        <div className="info-content">
          <p style={{ marginBottom: '16px', color: '#713f12' }}>
            Calculate the VFA (Volatile Fatty Acid) number by titrating serum with NaOH.
          </p>
          
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #facc15',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '12px', color: '#713f12', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧪</span> VFA = (V × N × 100) / W
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#713f12', fontSize: '13px' }}>
                  Volume of NaOH (V) - mL
                </label>
                <input
                  type="number"
                  id="vfaVolume"
                  placeholder="e.g., 0.8"
                  step="0.01"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #facc15',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onChange={(e) => {
                    const volume = e.target.value;
                    const normality = document.getElementById('vfaNormality').value;
                    const weight = document.getElementById('vfaWeight').value;
                    calculateVFA(volume, normality, weight);
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#713f12', fontSize: '13px' }}>
                  Normality of NaOH (N) - Fixed
                </label>
                <input
                  type="text"
                  id="vfaNormality"
                  value="0.1"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #facc15',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '700',
                    backgroundColor: '#fef9c3',
                    color: '#713f12',
                    cursor: 'not-allowed'
                  }}
                />
                <div style={{ fontSize: '11px', color: '#854d0e', marginTop: '4px' }}>
                  Standard: 0.1 N (Fixed)
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#713f12', fontSize: '13px' }}>
                  Weight of Latex Sample (W) - g
                </label>
                <input
                  type="number"
                  id="vfaWeight"
                  placeholder="e.g., 10"
                  step="0.1"
                  min="0"
                  defaultValue="10"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #facc15',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onChange={(e) => {
                    const volume = document.getElementById('vfaVolume').value;
                    const normality = document.getElementById('vfaNormality').value;
                    const weight = e.target.value;
                    calculateVFA(volume, normality, weight);
                  }}
                />
              </div>
            </div>
            <div id="vfaResults" style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              display: 'none'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>VFA Number</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div id="vfaNumberResult" style={{ fontWeight: '700', color: '#ca8a04', fontSize: '28px' }}>0.00</div>
                  <div style={{ fontSize: '20px', color: '#10b981' }} title="Value transferred to main form">🔒</div>
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', fontWeight: '600' }}>
                  ✓ Transferred to VFA field
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '6px',
            fontSize: '13px',
            color: '#854d0e'
          }}>
            <strong>Formula Explanation:</strong><br/>
            • V = Volume of 0.1 N NaOH used in titration (mL)<br/>
            • N = Normality of NaOH (typically 0.1 N)<br/>
            • W = Weight of latex sample (g)<br/>
            • 100 = Conversion factor<br/><br/>
            <strong>Example:</strong> For a 10g latex sample requiring 0.8 mL of 0.1 N NaOH:<br/>
            VFA = (0.8 × 0.1 × 100) / 10 = 0.8<br/><br/>
            <strong>VFA Number:</strong> Indicates the volatile fatty acid content in the latex, which affects stability and quality
          </div>
        </div>
      </div>

      {/* Copper (Cu) Concentration Calculator Section */}
      <div className="info-section" style={{ backgroundColor: '#fef2f2', border: '2px solid #ef4444' }}>
        <h4>🔶 Copper (Cu) Concentration Calculator</h4>
        <div className="info-content">
          <p style={{ marginBottom: '16px', color: '#7f1d1d' }}>
            Determine copper concentration (ppm) in latex using AAS or ICP analysis with dilution factor.
          </p>
          
          <div style={{
            backgroundColor: '#fee2e2',
            border: '2px solid #f87171',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '12px', color: '#7f1d1d', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔬</span> Cu Concentration (ppm) = Instrument Reading × Dilution Factor
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#7f1d1d', fontSize: '13px' }}>
                  Instrument Reading (ppm)
                </label>
                <input
                  type="number"
                  id="cuReading"
                  placeholder="e.g., 2.5"
                  step="0.001"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #f87171',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onChange={(e) => {
                    const reading = e.target.value;
                    const factor = document.getElementById('cuDilution').value;
                    calculateCu(reading, factor);
                  }}
                />
                <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px' }}>
                  From AAS or ICP analysis
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#7f1d1d', fontSize: '13px' }}>
                  Dilution Factor
                </label>
                <input
                  type="number"
                  id="cuDilution"
                  placeholder="e.g., 10"
                  step="0.1"
                  min="1"
                  defaultValue="1"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #f87171',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onChange={(e) => {
                    const reading = document.getElementById('cuReading').value;
                    const factor = e.target.value;
                    calculateCu(reading, factor);
                  }}
                />
                <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px' }}>
                  Use 1 if no dilution
                </div>
              </div>
            </div>
            <div id="cuResults" style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              display: 'none'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Final Cu Concentration</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                  <div id="cuConcentrationResult" style={{ fontWeight: '700', color: '#dc2626', fontSize: '28px' }}>0.000</div>
                  <div style={{ fontSize: '16px', color: '#64748b', fontWeight: '600' }}>ppm</div>
                  <div style={{ fontSize: '20px', color: '#10b981' }} title="Value transferred to main form">🔒</div>
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', fontWeight: '600' }}>
                  ✓ Transferred to CU field
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fee2e2', 
            borderRadius: '6px',
            fontSize: '13px',
            color: '#991b1b'
          }}>
            <strong>Analysis Methods:</strong><br/>
            • AAS = Atomic Absorption Spectroscopy<br/>
            • ICP = Inductively Coupled Plasma<br/><br/>
            <strong>Formula:</strong><br/>
            Final Cu Concentration (ppm) = Instrument Reading (ppm) × Dilution Factor<br/><br/>
            <strong>Example:</strong> If instrument reads 2.5 ppm and sample was diluted 10×:<br/>
            Cu Concentration = 2.5 × 10 = 25.0 ppm<br/><br/>
            <strong>Copper Content:</strong> Important for latex quality assessment. High copper levels can affect vulcanization and product properties
          </div>
        </div>
      </div>

      {/* Magnesium (Mg) Concentration Calculator Section */}
      <div className="info-section" style={{ backgroundColor: '#f0fdf4', border: '2px solid #22c55e' }}>
        <h4>🔷 Magnesium (Mg) Concentration Calculator</h4>
        <div className="info-content">
          <p style={{ marginBottom: '16px', color: '#14532d' }}>
            Record magnesium concentration (ppm) in latex serum using AAS or ICP-OES analysis with dilution factor.
          </p>
          
          <div style={{
            backgroundColor: '#dcfce7',
            border: '2px solid #4ade80',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '12px', color: '#14532d', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔬</span> Mg Concentration (ppm) = Instrument Reading × Dilution Factor
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#14532d', fontSize: '13px' }}>
                  Instrument Reading (ppm)
                </label>
                <input
                  type="number"
                  id="mgReading"
                  placeholder="e.g., 3.8"
                  step="0.001"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #4ade80',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onChange={(e) => {
                    const reading = e.target.value;
                    const factor = document.getElementById('mgDilution').value;
                    calculateMg(reading, factor);
                  }}
                />
                <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
                  From AAS or ICP-OES analysis
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#14532d', fontSize: '13px' }}>
                  Dilution Factor
                </label>
                <input
                  type="number"
                  id="mgDilution"
                  placeholder="e.g., 10"
                  step="0.1"
                  min="1"
                  defaultValue="1"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #4ade80',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onChange={(e) => {
                    const reading = document.getElementById('mgReading').value;
                    const factor = e.target.value;
                    calculateMg(reading, factor);
                  }}
                />
                <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
                  Use 1 if no dilution
                </div>
              </div>
            </div>
            <div id="mgResults" style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              display: 'none'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Final Mg Concentration</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                  <div id="mgConcentrationResult" style={{ fontWeight: '700', color: '#16a34a', fontSize: '28px' }}>0.000</div>
                  <div style={{ fontSize: '16px', color: '#64748b', fontWeight: '600' }}>ppm</div>
                  <div style={{ fontSize: '20px', color: '#10b981' }} title="Value transferred to main form">🔒</div>
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', fontWeight: '600' }}>
                  ✓ Transferred to MG field
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#dcfce7', 
            borderRadius: '6px',
            fontSize: '13px',
            color: '#166534'
          }}>
            <strong>Analysis Methods:</strong><br/>
            • AAS = Atomic Absorption Spectroscopy<br/>
            • ICP-OES = Inductively Coupled Plasma - Optical Emission Spectroscopy<br/><br/>
            <strong>Formula:</strong><br/>
            Final Mg Concentration (ppm) = Instrument Reading (ppm) × Dilution Factor<br/><br/>
            <strong>Example:</strong> If instrument reads 3.8 ppm and sample was diluted 10×:<br/>
            Mg Concentration = 3.8 × 10 = 38.0 ppm<br/><br/>
            <strong>Magnesium Content:</strong> Essential mineral in latex serum. Mg levels affect latex stability, coagulation properties, and overall quality
          </div>
        </div>
      </div>

      {/* Ammonia Calculator Section */}
      <div className="info-section" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}>
        <h4>🧪 Ammonia Addition Calculator</h4>
        <div className="info-content">
          <p style={{ marginBottom: '16px', color: '#92400e' }}>
            Calculate pure ammonia (kg) added and final NH₃ percentage when mixing ammonia solution into latex.
          </p>
          
          {/* Quick Barrel Calculator */}
          <div style={{
            backgroundColor: '#dbeafe',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '12px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛢️</span> Per Barrel Calculator (Standard: 7L ammonia + 200L latex)
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1e40af', fontSize: '13px' }}>
                  Number of Barrels (Auto-synced)
                </label>
                <input
                  type="number"
                  id="barrelCount"
                  placeholder="e.g., 5"
                  step="1"
                  min="1"
                  value={formData.No_of_Barrels || '1'}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #3b82f6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: '#eff6ff'
                  }}
                  onChange={(e) => {
                    const barrels = e.target.value;
                    // Update main form data
                    setFormData(prev => ({ ...prev, No_of_Barrels: barrels }));
                    // Calculate ammonia
                    const conc = document.getElementById('barrelAmmoniaConc').value;
                    calculateBarrelAmmonia(barrels, conc);
                  }}
                />
                <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '4px' }}>
                  Synced with main form
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1e40af', fontSize: '13px' }}>
                  Ammonia Concentration (%)
                </label>
                <input
                  type="number"
                  id="barrelAmmoniaConc"
                  placeholder="e.g., 25"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue="25"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #3b82f6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  onChange={(e) => {
                    const barrels = document.getElementById('barrelCount').value;
                    const conc = e.target.value;
                    calculateBarrelAmmonia(barrels, conc);
                  }}
                />
              </div>
            </div>
            <div id="barrelResults" style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              display: 'none'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Total Ammonia Solution:</span>
                  <div id="totalAmmoniaVol" style={{ fontWeight: '700', color: '#1e40af', fontSize: '16px' }}>0 L</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Total Latex Volume:</span>
                  <div id="totalLatexVol" style={{ fontWeight: '700', color: '#1e40af', fontSize: '16px' }}>0 L</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Pure NH₃ Added:</span>
                  <div id="barrelPureNH3" style={{ fontWeight: '700', color: '#166534', fontSize: '16px' }}>0 kg</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Final NH₃ %:</span>
                  <div id="barrelFinalNH3" style={{ fontWeight: '700', color: '#1e40af', fontSize: '16px' }}>0%</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Custom Calculator */}
          <details style={{ marginBottom: '16px' }}>
            <summary style={{ 
              cursor: 'pointer', 
              fontWeight: '600', 
              color: '#92400e',
              padding: '8px',
              backgroundColor: '#fde68a',
              borderRadius: '6px',
              marginBottom: '12px'
            }}>
              📐 Custom Volume Calculator (Click to expand)
            </summary>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginTop: '12px'
            }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>
                  Ammonia Solution Volume (L)
                </label>
                <input
                  type="number"
                  id="ammoniaVolume"
                  placeholder="e.g., 10"
                  step="0.1"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #f59e0b',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  onChange={(e) => {
                    const vol = e.target.value;
                    const conc = document.getElementById('ammoniaConcentration').value;
                    const latex = document.getElementById('latexVolume').value;
                    calculateAmmonia(vol, conc, latex);
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>
                  Ammonia Concentration (%)
                </label>
                <input
                  type="number"
                  id="ammoniaConcentration"
                  placeholder="e.g., 25"
                  step="0.1"
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #f59e0b',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  onChange={(e) => {
                    const vol = document.getElementById('ammoniaVolume').value;
                    const conc = e.target.value;
                    const latex = document.getElementById('latexVolume').value;
                    calculateAmmonia(vol, conc, latex);
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>
                  Latex Volume (L)
                </label>
                <input
                  type="number"
                  id="latexVolume"
                  placeholder="e.g., 1000"
                  step="0.1"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #f59e0b',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  onChange={(e) => {
                    const vol = document.getElementById('ammoniaVolume').value;
                    const conc = document.getElementById('ammoniaConcentration').value;
                    const latex = e.target.value;
                    calculateAmmonia(vol, conc, latex);
                  }}
                />
              </div>
            </div>
          
            <div id="ammoniaResults" style={{
              backgroundColor: '#dcfce7',
              border: '2px solid #10b981',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px',
              display: 'none'
            }}>
              <h5 style={{ marginTop: 0, marginBottom: '12px', color: '#166534' }}>📊 Calculation Results</h5>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '12px', 
                  borderRadius: '6px',
                  borderLeft: '4px solid #10b981'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Pure Ammonia Added</div>
                  <div id="pureAmmoniaResult" style={{ fontSize: '20px', fontWeight: '700', color: '#166534' }}>
                    0.00 kg
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '12px', 
                  borderRadius: '6px',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Final NH₃ Percentage in Latex</div>
                  <div id="finalNH3Result" style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af' }}>
                    0.00%
                  </div>
                </div>
              </div>
            </div>
          </details>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#e0f2fe', 
            borderRadius: '6px',
            fontSize: '13px',
            color: '#075985'
          }}>
            <strong>Standard Barrel Specifications:</strong><br/>
            • Ammonia Solution: 7 L per barrel<br/>
            • Latex Volume: 200 L per barrel<br/>
            • Ammonia Density: 0.91 kg/L<br/><br/>
            <strong>Formula:</strong><br/>
            Pure NH₃ (kg) = Volume (L) × Concentration (%) × 0.91 / 100<br/>
            Final NH₃ (%) = [Pure NH₃ (kg) / Total Volume (L)] × 100
          </div>
        </div>
      </div>

      <div className="info-section">
        <h4>ℹ️ About AI Process Recommendation</h4>
        <div className="info-content">
          <p>
            This AI-powered tool analyzes latex properties to recommend the optimal processing method. 
            The machine learning model considers multiple factors including DRC percentage, viscosity, 
            impurity levels, and other chemical properties.
          </p>
          <div className="process-types">
            <div className="process-type">
              <strong>🔴 Block Rubber TSR Processing:</strong> Technical Specified Rubber production
            </div>
            <div className="process-type">
              <strong>🔵 Concentrated Latex:</strong> Industrial-grade latex concentration
            </div>
            <div className="process-type">
              <strong>🟠 Foam Production:</strong> Specialized foam rubber manufacturing
            </div>
            <div className="process-type">
              <strong>🟢 Centrifugation:</strong> High-quality latex separation
            </div>
            <div className="process-type">
              <strong>🔷 Creaming:</strong> Natural density-based separation
            </div>
          </div>
          <p className="info-note">
            <strong>Note:</strong> This is an AI-assisted recommendation. Final processing decisions 
            should be validated by experienced lab staff and quality control procedures.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIRubberProcess;
