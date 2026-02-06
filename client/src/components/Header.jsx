import './Header.css';

function Header({ onToggleDictionary }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-logo">🤟</span>
          <div>
            <h1 className="header-title">LST Interpreter</h1>
            <p className="header-subtitle">
              Traducteur en Langue des Signes Tunisienne
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-dictionary" onClick={onToggleDictionary}>
            📖 Dictionnaire
          </button>
          <span className="header-badge">AVST</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
