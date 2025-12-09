import React, { useEffect, useState } from "react";
import Calendar from "./components/Calendar";

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
    <div>
      <h1>Available Calendars</h1>
      <div style={{ marginBottom: 12 }}>
        {!showNewCalendar ? (
          <button onClick={() => setShowNewCalendar(true)}>＋ New Calendar</button>
        ) : (
          <form
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
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowNewCalendar(false)}>Cancel</button>
          </form>
        )}
      </div>
      {calendars.map((c) => (
        <div
          key={c._id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            margin: 8,
            cursor: "pointer",
            borderRadius: 4,
            backgroundColor: '#f9f9f9',
            transition: 'background-color 0.3s'
          }}
          onClick={() => setSelectedCalendar(c)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
        >
          <h3 style={{ margin: '0 0 8px 0' }}>{c.name}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: 12 }}>Click to view details</p>
        </div>
      ))}
    </div>
  );
}

export default App;
