import './legend.css';
import Grid from "./Grid";

const newGrid = new Grid() 

const MapLegend = () => {
  return (
    <div className="info legend">
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(10) }}></span>
          <span className="legend-value">10-25</span>
        </div>
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(26) }}></span>
          <span className="legend-value">26-50</span>
        </div>
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(51) }}></span>
          <span className="legend-value">51-100</span>
        </div>
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(101) }}></span>
          <span className="legend-value">101-150</span>
        </div>
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(151) }}></span>
          <span className="legend-value">151-200</span>
        </div>
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(201) }}></span>
          <span className="legend-value">201-300</span>
        </div>
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(301) }}></span>
          <span className="legend-value">301-500</span>
        </div>
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(501) }}></span>
          <span className="legend-value">501-700</span>
        </div>
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(701) }}></span>
          <span className="legend-value">701-1000</span>
        </div>
        <div className="legend-item">
          <span className="legend-key" style={{ background: newGrid.getColor(1001) }}></span>
          <span className="legend-value">&gt;1000</span>
        </div>
      </div>
    </div>
  );
};



export default MapLegend;