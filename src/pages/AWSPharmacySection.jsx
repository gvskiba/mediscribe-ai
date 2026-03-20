import React, { useState, useEffect, useRef } from 'react';

const AWSPharmacySection = () => {
  const [config, setConfig] = useState({
    apiBase: '',
    apiKey: '',
    region: 'us-east-1',
    locationPlaceIndex: '',
    cognitoPoolId: '',
    authMode: 'apikey',
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionOk, setConnectionOk] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [patient, setPatient] = useState(null);
  const [connStatus, setConnStatus] = useState('disconnected');

  const DEMO_PHARMACIES = [
    { ncpdpId:'1847302', npi:'1234567890', name:'CVS Pharmacy #3847', chain:'CVS', address:'1420 Oak Ave', city:'Springfield', state:'IL', zip:'62701', phone:'(217) 555-0142', fax:'(217) 555-0143', hours:'Open 24 hours', distance:'0.4 mi', open24h:true, epcsCapable:true, controlledSub:true, deliveryAvail:false, driveThru:true, transmitMethods:['epcs','fax'], lat:39.781, lng:-89.650 },
    { ncpdpId:'2091847', npi:'1987654321', name:'Walgreens #0291', chain:'WAG', address:'832 Main St', city:'Springfield', state:'IL', zip:'62701', phone:'(217) 555-0291', fax:'(217) 555-0292', hours:'Open until 10pm', distance:'0.9 mi', open24h:false, epcsCapable:true, controlledSub:true, deliveryAvail:false, driveThru:true, transmitMethods:['epcs','fax'], lat:39.799, lng:-89.644 },
    { ncpdpId:'3002918', npi:'1555443322', name:'Regional Medical Center Pharmacy', chain:'HOSP', address:'501 N First St', city:'Springfield', state:'IL', zip:'62702', phone:'(217) 555-5000', fax:'(217) 555-5001', hours:'Open 24 hours', distance:'1.1 mi', open24h:true, epcsCapable:true, controlledSub:true, deliveryAvail:false, driveThru:false, transmitMethods:['epcs','fax','print'], lat:39.803, lng:-89.647 },
    { ncpdpId:'4118293', npi:'1667788990', name:'Walmart Pharmacy #4421', chain:'WAL', address:'2200 Commerce Blvd', city:'Springfield', state:'IL', zip:'62703', phone:'(217) 555-4421', fax:'(217) 555-4422', hours:'Open until 9pm', distance:'1.8 mi', open24h:false, epcsCapable:true, controlledSub:false, deliveryAvail:false, driveThru:true, transmitMethods:['epcs','fax'], lat:39.762, lng:-89.668 },
    { ncpdpId:'5829103', npi:'1776655443', name:'Amazon Pharmacy', chain:'AMAZON', address:'Delivered to patient address', city:'', state:'', zip:'', phone:'1-855-745-5725', fax:'N/A', hours:'24/7 delivery', distance:'Delivery', open24h:true, epcsCapable:true, controlledSub:false, deliveryAvail:true, driveThru:false, transmitMethods:['epcs'], lat:null, lng:null },
    { ncpdpId:'6038291', npi:'1884455662', name:'Rite Aid #4917', chain:'RITEAID', address:'3100 Wabash Ave', city:'Springfield', state:'IL', zip:'62704', phone:'(217) 555-4917', fax:'(217) 555-4918', hours:'Open until 9pm', distance:'2.1 mi', open24h:false, epcsCapable:true, controlledSub:true, deliveryAvail:false, driveThru:true, transmitMethods:['epcs','fax'], lat:39.776, lng:-89.686 },
  ];

  const CHAIN_BADGES = {
    AMAZON:'chain-amazon', CVS:'chain-cvs', WAG:'chain-walgreens',
    WAL:'chain-walmart', HOSP:'chain-hosp', RITEAID:'chain-riteaid',
  };
  const CHAIN_LABELS = { AMAZON:'AMAZON RX', WAG:'WALGREENS', WAL:'WALMART', HOSP:'HOSPITAL', RITEAID:'RITE AID' };

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    renderDemo();
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleMessage = (ev) => {
    if (!ev.data || typeof ev.data !== 'object') return;
    if (ev.data.type === 'NOTRYA_AWS_CONFIG') {
      setConfig(prev => ({ ...prev, ...ev.data.payload }));
      setConnStatus('connected');
    }
    if (ev.data.type === 'NOTRYA_PATIENT') {
      setPatient(ev.data.payload);
    }
  };

  const searchDemo = (query) => {
    const q = (query || '').toLowerCase();
    return DEMO_PHARMACIES.filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.chain.toLowerCase().includes(q) ||
      p.zip.includes(q) || p.city.toLowerCase().includes(q) ||
      p.ncpdpId.includes(q) || p.address.toLowerCase().includes(q)
    );
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

  const doSearch = (query) => {
    setLoading(true);
    setTimeout(() => {
      const results = applyFilter(searchDemo(query));
      setResults(results);
      setLoading(false);
    }, 200);
  };

  const renderDemo = () => {
    setResults(applyFilter(DEMO_PHARMACIES));
  };

  const selectPharmacy = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'NOTRYA_PHARMACY_SELECTED',
        payload: {
          ncpdpId: pharmacy.ncpdpId,
          npi: pharmacy.npi,
          name: pharmacy.name,
          address: `${pharmacy.address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zip}`,
          phone: pharmacy.phone,
          fax: pharmacy.fax,
          epcsCapable: pharmacy.epcsCapable,
          transmitMethods: pharmacy.transmitMethods,
        }
      }, '*');
    }
  };

  const handleTransmit = (method) => {
    if (!selectedPharmacy) {
      alert('No pharmacy selected.');
      return;
    }
    if (!connectionOk) {
      alert(`[DEMO MODE] Would transmit via ${method.toUpperCase()} to ${selectedPharmacy.name}.\n\nConfigure AWS endpoint to transmit live prescriptions.`);
      return;
    }
    alert(`✅ Prescription transmitted via ${method.toUpperCase()}.\nTracking ID: ${Math.random().toString(36).substr(2, 9)}`);
  };

  return (
    <div style={{ backgroundColor: '#050f1e', color: '#e8f0fe', minHeight: '100vh', padding: '20px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        .pharm-card { background: #0b1e36; border: 1.5px solid #1a3555; border-radius: 8px; padding: 12px 14px; cursor: pointer; transition: all 0.18s; position: relative; }
        .pharm-card:hover { border-color: #2a4f7a; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
        .pharm-card.selected { border-color: #00e5c0; background: rgba(0,229,192,0.06); }
        .pharm-name { font-size: 13px; font-weight: 700; color: #e8f0fe; margin-bottom: 2px; }
        .pharm-addr { font-size: 11px; color: #4a6a8a; line-height: 1.4; }
        .pharm-hours { font-size: 10px; margin-top: 3px; }
        .hours-open { color: #00e5c0; }
        .hours-closed { color: #ff6b6b; }
        .cap-pill { font-size: 9px; padding: 1px 6px; border-radius: 3px; font-weight: 600; display: inline-block; margin-right: 4px; margin-top: 6px; }
        .cap-epcs { background: rgba(0,229,192,0.12); color: #00e5c0; }
        .cap-control { background: rgba(155,109,255,0.12); color: #9b6dff; }
        .cap-24h { background: rgba(59,158,255,0.12); color: #3b9eff; }
        .cap-delivery { background: rgba(255,159,67,0.1); color: #ff9f43; }
        .config-inp { background: #0e2544; border: 1px solid #1a3555; border-radius: 8px; padding: 7px 10px; color: #e8f0fe; font-family: 'JetBrains Mono', monospace; font-size: 11px; outline: none; width: 100%; }
        .config-inp:focus { border-color: #3b9eff; }
        .btn-primary { background: #00e5c0; color: #050f1e; border: none; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .btn-primary:hover { filter: brightness(1.12); }
        .filter-chip { padding: 4px 12px; border-radius: 20px; font-size: 11px; cursor: pointer; border: 1px solid #1a3555; background: #0e2544; color: #8aaccc; transition: all 0.15s; }
        .filter-chip.on { background: rgba(59,158,255,0.15); border-color: #3b9eff; color: #3b9eff; }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', fontFamily: "'Playfair Display', serif" }}>
          🏥 AWS Pharmacy Selection Module
        </h1>
        <p style={{ fontSize: '12px', color: '#8aaccc', marginBottom: '20px' }}>
          Search and select pharmacies powered by Amazon Web Services. Works in demo mode with local data.
        </p>

        {/* Search Bar */}
        <div style={{ background: '#081628', border: '1px solid #1a3555', borderRadius: '12px', padding: '16px 18px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch(searchQuery)}
              placeholder="Search pharmacy name, zip code, city, or NCPDP ID…"
              style={{ flex: 1, background: '#0b1e36', border: '2px solid #2a4f7a', borderRadius: '12px', padding: '11px 16px', color: '#e8f0fe', fontSize: '14px', outline: 'none' }}
            />
            <button onClick={() => doSearch(searchQuery)} className="btn-primary">Search</button>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'epcs', '24h', 'control', 'delivery', 'amazon'].map(f => (
              <div
                key={f}
                className={`filter-chip ${activeFilter === f ? 'on' : ''}`}
                onClick={() => { setActiveFilter(f); renderDemo(); }}
                style={{ cursor: 'pointer' }}
              >
                {f === 'all' && 'All Pharmacies'}
                {f === 'epcs' && '⚡ EPCS Capable'}
                {f === '24h' && '🕐 24 Hours'}
                {f === 'control' && '🔒 Controlled Substances'}
                {f === 'delivery' && '🚚 Delivery'}
                {f === 'amazon' && '📦 Amazon Pharmacy'}
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ background: '#081628', border: '1px solid #1a3555', borderRadius: '12px', padding: '16px 18px', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', fontFamily: "'Playfair Display', serif" }}>
            Results <span style={{ fontSize: '11px', color: '#4a6a8a' }}>({results.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', color: '#4a6a8a', textAlign: 'center', padding: '20px' }}>Searching…</div>
            ) : results.length === 0 ? (
              <div style={{ gridColumn: '1/-1', color: '#4a6a8a', textAlign: 'center', padding: '20px' }}>No pharmacies found.</div>
            ) : (
              results.map(p => (
                <div
                  key={p.ncpdpId}
                  className={`pharm-card ${selectedPharmacy?.ncpdpId === p.ncpdpId ? 'selected' : ''}`}
                  onClick={() => selectPharmacy(p)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #1a3555', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="pharm-name">{p.name}</div>
                      <div className="pharm-addr">{p.address}{p.city ? ', ' + p.city : ''}{p.state ? ' ' + p.state : ''}</div>
                      {p.distance && <div style={{ fontSize: '10px', color: '#3b9eff', fontWeight: 600 }}>{p.distance}</div>}
                      <div className={`pharm-hours ${p.open24h || p.hours?.includes('Open') ? 'hours-open' : 'hours-closed'}`}>{p.hours || '—'}</div>
                      <div style={{ fontSize: '9px', color: '#4a6a8a', marginTop: '4px' }}>NCPDP {p.ncpdpId} · NPI {p.npi}</div>
                    </div>
                  </div>
                  <div>
                    {p.epcsCapable && <span className="cap-pill cap-epcs">⚡ EPCS</span>}
                    {p.controlledSub && <span className="cap-pill cap-control">🔒 CII–CV</span>}
                    {p.open24h && <span className="cap-pill cap-24h">🕐 24hr</span>}
                    {p.deliveryAvail && <span className="cap-pill cap-delivery">🚚 Delivery</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Detail */}
        {selectedPharmacy && (
          <div style={{ background: 'rgba(0,229,192,0.05)', border: '1px solid rgba(0,229,192,0.22)', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '10px', color: '#00e5c0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '12px' }}>
              ✓ Selected Pharmacy
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase' }}>Pharmacy Name</div>
                <div style={{ fontSize: '12px', color: '#e8f0fe', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{selectedPharmacy.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase' }}>NCPDP ID</div>
                <div style={{ fontSize: '12px', color: '#e8f0fe', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{selectedPharmacy.ncpdpId}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase' }}>NPI</div>
                <div style={{ fontSize: '12px', color: '#e8f0fe', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{selectedPharmacy.npi}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {selectedPharmacy.transmitMethods?.includes('epcs') && (
                <button
                  onClick={() => handleTransmit('epcs')}
                  style={{ background: 'rgba(0,229,192,0.12)', border: '1px solid rgba(0,229,192,0.35)', color: '#00e5c0', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  ⚡ e-Prescribe (EPCS)
                </button>
              )}
              {selectedPharmacy.transmitMethods?.includes('fax') && (
                <button
                  onClick={() => handleTransmit('fax')}
                  style={{ background: '#0e2544', border: '1px solid #1a3555', color: '#8aaccc', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  📠 Fax
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AWSPharmacySection;