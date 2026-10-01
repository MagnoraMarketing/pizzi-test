// Mobilmenu
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav__toggle');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.nav__links a').forEach((link) =>
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  })
);

// Menufaner
const tabs = document.querySelectorAll('.tab');
const dishes = document.querySelectorAll('.dish');
function showCategory(cat) {
  tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.filter === cat));
  dishes.forEach((d) => (d.hidden = d.dataset.cat !== cat));
}
tabs.forEach((t) => t.addEventListener('click', () => showCategory(t.dataset.filter)));
showCategory('rosso');

// Bordbestilling (demo – sender ikke data nogen steder)
const form = document.querySelector('.booking');
const msg = form.querySelector('.booking__msg');
form.elements.date.min = new Date().toISOString().split('T')[0];
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    msg.textContent = 'Udfyld venligst alle felter.';
    return;
  }
  msg.textContent = `Tak, ${form.elements.name.value.trim()}! Vi bekræfter dit bord til ${form.elements.guests.value} den ${form.elements.date.value} kl. ${form.elements.time.value} pr. SMS.`;
  form.reset();
});

document.getElementById('year').textContent = new Date().getFullYear();
