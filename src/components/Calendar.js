import React, { useState, useEffect } from 'react';
import { AiOutlineArrowRight, AiOutlineArrowLeft, AiFillHome, AiTwotoneDelete } from 'react-icons/ai';
import EventManager from './Event';

function CalendarComponent({ calendar, ditto, onBack }) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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
        year={selectedYear}
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
        <button className="button-54" onClick={onBack}><AiFillHome /></button>
      </div>

      <h2 style={{ color: '#f3f4f6', marginTop: 0 }}>{calendar.name}</h2>

      <div className="year-controls">
        <button className="button-54" onClick={() => setSelectedYear((y) => y - 1)} aria-label="Previous Year">
          <AiOutlineArrowLeft />
        </button>
        <div
          className="year-display"
          role="button"
          tabIndex={0}
          onClick={() => setSelectedYear(new Date().getFullYear())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSelectedYear(new Date().getFullYear());
            }
          }}
        >
          {selectedYear}
        </div>
        <button className="button-54" onClick={() => setSelectedYear((y) => y + 1)} aria-label="Next Year">
          <AiOutlineArrowRight />
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ color: '#cbd5f5' }}>Select a Month</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {months.map((month, index) => (
            <div
              key={index}
              onClick={() => setSelectedMonthIndex(index)}
              style={{
                padding: '20px',
                cursor: 'pointer',
                border: '1px solid #2a3344',
                textAlign: 'center',
                backgroundColor: '#141a26',
                color: '#e5e7eb',
                borderRadius: 12,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b4a66';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.35)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a3344';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
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

function MonthView({ monthIndex, monthName, year, calendar, ditto, events, onBack }) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Filtrar eventos de este mes y año
  const eventsInMonth = (events || []).filter(e => {
    if (!e || !e.date) return false;
    const d = new Date(e.date);
    if (isNaN(d)) return false;
    return d.getMonth() === monthIndex && d.getFullYear() === year;
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
      <div style={{ marginBottom: 12 }}>
        <button className="button-54" onClick={onBack}>
          ← Back to Months
        </button>
      </div>

      <h3 style={{ color: '#cbd5f5' }}>{monthName} {year}</h3>

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
              backgroundColor: '#1b2434',
              color: '#cbd5f5',
              borderRadius: 8,
              border: '1px solid #2a3344'
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
              border: '1px solid #2a3344',
              backgroundColor: '#0f1522',
              borderRadius: 10,
              overflow: 'auto',
              color: '#e5e7eb'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#f3f4f6' }}>{day}</div>
            <div>
              {(eventsByDay[day] || []).map((ev) => (
                <div
                  key={ev._id}
                  style={{
                    fontSize: 11,
                    marginBottom: 4,
                    padding: 4,
                    backgroundColor: '#161e2b',
                    borderRadius: 6,
                    borderLeft: '3px solid #4b5b7a',
                    color: '#cbd5f5'
                  }}
                >
                  • {ev.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {eventsInMonth.length === 0 && <p style={{ color: '#9aa4b2', fontStyle: 'italic' }}>No events in this month.</p>}
    </div>
  );
}

export default CalendarComponent;

