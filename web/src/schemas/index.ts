/**
 * Exportar todos los esquemas de Zod
 */

// Eventos
export {
  EventoSchema,
  CreateEventoSchema,
  UpdateEventoSchema,
  type Evento,
  type CreateEvento,
  type UpdateEvento,
} from './evento.schema';

// Participantes
export {
  ParticipanteSchema,
  CreateParticipanteSchema,
  UpdateParticipanteSchema,
  type Participante,
  type CreateParticipante,
  type UpdateParticipante,
} from './participante.schema';

// Etiquetas
export {
  EtiquetaSchema,
  EtiquetaFirestoreSchema,
  CreateEtiquetaFirestoreSchema,
  type Etiqueta,
  type EtiquetaFirestore,
  type CreateEtiquetaFirestore,
} from './etiqueta.schema';

// Anfitriones
export {
  AnfitrionSchema,
  CreateAnfitrionSchema,
  UpdateAnfitrionSchema,
  type Anfitrion,
  type CreateAnfitrion,
  type UpdateAnfitrion,
} from './anfitrion.schema';

// Selecciones
export {
  SeleccionSchema,
  CreateSeleccionSchema,
  UpdateSeleccionSchema,
  type Seleccion,
  type CreateSeleccion,
  type UpdateSeleccion,
} from './seleccion.schema';

// Usuarios
export {
  UsuarioSchema,
  RegisterUsuarioSchema,
  LoginUsuarioSchema,
  type Usuario,
  type RegisterUsuario,
  type LoginUsuario,
} from './usuario.schema';

