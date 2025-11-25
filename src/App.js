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

  if (selectedCalendar) {
    return (
      <div>
        <button onClick={() => setSelectedCalendar(null)}>← Volver</button>
        <CalendarDetail calendar={selectedCalendar} />
      </div>
    );
  }
  

  return (
    <div>
      <h1>Calendarios disponibles</h1>
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
