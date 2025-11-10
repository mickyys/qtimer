"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function EventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/events");
        setEvents(response.data);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div>
      <h1>Events</h1>
      <ul>
        {events.map((event: any) => (
          <li key={event.id}>
            <a href={`/events/${event.id}`}>{event.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
