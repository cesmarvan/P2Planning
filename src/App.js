import React, { useEffect, useState } from "react";
import Calendar from "./components/Calendar";
import "./App.css";

import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';

function App({ ditto }) {
  const [calendars, setCalendars] = useState([]);

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
          console.log("Creating initial calendar...");
          await ditto.store.collection("calendars").upsert({
            _id: "cal1",
            name: "Example calendar"
          });
          console.log("Initial calendar created");
        }
      } catch (err) {
        console.error("Error checking/creating initial calendar:", err);
      }
    })();

    return () => {
      console.log("Stopping observer");
      calObserver?.stop?.();
    };
  }, [ditto]);

  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [showNewCalendar, setShowNewCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const totalPages = Math.max(1, Math.ceil(calendars.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleCalendars = calendars.slice(pageStart, pageStart + pageSize);

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
      <div className="app-header">
        <h1 className="app-title">P2Planning</h1>
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
                    name: newCalendarName
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
        {visibleCalendars.map((c) => (
          <div
            key={c._id}
            className="calendar-card"
            onClick={() => setSelectedCalendar(c)}
          >
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
