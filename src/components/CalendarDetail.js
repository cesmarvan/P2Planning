import React, { useState } from 'react';

function CalendarView({ calendar, ditto }) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

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
          // pass add event controls
          showAddEvent={showAddEvent}
          setShowAddEvent={setShowAddEvent}
          newEventTitle={newEventTitle}
          setNewEventTitle={setNewEventTitle}
          newEventDate={newEventDate}
          setNewEventDate={setNewEventDate}
          calendar={calendar}
          ditto={ditto}
        />
      )}
    </div>
  );
}

function MonthView({ monthIndex, monthName, events, onBack, showAddEvent, setShowAddEvent, newEventTitle, setNewEventTitle, newEventDate, setNewEventDate, calendar, ditto }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack}>← Volver a meses</button>
        <button onClick={() => {
          // default date to first of month if empty
          if (!newEventDate) {
            const mm = String(monthIndex + 1).padStart(2, '0');
            setNewEventDate(`${year}-${mm}-01`);
          }
          setShowAddEvent(prev => !prev)
        }}>{showAddEvent ? 'Cancelar' : '＋ Añadir evento'}</button>
      </div>
      {showAddEvent && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newEventTitle || !newEventDate) return;

            try {
              // build new events array
              const existing = calendar;
              const newEvents = [...(existing.events || []), { title: newEventTitle, date: newEventDate }];

              await ditto.store.collection('calendars').upsert({
                _id: existing._id,
                name: existing.name,
                events: newEvents
              });

              // clear form
              setNewEventTitle('');
              setNewEventDate('');
              setShowAddEvent(false);
            } catch (err) {
              console.error('Failed to add event from detail view:', err);
            }
          }}
          style={{ marginTop: 8, marginBottom: 12 }}
        >
          <input placeholder='Título del evento' value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
          <input type='date' value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
          <button type='submit'>Guardar evento</button>
        </form>
      )}
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
