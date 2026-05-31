import React, { useState } from 'react';
import { Cpu, Send, Activity } from 'lucide-react';
import { predict } from '../api/ai';

const AIPredictor = () => {
  const [inputData, setInputData] = useState('{"traffic_volume": 5000, "age_years": 10, "last_maintenance_months": 24}');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    try {
      const parsedData = JSON.parse(inputData);
      const data = await predict(parsedData);
      setPrediction(data);
    } catch (error) {
      console.error('Prediction failed', error);
      setPrediction({ error: 'Failed to parse JSON or connect to AI Gateway.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Cpu size={24} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>AI Degradation Predictor</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Leverage machine learning to predict road maintenance needs.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-panel card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--primary-color)" />
            Input Parameters
          </h3>
          <form onSubmit={handlePredict}>
            <div className="input-group">
              <label className="input-label">Road Telemetry Data (JSON format)</label>
              <textarea 
                className="input-field" 
                value={inputData} 
                onChange={(e) => setInputData(e.target.value)} 
                required 
                rows={10}
                style={{ fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.2)' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              <Send size={18} /> {loading ? 'Running Inference...' : 'Generate Prediction'}
            </button>
          </form>
        </div>

        <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Prediction Results</h3>
          
          <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--primary-color)' }}>
                <Activity className="logo-icon animate-pulse" size={40} />
              </div>
            ) : prediction ? (
              prediction.error ? (
                <div style={{ color: 'var(--danger-color)' }}>{prediction.error}</div>
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--success-color)' }}>
                  {JSON.stringify(prediction, null, 2)}
                </pre>
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Awaiting input parameters...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPredictor;
