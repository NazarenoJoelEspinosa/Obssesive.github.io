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
  const openBtn = document.getElementById('openReserveBtn');
  const modal = document.getElementById('reserveModal');
  const closeBtn = document.getElementById('closeReserveBtn');
  const cancelBtn = document.getElementById('reserveCancel');
  const form = document.getElementById('reserveForm');
  const msg = document.getElementById('reserveMessage');

  // Config: endpoint a donde enviar reservas
  const RESERVE_ENDPOINT = '/api/reservas'; // reemplazá si tenés otra URL
  const USE_BACKEND = false; // poné true cuando tengas API disponible

  // Helpers
  function showModal() {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    // foco en primer campo
    setTimeout(() => document.getElementById('reserveName').focus(), 120);
    // set min date hoy
    const dateInput = document.getElementById('reserveDate');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
    // si no existe valor, poner siguiente día hábil simple (hoy +1)
    if (!dateInput.value) {
      const next = new Date(today);
      next.setDate(next.getDate() + 1);
      const ndd = String(next.getDate()).padStart(2, '0');
      const nmm = String(next.getMonth() + 1).padStart(2, '0');
      dateInput.value = `${next.getFullYear()}-${nmm}-${ndd}`;
    }
  }
  function closeModalReserve() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    msg.textContent = '';
    form.reset();
  }

  // Open / close
  openBtn.addEventListener('click', showModal);
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
    if (!formData.get('date')) errors.push('Seleccioná una fecha');
    if (!formData.get('time')) errors.push('Seleccioná un horario');
    return errors;
  }

  // send: si USE_BACKEND true hace fetch POST; si no, guarda en localStorage
  async function submitReservation(dataObj) {
    if (USE_BACKEND) {
      const res = await fetch(RESERVE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataObj)
      });
      if (!res.ok) throw new Error('Error al enviar la reserva');
      return res.json();
    } else {
      // fallback: guardar en localStorage en array "obs_reservas"
      const key = 'obs_reservas';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(Object.assign({ id: Date.now(), savedAt: new Date().toISOString() }, dataObj));
      localStorage.setItem(key, JSON.stringify(existing));
      return { saved: true, id: dataObj.id || Date.now() };
    }
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    msg.style.color = '#cfeadf';
    msg.textContent = 'Validando...';

    const formData = new FormData(form);
    const errors = validateForm(formData);
    if (errors.length) {
      msg.style.color = '#f6b1b1';
      msg.textContent = errors.join(' · ');
      return;
    }

    // construir objeto
    const payload = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      phone: formData.get('phone').trim(),
      service: formData.get('service'),
      date: formData.get('date'),
      time: formData.get('time'),
      notes: formData.get('notes') ? formData.get('notes').trim() : ''
    };

    try {
      msg.style.color = '#cfeadf';
      msg.textContent = 'Enviando reserva...';
      const result = await submitReservation(payload);
      // track event (analytics placeholder)
      try { if (window.gtag) window.gtag('event','reservation_submitted',{method: USE_BACKEND ? 'api' : 'local'}); } catch(e){}
      msg.style.color = '#b8f0c6';
      msg.textContent = 'Reserva registrada. Pronto nos contactamos para confirmar.';
      setTimeout(closeModalReserve, 1600);
    } catch (err) {
      console.error(err);
      msg.style.color = '#f6b1b1';
      msg.textContent = 'Ocurrió un error al enviar, intentá de nuevo más tarde.';
    }
  });
})();
