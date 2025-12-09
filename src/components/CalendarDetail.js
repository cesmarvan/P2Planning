import React, { useState, useEffect } from 'react';

function CalendarView({ calendar, ditto }) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [events, setEvents] = useState([]);

  // Observar eventos de este calendario
  useEffect(() => {
    if (!ditto || !calendar) return;

    console.log("Setting up event observation for calendar:", calendar._id);

    // Registrar subscripción para eventos
    ditto.sync.registerSubscription(`SELECT * FROM events WHERE calendar_id = '${calendar._id}'`);

    const observer = ditto.store.registerObserver(
      `SELECT * FROM events WHERE calendar_id = '${calendar._id}'`,
      (result) => {
        console.log("Events updated for calendar", calendar._id, ":", result.items.length);
        setEvents(result.items);
      }
    );

    return () => {
      observer?.stop?.();
    };
  }, [ditto, calendar]);

  // Create a grid with the months of the calendar
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div>
      <h2>{calendar.name}</h2>
      {selectedMonthIndex === null ? (
        <div>
          <h3>Select a month</h3>
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
          events={events}
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
        <button onClick={onBack}>← Back to months</button>
        <button onClick={() => {
          // default date to first of month if empty
          if (!newEventDate) {
            const mm = String(monthIndex + 1).padStart(2, '0');
            setNewEventDate(`${year}-${mm}-01`);
          }
          setShowAddEvent(prev => !prev)
        }}>{showAddEvent ? 'Cancel' : '＋ Add event'}</button>
      </div>
      {showAddEvent && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newEventTitle || !newEventDate) return;

            try {
              const eventId = `event-${Date.now()}`;
              console.log("Creating event:", eventId, "for calendar:", calendar._id);

              await ditto.store.collection("events").upsert({
                _id: eventId,
                calendar_id: calendar._id,
                title: newEventTitle,
                date: newEventDate
              });

              console.log("Event created successfully");
              // clear form
              setNewEventTitle('');
              setNewEventDate('');
              setShowAddEvent(false);
            } catch (err) {
              console.error('Failed to add event from detail view:', err);
              alert("Error creating event: " + err.message);
            }
          }}
          style={{ marginTop: 8, marginBottom: 12 }}
        >
          <input placeholder='Title of the event' value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
          <input type='date' value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
          <button type='submit'>Save event</button>
        </form>
      )}
      <h3>{monthName} — Events</h3>
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
      {eventsInMonth.length === 0 && <p>No events in this month.</p>}
    </div>
  );
}

export default CalendarView;
