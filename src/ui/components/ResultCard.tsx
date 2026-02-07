import type { SearchableComponent } from '../hooks/useSearch';

interface ResultCardProps {
  component: SearchableComponent;
  onClick?: () => void;
  onPlace?: () => void;
}

export function ResultCard({ component, onClick, onPlace }: ResultCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  const handlePlaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlace) {
      onPlace();
    }
  };

  return (
    <div className="result-card" onClick={handleCardClick}>
      <div className="result-preview">
        {/* Placeholder for preview image */}
        <div className="result-preview-placeholder">
          {component.name.charAt(0)}
        </div>
      </div>
      <div className="result-info">
        <div className="result-header">
          <h3 className="result-name">{component.name}</h3>
          <span className="result-system-badge">{component.designSystemName}</span>
        </div>
        <div className="result-category">{component.category}</div>
      </div>
      <button 
        className="result-place-btn"
        onClick={handlePlaceClick}
        title="Place component"
      >
        Place
      </button>
    </div>
  );
}
