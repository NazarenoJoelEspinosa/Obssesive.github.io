let currentGroup = null;
let groupSlides = []; // array de slides del grupo abierto
let groupIndex = 0;   // índice dentro del grupo (0..groupSlides.length-1)

function openModalGroup(groupId) {
  const modal = document.getElementById("galleryModal");
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");

  currentGroup = String(groupId);
  // seleccionar sólo las slides que tienen data-group == currentGroup
  const allSlides = Array.from(document.querySelectorAll("#galleryModal .slide"));
  groupSlides = allSlides.filter(s => s.getAttribute("data-group") === currentGroup);

  // si no hay slides para el grupo, cerrar y salir
  if (!groupSlides.length) {
    closeModal();
    return;
  }

  // ocultar todas en modal y mostrar la primera del grupo
  allSlides.forEach(s => s.style.display = "none");
  groupIndex = 0;
  groupSlides[groupIndex].style.display = "block";

  // pausar otros videos si existieran
  pauseAllModalVideos();
}

function closeModal() {
  const modal = document.getElementById("galleryModal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  // esconder todas las slides
  document.querySelectorAll("#galleryModal .slide").forEach(s => s.style.display = "none");
  pauseAllModalVideos();
  currentGroup = null;
  groupSlides = [];
  groupIndex = 0;
}

function changeSlide(direction) {
  if (!groupSlides || !groupSlides.length) return;

  // nuevo índice limitado dentro del grupo (sin wrap fuera del grupo)
  const newIndex = groupIndex + direction;
  if (newIndex < 0 || newIndex >= groupSlides.length) {
    // opcional: animación o rebote; por ahora no hace nada para indicar límite
    return;
  }

  // cambiar slide
  groupSlides[groupIndex].style.display = "none";
  // si era un video, pausar
  stopMediaInElement(groupSlides[groupIndex]);

  groupIndex = newIndex;
  groupSlides[groupIndex].style.display = "block";

  // pausar otros videos y no dejar reproducir el anterior
  pauseAllModalVideos();
}

function pauseAllModalVideos() {
  const vids = document.querySelectorAll("#galleryModal video");
  vids.forEach(v => v.pause());
}

function stopMediaInElement(el) {
  const v = el.querySelector("video");
  if (v) {
    v.pause();
    v.currentTime = 0;
  }
}

/* Soporte teclado: Escape cierra, flechas navegan (dentro del grupo) */
document.addEventListener("keydown", function(e) {
  const modal = document.getElementById("galleryModal");
  if (!modal || modal.getAttribute("aria-hidden") === "true") return;

  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowLeft") changeSlide(-1);
  if (e.key === "ArrowRight") changeSlide(1);
});

/* Cerrar modal si se hace click fuera del contenido */
document.getElementById("galleryModal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});


/* ===== Reserva: comportamiento y validación ===== */
(function() {
  // openBtn ya no se usa, pero lo dejamos por consistencia con el HTML si existiera.
  // const openBtn = document.getElementById('openReserveBtn'); 
  const modal = document.getElementById('reserveModal');
  const closeBtn = document.getElementById('closeReserveBtn');
  const cancelBtn = document.getElementById('reserveCancel');
  const form = document.getElementById('reserveForm');
  const msg = document.getElementById('reserveMessage');

  // Helpers
  function showModal() {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Evita scroll en fondo
    // foco en primer campo
    setTimeout(() => document.getElementById('reserveName').focus(), 120);
    // Lógica de fecha y hora eliminada.
    form.reset(); // Limpiar formulario al abrir
    msg.textContent = ''; // Limpiar mensaje de estado
  }
  function closeModalReserve() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    msg.textContent = '';
    form.reset();
  }

  // NUEVO: Selecciona todos los botones de reserva, excluyendo los del formulario (para evitar bugs)
  const allReserveBtns = document.querySelectorAll('.styled-reserve-btn:not(.form-actions .styled-reserve-btn)');

  // Open / close: Añade listener a todos los botones que abren el modal
  allReserveBtns.forEach(btn => {
    btn.addEventListener('click', showModal);
  });

  closeBtn.addEventListener('click', closeModalReserve);
  cancelBtn.addEventListener('click', closeModalReserve);

  // click fuera del dialog cierra
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModalReserve();
  });

  // keyboard support
  document.addEventListener('keydown', function(e) {
    if (modal.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') closeModalReserve();
  });

  // simple validation helper
  function validateForm(formData) {
    const errors = [];
    if (!formData.get('name') || formData.get('name').trim().length < 2) errors.push('Nombre inválido');
    const email = formData.get('email') || '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido');
    const phone = formData.get('phone') || '';
    if (!/[\d]{6,}/.test(phone.replace(/\D/g,''))) errors.push('Teléfono inválido');
    if (!formData.get('service')) errors.push('Seleccioná un servicio');
    // Validaciones de fecha y horario eliminadas.
    return errors;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault(); // Detenemos el envío inicial para validar

    msg.style.color = '#cfeadf';
    msg.textContent = 'Validando...';

    const formData = new FormData(form);
    const errors = validateForm(formData); // Usamos la validación simplificada

    if (errors.length) {
      // Si hay errores, los mostramos y no enviamos
      msg.style.color = '#f6b1b1';
      msg.textContent = errors.join(' · ');
      return;
    }
    
    // Si la validación es exitosa:
    msg.style.color = '#cfeadf';
    msg.textContent = 'Enviando reserva...';
    
    // Permitimos el envío nativo de Formspree (o el servicio que uses en el 'action')
    // El 'submit()' disparará el envío real del formulario.
    form.submit();

    // NOTA: Con el envío nativo, el usuario abandonará la página y verá la página de "Thank You" de Formspree. 
    // Los siguientes mensajes de éxito son opcionales y solo se verán brevemente.
  });
})();