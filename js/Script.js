'use strict';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('is-open', !expanded);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();
const reserveDialog = document.querySelector('#reserveModal');
const galleryDialog = document.querySelector('#galleryModal');
let dialogTrigger;
function openDialog(dialog, trigger) {
  dialogTrigger = trigger;
  dialog.showModal();
  document.body.classList.add('dialog-open');
}
[reserveDialog, galleryDialog].forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    dialogTrigger?.focus();
  });
});
const form = document.querySelector('#reserveForm');
const serviceSelect = document.querySelector('#reserveService');
const message = document.querySelector('#reserveMessage');
const submitButton = form.querySelector('[type="submit"]');
let sending = false;
document.querySelectorAll('[data-service]').forEach(button => {
  button.addEventListener('click', () => {
    if (!sending) {
      serviceSelect.value = button.dataset.service || 'asesoramiento';
      message.textContent = '';
      message.classList.remove('error-message');
    }
    openDialog(reserveDialog, button);
    document.querySelector('#reserveName').focus();
  });
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending || !form.reportValidity()) return;
  const nameInput = document.querySelector('#reserveName');
  const phoneInput = document.querySelector('#reservePhone');
  if (nameInput.value.trim().length < 2 || phoneInput.value.replace(/\D/g, '').length < 6) {
    message.textContent = 'Revisá tu nombre y teléfono antes de enviar.';
    message.classList.add('error-message');
    return;
  }
  sending = true;
  submitButton.disabled = true;
  message.classList.remove('error-message');
  message.textContent = 'Enviando tu consulta…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error('No se pudo enviar');
    message.textContent = 'Recibimos tu consulta. El taller te contactará para coordinar; tu turno todavía no está confirmado.';
    form.reset();
  } catch {
    message.textContent = 'No pudimos confirmar el envío. Tus datos siguen acá; podés reintentar o escribirnos por WhatsApp.';
    message.classList.add('error-message');
  } finally {
    clearTimeout(timeout);
    sending = false;
    submitButton.disabled = false;
  }
});
const media = [
  { src: './img/BMW 4301/BMW 4301 Foto de atras.jpeg', caption: 'BMW · Exterior y terminaciones' },
  { src: './img/BMW 4301/BMW 4301 interior 1.jpeg', caption: 'BMW · Detalles del interior' },
  { src: './img/BMW 4301/BMW 4301 Atras.jpeg', caption: 'BMW · Pintura y reflejos' },
  { src: './img/BMW 4301/BMW 4301 Foto costado.jpeg', caption: 'BMW · Frente y llantas' },
  { src: './img/BMW 4301/BMW 4301 interior 2.jpeg', caption: 'BMW · Interior, otro ángulo' },
  { src: './img/BMW 4301/BMW 4301 Video.mp4', caption: 'BMW · Recorrido en video', video: true },
  { src: './img/BMW 4301/BMW 4301 Video 2.mp4', caption: 'BMW · Los detalles en movimiento', video: true }
];
let mediaIndex = 0;
const galleryImage = document.querySelector('#galleryImage');
const galleryVideo = document.querySelector('#galleryVideo');
function showMedia(index) {
  mediaIndex = (index + media.length) % media.length;
  const item = media[mediaIndex];
  galleryVideo.pause();
  galleryVideo.removeAttribute('src');
  galleryVideo.load();
  galleryVideo.hidden = !item.video;
  galleryImage.hidden = Boolean(item.video);
  if (item.video) galleryVideo.src = item.src;
  else {
    galleryImage.src = item.src;
    galleryImage.alt = item.caption;
  }
  document.querySelector('#galleryCaption').textContent = item.caption;
  document.querySelector('#galleryCount').textContent = `${mediaIndex + 1} / ${media.length}`;
}
document.querySelectorAll('[data-gallery]').forEach(button => {
  button.addEventListener('click', () => {
    showMedia(Number(button.dataset.gallery));
    openDialog(galleryDialog, button);
  });
});
document.querySelector('#galleryPrev').addEventListener('click', () => showMedia(mediaIndex - 1));
document.querySelector('#galleryNext').addEventListener('click', () => showMedia(mediaIndex + 1));
galleryDialog.addEventListener('keydown', event => {
  if (event.target === galleryVideo) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showMedia(mediaIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
galleryDialog.addEventListener('close', () => {
  galleryVideo.pause();
  galleryVideo.removeAttribute('src');
  galleryVideo.load();
});
