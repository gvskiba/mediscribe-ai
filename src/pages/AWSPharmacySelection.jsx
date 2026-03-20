import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const CSS = `
:root {
  --bg:#050f1e; --bg-panel:#081628; --bg-card:#0b1e36; --bg-up:#0e2544;
  --border:#1a3555; --border-hi:#2a4f7a;
  --blue:#3b9eff; --cyan:#00d4ff; --teal:#00e5c0; --gold:#f5c842;
  --purple:#9b6dff; --coral:#ff6b6b; --orange:#ff9f43;
  --txt:#e8f0fe; --txt2:#8aaccc; --txt3:#4a6a8a; --txt4:#2e4a6a;
  --r:8px; --rl:12px;
}
.aws-root{background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;padding:20px;min-height:100vh;position:fixed;top:65px;left:72px;right:0;bottom:0;overflow-y:auto}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.demo-wrap{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.demo-header{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:18px 20px}
.demo-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--txt);margin-bottom:4px}
.demo-sub{font-size:12px;color:var(--txt3);line-height:1.5}
.config-panel{background:rgba(59,158,255,.04);border:1px solid rgba(59,158,255,.2);border-radius:var(--rl);padding:16px 18px}
.config-title{font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.config-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.config-field{display:flex;flex-direction:column;gap:4px}
.config-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em}
.config-inp{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-family:'JetBrains Mono',monospace;font-size:11px;outline:none;width:100%;transition:border-color .15s}
.config-inp:focus{border-color:var(--blue)}
.config-inp.ok{border-color:rgba(0,229,192,.4)}
.config-inp.err{border-color:rgba(255,107,107,.4)}
.status-row{display:flex;align-items:center;gap:8px;margin-top:12px;padding:8px 12px;border-radius:var(--r)}
.status-row.connected{background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.25)}
.status-row.disconnected{background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.2)}
.status-row.testing{background:rgba(245,200,66,.06);border:1px solid rgba(245,200,66,.2)}
.status-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot-teal{background:var(--teal);box-shadow:0 0 6px rgba(0,229,192,.5)}
.dot-coral{background:var(--coral)}
.dot-gold{background:var(--gold);animation:blink .8s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.status-text{font-size:12px;color:var(--txt2)}
.search-section{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
.search-wrap{position:relative;display:flex;gap:8px}
.search-inp{flex:1;background:var(--bg-card);border:2px solid var(--border-hi);border-radius:var(--rl);padding:11px 16px 11px 44px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all .2s}
.search-inp:focus{border-color:var(--blue);box-shadow:0 0 0 4px rgba(59,158,255,.1)}
.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px;pointer-events:none}
.search-filters{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.filter-chip{padding:4px 12px;border-radius:20px;font-size:11px;cursor:pointer;border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);transition:all .15s;user-select:none}
.filter-chip:hover{border-color:var(--border-hi);color:var(--txt)}
.filter-chip.on{background:rgba(59,158,255,.15);border-color:var(--blue);color:var(--blue)}
.results-area{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px;min-height:240px}
.results-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.results-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--txt)}
.results-meta{font-size:11px;color:var(--txt3);font-family:'JetBrains Mono',monospace}
.results-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pharm-card{background:var(--bg-card);border:1.5px solid var(--border);border-radius:var(--r);padding:12px 14px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden}
.pharm-card:hover{border-color:var(--border-hi);transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.3)}
.pharm-card.selected{border-color:var(--teal);background:rgba(0,229,192,.06);box-shadow:0 0 0 1px rgba(0,229,192,.2),0 4px 20px rgba(0,229,192,.12)}
.pharm-card.amazon{border-color:rgba(255,159,67,.3)}
.pharm-card.amazon.selected{border-color:var(--orange);background:rgba(255,159,67,.07)}
.pharm-select-dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--border);flex-shrink:0;transition:all .15s;display:flex;align-items:center;justify-content:center}
.pharm-card.selected .pharm-select-dot{background:var(--teal);border-color:var(--teal)}
.pharm-card.selected .pharm-select-dot::after{content:'✓';color:var(--bg);font-size:9px;font-weight:900}
.pharm-card.amazon.selected .pharm-select-dot{background:var(--orange);border-color:var(--orange)}
.pharm-name{font-size:13px;font-weight:700;color:var(--txt);margin-bottom:2px}
.pharm-addr{font-size:11px;color:var(--txt3);line-height:1.4}
.pharm-distance{font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--blue);font-weight:600}
.pharm-hours{font-size:10px;margin-top:3px}
.hours-open{color:var(--teal)}
.hours-closed{color:var(--coral)}
.pharm-chain-badge{position:absolute;top:10px;right:10px;font-size:9px;padding:2px 7px;border-radius:3px;font-weight:700;font-family:'JetBrains Mono',monospace}
.chain-amazon{background:rgba(255,159,67,.2);color:var(--orange)}
.chain-cvs{background:rgba(255,107,107,.15);color:var(--coral)}
.chain-walgreens{background:rgba(59,158,255,.15);color:var(--blue)}
.chain-walmart{background:rgba(0,229,192,.12);color:var(--teal)}
.chain-hosp{background:rgba(155,109,255,.15);color:var(--purple)}
.chain-riteaid{background:rgba(245,200,66,.12);color:var(--gold)}
.chain-other{background:rgba(74,106,138,.2);color:var(--txt3)}
.ncpdp-badge{font-size:9px;font-family:'JetBrains Mono',monospace;color:var(--txt4);margin-top:4px}
.pharm-capabilities{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}
.cap-pill{font-size:9px;padding:1px 6px;border-radius:3px;font-weight:600}
.cap-epcs{background:rgba(0,229,192,.12);color:var(--teal)}
.cap-control{background:rgba(155,109,255,.12);color:var(--purple)}
.cap-24h{background:rgba(59,158,255,.12);color:var(--blue)}
.cap-driveup{background:rgba(245,200,66,.1);color:var(--gold)}
.cap-delivery{background:rgba(255,159,67,.1);color:var(--orange)}
.skel{background:linear-gradient(90deg,var(--bg-up) 25%,rgba(59,158,255,.06) 50%,var(--bg-up) 75%);background-size:200% 100%;animation:skel .9s infinite;border-radius:var(--r);height:90px}
@keyframes skel{0%{background-position:200% 0}100%{background-position:-200% 0}}
.selected-detail{background:rgba(0,229,192,.05);border:1px solid rgba(0,229,192,.22);border-radius:var(--rl);padding:14px 16px}
.sel-detail-title{font-size:10px;color:var(--teal);text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin-bottom:10px}
.sel-detail-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.sel-detail-field{display:flex;flex-direction:column;gap:3px}
.sel-detail-label{font-size:9px;color:var(--txt4);text-transform:uppercase;letter-spacing:.05em}
.sel-detail-val{font-size:12px;color:var(--txt);font-family:'JetBrains Mono',monospace;font-weight:600}
.transmit-row{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
.tx-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:var(--r);font-size:12px;cursor:pointer;transition:all .15s;font-weight:600;border:1px solid}
.tx-epcs{background:rgba(0,229,192,.12);border-color:rgba(0,229,192,.35);color:var(--teal)}
.tx-epcs:hover{background:rgba(0,229,192,.22)}
.tx-fax{background:var(--bg-up);border-color:var(--border);color:var(--txt2)}
.tx-fax:hover{border-color:var(--border-hi);color:var(--txt)}
.tx-print{background:var(--bg-up);border-color:var(--border);color:var(--txt2)}
.tx-print:hover{border-color:var(--border-hi);color:var(--txt)}
.tx-amazon{background:rgba(255,159,67,.12);border-color:rgba(255,159,67,.35);color:var(--orange)}
.tx-amazon:hover{background:rgba(255,159,67,.22)}
.aws-legend{display:flex;gap:6px;flex-wrap:wrap}
.aw-chip{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--txt3);background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 9px}
.aw-dot{width:6px;height:6px;border-radius:50%}
.badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap}
.badge-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.badge-orange{background:rgba(255,159,67,.12);color:var(--orange);border:1px solid rgba(255,159,67,.3)}
.badge-blue{background:rgba(59,158,255,.12);color:var(--blue);border:1px solid rgba(59,158,255,.3)}
.btn-primary{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.btn-primary:hover{filter:brightness(1.12)}
.btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.btn-ghost:hover{border-color:var(--border-hi);color:var(--txt)}
`;

const DEMO_PHARMACIES = [
  { ncpdpId:'1847302', npi:'1234567890', name:'CVS Pharmacy #3847', chain:'CVS', address:'1420 Oak Ave', city:'Springfield', state:'IL', zip:'62701', phone:'(217) 555-0142', fax:'(217) 555-0143', hours:'Open 24 hours', distance:'0.4 mi', open24h:true, epcsCapable:true, controlledSub:true, deliveryAvail:false, driveThru:true, transmitMethods:['epcs','fax'], lat:39.781, lng:-89.650 },
  { ncpdpId:'2091847', npi:'1987654321', name:'Walgreens #0291', chain:'WAG', address:'832 Main St', city:'Springfield', state:'IL', zip:'62701', phone:'(217) 555-0291', fax:'(217) 555-0292', hours:'Open until 10pm', distance:'0.9 mi', open24h:false, epcsCapable:true, controlledSub:true, deliveryAvail:false, driveThru:true, transmitMethods:['epcs','fax'], lat:39.799, lng:-89.644 },
  { ncpdpId:'3002918', npi:'1555443322', name:'Regional Medical Center Pharmacy', chain:'HOSP', address:'501 N First St', city:'Springfield', state:'IL', zip:'62702', phone:'(217) 555-5000', fax:'(217) 555-5001', hours:'Open 24 hours', distance:'1.1 mi', open24h:true, epcsCapable:true, controlledSub:true, deliveryAvail:false, driveThru:false, transmitMethods:['epcs','fax','print'], lat:39.803, lng:-89.647 },
  { ncpdpId:'4118293', npi:'1667788990', name:'Walmart Pharmacy #4421', chain:'WAL', address:'2200 Commerce Blvd', city:'Springfield', state:'IL', zip:'62703', phone:'(217) 555-4421', fax:'(217) 555-4422', hours:'Open until 9pm', distance:'1.8 mi', open24h:false, epcsCapable:true, controlledSub:false, deliveryAvail:false, driveThru:true, transmitMethods:['epcs','fax'], lat:39.762, lng:-89.668 },
  { ncpdpId:'5829103', npi:'1776655443', name:'Amazon Pharmacy', chain:'AMAZON', address:'Delivered to patient address', city:'', state:'', zip:'', phone:'1-855-745-5725', fax:'N/A', hours:'24/7 delivery', distance:'Delivery', open24h:true, epcsCapable:true, controlledSub:false, deliveryAvail:true, driveThru:false, transmitMethods:['epcs'], lat:null, lng:null },
  { ncpdpId:'6038291', npi:'1884455662', name:'Rite Aid #4917', chain:'RITEAID', address:'3100 Wabash Ave', city:'Springfield', state:'IL', zip:'62704', phone:'(217) 555-4917', fax:'(217) 555-4918', hours:'Open until 9pm', distance:'2.1 mi', open24h:false, epcsCapable:true, controlledSub:true, deliveryAvail:false, driveThru:true, transmitMethods:['epcs','fax'], lat:39.776, lng:-89.686 },
];

const CHAIN_BADGES = { AMAZON:'chain-amazon', CVS:'chain-cvs', WAG:'chain-walgreens', WAL:'chain-walmart', HOSP:'chain-hosp', RITEAID:'chain-riteaid' };
const CHAIN_LABELS = { AMAZON:'AMAZON RX', WAG:'WALGREENS', WAL:'WALMART', HOSP:'HOSPITAL', RITEAID:'RITE AID' };

export default function AWSPharmacySelection() {
  const [config, setConfig] = useState({
    apiBase: '',
    apiKey: '',
    region: 'us-east-1',
    locationPlaceIndex: '',
    cognitoPoolId: '',
    authMode: 'apikey',
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionText, setConnectionText] = useState('Not connected — running in demo mode with local data.');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [results, setResults] = useState(DEMO_PHARMACIES);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
    return () => styleEl.remove();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const q = searchQuery.toLowerCase();
    const filtered = DEMO_PHARMACIES.filter(p =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.chain.toLowerCase().includes(q) ||
      p.zip.includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.ncpdpId.includes(q)
    );
    setResults(applyFilter(filtered));
    setLoading(false);
  };

  const applyFilter = (list) => {
    if (activeFilter === 'all') return list;
    if (activeFilter === 'epcs') return list.filter(p => p.epcsCapable);
    if (activeFilter === '24h') return list.filter(p => p.open24h);
    if (activeFilter === 'control') return list.filter(p => p.controlledSub);
    if (activeFilter === 'delivery') return list.filter(p => p.deliveryAvail);
    if (activeFilter === 'amazon') return list.filter(p => p.chain === 'AMAZON');
    return list;
  };

  const selectPharm = (p) => {
    setSelectedPharmacy(p);
  };

  return (
    <div className="aws-root">
      <div className="demo-wrap">
        <div className="demo-header">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <div className="demo-title">🏥 Notrya — AWS Pharmacy Selection Module</div>
            <span className="badge badge-orange">AWS Integration</span>
            <span className="badge badge-blue" style={{marginLeft:'auto'}}>NCPDP / SureScripts</span>
          </div>
          <div className="demo-sub">
            Live pharmacy search powered by <strong style={{color:'var(--orange)'}}>Amazon Web Services</strong>.<br/>
            Configure your API Gateway endpoint, auth credentials, and Amazon Location place index below — then search by name, zip, or NCPDP ID.<br/>
            Works in <strong style={{color:'var(--teal)'}}>DEMO mode</strong> without credentials using a local dataset.
          </div>
          <div className="aws-legend" style={{marginTop:8}}>
            <div className="aw-chip"><div className="aw-dot" style={{background:'var(--orange)'}}/>API Gateway + Lambda</div>
            <div className="aw-chip"><div className="aw-dot" style={{background:'var(--blue)'}}/>Amazon Location Service</div>
            <div className="aw-chip"><div className="aw-dot" style={{background:'var(--teal)'}}/>Cognito Auth</div>
            <div className="aw-chip"><div className="aw-dot" style={{background:'var(--purple)'}}/>DynamoDB / NCPDP</div>
          </div>
        </div>

        <div className="search-section">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div>
              <div style={{fontFamily:'Playfair Display',fontSize:16,fontWeight:600,color:'var(--txt)'}}>Pharmacy Search</div>
              <div style={{fontSize:11,color:'var(--txt3)',marginTop:2}}>Search by pharmacy name, zip code, city, or NCPDP ID</div>
            </div>
            <div style={{display:'flex',gap:6,marginLeft:'auto'}}>
              <button className="btn-ghost" style={{fontSize:11}} onClick={() => setResults(DEMO_PHARMACIES.slice().sort((a,b) => (parseFloat(a.distance)||99) - (parseFloat(b.distance)||99)))}>📍 Near Patient</button>
              <button className="btn-ghost" style={{fontSize:11}} onClick={() => {setActiveFilter('amazon'); handleSearch();}}>📦 Amazon Pharmacy</button>
            </div>
          </div>

          <div className="search-wrap" style={{marginBottom:8}}>
            <span className="search-icon">🔍</span>
            <input type="text" className="search-inp" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search pharmacy name, zip code, city, or NCPDP ID…" />
            <button className="btn-primary" onClick={handleSearch}>Search</button>
          </div>

          <div className="search-filters">
            {[['all','All Pharmacies'],['epcs','⚡ EPCS Capable'],['24h','🕐 24 Hours'],['control','🔒 Controlled Substances'],['delivery','🚚 Delivery'],['amazon','📦 Amazon Pharmacy']].map(([f,lbl]) => (
              <div key={f} className={`filter-chip${activeFilter === f ? ' on' : ''}`} onClick={() => {setActiveFilter(f); handleSearch();}}>{lbl}</div>
            ))}
          </div>
        </div>

        <div className="results-area">
          <div className="results-header">
            <div className="results-title">Results</div>
            <span className="results-meta">{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <span className="badge badge-teal" style={{marginLeft:'auto',fontSize:9}}>🔵 DEMO</span>
          </div>
          <div className="results-grid">
            {loading && [1,2,3,4].map(i => <div key={i} className="skel"/>)}
            {!loading && results.map(p => {
              const chainClass = CHAIN_BADGES[p.chain] || 'chain-other';
              const chainLabel = CHAIN_LABELS[p.chain] || p.chain;
              const isAmazon = p.chain === 'AMAZON';
              const isSelected = selectedPharmacy?.ncpdpId === p.ncpdpId;
              return (
                <div key={p.ncpdpId} className={`pharm-card${isAmazon ? ' amazon' : ''}${isSelected ? ' selected' : ''}`} onClick={() => selectPharm(p)}>
                  <div className={`pharm-chain-badge ${chainClass}`}>{chainLabel}</div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <div className="pharm-select-dot"/>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="pharm-name">{p.name}</div>
                      <div className="pharm-addr">{p.address}{p.city ? ', ' + p.city : ''}{p.state ? ' ' + p.state : ''}</div>
                      {p.distance && <div className="pharm-distance">{p.distance}</div>}
                      <div className={`pharm-hours ${p.open24h || (p.hours||'').toLowerCase().includes('open') ? 'hours-open' : 'hours-closed'}`}>{p.hours || '—'}</div>
                      <div className="ncpdp-badge">NCPDP {p.ncpdpId} · NPI {p.npi}</div>
                    </div>
                  </div>
                  <div className="pharm-capabilities">
                    {p.epcsCapable && <span className="cap-pill cap-epcs">⚡ EPCS</span>}
                    {p.controlledSub && <span className="cap-pill cap-control">🔒 CII–CV</span>}
                    {p.open24h && <span className="cap-pill cap-24h">🕐 24hr</span>}
                    {p.driveThru && <span className="cap-pill cap-driveup">🚗 Drive-up</span>}
                    {p.deliveryAvail && <span className="cap-pill cap-delivery">🚚 Delivery</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedPharmacy && (
          <div className="selected-detail">
            <div className="sel-detail-title">✓ Selected Pharmacy</div>
            <div className="sel-detail-grid">
              <div className="sel-detail-field"><div className="sel-detail-label">Pharmacy Name</div><div className="sel-detail-val">{selectedPharmacy.name}</div></div>
              <div className="sel-detail-field"><div className="sel-detail-label">NCPDP ID</div><div className="sel-detail-val">{selectedPharmacy.ncpdpId}</div></div>
              <div className="sel-detail-field"><div className="sel-detail-label">NPI</div><div className="sel-detail-val">{selectedPharmacy.npi}</div></div>
              <div className="sel-detail-field"><div className="sel-detail-label">Address</div><div className="sel-detail-val" style={{fontSize:11}}>{selectedPharmacy.address}, {selectedPharmacy.city}, {selectedPharmacy.state} {selectedPharmacy.zip}</div></div>
              <div className="sel-detail-field"><div className="sel-detail-label">Phone / Fax</div><div className="sel-detail-val" style={{fontSize:11}}>📞 {selectedPharmacy.phone} 📠 {selectedPharmacy.fax}</div></div>
              <div className="sel-detail-field"><div className="sel-detail-label">Hours</div><div className="sel-detail-val" style={{fontSize:11}}>{selectedPharmacy.hours}</div></div>
            </div>
            <div style={{height:1,background:'var(--border)',margin:'14px 0'}}/>
            <div style={{fontSize:11,color:'var(--txt3)',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Transmit Prescription Via</div>
            <div className="transmit-row">
              {selectedPharmacy.transmitMethods?.includes('epcs') && <div className="tx-btn tx-epcs">⚡ e-Prescribe (EPCS)</div>}
              {selectedPharmacy.chain === 'AMAZON' && <div className="tx-btn tx-amazon">📦 Send to Amazon Pharmacy</div>}
              {selectedPharmacy.transmitMethods?.includes('fax') && <div className="tx-btn tx-fax">📠 Fax</div>}
              {selectedPharmacy.transmitMethods?.includes('print') && <div className="tx-btn tx-print">🖨 Print</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}