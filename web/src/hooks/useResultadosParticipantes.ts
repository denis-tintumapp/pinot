/**
 * Hook para cargar y calcular resultados de participantes
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  getFirestore,
  Timestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';

interface SeleccionParticipante {
  etiquetaNombre: string;
  naipeSeleccionado: string;
  naipeCorrecto: string;
  esCorrecta: boolean;
}

interface ParticipanteResultado {
  nombre: string;
  puntos: number;
  selecciones: SeleccionParticipante[];
  ordenEtiquetas: string[];
  seleccionesNaipes: Record<string, string>;
  seleccionesEtiquetas: Record<string, string>;
  posicion?: number;
  posicionFinal?: number;
}

export const useResultadosParticipantes = (eventoId: string | null) => {
  const [participantes, setParticipantes] = useState<ParticipanteResultado[]>([]);
  const [podio, setPodio] = useState<ParticipanteResultado[]>([]);
  const [resto, setResto] = useState<ParticipanteResultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      if (!eventoId) {
        setParticipantes([]);
        setPodio([]);
        setResto([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let app;
        if (getApps().length === 0) {
          app = initializeApp(firebaseConfig);
        } else {
          app = getApps()[0];
        }

        if (!app) {
          throw new Error('No se pudo inicializar Firebase');
        }

        const db = getFirestore(app);

        // Cargar información del evento para obtener timer
        const eventoRef = doc(db, 'eventos', eventoId);
        const eventoSnap = await getDoc(eventoRef);
        let timerIniciadoEn: number | null = null;
        let duracionTimerMinutos = 30;

        if (eventoSnap.exists()) {
          const eventoData = eventoSnap.data();
          timerIniciadoEn = eventoData.timerIniciadoEn
            ? (eventoData.timerIniciadoEn instanceof Timestamp
                ? eventoData.timerIniciadoEn.toMillis()
                : eventoData.timerIniciadoEn)
            : null;
          if (timerIniciadoEn && eventoData.timerExpiraEn) {
            const timerExpiraEn = eventoData.timerExpiraEn instanceof Timestamp
              ? eventoData.timerExpiraEn.toMillis()
              : eventoData.timerExpiraEn;
            duracionTimerMinutos = (timerExpiraEn - timerIniciadoEn) / (1000 * 60);
          }
        }

        // Cargar respuestas correctas
        const seleccionesRef = collection(db, 'selecciones');
        const qAnfitrion = query(
          seleccionesRef,
          where('eventoId', '==', eventoId),
          where('sesionId', '==', 'ANFITRION'),
          where('finalizado', '==', true)
        );
        const anfitrionSnapshot = await getDocs(qAnfitrion);

        let respuestasCorrectas: Record<string, string> = {};
        if (!anfitrionSnapshot.empty) {
          const anfitrionData = anfitrionSnapshot.docs[0].data();
          respuestasCorrectas = anfitrionData.seleccionesNaipes || {};
        }

        // Cargar todas las selecciones finalizadas
        const qParticipantes = query(
          seleccionesRef,
          where('eventoId', '==', eventoId),
          where('finalizado', '==', true)
        );
        const participantesSnapshot = await getDocs(qParticipantes);

        // Cargar naipes
        const eventoData = eventoSnap.data();
        const naipes: Array<{ id: string; nombre: string }> = [];
        if (eventoData) {
          const naipesArray = eventoData.naipes || [];
          naipes.push(...naipesArray.map((n: any) => ({
            id: n.id || n,
            nombre: n.nombre || n
          })));
        }

        // Procesar cada participante
        const participantesConPuntaje: ParticipanteResultado[] = [];

        participantesSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.sesionId === 'ANFITRION') {
            return;
          }

          const nombreParticipante = data.nombreParticipante || 'Participante sin nombre';
          const seleccionesNaipes = data.seleccionesNaipes || {};
          const seleccionesEtiquetas = data.seleccionesEtiquetas || {};
          const seleccionesNaipesTimestamps = data.seleccionesNaipesTimestamps || {};
          const ordenEtiquetasParticipante = data.ordenEtiquetas || [];

          // Calcular puntaje
          let puntos = 0;
          const seleccionesArray: SeleccionParticipante[] = [];

          Object.keys(seleccionesNaipes).forEach((etiquetaId) => {
            const naipeSeleccionado = seleccionesNaipes[etiquetaId];
            const naipeCorrecto = respuestasCorrectas[etiquetaId];
            const esCorrecta = naipeSeleccionado && naipeCorrecto && naipeSeleccionado === naipeCorrecto;

            let puntosAcierto = 0;
            let puntosBonus = 0;

            if (esCorrecta) {
              puntosAcierto = 100;

              // Calcular bonus por tiempo
              if (timerIniciadoEn && seleccionesNaipesTimestamps[etiquetaId]) {
                const timestampAsignacion = seleccionesNaipesTimestamps[etiquetaId];
                const tiempoTranscurrido = (timestampAsignacion - timerIniciadoEn) / (1000 * 60);
                const tiempoRestante = duracionTimerMinutos - tiempoTranscurrido;

                if (tiempoTranscurrido <= 15) {
                  puntosBonus = 25;
                } else if (tiempoTranscurrido <= 25) {
                  puntosBonus = 10;
                } else if (tiempoRestante <= 5) {
                  puntosBonus = 0;
                } else {
                  puntosBonus = 0;
                }
              }
            }

            puntos += puntosAcierto + puntosBonus;

            const naipe = naipes.find(n => n.id === naipeSeleccionado);
            const naipeCorrectoObj = naipes.find(n => n.id === naipeCorrecto);

            seleccionesArray.push({
              etiquetaNombre: seleccionesEtiquetas[etiquetaId] || 'Etiqueta desconocida',
              naipeSeleccionado: naipe ? naipe.nombre : 'Naipe desconocido',
              naipeCorrecto: naipeCorrectoObj ? naipeCorrectoObj.nombre : 'Naipe desconocido',
              esCorrecta
            });
          });

          participantesConPuntaje.push({
            nombre: nombreParticipante,
            puntos,
            selecciones: seleccionesArray,
            ordenEtiquetas: ordenEtiquetasParticipante,
            seleccionesNaipes,
            seleccionesEtiquetas
          });
        });

        // Ordenar por puntaje decreciente
        participantesConPuntaje.sort((a, b) => {
          if (b.puntos !== a.puntos) {
            return b.puntos - a.puntos;
          }
          return a.nombre.localeCompare(b.nombre);
        });

        // Agrupar por puntaje para manejar empates
        const participantesAgrupados: Array<{
          puntaje: number;
          participantes: ParticipanteResultado[];
          posicionInicial: number;
        }> = [];
        let grupoActual: ParticipanteResultado[] = [];
        let puntajeAnterior: number | null = null;

        participantesConPuntaje.forEach((participante) => {
          if (puntajeAnterior === null || participante.puntos === puntajeAnterior) {
            grupoActual.push(participante);
          } else {
            if (grupoActual.length > 0) {
              participantesAgrupados.push({
                puntaje: puntajeAnterior,
                participantes: grupoActual,
                posicionInicial: participantesAgrupados.reduce((sum, g) => sum + g.participantes.length, 0) + 1
              });
            }
            grupoActual = [participante];
          }
          puntajeAnterior = participante.puntos;
        });

        if (grupoActual.length > 0) {
          participantesAgrupados.push({
            puntaje: puntajeAnterior!,
            participantes: grupoActual,
            posicionInicial: participantesAgrupados.reduce((sum, g) => sum + g.participantes.length, 0) + 1
          });
        }

        // Separar podio del resto
        const podioArray: ParticipanteResultado[] = [];
        const restoArray: ParticipanteResultado[] = [];
        let posicionActual = 1;

        participantesAgrupados.forEach(grupo => {
          const posicionFinal = posicionActual + grupo.participantes.length - 1;

          if (posicionActual <= 3) {
            grupo.participantes.forEach(p => {
              podioArray.push({ ...p, posicion: posicionActual, posicionFinal });
            });
          } else {
            grupo.participantes.forEach(p => {
              restoArray.push({ ...p, posicion: posicionActual });
            });
          }

          posicionActual = posicionFinal + 1;
        });

        setParticipantes(participantesConPuntaje);
        setPodio(podioArray);
        setResto(restoArray);
      } catch (err: any) {
        console.error('[useResultadosParticipantes] Error:', err);
        setError(err.message || 'Error al cargar resultados');
        setParticipantes([]);
        setPodio([]);
        setResto([]);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [eventoId]);

  return { participantes, podio, resto, loading, error };
};











