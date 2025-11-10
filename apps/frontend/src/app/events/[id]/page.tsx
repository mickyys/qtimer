"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/events/${params.id}`);
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };
    const fetchResults = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/results/${params.id}`);
        setResults(response.data);
      } catch (error) {
        console.error("Error fetching results:", error);
      }
    };
    fetchEvent();
    fetchResults();
  }, [params.id]);

  if (!event) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Event {(event as any).name}</h1>
      <h2>Runners</h2>
      <ul>
        {results.map((result: any) => (
          <li key={result.id}>
            {result.runner_name} - {result.time}
          </li>
        ))}
      </ul>
    </div>
  );
}
