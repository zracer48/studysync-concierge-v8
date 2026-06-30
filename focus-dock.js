const form = document.getElementById('dockForm');
const emptyState = document.getElementById('emptyState');
const dockResult = document.getElementById('dockResult');
const surveyButton = document.getElementById('surveyButton');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const features = [...form.querySelectorAll('input[type="checkbox"]:checked')].map(item => item.value);
  const studentType = data.get('studentType');
  const issue = data.get('deskIssue');
  const price = data.get('price');
  const primaryFeature = features[0] || 'Phone stand';
  dockResult.innerHTML = `
    <div class="dock-card">
      <h3>Recommended Focus Dock Setup</h3>
      <p>For a <strong>${studentType}</strong> whose biggest desk problem is <strong>${issue}</strong>, the most useful version should prioritize <strong>${primaryFeature}</strong> and keep the design compact enough for daily use.</p>
      <ul>
        <li><strong>Selected features:</strong> ${features.join(', ') || 'No features selected yet'}</li>
        <li><strong>Expected price:</strong> ${price}</li>
        <li><strong>Prototype direction:</strong> low-fidelity CAD model now, functional material prototype next.</li>
        <li><strong>Next improvement:</strong> compare wireless charging, larger drawer, and foldable layout in future testing.</li>
      </ul>
    </div>`;
  emptyState.classList.add('hidden');
  dockResult.classList.remove('hidden');
  surveyButton.classList.remove('hidden');
});
