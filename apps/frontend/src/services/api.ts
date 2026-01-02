const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  address: string;
  imageUrl: string;
  fileName: string;
  fileExtension: string;
  status: string;
  createdAt: string;
  fileHash?: string;
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

// Función para obtener participantes por slug del evento
export const getParticipantsBySlug = async (
  eventSlug: string,
  filters: { [key: string]: string } = {},
  page: number = 1,
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
    `${API_URL}/events/${eventSlug}/participants?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch participants");
  }

  return response.json();
};

// Helper to calculate SHA-256 hash
const calculateSHA256 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  // Note: 'crypto' is a web API, available in browser environments
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

interface UploadResult {
  EventID: string;
  RecordsInserted: number;
  Reprocessed: boolean;
}

export const uploadFile = async (file: File): Promise<UploadResult> => {
  const hash = await calculateSHA256(file);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("hash", hash);

  const response = await fetch(`${API_URL}/events/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Error de red o respuesta inválida" }));
    throw new Error(errorData.error || `Error HTTP! estado: ${response.status}`);
  }

  return response.json();
};

export const uploadFileToEvent = async (file: File, eventId: string): Promise<UploadResult> => {
  const hash = await calculateSHA256(file);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("hash", hash);

  const response = await fetch(`${API_URL}/events/${eventId}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Error de red o respuesta inválida" }));
    throw new Error(errorData.error || `Error HTTP! estado: ${response.status}`);
  }

  return response.json();
};

interface CreateEventRequest {
  name: string;
  date: string;
  time: string;
  address: string;
  imageUrl: string;
}

interface CreateEventResponse {
  id: string;
  name: string;
  date: string;
  time: string;
  address: string;
  imageUrl: string;
  status: string;
  createdAt: string;
}

export const createEvent = async (data: CreateEventRequest): Promise<CreateEventResponse> => {
  const response = await fetch(`${API_URL}/events/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Error de red o respuesta inválida" }));
    throw new Error(errorData.error || `Error HTTP! estado: ${response.status}`);
  }

  return response.json();
};

export const getEvent = async (eventId: string): Promise<CreateEventResponse> => {
  const response = await fetch(`${API_URL}/events/${eventId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Error de red o respuesta inválida" }));
    throw new Error(errorData.error || `Error HTTP! estado: ${response.status}`);
  }

  return response.json();
};

interface UpdateEventRequest {
  name: string;
  date: string;
  time: string;
  address: string;
  imageUrl: string;
  fileName?: string;
  fileExtension?: string;
}

export const updateEvent = async (eventId: string, data: UpdateEventRequest): Promise<CreateEventResponse> => {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Error de red o respuesta inválida" }));
    throw new Error(errorData.error || `Error HTTP! estado: ${response.status}`);
  }

  return response.json();
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Error de red o respuesta inválida" }));
    throw new Error(errorData.error || `Error HTTP! estado: ${response.status}`);
  }
};

export const updateEventStatus = async (eventId: string, status: string): Promise<CreateEventResponse> => {
  const response = await fetch(`${API_URL}/events/${eventId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Error de red o respuesta inválida" }));
    throw new Error(errorData.error || `Error HTTP! estado: ${response.status}`);
  }

  return response.json();
};

interface ComparisonResponse {
  firstPlace: Participant | null;
  previousParticipants: Participant[];
}

// Obtener datos de comparación: 1er lugar y 5 anteriores a un participante
export const getParticipantComparison = async (
  eventSlug: string,
  participantBib: string,
  distance: string
): Promise<ComparisonResponse> => {
  const params = new URLSearchParams();
  params.append("bib", participantBib);
  params.append("distance", distance);

  const response = await fetch(
    `${API_URL}/events/${eventSlug}/participants/comparison?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch participant comparison");
  }

  return response.json();
};

