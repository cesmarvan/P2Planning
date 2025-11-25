// src/Calendar.js

class Calendar {
  constructor(id, name, events = []) {
    this.id = id;
    this.name = name;
    this.events = events; // Array de eventos, puede ser una lista, tupla o set
  }

  // Método para agregar un evento
  addEvent(event) {
    this.events.push(event);
  }

  // Método para eliminar un evento por su id
  removeEvent(eventId) {
    this.events = this.events.filter(event => event.id !== eventId);
  }

  // Método para obtener los eventos del calendario
  getEvents() {
    return this.events;
  }
}

export default Calendar;
