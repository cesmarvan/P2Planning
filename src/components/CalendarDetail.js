import { useEffect, useState } from 'react';
import getPeerId from '../peer';

function CalendarView({ calendar, ditto }) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [events, setEvents] = useState([]);
  const [newPeerId, setNewPeerId] = useState('');
  const currentPeerId = getPeerId();
  const [localAllowed, setLocalAllowed] = useState(calendar?.allowedPeers || []);

  // Keep localAllowed in sync when parent calendar prop changes
  useEffect(() => {
    setLocalAllowed(calendar?.allowedPeers || []);
  }, [calendar?.allowedPeers]);

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
      <h2 style={{ color: '#f3f4f6', marginTop: 0 }}>{calendar.name}</h2>
      {/* Access control UI - only visible to owner */}
      {calendar?.owner === currentPeerId && (
        <div style={{ marginBottom: 12, padding: 12, border: '1px solid #2a3344', borderRadius: 8, backgroundColor: '#0f1522' }}>
          <h4 style={{ marginTop: 0, color: '#cbd5f5' }}>Access control</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input placeholder='Peer ID to allow' value={newPeerId} onChange={e => setNewPeerId(e.target.value)} />
            <button className="button-54" onClick={async () => {
              if (!newPeerId) return;
              try {
                const newAllowed = Array.from(new Set([...(localAllowed || []), newPeerId]));
                await ditto.store.collection('calendars').upsert({
                  ...calendar,
                  allowedPeers: newAllowed
                });
                setLocalAllowed(newAllowed);
                setNewPeerId('');
              } catch (err) {
                console.error('Failed to add allowed peer (upsert):', err);
                alert('Error adding peer: ' + err.message);
              }
            }}>Add peer</button>
          </div>
          <div>
            <strong style={{ color: '#9aa4b2' }}>Allowed peers:</strong>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {localAllowed.map((p) => (
                <div key={p} style={{ padding: '6px 8px', backgroundColor: '#141a26', borderRadius: 8, border: '1px solid #2a3344', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#e5e7eb' }}>{p}</span>
                  <button className="button-54" onClick={async () => {
                    try {
                      const newAllowed = (localAllowed || []).filter(x => x !== p);
                      await ditto.store.collection('calendars').upsert({
                        ...calendar,
                        allowedPeers: newAllowed
                      });
                      setLocalAllowed(newAllowed);
                    } catch (err) {
                      console.error('Failed to remove allowed peer (upsert):', err);
                      alert('Error removing peer: ' + err.message);
                    }
                  }}>Remove</button>
                </div>
              ))}
              {(localAllowed || []).length === 0 && <div style={{ color: '#9aa4b2' }}>No peers allowed yet.</div>}
            </div>
          </div>
        </div>
      )}
      {selectedMonthIndex === null ? (
        <div>
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
                  color: '#3b4a66',
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

  // Map events to day numbers for this month and year
  const eventsInMonth = (events || []).filter(e => {
    if (!e || !e.date) return false;
    const d = new Date(e.date);
    if (isNaN(d)) return false;
    return d.getMonth() === monthIndex && d.getFullYear() === year;
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
        <button className="button-54" onClick={onBack}>← Back to months</button>
        <button className="button-54" onClick={() => {
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
          style={{ marginTop: 12, marginBottom: 12 }}
        >
          <input placeholder='Title of the event' value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
          <input type='date' value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
          <button className="button-54" type='submit'>Save event</button>
        </form>
      )}
      <h3 style={{ color: '#cbd5f5' }}>{monthName} — Events</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            style={{
              minHeight: 80,
              padding: '6px',
              border: '1px solid #2a3344',
              backgroundColor: '#0f1522',
              color: '#e5e7eb',
              borderRadius: 10
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#f3f4f6' }}>{day}</div>
            <div style={{ marginTop: 6 }}>
              {(eventsByDay[day] || []).map((ev, idx) => (
                <div key={idx} style={{ fontSize: 12, marginBottom: 4, color: '#cbd5f5' }}>
                  • {ev.title}{ev.date ? ` (${ev.date})` : ''}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {eventsInMonth.length === 0 && <p style={{ color: '#9aa4b2' }}>No events in this month.</p>}
    </div>
  );
}

export default CalendarView;
