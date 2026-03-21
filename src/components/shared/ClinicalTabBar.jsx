import { useNavigate } from 'react-router-dom';

const TABS = [
  {id:'chart',icon:'📊',label:'Patient Chart', path:'/NewPatientInput', tab:'chart'},
  {id:'demo',icon:'👤',label:'Demographics', path:'/NewPatientInput', tab:'demo'},
  {id:'cc',icon:'🗣️',label:'CC', path:'/NewPatientInput', tab:'cc'},
  {id:'vit',icon:'📊',label:'Vitals', path:'/NewPatientInput', tab:'vit'},
  {id:'meds',icon:'💊',label:'Meds & PMH', path:'/NewPatientInput', tab:'meds'},
  {id:'ros',icon:'🔍',label:'ROS', path:'/NewPatientInput', tab:'ros'},
  {id:'pe',icon:'🩺',label:'Exam', path:'/NewPatientInput', tab:'pe'},
  {id:'mdm',icon:'⚖️',label:'MDM', path:'/NewPatientInput', tab:'mdm'},
  {id:'discharge',icon:'🏥',label:'Discharge', path:'/NewPatientInput', tab:'discharge'},
];

const CSS = `
.ctb-wrap{position:sticky;bottom:0;background:rgba(4,13,26,.96);backdrop-filter:blur(12px);border-top:1px solid #1a3555;flex-shrink:0;z-index:50;padding:7px 16px 8px;display:flex;align-items:center;justify-content:center;gap:6px;}
.ctb-tabs{display:flex;align-items:center;gap:2px;background:#060f1e;border:1px solid #1a3555;border-radius:12px;padding:3px;overflow-x:auto;max-width:100%;}
.ctb-tabs::-webkit-scrollbar{display:none}
.ctb-tab{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:9px;border:none;background:transparent;color:#4a6a8a;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .18s;white-space:nowrap;flex-shrink:0;font-weight:500;}
.ctb-tab:hover{background:#0e2544;color:#8aaccc;}
.ctb-tab.ctb-active{background:linear-gradient(135deg,#0a2040,#0d2a52);color:#3b9eff;font-weight:600;box-shadow:0 1px 6px rgba(59,158,255,.2);}
.ctb-tab-icon{font-size:13px;line-height:1;}
.ctb-div{width:1px;height:22px;background:#1a3555;margin:0 3px;flex-shrink:0;}
.ctb-tab-er{color:#00e5c0!important;}
.ctb-tab-er:hover{background:rgba(0,229,192,.08)!important;color:#00e5c0!important;}
.ctb-tab-er.ctb-active{background:rgba(0,229,192,.1)!important;border:1px solid rgba(0,229,192,.3)!important;color:#00e5c0!important;}
.ctb-tab-rx{color:#3b9eff!important;}
.ctb-tab-rx:hover{background:rgba(59,158,255,.08)!important;}
.ctb-tab-rx.ctb-active{background:rgba(59,158,255,.12)!important;border:1px solid rgba(59,158,255,.3)!important;color:#3b9eff!important;}
.ctb-tab-proc{color:#9b6dff!important;}
.ctb-tab-proc:hover{background:rgba(155,109,255,.08)!important;color:#9b6dff!important;}
.ctb-tab-proc.ctb-active{background:rgba(155,109,255,.12)!important;border:1px solid rgba(155,109,255,.3)!important;color:#9b6dff!important;}
.ctb-nav{display:flex;align-items:center;gap:5px;margin-left:6px;flex-shrink:0;}
.ctb-back{height:28px;padding:0 12px;background:#0e2544;border:1px solid #1a3555;border-radius:7px;color:#8aaccc;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;}
.ctb-back:hover{border-color:#2a4f7a;color:#e8f0fe;}
.ctb-next{height:28px;padding:0 14px;background:#3b9eff;border:none;border-radius:7px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;}
.ctb-next:hover{filter:brightness(1.15);}
`;

export default function ClinicalTabBar({ currentPage = 'NewPatientInput', currentTab = null, onTabChange = null, showNav = false, onBack = null, onNext = null }) {
  const navigate = useNavigate();

  const handleTabClick = (tab) => {
    if (currentPage === 'NewPatientInput' && onTabChange) {
      onTabChange(tab.tab);
    } else {
      navigate(`/NewPatientInput?tab=${tab.tab}`);
    }
  };

  const isTabActive = (tab) => {
    if (currentPage === 'NewPatientInput') return currentTab === tab.tab;
    return false;
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ctb-wrap">
        <div className="ctb-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`ctb-tab${isTabActive(t) ? ' ctb-active' : ''}`} onClick={() => handleTabClick(t)}>
              <span className="ctb-tab-icon">{t.icon}</span>{t.label}
            </button>
          ))}
          <div className="ctb-div"/>
          <button className={`ctb-tab ctb-tab-er${currentPage === 'ERPlanBuilder' ? ' ctb-active' : ''}`} onClick={() => navigate('/ERPlanBuilder')}>
            <span className="ctb-tab-icon">🩺</span>ER Plan
          </button>
          <button className={`ctb-tab ctb-tab-rx${currentPage === 'AutoCoder' ? ' ctb-active' : ''}`} onClick={() => navigate('/AutoCoder')}>
            <span className="ctb-tab-icon">💻</span>AutoCoder
          </button>
          <button className={`ctb-tab ctb-tab-rx${currentPage === 'ERx' ? ' ctb-active' : ''}`} onClick={() => navigate('/ERx')}>
            <span className="ctb-tab-icon">💊</span>eRx
          </button>
          <button className={`ctb-tab ctb-tab-proc${currentPage === 'EDProcedureNotes' ? ' ctb-active' : ''}`} onClick={() => navigate('/EDProcedureNotes')}>
            <span className="ctb-tab-icon">🩹</span>Procedures
          </button>
        </div>
        {showNav && (
          <div className="ctb-nav">
            <button className="ctb-back" onClick={onBack}>← Back</button>
            <button className="ctb-next" onClick={onNext}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}