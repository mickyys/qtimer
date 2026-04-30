'use client';

import { useState, useMemo, ReactNode, Fragment, FC } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface ParticipantData {
  id: string;
  data: {
    [key: string]: string;
  };
}

interface ParticipantsTableProps {
  participants: ParticipantData[];
  loading?: boolean;
  onSelectParticipant?: (participant: ParticipantData) => void;
  isLoading?: boolean;
}

// Columnas visibles por defecto
const DEFAULT_COLUMNS = ['dorsal', 'name', 'category', 'sex', 'chip', 'position'];

const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Master': 'bg-blue-100 text-blue-800',
    'Elite': 'bg-purple-100 text-purple-800',
    'Sub-23': 'bg-green-100 text-green-800',
    'Junior': 'bg-yellow-100 text-yellow-800',
    'Cadete': 'bg-orange-100 text-orange-800',
  };
  return colors[category] || 'bg-slate-100 text-slate-800';
};

const getSexIcon = (sex: string): string => {
  return sex?.toLowerCase() === 'f' ? '👩' : '👨';
};

const getPositionBadgeVariant = (position: string, categoryPosition?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  // Usar categoryPosition si está disponible, sino usar position general
  const posToUse = categoryPosition || position;
  const posNum = parseInt(posToUse);
  if (posNum === 1) return 'default';
  if (posNum <= 3) return 'secondary';
  return 'outline';
};

export const ParticipantsTable: FC<ParticipantsTableProps> = ({
  participants,
  loading = false,
  onSelectParticipant,
  isLoading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);

  // Obtener todas las columnas únicas disponibles
  const allColumns = useMemo(() => {
    const columns = new Set<string>();
    participants.forEach((p) => {
      Object.keys(p.data).forEach((col) => columns.add(col));
    });
    return Array.from(columns).sort();
  }, [participants]);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!participants || participants.length === 0) {
    return (
      <div className="w-full text-center py-12 text-slate-500">
        <p className="text-lg">No hay participantes para mostrar</p>
      </div>
    );
  }

  const getDisplayValue = (value: string, key: string, participantData?: any): ReactNode => {
    if (key === 'category') {
      return (
        <Badge className={getCategoryColor(value)}>
          {value || 'Sin categoría'}
        </Badge>
      );
    }

    if (key === 'sex') {
      return (
        <span className="flex items-center gap-1">
          {getSexIcon(value)}
          {value?.toUpperCase() || 'N/A'}
        </span>
      );
    }

    if (key === 'position') {
      const isPositioned = value && value !== '0' && value !== '';
      if (!isPositioned) {
        return (
          <Badge variant="outline" className="bg-slate-50">
            DNS
          </Badge>
        );
      }
      return (
        <Badge variant={getPositionBadgeVariant(value, participantData?.['categoryPosition'])} className="font-bold">
          #{value}
        </Badge>
      );
    }

    return value || '-';
  };

  return (
    <div className="w-full space-y-4">
      {/* Información de resumen */}
      <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-lg p-4 border border-emerald-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Total de participantes: <span className="text-2xl text-emerald-600">{participants.length}</span>
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              Finalizados: {participants.filter(p => p.data.position && p.data.position !== '0').length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600">
              Columnas disponibles: {allColumns.length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <TableRow className="border-b border-slate-200 hover:bg-slate-100">
              <TableHead className="w-10 text-center">
                <span className="text-xs font-semibold text-slate-600">#</span>
              </TableHead>
              {DEFAULT_COLUMNS.map((column) => (
                <TableHead
                  key={column}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide"
                >
                  {column === 'dorsal' && '🏷️'}
                  {column === 'name' && '👤'}
                  {column === 'category' && '🎯'}
                  {column === 'sex' && '⚡'}
                  {column === 'chip' && '📱'}
                  {column === 'position' && '🏆'}
                  {' '}
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                </TableHead>
              ))}
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant, index) => (
              <Fragment key={participant.id}>
                <TableRow
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === participant.id ? null : participant.id)}
                >
                  <TableCell className="text-center text-sm font-medium text-slate-600 w-10">
                    {index + 1}
                  </TableCell>

                  {DEFAULT_COLUMNS.map((column) => (
                    <TableCell
                      key={`${participant.id}-${column}`}
                      className="px-4 py-3 text-sm text-slate-700"
                    >
                      {getDisplayValue(participant.data[column] || '', column, participant.data)}
                    </TableCell>
                  ))}

                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectParticipant?.(participant);
                      }}
                      className="hover:bg-emerald-100 hover:text-emerald-700"
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Fila expandida con datos adicionales */}
                {expandedId === participant.id && (
                  <TableRow className="bg-gradient-to-r from-slate-50 to-emerald-50 border-l-4 border-l-emerald-500">
                    <TableCell colSpan={DEFAULT_COLUMNS.length + 2} className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900">Información Completa</h4>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {Object.entries(participant.data).map(([key, value]) => (
                            <div key={key} className="bg-white rounded-lg p-3 border border-slate-200">
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                {key}
                              </p>
                              <p className="text-sm font-medium text-slate-900 mt-1">
                                {getDisplayValue(value, key, participant.data)}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-200">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onSelectParticipant?.(participant)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Ver detalles completos
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedId(null)}
                          >
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación info */}
      <div className="text-xs text-slate-500 text-center">
        Mostrando {participants.length} participante(s)
      </div>
    </div>
  );
};

export default ParticipantsTable;
