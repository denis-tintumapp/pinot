// Estado global compartido
let eventoActivo = null;

function getLabels() {
  return {
    eventoActivoLabel: document.getElementById("eventoActivoLabel"),
    eventoActivoLabelEtq: document.getElementById("eventoActivoLabelEtq")
  };
}

function actualizarEventoActivoLabels() {
  const { eventoActivoLabel, eventoActivoLabelEtq } = getLabels();
  const label = eventoActivo
    ? `${eventoActivo.fecha} — ${eventoActivo.nombre}`
    : "Ninguno";
  
  if (eventoActivoLabel) eventoActivoLabel.textContent = label;
  if (eventoActivoLabelEtq) eventoActivoLabelEtq.textContent = label;
}

function getEventoActivo() {
  return eventoActivo;
}

function setEventoActivo(evt) {
  eventoActivo = evt;
  actualizarEventoActivoLabels();
}

export { getEventoActivo, setEventoActivo, actualizarEventoActivoLabels };

