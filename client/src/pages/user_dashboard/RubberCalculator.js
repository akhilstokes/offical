import React, { useState } from 'react';
import './RubberCalculator.css';

const RubberCalculator = () => {
    const [activeTab, setActiveTab] = useState('dry-content');
    const [results, setResults] = useState({});
    const [formData, setFormData] = useState({
        // Dry Content Calculator
        wetWeight: '',
        dryWeight: '',
        moistureContent: '',
        
        // Density Calculator
        mass: '',
        volume: '',
        density: '',
        
        // Cost Calculator
        rubberWeight: '',
        pricePerKg: '',
        totalCost: '',
        
        // Volume Calculator
        length: '',
        width: '',
        height: '',
        diameter: '',
        radius: '',
        shape: 'rectangular'
    });

    const handleInputChange = (field, value) => {
        // Sanitize negatives for numeric fields used in calculators
        const numericFields = new Set(['wetWeight','dryWeight','moistureContent','mass','volume','density','rubberWeight','pricePerKg','totalCost','length','width','height','diameter','radius']);
        let v = value;
        
        if (numericFields.has(field)) {
            // Reject negative numbers
            const num = parseFloat(v);
            if (v !== '' && (isNaN(num) || num < 0)) return;
        }
        
        setFormData(prev => ({
            ...prev,
            [field]: v
        }));
    };

    const calculateDryContent = () => {
        const wetWeight = parseFloat(formData.wetWeight);
        const dryWeight = parseFloat(formData.dryWeight);
        
        if (wetWeight && dryWeight && wetWeight > 0) {
            const dryContent = (dryWeight / wetWeight) * 100;
            const moistureContent = 100 - dryContent;
            
            setResults(prev => ({
                ...prev,
                dryContent: dryContent.toFixed(2),
                moistureContent: moistureContent.toFixed(2)
            }));
        }
    };

    const calculateDensity = () => {
        const mass = parseFloat(formData.mass);
        const volume = parseFloat(formData.volume);
        
        if (mass && volume && volume > 0) {
            const density = mass / volume;
            setResults(prev => ({
                ...prev,
                density: density.toFixed(3)
            }));
        }
    };

    const calculateCost = () => {
        const weight = parseFloat(formData.rubberWeight);
        const price = parseFloat(formData.pricePerKg);
        
        if (weight && price) {
            const totalCost = weight * price;
            setResults(prev => ({
                ...prev,
                totalCost: totalCost.toFixed(2)
            }));
        }
    };

    const calculateVolume = () => {
        let volume = 0;
        
        if (formData.shape === 'rectangular') {
            const length = parseFloat(formData.length);
            const width = parseFloat(formData.width);
            const height = parseFloat(formData.height);
            
            if (length && width && height) {
                volume = length * width * height;
            }
        } else if (formData.shape === 'cylindrical') {
            const radius = parseFloat(formData.radius);
            const height = parseFloat(formData.height);
            
            if (radius && height) {
                volume = Math.PI * radius * radius * height;
            }
        } else if (formData.shape === 'spherical') {
            const radius = parseFloat(formData.radius);
            
            if (radius) {
                volume = (4/3) * Math.PI * radius * radius * radius;
            }
        }
        
        if (volume > 0) {
            setResults(prev => ({
                ...prev,
                volume: volume.toFixed(3)
            }));
        }
    };

    const clearResults = () => {
        setResults({});
        setFormData({
            wetWeight: '',
            dryWeight: '',
            moistureContent: '',
            mass: '',
            volume: '',
            density: '',
            rubberWeight: '',
            pricePerKg: '',
            totalCost: '',
            length: '',
            width: '',
            height: '',
            diameter: '',
            radius: '',
            shape: 'rectangular'
        });
    };

    const renderDryContentCalculator = () => (
        <div className="calculator-section">
            <h3>Dry Content Calculator</h3>
            <p>Calculate dry rubber content and moisture percentage</p>
            
            <div className="input-group">
                <label>Wet Weight (kg):</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={formData.wetWeight}
                    onChange={(e) => handleInputChange('wetWeight', e.target.value)}
                    onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                    onWheel={(e)=>e.currentTarget.blur()}
                    placeholder="Enter wet weight"
                />
            </div>
            
            <div className="input-group">
                <label>Dry Weight (kg):</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={formData.dryWeight}
                    onChange={(e) => handleInputChange('dryWeight', e.target.value)}
                    onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                    onWheel={(e)=>e.currentTarget.blur()}
                    placeholder="Enter dry weight"
                />
            </div>
            
            <button onClick={calculateDryContent} className="calculate-btn">
                Calculate Dry Content
            </button>
            
            {results.dryContent && (
                <div className="results">
                    <h4>Results:</h4>
                    <div className="result-item">
                        <span>Dry Content:</span>
                        <span className="result-value">{results.dryContent}%</span>
                    </div>
                    <div className="result-item">
                        <span>Moisture Content:</span>
                        <span className="result-value">{results.moistureContent}%</span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderDensityCalculator = () => (
        <div className="calculator-section">
            <h3>Density Calculator</h3>
            <p>Calculate rubber density from mass and volume</p>
            
            <div className="input-group">
                <label>Mass (kg):</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={formData.mass}
                    onChange={(e) => handleInputChange('mass', e.target.value)}
                    onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                    onWheel={(e)=>e.currentTarget.blur()}
                    placeholder="Enter mass"
                />
            </div>
            
            <div className="input-group">
                <label>Volume (m³):</label>
                <input
                    type="number"
                    step="0.001"
                    min="0"
                    inputMode="decimal"
                    value={formData.volume}
                    onChange={(e) => handleInputChange('volume', e.target.value)}
                    onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                    onWheel={(e)=>e.currentTarget.blur()}
                    placeholder="Enter volume"
                />
            </div>
            
            <button onClick={calculateDensity} className="calculate-btn">
                Calculate Density
            </button>
            
            {results.density && (
                <div className="results">
                    <h4>Results:</h4>
                    <div className="result-item">
                        <span>Density:</span>
                        <span className="result-value">{results.density} kg/m³</span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCostCalculator = () => (
        <div className="calculator-section">
            <h3>Cost Calculator</h3>
            <p>Calculate total cost of rubber based on weight and price</p>
            
            <div className="input-group">
                <label>Rubber Weight (kg):</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={formData.rubberWeight}
                    onChange={(e) => handleInputChange('rubberWeight', e.target.value)}
                    onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                    onWheel={(e)=>e.currentTarget.blur()}
                    placeholder="Enter weight"
                />
            </div>
            
            <div className="input-group">
                <label>Price per kg ($):</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={formData.pricePerKg}
                    onChange={(e) => handleInputChange('pricePerKg', e.target.value)}
                    onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                    onWheel={(e)=>e.currentTarget.blur()}
                    placeholder="Enter price per kg"
                />
            </div>
            
            <button onClick={calculateCost} className="calculate-btn">
                Calculate Cost
            </button>
            
            {results.totalCost && (
                <div className="results">
                    <h4>Results:</h4>
                    <div className="result-item">
                        <span>Total Cost:</span>
                        <span className="result-value">${results.totalCost}</span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderVolumeCalculator = () => (
        <div className="calculator-section">
            <h3>Volume Calculator</h3>
            <p>Calculate volume of rubber products</p>
            
            <div className="input-group">
                <label>Shape:</label>
                <select 
                    value={formData.shape} 
                    onChange={(e) => handleInputChange('shape', e.target.value)}
                >
                    <option value="rectangular">Rectangular</option>
                    <option value="cylindrical">Cylindrical</option>
                    <option value="spherical">Spherical</option>
                </select>
            </div>
            
            {formData.shape === 'rectangular' && (
                <>
                    <div className="input-group">
                        <label>Length (m):</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            value={formData.length}
                            onChange={(e) => handleInputChange('length', e.target.value)}
                            onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                            onWheel={(e)=>e.currentTarget.blur()}
                            placeholder="Enter length"
                        />
                    </div>
                    <div className="input-group">
                        <label>Width (m):</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            value={formData.width}
                            onChange={(e) => handleInputChange('width', e.target.value)}
                            onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                            onWheel={(e)=>e.currentTarget.blur()}
                            placeholder="Enter width"
                        />
                    </div>
                </>
            )}
            
            {(formData.shape === 'cylindrical' || formData.shape === 'spherical') && (
                <div className="input-group">
                    <label>Radius (m):</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={formData.radius}
                        onChange={(e) => handleInputChange('radius', e.target.value)}
                        onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                        onWheel={(e)=>e.currentTarget.blur()}
                        placeholder="Enter radius"
                    />
                </div>
            )}
            
            {formData.shape !== 'spherical' && (
                <div className="input-group">
                    <label>Height (m):</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={formData.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                        onWheel={(e)=>e.currentTarget.blur()}
                        placeholder="Enter height"
                    />
                </div>
            )}
            
            <button onClick={calculateVolume} className="calculate-btn">
                Calculate Volume
            </button>
            
            {results.volume && (
                <div className="results">
                    <h4>Results:</h4>
                    <div className="result-item">
                        <span>Volume:</span>
                        <span className="result-value">{results.volume} m³</span>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="rubber-calculator">
            <div className="calculator-header">
                <h2>
                    <i className="fas fa-calculator"></i>
                    Rubber Calculator
                </h2>
                <p>Professional tools for rubber industry calculations</p>
            </div>

            <div className="calculator-tabs">
                <button 
                    className={activeTab === 'dry-content' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('dry-content')}
                >
                    <i className="fas fa-tint"></i>
                    Dry Content
                </button>
                <button 
                    className={activeTab === 'density' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('density')}
                >
                    <i className="fas fa-weight"></i>
                    Density
                </button>
                <button 
                    className={activeTab === 'cost' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('cost')}
                >
                    <i className="fas fa-dollar-sign"></i>
                    Cost
                </button>
                <button 
                    className={activeTab === 'volume' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('volume')}
                >
                    <i className="fas fa-cube"></i>
                    Volume
                </button>
            </div>

            <div className="calculator-content">
                {activeTab === 'dry-content' && renderDryContentCalculator()}
                {activeTab === 'density' && renderDensityCalculator()}
                {activeTab === 'cost' && renderCostCalculator()}
                {activeTab === 'volume' && renderVolumeCalculator()}
            </div>

            <div className="calculator-footer">
                <button onClick={clearResults} className="clear-btn">
                    <i className="fas fa-trash"></i>
                    Clear All
                </button>
            </div>
        </div>
    );
};

export default RubberCalculator;

