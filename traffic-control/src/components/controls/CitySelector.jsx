import React from 'react';
import { CITIES } from '../../config/cities';

export default function CitySelector({ selectedCityId, onSelectCity }) {
  return (
    <div className="city-pill-container" role="tablist" aria-label="City Selector">
      {Object.values(CITIES).map((city) => {
        const isActive = city.id === selectedCityId;
        return (
          <button
            key={city.id}
            role="tab"
            aria-selected={isActive}
            className={`city-pill-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectCity(city.id)}
            title={`Switch view to ${city.name} (${city.nativeName})`}
          >
            <span
              className="city-dot"
              style={{
                backgroundColor: city.badgeColor,
                boxShadow: isActive ? `0 0 8px ${city.badgeColor}` : 'none',
              }}
            />
            <span>{city.name}</span>
          </button>
        );
      })}
    </div>
  );
}
