document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const sampleMessageButton = document.querySelector('.input-row button');
if (sampleMessageButton) {
  sampleMessageButton.addEventListener('click', () => {
    sampleMessageButton.textContent = '✓';
    setTimeout(() => { sampleMessageButton.textContent = '↑'; }, 1200);
  });
}
