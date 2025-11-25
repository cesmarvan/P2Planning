import React, { useEffect, useState } from "react";
import CalendarDetail from "./components/CalendarDetail";

function App({ ditto }) {
  const [calendars, setCalendars] = useState([]);
  const [eventInputs, setEventInputs] = useState({});

  useEffect(() => {
    if (!ditto) return;

    // Observamos la colección "calendars"
    const observer = ditto.store
      .collection("calendars")
      .findAll()
      .observeLocal((docs) => {
        setCalendars(docs.map(d => d.value));
      });

    // Si no hay calendarios, añadimos uno
    (async () => {
      const existing = await ditto.store.collection("calendars").findAll().exec();

      if (existing.length === 0) {
        await ditto.store.collection("calendars").upsert({
          _id: "cal1",
          name: "Example Calendar",
          events: [{ id: 'e1', title: 'Evento de ejemplo', date: '2025-06-15' }],
        });
      }
              console.log(existing)
    })();

    return () => observer.stop();
  }, [ditto]);

  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [showNewCalendar, setShowNewCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");

  if (selectedCalendar) {
    return (
      <div>
        <button onClick={() => setSelectedCalendar(null)}>← Volver</button>
        <CalendarDetail calendar={selectedCalendar} ditto={ditto} />
      </div>
    );
  }
  

  return (
    <div>
      <h1>Calendarios disponibles</h1>
      <div style={{ marginBottom: 12 }}>
        {!showNewCalendar ? (
          <button onClick={() => setShowNewCalendar(true)}>＋ Nuevo calendario</button>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newCalendarName) return;
              const id = `cal-${Date.now()}`;
              try {
                await ditto.store.collection("calendars").upsert({
                  _id: id,
                  name: newCalendarName,
                  events: []
                });
                setNewCalendarName("");
                setShowNewCalendar(false);
              } catch (err) {
                console.error("Failed to create calendar:", err);
              }
            }}
          >
            <input
              placeholder="Nombre del calendario"
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
            />
            <button type="submit">Crear</button>
            <button type="button" onClick={() => setShowNewCalendar(false)}>Cancelar</button>
          </form>
        )}
      </div>
      {calendars.map((c) => (
        <div
          key={c._id}
          style={{ border: "1px solid #ddd", padding: 8, margin: 8, cursor: "pointer" }}
          onClick={() => setSelectedCalendar(c)}
        >
          <h3>{c.name}</h3>
          <div>
            <strong>Eventos:</strong>
            <ul>
              {(c.events || []).slice(0, 5).map((e, i) => (
                <li key={i}>{e.title} {e.date ? `— ${e.date}` : ""}</li>
              ))}
              {((c.events || []).length > 5) && <li>...y { (c.events || []).length - 5 } más</li>}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
