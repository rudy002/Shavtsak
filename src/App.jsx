import { useState } from 'react'
import './App.css'

// Exemple de liste initiale de soldats avec leur dernière garde (lastDuty au format 'YYYY-MM-DD')
const initialSoldiers = [
  { name: "רז", lastDuty: "2024-06-10" },
  { name: "נתן (מפקד)", lastDuty: "2024-06-11" },
  { name: "קרטמן (מפקד)", lastDuty: "2024-06-09" },
  { name: "אליהו", lastDuty: "2024-06-08" },
  { name: "אסרך", lastDuty: "2024-06-07" },
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

// Créneaux pour le 7e étage (gardes de 2h entre 6h et 20h, mais on adapte pour finir à 21h)
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

function generatePlanning(soldiers) {
  const sorted = [...soldiers].sort(
    (a, b) => getDaysSince(b.lastDuty) - getDaysSince(a.lastDuty)
  );
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // 1. ש"ג de jour (6h-21h) : gardes de 2h, une seule personne
  let daySG = [];
  let dayPool = shuffle(sorted.filter(s => s.lastDuty !== yesterdayStr));
  let dayIndex = 0;
  for (let i = 0; i < dayShifts.length; i++) {
    const soldier = dayPool[dayIndex % dayPool.length];
    dayIndex++;
    daySG.push({
      shift: dayShifts[i],
      soldier: soldier
    });
  }

  // 2. 7e étage (6h-20h) : gardes de 2h, une seule personne
  let etage = [];
  let etagePool = shuffle(sorted.filter(s => s.lastDuty !== yesterdayStr));
  let etageIndex = 0;
  for (let i = 0; i < etageShifts.length; i++) {
    const soldier = etagePool[etageIndex % etagePool.length];
    etageIndex++;
    etage.push({
      shift: etageShifts[i],
      soldier: soldier
    });
  }

  // 3. ש"ג de nuit (21h-6h) : binômes de 1h30
  let nightSG = [];
  let nightPool = shuffle(sorted);
  let nightIndex = 0;
  for (let i = 0; i < nightShifts.length; i++) {
    const s1 = nightPool[nightIndex % nightPool.length];
    nightIndex++;
    const s2 = nightPool[nightIndex % nightPool.length];
    nightIndex++;
    nightSG.push({
      shift: nightShifts[i],
      soldiers: [s1, s2],
    });
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
  // Nouvel état : qui est présent aujourd'hui
  const [presentToday, setPresentToday] = useState(initialSoldiers.map(s => s.name));

  const handleTogglePresent = (name) => {
    setPresentToday((prev) =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const handleGenerate = () => {
    // On ne garde que les soldats présents aujourd'hui
    const filteredSoldiers = soldiers.filter(s => presentToday.includes(s.name));
    const plan = generatePlanning(filteredSoldiers);
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
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#1a365d', 
        marginBottom: isMobile ? '10px' : '20px',
        fontSize: isMobile ? '18px' : '24px'
      }}>
        Guard Duty Schedule Generator (שב"צק)
      </h1>

      <div style={{
        maxWidth: isMobile ? '98vw' : '800px',
        margin: '0 auto 20px auto',
        backgroundColor: 'white',
        padding: isMobile ? '10px' : '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: isMobile ? '15px' : '18px', marginBottom: '10px', color: '#1a365d' }}>
          Select the soldiers present today
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
          Generate today's schedule
        </button>
      </div>

      {!planning && (
        <div style={{textAlign: 'center', color: '#888', marginBottom: isMobile ? 15 : 30, fontSize: isMobile ? '14px' : '16px'}}>
          Click the button to generate today's schedule.
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
            Today's Schedule
          </h2>

          <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', minWidth: isMobile ? 350 : 0, marginBottom: '20px', borderCollapse: 'collapse', fontSize: isMobile ? '13px' : '16px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#222' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#222' }}>ש"ג</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#222' }}>7th Floor</th>
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
                      <td style={{ padding: '10px', color: '#222' }}>{shift.start} - {shift.end}</td>
                      <td style={{ padding: '10px', color: '#222' }}>{sg}</td>
                      <td style={{ padding: '10px', color: '#222' }}>{etage}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: isMobile ? '15px' : '18px', marginBottom: '10px', color: '#4b5563' }}>
            Soldiers present on base
          </h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '20px', fontSize: isMobile ? '13px' : '16px' }}>
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
          List of soldiers and last assigned slot
        </h2>

        <div style={{overflowX: 'auto'}}>
          <table style={{ width: '100%', minWidth: isMobile ? 350 : 0, fontSize: isMobile ? '13px' : '16px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px', color: '#222' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#222' }}>Last assigned slot</th>
              </tr>
            </thead>
            <tbody>
              {soldiers.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px', color: '#222' }}>{s.name}</td>
                  <td style={{ padding: '10px', color: '#222' }}>{s.lastDuty}</td>
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
