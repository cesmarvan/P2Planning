import React, { useState, useEffect } from 'react';
import EventManager from './Event';

function CalendarComponent({ calendar, ditto, onBack }) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [events, setEvents] = useState([]);

  // Observar eventos de este calendario
  useEffect(() => {
    if (!ditto || !calendar) return;

    console.log("Calendar component - Setting up event observation for:", calendar._id);

    // Registrar subscripción para TODOS los eventos
    ditto.sync.registerSubscription(`SELECT * FROM events`);

    const observer = ditto.store.registerObserver(
      `SELECT * FROM events`,
      (result) => {
        // Extraer valores de los items
        const allEvents = result.items.map(item => item.value);
        // Filtrar solo los eventos de este calendario
        const calendarEvents = allEvents.filter(e => e.calendar_id === calendar._id);
        console.log("Calendar observer - Events updated:", calendarEvents.length);
        setEvents(calendarEvents);
      }
    );

    return () => {
      observer?.stop?.();
    };
  }, [ditto, calendar]);

  // Meses del año
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (selectedMonthIndex !== null) {
    return (
      <MonthView
        monthIndex={selectedMonthIndex}
        monthName={months[selectedMonthIndex]}
        calendar={calendar}
        ditto={ditto}
        events={events}
        onBack={() => setSelectedMonthIndex(null)}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={onBack}
          style={{ padding: 8, cursor: 'pointer', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: 4 }}
        >
          ← Back to Calendars
        </button>
      </div>

      <h2>{calendar.name}</h2>

      <div style={{ marginBottom: 20 }}>
        <h3>Select a Month</h3>
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
                backgroundColor: '#f0f0f0',
                borderRadius: 4,
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            >
              {month}
            </div>
          ))}
        </div>
      </div>

      {/* Usar el componente EventManager */}
      <EventManager calendar={calendar} ditto={ditto} />
    </div>
  );
}

function MonthView({ monthIndex, monthName, calendar, ditto, events, onBack }) {
  const year = new Date().getFullYear();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Filtrar eventos de este mes
  const eventsInMonth = (events || []).filter(e => {
    if (!e || !e.date) return false;
    const d = new Date(e.date);
    if (isNaN(d)) return false;
    return d.getMonth() === monthIndex;
  });

  // Agrupar eventos por día
  const eventsByDay = {};
  eventsInMonth.forEach(e => {
    const d = new Date(e.date);
    const day = d.getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  return (
    <div>
      <button 
        onClick={onBack}
        style={{ padding: 8, cursor: 'pointer', marginBottom: 12, backgroundColor: '#666', color: 'white', border: 'none', borderRadius: 4 }}
      >
        ← Back to Months
      </button>

      <h3>{monthName} {year}</h3>

      {/* Grid de 7 columnas (días de la semana) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: 20 }}>
        {/* Encabezados de días de semana */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            style={{
              padding: 8,
              fontWeight: 'bold',
              textAlign: 'center',
              backgroundColor: '#2196F3',
              color: 'white',
              borderRadius: 4
            }}
          >
            {day}
          </div>
        ))}

        {/* Días del mes */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            style={{
              minHeight: 100,
              padding: '8px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              borderRadius: 4,
              overflow: 'auto'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{day}</div>
            <div>
              {(eventsByDay[day] || []).map((ev) => (
                <div
                  key={ev._id}
                  style={{
                    fontSize: 11,
                    marginBottom: 4,
                    padding: 4,
                    backgroundColor: '#e3f2fd',
                    borderRadius: 2,
                    borderLeft: '3px solid #2196F3'
                  }}
                >
                  • {ev.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {eventsInMonth.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No events in this month.</p>}
    </div>
  );
}

export default CalendarComponent;

