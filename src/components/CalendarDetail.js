import React, { useState } from 'react';

function CalendarView({ calendar }) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);

  // Crear una cuadrícula con los meses del calendario
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div>
      <h2>{calendar.name}</h2>
      {selectedMonthIndex === null ? (
        <div>
          <h3>Selecciona un mes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {months.map((month, index) => (
              <div
                key={index}
                onClick={() => setSelectedMonthIndex(index)}
                style={{
                  padding: '20px',
                  cursor: 'pointer',
                  border: '1px solid #ccc',
                  textAlign: 'center',
                  backgroundColor: '#f0f0f0'
                }}
              >
                {month}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <MonthView
          monthIndex={selectedMonthIndex}
          monthName={months[selectedMonthIndex]}
          events={calendar.events || []}
          onBack={() => setSelectedMonthIndex(null)}
        />
      )}
    </div>
  );
}

function MonthView({ monthIndex, monthName, events, onBack }) {
  // Use current year for days calculation
  const year = new Date().getFullYear();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Map events to day numbers for this month
  const eventsInMonth = (events || []).filter(e => {
    if (!e || !e.date) return false;
    const d = new Date(e.date);
    if (isNaN(d)) return false;
    return d.getMonth() === monthIndex;
  });

  const eventsByDay = {};
  eventsInMonth.forEach(e => {
    const d = new Date(e.date);
    const day = d.getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  return (
    <div>
      <button onClick={onBack}>← Volver a meses</button>
      <h3>{monthName} — Eventos</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            style={{
              minHeight: 80,
              padding: '6px',
              border: '1px solid #ccc',
              backgroundColor: '#fff'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{day}</div>
            <div style={{ marginTop: 6 }}>
              {(eventsByDay[day] || []).map((ev, idx) => (
                <div key={idx} style={{ fontSize: 12, marginBottom: 4 }}>
                  • {ev.title}{ev.date ? ` (${ev.date})` : ''}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {eventsInMonth.length === 0 && <p>No hay eventos en este mes.</p>}
    </div>
  );
}

export default CalendarView;
