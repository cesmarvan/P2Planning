import { useEffect, useState } from "react";
import "./App.css";
import Calendar from "./components/Calendar";
import getPeerId from './peer';

import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';

function App({ ditto }) {
  const [calendars, setCalendars] = useState([]);
  const currentPeerId = getPeerId();
  const [allEvents, setAllEvents] = useState([]);

  console.log("App rendered, ditto:", ditto ? "present" : "missing");
  console.log("Current calendars state:", calendars);

  useEffect(() => {
    if (!ditto) {
      console.log("Ditto not ready, skipping setup");
      return;
    }

    console.log("Setting up observation for calendars with Cloud sync...");

    // Registrar subscripción de sync para recibir actualizaciones de otros peers
    ditto.sync.registerSubscription(`SELECT * FROM calendars`);

    // También observar todos los eventos para poder mostrar contadores
    ditto.sync.registerSubscription(`SELECT * FROM events`);

    const evObserver = ditto.store.registerObserver(
      `SELECT * FROM events`,
      (result) => {
        const events = result.items.map(item => item.value);
        setAllEvents(events);
      }
    );

    // Observar cambios locales en calendarios
    const calObserver = ditto.store.registerObserver(
      `SELECT * FROM calendars`,
      (result) => {
        console.log("Calendar observer - Calendars changed:", result.items.length, "documents");
        // Extraer valores de los items
        const calendarData = result.items.map(item => item.value);
        console.log("Extracted calendar data:", calendarData);
        setCalendars(calendarData);
      }
    );

    // Cargar/crear calendario inicial
    (async () => {
      try {
        const existing = await ditto.store.collection("calendars").findAll().exec();
        console.log("Existing calendars on mount:", existing.length);

        if (existing.length === 0) {
          console.log("Creating initial calendar for this peer...");
          // Use a peer-specific id so other peers don't overwrite the same doc on first load
          const initId = `cal-${currentPeerId}`;
          await ditto.store.collection("calendars").upsert({
            _id: initId,
            name: "Example calendar",
            owner: currentPeerId,
            allowedPeers: [currentPeerId]
          });
          console.log("Initial calendar created with id:", initId);
        }
      } catch (err) {
        console.error("Error checking/creating initial calendar:", err);
      }
    })();

    return () => {
      console.log("Stopping observer");
      calObserver?.stop?.();
      evObserver?.stop?.();
    };
  }, [ditto]);

  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [showNewCalendar, setShowNewCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Only show calendars the current peer owns or that include them in allowedPeers
  const accessibleCalendars = calendars.filter(c => {
    if (!c) return false;
    if (c.owner === currentPeerId) return true;
    if (Array.isArray(c.allowedPeers) && c.allowedPeers.includes(currentPeerId)) return true;
    return false;
  });

  const totalPages = Math.max(1, Math.ceil(accessibleCalendars.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleCalendars = accessibleCalendars.slice(pageStart, pageStart + pageSize);
  // attach upcomingCount to visible calendars
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const visibleCalendarsWithCount = visibleCalendars.map(c => {
    const count = allEvents.filter(e => e && e.calendar_id === c._id && (() => {
      if (!e.date) return false;
      const d = new Date(e.date);
      if (isNaN(d)) return false;
      return d >= todayStart;
    })()).length;
    return { ...c, upcomingCount: count };
  });

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const activeCalendar = selectedCalendar
    ? calendars.find((c) => c._id === selectedCalendar._id) || selectedCalendar
    : null;

  if (activeCalendar) {
    return (
      <Calendar 
        calendar={activeCalendar} 
        ditto={ditto} 
        onBack={() => setSelectedCalendar(null)}
      />
    );
  }
  

  return (
    <div className="app-page">
      <div className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="app-title">P2Planning</h1>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, opacity: 0.95 }} title={`Peer id: ${currentPeerId}`}>
          {currentPeerId}
        </div>
      </div>

      <div className="calendar-toolbar">
        <div className="new-calendar-area">
          {!showNewCalendar ? (
            <button className="button-54" onClick={() => setShowNewCalendar(true)}>New Calendar</button>
          ) : (
            <form
              className="new-calendar-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCalendarName) return;
                const id = `cal-${Date.now()}`;
                console.log("Creating new calendar with ID:", id, "name:", newCalendarName);
                try {
                  await ditto.store.collection("calendars").upsert({
                    _id: id,
                    name: newCalendarName,
                    owner: currentPeerId,
                    allowedPeers: [currentPeerId]
                  });
                  console.log("Calendar created successfully");
                  setNewCalendarName("");
                  setShowNewCalendar(false);
                } catch (err) {
                  console.error("Error creating calendar:", err);
                  alert("Error creating calendar: " + err.message);
                }
              }}
            >
              <input
                placeholder="Calendar name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
              />
              <button className="button-54" type="submit"><AiOutlineCheck /></button>
              <button className="button-54" type="button" onClick={() => setShowNewCalendar(false)}><AiOutlineClose /></button>
            </form>
          )}
        </div>
      </div>

      <div className="calendar-grid">
        {visibleCalendarsWithCount.map((c) => (
          <div
            key={c._id}
            className="calendar-card"
            style={{ position: 'relative' }}
            onClick={() => setSelectedCalendar(c)}
          >
            {c.upcomingCount > 0 && (
              <div style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#e11', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                {c.upcomingCount}
              </div>
            )}
            <div>
              <h3 className="calendar-card-title">{c.name}</h3>
              <p className="calendar-card-subtitle">Open calendar</p>
            </div>
          </div>
        ))}
      </div>

      {calendars.length > pageSize && (
        <div className="pagination">
          <button className="button-54" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            ← Prev
          </button>
          <span className="pagination-info">Page {currentPage} of {totalPages}</span>
          <button className="button-54" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
