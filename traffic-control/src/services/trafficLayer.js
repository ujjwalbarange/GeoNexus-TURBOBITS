/**
 * Traffic Map Visualization Layer
 * Handles high-performance Leaflet vector rendering for traffic segments:
 * - Dynamic color coding based on normalized congestion severity
 * - Neon glow backdrop polyline + crisp foreground stroke
 * - Interactive hover tooltips with speed / congestion details
 * - Click handler to focus and inspect specific road segments
 */

import L from 'leaflet';
import { TRAFFIC_LEVELS } from '../config/mapConfig';

export class TrafficMapLayerManager {
  constructor(mapInstance) {
    this.map = mapInstance;
    this.layerGroup = L.layerGroup().addTo(mapInstance);
    this.onSegmentSelectCallback = null;
    this.activePolylines = [];
  }

  setSelectCallback(cb) {
    this.onSegmentSelectCallback = cb;
  }

  /**
   * Clear existing traffic overlays
   */
  clear() {
    this.layerGroup.clearLayers();
    this.activePolylines = [];
  }

  /**
   * Render or update traffic segments on the map
   * @param {Array} segments - Array of normalized traffic segments
   * @param {string|null} selectedSegmentId - Currently highlighted segment
   */
  renderSegments(segments, selectedSegmentId = null) {
    this.clear();
    if (!segments || segments.length === 0) return;

    segments.forEach((seg) => {
      if (!seg.coordinates || seg.coordinates.length < 2) return;

      const isSelected = selectedSegmentId === seg.id;
      const level = TRAFFIC_LEVELS[seg.congestionLevel] || TRAFFIC_LEVELS.UNKNOWN;

      // 1. Subtle glow backdrop polyline
      const glowPolyline = L.polyline(seg.coordinates, {
        color: seg.color || level.color,
        weight: (seg.strokeWeight || level.strokeWeight) + 5,
        opacity: isSelected ? 0.7 : 0.25,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      });

      // 2. Crisp foreground traffic line
      const mainPolyline = L.polyline(seg.coordinates, {
        color: seg.color || level.color,
        weight: isSelected ? (seg.strokeWeight || level.strokeWeight) + 2 : (seg.strokeWeight || level.strokeWeight),
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Hover Tooltip
      const tooltipHtml = `
        <div style="font-family: 'Inter', sans-serif; font-size: 12px; padding: 4px 6px; color: #f8fafc;">
          <div style="font-weight: 700; color: #fff; margin-bottom: 2px;">${seg.corridorName}</div>
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${seg.color};"></span>
            <span style="font-weight: 600; color: ${seg.color};">${level.label}</span>
            ${seg.currentSpeedKmH !== null ? `<span style="color: #94a3b8;">· ${seg.currentSpeedKmH} km/h</span>` : ''}
          </div>
        </div>
      `;

      mainPolyline.bindTooltip(tooltipHtml, {
        sticky: true,
        className: 'traffic-tooltip-dark',
        direction: 'top',
        offset: [0, -6],
      });

      // Click event
      mainPolyline.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (this.onSegmentSelectCallback) {
          this.onSegmentSelectCallback(seg);
        }
      });

      // Hover feedback
      mainPolyline.on('mouseover', function () {
        this.setStyle({ weight: (seg.strokeWeight || level.strokeWeight) + 3, opacity: 1 });
      });

      mainPolyline.on('mouseout', function () {
        if (!isSelected) {
          this.setStyle({ weight: seg.strokeWeight || level.strokeWeight, opacity: 0.95 });
        }
      });

      // Add both to layer group
      glowPolyline.addTo(this.layerGroup);
      mainPolyline.addTo(this.layerGroup);

      this.activePolylines.push({ id: seg.id, polyline: mainPolyline });
    });
  }

  /**
   * Remove layers and cleanup listeners
   */
  destroy() {
    this.clear();
    this.map.removeLayer(this.layerGroup);
  }
}
