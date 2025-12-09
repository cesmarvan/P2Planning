import React, { useState, useEffect } from 'react';

function EventManager({ calendar, ditto }) {
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  // Observar eventos de este calendario
  useEffect(() => {
    if (!ditto || !calendar) return;

    console.log("Setting up event observation for calendar:", calendar._id);

    // Registrar subscripción para TODOS los eventos
    ditto.sync.registerSubscription(`SELECT * FROM events`);

    const observer = ditto.store.registerObserver(
      `SELECT * FROM events`,
      (result) => {
        // Extraer valores de los items
        const allEvents = result.items.map(item => item.value);
        // Filtrar solo los eventos de este calendario
        const calendarEvents = allEvents.filter(e => e.calendar_id === calendar._id);
        console.log("Events updated for calendar", calendar._id, ":", calendarEvents.length, "out of", result.items.length);
        setEvents(calendarEvents);
      }
    );

    return () => {
      observer?.stop?.();
    };
  }, [ditto, calendar]);

  // Crear un nuevo evento
  const handleCreateEvent = async (e) => {
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
      setNewEventTitle('');
      setNewEventDate('');
      setShowAddEvent(false);
    } catch (err) {
      console.error('Failed to add event:', err);
      alert("Error creating event: " + err.message);
    }
  };

  // Eliminar un evento
  const handleDeleteEvent = async (eventId) => {
    try {
      console.log("Deleting event:", eventId);
      await ditto.store.collection("events").findByID(eventId).remove();
      console.log("Event deleted successfully");
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert("Error deleting event: " + err.message);
    }
  };

  // Actualizar un evento
  const handleUpdateEvent = async (eventId, updates) => {
    try {
      console.log("Updating event:", eventId, updates);
      await ditto.store.collection("events").findByID(eventId).update((mutableDoc) => {
        Object.assign(mutableDoc, updates);
      });
      console.log("Event updated successfully");
    } catch (err) {
      console.error('Failed to update event:', err);
      alert("Error updating event: " + err.message);
    }
  };

  return (
    <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
      <h3>Events Manager</h3>
      
      {/* Formulario para agregar evento */}
      <div style={{ marginBottom: 16 }}>
        {!showAddEvent ? (
          <button 
            onClick={() => setShowAddEvent(true)}
            style={{ padding: 8, cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}
          >
            ＋ Add Event
          </button>
        ) : (
          <form onSubmit={handleCreateEvent} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Event title"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              required
              style={{ flex: 1, minWidth: 150, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              required
              style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <button 
              type="submit"
              style={{ padding: 8, cursor: 'pointer', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4 }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddEvent(false);
                setNewEventTitle('');
                setNewEventDate('');
              }}
              style={{ padding: 8, cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 4 }}
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Lista de eventos */}
      <div style={{ marginTop: 16 }}>
        <h4>All Events ({events.length})</h4>
        {events.length === 0 ? (
          <p style={{ color: '#999' }}>No events yet</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {events.map((event) => (
              <li
                key={event._id}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>{event.title}</strong>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    📅 {event.date || 'No date'}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEvent(event._id)}
                  style={{
                    padding: 6,
                    cursor: 'pointer',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default EventManager;
