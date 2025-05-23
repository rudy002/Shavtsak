import { useState } from 'react'
import './App.css'

// Exemple de liste initiale de soldats avec leur dernière garde (lastDuty au format 'YYYY-MM-DD')
const initialSoldiers = [
  { name: "רז", lastDuty: "2024-06-10" },
  { name: "נתן (מפקד)", lastDuty: "2024-06-11" },
  { name: "קרטמן (מפקד)", lastDuty: "2024-06-09" },
  { name: "אליהו", lastDuty: "2024-06-08" },
  { name: "משה אסרף", lastDuty: "2024-06-07" },
  { name: "בניטה", lastDuty: "2024-06-06" },
  { name: "שי תור", lastDuty: "2024-06-05" },
  { name: "צבי", lastDuty: "2024-06-04" },
  { name: "נתאנל", lastDuty: "2024-06-03" },
  { name: "מחפוד", lastDuty: "2024-06-02" },
  { name: "אלמקייס", lastDuty: "2024-06-01" },
  { name: "שיקמן", lastDuty: "2024-05-31" },
  { name: "סויסה", lastDuty: "2024-05-30" },
  { name: "סנדמן", lastDuty: "2024-05-29" },
  { name: "ביטון", lastDuty: "2024-05-28" },
  { name: "שלומי חתן", lastDuty: "2024-05-28" },
  { name: "רמתי", lastDuty: "2024-05-28" },
  { name: " חגי קץ (מפקד)", lastDuty: "2024-05-28" },
  { name: "רודי חדד", lastDuty: "2024-05-28" },
];

// Créneaux de jour pour le ש״ג (gardes de 2h entre 6h et 21h)
const dayShifts = [
  { start: "06:00", end: "08:00" },
  { start: "08:00", end: "10:00" },
  { start: "10:00", end: "12:00" },
  { start: "12:00", end: "14:00" },
  { start: "14:00", end: "16:00" },
  { start: "16:00", end: "18:00" },
  { start: "18:00", end: "19:30" },
  { start: "19:30", end: "21:00" },
];

// Créneaux de nuit pour le ש״ג (binômes de 1h30 entre 21h et 6h)
const nightShifts = [
  { start: "21:00", end: "22:30" },
  { start: "22:30", end: "00:00" },
  { start: "00:00", end: "01:30" },
  { start: "01:30", end: "03:00" },
  { start: "03:00", end: "04:30" },
  { start: "04:30", end: "06:00" },
];

// Créneaux pour le 5e étage (gardes de 2h entre 6h et 20h, mais on adapte pour finir à 21h)
const etageShifts = [
  { start: "06:00", end: "08:00" },
  { start: "08:00", end: "10:00" },
  { start: "10:00", end: "12:00" },
  { start: "12:00", end: "14:00" },
  { start: "14:00", end: "16:00" },
  { start: "16:00", end: "18:00" },
  { start: "18:00", end: "19:30" },
  { start: "19:30", end: "21:00" },
];

function getDaysSince(dateStr) {
  const today = new Date();
  const date = new Date(dateStr);
  const diff = today - date;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Mélange un tableau (Fisher-Yates)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Fonction pour calculer les heures entre deux créneaux
function getHoursBetween(time1, time2) {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  let hours = h2 - h1;
  if (hours < 0) hours += 24; // Gestion du passage à minuit
  const minutes = m2 - m1;
  return hours + minutes / 60;
}

// Fonction pour calculer le score de repos d'un soldat
function calculateRestScore(soldier, assignedShifts, currentShift) {
  if (assignedShifts.length === 0) return 0;
  
  // Trouve la dernière garde du soldat
  const lastShift = assignedShifts
    .filter(s => s.soldier.name === soldier.name)
    .sort((a, b) => b.shift.start.localeCompare(a.shift.start))[0];
    
  if (!lastShift) return 0;
  
  // Calcule le temps de repos depuis la dernière garde
  const restHours = getHoursBetween(lastShift.shift.end, currentShift.start);
  
  // Bonus si c'était une garde de nuit
  const wasNightShift = parseInt(lastShift.shift.start) >= 21 || parseInt(lastShift.shift.start) < 6;
  
  // Pénalité basée sur le nombre total de gardes du soldat
  const totalShifts = assignedShifts.filter(s => s.soldier.name === soldier.name).length;
  const shiftPenalty = totalShifts * 2; // Plus un soldat a de gardes, plus son score est réduit
  
  return (restHours * (wasNightShift ? 1.5 : 1)) - shiftPenalty;
}

// Fonction utilitaire pour vérifier si deux créneaux sont consécutifs ou se chevauchent strictement
function slotsOverlapOrConsecutive(shift1, shift2) {
  // Interdit chevauchement OU consécutif (fin >= début)
  return !(shift1.end >= shift2.start || shift1.start >= shift2.end);
}

function getNextShiftStart(soldierName, assignedShifts, currentShift) {
  // Cherche la prochaine garde déjà attribuée à ce soldat après le créneau courant
  const futureShifts = assignedShifts.filter(s => s.soldier && s.soldier.name === soldierName && s.shift.start > currentShift.end);
  if (futureShifts.length === 0) return null;
  return futureShifts.sort((a, b) => a.shift.start.localeCompare(b.shift.start))[0].shift.start;
}

function getAllShifts() {
  // Fusionne tous les créneaux (jour, nuit, étage) avec leur type
  return [
    ...dayShifts.map(s => ({...s, type: 'day'})),
    ...etageShifts.map(s => ({...s, type: 'etage'})),
    ...nightShifts.map(s => ({...s, type: 'night'})),
  ];
}

function getSoldierIntervals(planning, soldiers) {
  // Pour chaque soldat, calcule l'intervalle minimal entre ses gardes (en heures)
  let intervals = {};
  soldiers.forEach(s => {
    let slots = [];
    if (planning.daySG) slots = slots.concat(planning.daySG.filter(d => d.soldier && d.soldier.name === s.name).map(d => d.shift));
    if (planning.etage) slots = slots.concat(planning.etage.filter(e => e.soldier && e.soldier.name === s.name).map(e => e.shift));
    if (planning.nightSG) slots = slots.concat(planning.nightSG.filter(n => n.soldiers && n.soldiers.some(sol => sol && sol.name === s.name)).map(n => n.shift));
    slots.sort((a, b) => a.start.localeCompare(b.start));
    let min = Infinity;
    for (let i = 1; i < slots.length; i++) {
      const diff = getHoursBetween(slots[i-1].end, slots[i].start);
      if (diff < min) min = diff;
    }
    intervals[s.name] = min === Infinity ? 999 : min;
  });
  return intervals;
}

function generatePlanningQueue(soldiers, yesterdayShifts = []) {
  // 1. Construire la queue initiale selon la dernière garde (veille incluse)
  let lastDutyMap = {};
  soldiers.forEach(s => { lastDutyMap[s.name] = s.lastDuty; });
  yesterdayShifts.forEach(s => {
    if (s.soldiers) {
      s.soldiers.forEach(sol => {
        lastDutyMap[sol.name] = 'yesterday';
      });
    } else if (s.soldier) {
      lastDutyMap[s.soldier.name] = 'yesterday';
    }
  });
  // Trie la queue : ceux qui ont gardé il y a le plus longtemps en premier
  let queue = [...soldiers].sort((a, b) => {
    const aDuty = lastDutyMap[a.name] || '';
    const bDuty = lastDutyMap[b.name] || '';
    return aDuty.localeCompare(bDuty);
  });

  // 2. Pour chaque créneau horaire, pop deux soldats différents (un pour chaque poste), puis les remettre à la fin
  let daySG = [], etage = [], nightSG = [];
  let fifo = [...queue];

  // Pour chaque créneau horaire de jour (même index pour ש"ג et קומה 5)
  for (let i = 0; i < dayShifts.length; i++) {
    // ש"ג
    const sgSoldier = fifo.shift();
    // קומה 5
    let etageSoldier = fifo.find(s => s.name !== sgSoldier.name);
    if (!etageSoldier) etageSoldier = sgSoldier;
    else fifo.splice(fifo.findIndex(s => s.name === etageSoldier.name), 1);
    daySG.push({ shift: dayShifts[i], soldier: sgSoldier });
    etage.push({ shift: etageShifts[i], soldier: etageSoldier });
    fifo.push(sgSoldier);
    fifo.push(etageSoldier);
  }

  // ש"ג de nuit (binômes)
  for (let i = 0; i < nightShifts.length; i++) {
    const s1 = fifo.shift();
    let s2 = fifo.find(s => s.name !== s1.name);
    if (!s2) s2 = s1;
    else fifo.splice(fifo.findIndex(s => s.name === s2.name), 1);
    nightSG.push({ shift: nightShifts[i], soldiers: [s1, s2] });
    fifo.push(s1);
    fifo.push(s2);
  }

  // Soldats présents sur la base (hors gardes) : au moins 10
  let assignedNames = [
    ...daySG.map(d => d.soldier.name),
    ...etage.map(e => e.soldier.name),
    ...nightSG.flatMap((b) => b.soldiers.map((s) => s.name)),
  ];
  let present = soldiers
    .filter((s) => !assignedNames.includes(s.name))
    .map((s) => s.name);
  if (present.length < 10) {
    const toAdd = assignedNames.filter((name) => !present.includes(name));
    present = present.concat(toAdd.slice(0, 10 - present.length));
  } else {
    present = present.slice(0, 10);
  }
  // Nouveau : dictionnaire soldat -> dernier créneau
  let lastDutySlot = {};
  daySG.forEach(d => { lastDutySlot[d.soldier.name] = d.shift.start + '-' + d.shift.end; });
  etage.forEach(e => { lastDutySlot[e.soldier.name] = e.shift.start + '-' + e.shift.end; });
  nightSG.forEach(b => {
    b.soldiers.forEach(s => { lastDutySlot[s.name] = b.shift.start + '-' + b.shift.end; });
  });
  return {
    daySG,
    etage,
    nightSG,
    present,
    lastDutySlot,
  };
}

function App() {
  const [soldiers, setSoldiers] = useState(initialSoldiers);
  const [planning, setPlanning] = useState(null);
  const [presentToday, setPresentToday] = useState(initialSoldiers.map(s => s.name));
  // Nouvel état pour les gardes de la veille
  const [yesterdayShifts, setYesterdayShifts] = useState([]);
  // Nouvel état pour indiquer si on est en mode édition de la veille
  const [isEditingYesterday, setIsEditingYesterday] = useState(false);

  const handleTogglePresent = (name) => {
    setPresentToday((prev) =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  // Nouvelle fonction pour gérer les gardes de la veille
  const handleYesterdayShift = (type, shift, soldiers) => {
    setYesterdayShifts(prev => {
      const newShifts = [...prev];
      const existingIndex = newShifts.findIndex(s => 
        s.type === type && 
        s.shift.start === shift.start && 
        s.shift.end === shift.end
      );

      if (existingIndex !== -1) {
        if (soldiers) {
          newShifts[existingIndex] = { type, shift, soldiers };
        } else {
          newShifts.splice(existingIndex, 1);
        }
      } else if (soldiers) {
        newShifts.push({ type, shift, soldiers });
      }

      return newShifts;
    });
  };

  const handleGenerate = () => {
    // On ne garde que les soldats présents aujourd'hui
    const filteredSoldiers = soldiers.filter(s => presentToday.includes(s.name));
    const plan = generatePlanningQueue(filteredSoldiers, yesterdayShifts);
    setPlanning(plan);
    // Met à jour le créneau de dernière garde pour les assignés
    setSoldiers((prev) =>
      prev.map((s) =>
        plan.lastDutySlot && plan.lastDutySlot[s.name]
          ? { ...s, lastDuty: plan.lastDutySlot[s.name] }
          : s
      )
    );
  };

  // Fusionner tous les créneaux horaires (jour, nuit, étage)
  // On prend tous les horaires de jour et de nuit, on les trie par heure de début
  const allShifts = [
    ...dayShifts.map(s => ({...s, type: 'day'})),
    ...nightShifts.map(s => ({...s, type: 'night'})),
  ];
  // On ajoute les créneaux étage qui ne sont pas déjà dans dayShifts
  const allEtageShifts = etageShifts.map(s => s.start + '-' + s.end);
  const allShiftsWithEtage = [
    ...allShifts,
    ...etageShifts.filter(s => !allShifts.some(d => d.start === s.start && d.end === s.end)).map(s => ({...s, type: 'etageOnly'})),
  ];
  // Tri par heure de début
  allShiftsWithEtage.sort((a, b) => a.start.localeCompare(b.start));

  // Détection mobile simple
  const isMobile = window.innerWidth < 600;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0', 
      padding: isMobile ? '5px' : '20px',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#1a365d', 
        marginBottom: isMobile ? '10px' : '20px',
        fontSize: isMobile ? '18px' : '24px'
      }}>
        מחולל לוח שמירות (שב"צק)
      </h1>

      <div style={{
        maxWidth: isMobile ? '98vw' : '800px',
        margin: '0 auto 20px auto',
        backgroundColor: 'white',
        padding: isMobile ? '10px' : '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '10px'
          }}>
            <button
              onClick={() => setIsEditingYesterday(!isEditingYesterday)}
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                backgroundColor: isEditingYesterday ? '#dc2626' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: isMobile ? '15px' : '16px'
              }}
            >
              {isEditingYesterday ? 'הסתר עריכת שמירות אתמול' : 'ערוך שמירות אתמול'}
            </button>
            {yesterdayShifts.length > 0 && (
              <span style={{ 
                color: '#059669',
                fontSize: isMobile ? '13px' : '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                ✓ {yesterdayShifts.length} שמירות אתמול נרשמו
              </span>
            )}
          </div>

          {isEditingYesterday && (
            <div style={{
              maxWidth: isMobile ? '98vw' : '800px',
              margin: '0 auto 20px auto',
              backgroundColor: 'white',
              padding: isMobile ? '10px' : '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f0fdf4',
                borderRadius: '5px',
                border: '1px solid #86efac'
              }}>
                <p style={{ margin: 0, fontSize: isMobile ? '13px' : '14px', color: '#166534' }}>
                  השינויים נשמרים אוטומטית ומשפיעים על יצירת לוח השמירות
                </p>
              </div>

              <h3 style={{ 
                fontSize: isMobile ? '16px' : '20px', 
                marginBottom: '15px',
                color: '#1a365d'
              }}>
                שמירות אתמול
              </h3>

              <div style={{overflowX: 'auto'}}>
                <table style={{ width: '100%', minWidth: isMobile ? 350 : 0, marginBottom: '20px', borderCollapse: 'collapse', fontSize: isMobile ? '13px' : '16px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'right', padding: '10px', color: '#222' }}>שעה</th>
                      <th style={{ textAlign: 'right', padding: '10px', color: '#222' }}>ש"ג</th>
                      <th style={{ textAlign: 'right', padding: '10px', color: '#222' }}>קומה 5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allShiftsWithEtage.map((shift, i) => {
                      const dayShift = yesterdayShifts.find(s => 
                        s.type === 'day' && 
                        s.shift.start === shift.start && 
                        s.shift.end === shift.end
                      );
                      const etageShift = yesterdayShifts.find(s => 
                        s.type === 'etage' && 
                        s.shift.start === shift.start && 
                        s.shift.end === shift.end
                      );
                      const nightShift = yesterdayShifts.find(s => 
                        s.type === 'night' && 
                        s.shift.start === shift.start && 
                        s.shift.end === shift.end
                      );

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px', color: '#222', textAlign: 'right' }}>{shift.start} - {shift.end}</td>
                          <td style={{ padding: '10px', color: '#222', textAlign: 'right' }}>
                            {shift.type === 'day' && (
                              <select
                                value={dayShift?.soldiers?.[0]?.name || ''}
                                onChange={(e) => handleYesterdayShift(
                                  'day',
                                  shift,
                                  e.target.value ? [{ name: e.target.value }] : null
                                )}
                                style={{ width: '150px', padding: '5px' }}
                              >
                                <option value="">ללא</option>
                                {soldiers.map((s, j) => (
                                  <option key={j} value={s.name}>{s.name}</option>
                                ))}
                              </select>
                            )}
                            {shift.type === 'night' && (
                              <div>
                                <select
                                  value={nightShift?.soldiers?.[0]?.name || ''}
                                  onChange={(e) => {
                                    const currentShift = nightShift;
                                    handleYesterdayShift(
                                      'night',
                                      shift,
                                      e.target.value ? [
                                        { name: e.target.value },
                                        currentShift?.soldiers?.[1] || { name: '' }
                                      ] : null
                                    );
                                  }}
                                  style={{ width: '150px', padding: '5px', marginBottom: '5px' }}
                                >
                                  <option value="">ללא</option>
                                  {soldiers.map((s, j) => (
                                    <option key={j} value={s.name}>{s.name}</option>
                                  ))}
                                </select>
                                <select
                                  value={nightShift?.soldiers?.[1]?.name || ''}
                                  onChange={(e) => {
                                    const currentShift = nightShift;
                                    handleYesterdayShift(
                                      'night',
                                      shift,
                                      currentShift?.soldiers?.[0] ? [
                                        currentShift.soldiers[0],
                                        e.target.value ? { name: e.target.value } : { name: '' }
                                      ] : null
                                    );
                                  }}
                                  style={{ width: '150px', padding: '5px' }}
                                >
                                  <option value="">ללא</option>
                                  {soldiers.map((s, j) => (
                                    <option key={j} value={s.name}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px', color: '#222', textAlign: 'right' }}>
                            {parseInt(shift.start) >= 6 && parseInt(shift.start) < 21 && (
                              <select
                                value={etageShift?.soldiers?.[0]?.name || ''}
                                onChange={(e) => handleYesterdayShift(
                                  'etage',
                                  shift,
                                  e.target.value ? [{ name: e.target.value }] : null
                                )}
                                style={{ width: '150px', padding: '5px' }}
                              >
                                <option value="">ללא</option>
                                {soldiers.map((s, j) => (
                                  <option key={j} value={s.name}>{s.name}</option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <h2 style={{ fontSize: isMobile ? '15px' : '18px', marginBottom: '10px', color: '#1a365d' }}>
          בחר את החיילים הנוכחים היום
        </h2>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-start',
          marginBottom: '10px'
        }}>
          {soldiers.map((s, i) => (
            <label key={i} style={{ marginRight: '15px', cursor: 'pointer', fontSize: isMobile ? '13px' : '16px' }}>
              <input
                type="checkbox"
                checked={presentToday.includes(s.name)}
                onChange={() => handleTogglePresent(s.name)}
                style={{ marginRight: '5px' }}
              />
              {s.name}
            </label>
          ))}
        </div>
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? '10px' : '20px' 
      }}>
        <button
          onClick={handleGenerate}
          style={{
            padding: isMobile ? '8px 12px' : '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: isMobile ? '15px' : '16px'
          }}
        >
          צור לוח שמירות להיום
        </button>
      </div>

      {!planning && (
        <div style={{textAlign: 'center', color: '#888', marginBottom: isMobile ? 15 : 30, fontSize: isMobile ? '14px' : '16px'}}>
          לחץ על הכפתור כדי ליצור את לוח השמירות להיום
        </div>
      )}

      {planning && (
        <div style={{
          maxWidth: isMobile ? '98vw' : '800px',
          margin: '0 auto',
          backgroundColor: 'white',
          padding: isMobile ? '10px' : '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: isMobile ? '16px' : '20px', 
            marginBottom: '15px',
            color: '#1a365d'
          }}>
            לוח השמירות להיום
          </h2>

          <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', minWidth: isMobile ? 350 : 0, marginBottom: '20px', borderCollapse: 'collapse', fontSize: isMobile ? '13px' : '16px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'right', padding: '10px', color: '#222' }}>שעה</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: '#222' }}>ש"ג</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: '#222' }}>קומה 5</th>
                </tr>
              </thead>
              <tbody>
                {allShiftsWithEtage.map((shift, i) => {
                  let sg = '';
                  let etage = '';
                  if (shift.type === 'day' && planning.daySG) {
                    const found = planning.daySG.find(d => d.shift.start === shift.start && d.shift.end === shift.end);
                    sg = found && found.soldier ? found.soldier.name : '';
                  }
                  if (shift.type === 'night' && planning.nightSG) {
                    const found = planning.nightSG.find(d => d.shift.start === shift.start && d.shift.end === shift.end);
                    sg = found && found.soldiers ? (found.soldiers[0]?.name + ' & ' + found.soldiers[1]?.name) : '';
                  }
                  if (planning.etage) {
                    const foundEtage = planning.etage.find(e => e.shift.start === shift.start && e.shift.end === shift.end);
                    etage = foundEtage && foundEtage.soldier ? foundEtage.soldier.name : '';
                  }
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px', color: '#222', textAlign: 'right' }}>{shift.start} - {shift.end}</td>
                      <td style={{ padding: '10px', color: '#222', textAlign: 'right' }}>{sg}</td>
                      <td style={{ padding: '10px', color: '#222', textAlign: 'right' }}>{etage}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: isMobile ? '15px' : '18px', marginBottom: '10px', color: '#4b5563' }}>
            חיילים נוכחים בבסיס
          </h3>
          <ul style={{ listStyleType: 'disc', paddingRight: '20px', marginBottom: '20px', fontSize: isMobile ? '13px' : '16px' }}>
            {planning.present.map((name, i) => (
              <li key={i} style={{ marginBottom: '5px' }}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{
        maxWidth: isMobile ? '98vw' : '800px',
        margin: '20px auto',
        backgroundColor: 'white',
        padding: isMobile ? '10px' : '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: isMobile ? '16px' : '20px', 
          marginBottom: '15px',
          color: '#1a365d'
        }}>
          רשימת החיילים ושמירה אחרונה
        </h2>

        <div style={{overflowX: 'auto'}}>
          <table style={{ width: '100%', minWidth: isMobile ? 350 : 0, fontSize: isMobile ? '13px' : '16px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'right', padding: '10px', color: '#222' }}>שם</th>
                <th style={{ textAlign: 'right', padding: '10px', color: '#222' }}>שמירה אחרונה</th>
              </tr>
            </thead>
            <tbody>
              {soldiers.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px', color: '#222', textAlign: 'right' }}>{s.name}</td>
                  <td style={{ padding: '10px', color: '#222', textAlign: 'right' }}>{s.lastDuty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App
