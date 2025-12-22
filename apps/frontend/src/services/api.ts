const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface Event {
  id: string;
  code: string;
  name: string;
  date: string;
  status: string;
}

interface EventsResponse {
  events: Event[];
  totalCount: number;
}

export const getEvents = async (
  name: string,
  date: string,
  page: number,
  limit: number = 20
): Promise<EventsResponse> => {
  const params = new URLSearchParams();
  if (name) params.append("name", name);
  if (date) params.append("date", date);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const response = await fetch(`${API_URL}/events?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return response.json();
};

interface Participant {
  id: string;
  eventId: string;
  data: {
    [key: string]: string;
  };
}

interface ParticipantsResponse {
  participants: Participant[];
  totalCount: number;
}

export const getParticipants = async (
  eventId: string,
  filters: { [key: string]: string },
  page: number,
  limit: number = 200
): Promise<ParticipantsResponse> => {
  const params = new URLSearchParams();
  for (const key in filters) {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  }
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const response = await fetch(
    `${API_URL}/events/${eventId}/participants?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch participants");
  }

  return response.json();
};
