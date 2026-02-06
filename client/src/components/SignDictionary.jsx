import { useState, useEffect } from 'react';
import { fetchDictionary } from '../services/api';
import './SignDictionary.css';

function SignDictionary({ onClose }) {
  const [signs, setSigns] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDictionary()
      .then((data) => {
        setSigns(data.signs || []);
      })
      .catch((err) => {
        console.error('Failed to load dictionary:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(signs.map((s) => s.category))];

  const filtered = signs.filter((sign) => {
    const matchesCategory =
      selectedCategory === 'all' || sign.category === selectedCategory;
    const matchesFilter =
      !filter ||
      sign.words.some((w) => w.includes(filter.toLowerCase())) ||
      sign.description.toLowerCase().includes(filter.toLowerCase());
    return matchesCategory && matchesFilter;
  });

  return (
    <div className="dictionary-overlay" onClick={onClose}>
      <div className="dictionary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dictionary-header">
          <h2>📖 Dictionnaire LST</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="dictionary-filters">
          <input
            type="text"
            className="dictionary-search"
            placeholder="Rechercher un mot..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${
                  selectedCategory === cat ? 'active' : ''
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'Tous' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="dictionary-list">
          {loading ? (
            <div className="dictionary-loading">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="dictionary-empty">Aucun signe trouvé</div>
          ) : (
            filtered.map((sign) => (
              <div key={sign.id} className="dictionary-item">
                <div className="dict-item-header">
                  <span className="dict-word">{sign.words[0]}</span>
                  <span className={`dict-category cat-${sign.category}`}>
                    {sign.category}
                  </span>
                </div>
                <div className="dict-description">{sign.description}</div>
                <div className="dict-words">
                  {sign.words.map((w, i) => (
                    <span key={i} className="dict-word-chip">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="dictionary-footer">
          {filtered.length} signe{filtered.length !== 1 ? 's' : ''} disponible
          {filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

export default SignDictionary;
