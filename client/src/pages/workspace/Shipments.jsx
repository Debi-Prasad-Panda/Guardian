export default function Shipments() {
  return (
    <div className="page-container flex-col gap-4">
      <div className="topbar flex justify-between items-center pb-4 border-b border-light">
        <h2 className="text-body text-secondary">Guardian &gt; Shipments</h2>
        <div className="filters flex gap-2">
          <input type="text" placeholder="Search..." className="input-field" />
          <button className="btn btn-outline">Export CSV</button>
        </div>
      </div>
      <div className="card table-container">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs text-secondary py-2 border-b border-light">Shipment ID</th>
              <th className="text-left text-xs text-secondary py-2 border-b border-light">Route</th>
              <th className="text-left text-xs text-secondary py-2 border-b border-light">Tier</th>
              <th className="text-left text-xs text-secondary py-2 border-b border-light">Risk %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 text-sm">SHP_001</td>
              <td className="py-2 text-sm">BLR → DEL</td>
              <td className="py-2"><span className="badge badge-critical">CRITICAL</span></td>
              <td className="py-2"><div className="risk-bar w-full bg-border-light"><div className="bg-risk-critical w-[87%] h-2"></div></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
