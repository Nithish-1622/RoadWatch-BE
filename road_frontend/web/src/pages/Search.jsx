import React, { useState } from 'react';
import { Search as SearchIcon, ExternalLink } from 'lucide-react';
import { searchRoads } from '../api/search';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchRoads(query);
      setResults(data);
    } catch (error) {
      console.error('Search failed', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Global Search</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Search across roads, budgets, complaints, and documents instantly.</p>
      </div>

      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '3rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Enter search query (e.g., 'Main St', 'Pothole')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: '3rem', height: '60px', fontSize: '1.2rem', borderRadius: '30px' }}
        />
        <SearchIcon 
          size={24} 
          style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} 
        />
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', borderRadius: '25px', padding: '0.5rem 1.5rem' }}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Search Results ({Array.isArray(results) ? results.length : 0})</h3>
          
          {Array.isArray(results) && results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map((item, index) => (
                <div key={index} className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>{item.title || item.name || `Result #${index + 1}`}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.description || item.content || JSON.stringify(item)}</p>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
              No results found for "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
