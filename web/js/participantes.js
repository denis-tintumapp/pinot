import { listarParticipantes as listarParticipantesFirestore, crearParticipante as crearParticipanteFirestore, actualizarParticipante as actualizarParticipanteFirestore, eliminarParticipante as eliminarParticipanteFirestore } from './firestore.js';
import { getEventoActivo } from './estado.js';

const inputPartNombre = document.getElementById("partNombre");
const msgParticipante = document.getElementById("msgParticipante");
const listaParticipantes = document.getElementById("listaParticipantes");
const btnAgregarParticipante = document.getElementById("btnAgregarParticipante");

let participanteEditando = null;

export async function cargarParticipantes() {
  const eventoActivo = getEventoActivo();
  
  if (!eventoActivo) {
    listaParticipantes.innerHTML = "<li>Creá un evento primero.</li>";
    return;
  }

  listaParticipantes.innerHTML = "<li>Cargando...</li>";
  const r = await listarParticipantesFirestore(eventoActivo.id);

  if (!r.ok) {
    listaParticipantes.innerHTML = `<li>Error: ${r.error}</li>`;
    return;
  }

  const delEvento = r.data || [];

  if (!delEvento.length) {
    listaParticipantes.innerHTML = "<li>No hay participantes cargados para este evento.</li>";
    return;
  }

  listaParticipantes.innerHTML = "";
  delEvento.forEach(p => {
    const li = document.createElement("li");
    li.className = "border rounded-xl px-3 py-2 flex justify-between items-center gap-2";

    const span = document.createElement("span");
    span.textContent = p.nombre;

    const acciones = document.createElement("div");
    acciones.className = "flex gap-2";

    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Editar";
    btnEdit.className = "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800";
    btnEdit.onclick = () => comenzarEdicionParticipante(p);

    const btnDel = document.createElement("button");
    btnDel.textContent = "Eliminar";
    btnDel.className = "text-xs px-2 py-1 rounded bg-red-100 text-red-700";
    btnDel.onclick = () => eliminarParticipante(p);

    acciones.appendChild(btnEdit);
    acciones.appendChild(btnDel);

    li.appendChild(span);
    li.appendChild(acciones);
    listaParticipantes.appendChild(li);
  });
}

function comenzarEdicionParticipante(p) {
  participanteEditando = p;
  inputPartNombre.value = p.nombre;
  msgParticipante.textContent = `Editando: ${p.nombre}`;
  msgParticipante.classList.remove("text-red-600");
  msgParticipante.classList.add("text-gray-600");
  btnAgregarParticipante.textContent = "Guardar cambios";
}

function resetEdicionParticipante() {
  participanteEditando = null;
  inputPartNombre.value = "";
  btnAgregarParticipante.textContent = "Agregar";
}

async function eliminarParticipante(p) {
  if (!confirm(`¿Eliminar a "${p.nombre}" de este evento?`)) return;

  msgParticipante.textContent = "Eliminando...";
  msgParticipante.classList.remove("text-green-600", "text-red-600");
  msgParticipante.classList.add("text-gray-600");

  try {
    const r = await eliminarParticipanteFirestore(p.id);

    if (r.ok) {
      msgParticipante.textContent = "Participante eliminado.";
      msgParticipante.classList.remove("text-gray-600");
      msgParticipante.classList.add("text-green-600");

      if (participanteEditando && participanteEditando.id === p.id) {
        resetEdicionParticipante();
      }

      await cargarParticipantes();
    } else {
      msgParticipante.textContent = "Error: " + (r.error || "No se pudo eliminar el participante");
      msgParticipante.classList.remove("text-gray-600");
      msgParticipante.classList.add("text-red-600");
    }
  } catch (err) {
    console.error(err);
    msgParticipante.textContent = "Error inesperado al eliminar participante.";
    msgParticipante.classList.remove("text-gray-600");
    msgParticipante.classList.add("text-red-600");
  }
}

async function agregarParticipante() {
  msgParticipante.textContent = "";
  msgParticipante.classList.remove("text-green-600", "text-red-600");
  msgParticipante.classList.add("text-gray-600");

  const eventoActivo = getEventoActivo();
  if (!eventoActivo) {
    msgParticipante.textContent = "Primero creá un evento.";
    msgParticipante.classList.remove("text-gray-600");
    msgParticipante.classList.add("text-red-600");
    return;
  }

  const nombre = (inputPartNombre.value || "").trim();
  if (!nombre) {
    msgParticipante.textContent = "Ingresá un nombre.";
    msgParticipante.classList.remove("text-gray-600");
    msgParticipante.classList.add("text-red-600");
    return;
  }

  try {
    let r;
    if (participanteEditando) {
      r = await actualizarParticipanteFirestore(participanteEditando.id, eventoActivo.id, nombre);
    } else {
      r = await crearParticipanteFirestore(eventoActivo.id, nombre);
    }

    if (r.ok) {
      msgParticipante.textContent = participanteEditando
        ? "Participante actualizado."
        : "Participante agregado.";
      msgParticipante.classList.remove("text-gray-600");
      msgParticipante.classList.add("text-green-600");

      resetEdicionParticipante();
      await cargarParticipantes();
    } else {
      msgParticipante.textContent = "Error: " + (r.error || "No se pudo procesar el participante");
      msgParticipante.classList.remove("text-gray-600");
      msgParticipante.classList.add("text-red-600");
    }
  } catch (err) {
    console.error(err);
    msgParticipante.textContent = "Error inesperado al guardar participante.";
    msgParticipante.classList.remove("text-gray-600");
    msgParticipante.classList.add("text-red-600");
  }
}

btnAgregarParticipante.onclick = agregarParticipante;


