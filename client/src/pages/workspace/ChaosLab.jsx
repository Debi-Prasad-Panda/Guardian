export default function ChaosLab() {
  return (
    <div className="page-container flex-col gap-4">
      <div className="topbar flex justify-between items-center pb-4 border-b border-light">
        <h2 className="text-body text-secondary">Guardian &gt; Chaos Lab</h2>
        <div className="status flex items-center gap-2"><span className="dot dot-green"></span> System Ready</div>
      </div>
      <div className="flex gap-4 map-split">
        <div className="map-view card fill-remaining min-h-[500px] flex items-center justify-center bg-bg-primary">
          [Mapbox GL Map]
        </div>
        <div className="control-panel card flex-col gap-4 w-[350px]">
          <h3 className="text-body font-semibold">Scenario Parameters</h3>
          <div className="flex-col gap-2">
            <label className="text-sm text-secondary">Weather Severity (1-10)</label>
            <input type="range" min="1" max="10" defaultValue="4" className="slider slider-critical" />
          </div>
          <div className="flex-col gap-2">
            <label className="text-sm text-secondary">Port Strike Probability</label>
            <input type="range" min="0" max="100" defaultValue="0" className="slider" />
          </div>
          <hr className="border-light" />
          <button className="btn btn-critical text-body font-bold py-3">⚡ INJECT CHAOS</button>
        </div>
      </div>
    </div>
  );
}
