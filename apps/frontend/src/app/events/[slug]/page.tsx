"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getParticipants } from "@/services/api";
import LoadingOverlay from "@/components/LoadingOverlay";
import ParticipantDetailModal from "@/components/ParticipantDetailModal";
import { MarathonResults } from "@/components/MarathonResults";

interface Participant {
  id: string;
  data: { [key: string]: string };
}

type Filters = {
  name: string;
  chip: string;
  dorsal: string;
  category: string;
  sex: string;
  position: string;
};

const FILTER_KEYS: { key: keyof Filters; label: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "chip", label: "Chip" },
  { key: "dorsal", label: "Dorsal" },
  { key: "category", label: "Categoría" },
  { key: "sex", label: "Sexo" },
  { key: "position", label: "Posición" },
];

export default function ParticipantsPage() {
  const params = useParams();
  const eventId = params.slug as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    name: "", chip: "", dorsal: "", category: "", sex: "", position: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const limit = 200;

  const fetchParticipants = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const { participants: fetchedParticipants, totalCount: fetchedTotalCount } =
        await getParticipants(eventId, filters, currentPage, limit);
      setParticipants(fetchedParticipants);
      setTotalCount(fetchedTotalCount);
    } catch (err) {
      setError("No se pudieron cargar los participantes. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [eventId, filters, currentPage, limit]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchParticipants();
    }, 500);

    return () => clearTimeout(handler);
  }, [filters, currentPage, fetchParticipants]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return <MarathonResults eventSlug={eventId}/>
}
