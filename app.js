const form = document.getElementById('plannerForm');
const emptyState = document.getElementById('emptyState');
const planResult = document.getElementById('planResult');
const resultActions = document.getElementById('resultActions');
const copyButton = document.getElementById('copyPlan');
const feedbackLink = document.getElementById('feedbackLink');
const waitlistForm = document.getElementById('waitlistForm');
const waitlistMessage = document.getElementById('waitlistMessage');

const dayTemplates = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
let latestPlanText = '';

const metricKeys = {
  plansGenerated: 'studysyncPlansGenerated',
  feedbackClicks: 'studysyncFeedbackClicks',
  waitlistCount: 'studysyncWaitlistCount',
  copyCount: 'studysyncCopyCount'
};

const subjectProfiles = [
  {
    match: ['accounting', 'finance', 'financial', 'econ', 'economics', 'statistics', 'stats'],
    focus: ['practice problems', 'formula review', 'homework calculations', 'quiz prep', 'error review'],
    action: 'Complete calculation practice, review formulas, and correct missed problems.'
  },
  {
    match: ['marketing', 'management', 'business', 'entrepreneurship', 'ent', 'sales'],
    focus: ['case study notes', 'project outline', 'concept review', 'presentation prep', 'discussion post'],
    action: 'Review key concepts, organize examples, and build the project or presentation outline.'
  },
  {
    match: ['law', 'legal', 'political', 'government', 'civics', 'history'],
    focus: ['reading notes', 'case brief', 'chapter review', 'essay outline', 'term review'],
    action: 'Read the assigned section, summarize key rules/events, and prepare examples for discussion.'
  },
  {
    match: ['english', 'writing', 'composition', 'literature', 'research'],
    focus: ['drafting', 'source review', 'outline building', 'revision', 'reading response'],
    action: 'Build the outline, write or revise the draft, and check that the assignment answers the prompt.'
  },
  {
    match: ['math', 'algebra', 'calculus', 'geometry', 'precalculus'],
    focus: ['practice set', 'formula review', 'problem corrections', 'test review', 'calculator practice'],
    action: 'Work through practice problems, identify mistakes, and redo the hardest question types.'
  },
  {
    match: ['science', 'biology', 'chemistry', 'physics', 'lab'],
    focus: ['lab review', 'diagram notes', 'concept map', 'practice questions', 'chapter review'],
    action: 'Review notes, memorize key processes/formulas, and answer practice questions.'
  },
  {
    match: ['psychology', 'sociology', 'health', 'wellness'],
    focus: ['concept review', 'study guide', 'article notes', 'quiz prep', 'reflection response'],
    action: 'Review definitions, connect concepts to examples, and prepare quiz or reflection notes.'
  }
];

function getMetric(key) {
  return Number(localStorage.getItem(metricKeys[key]) || 0);
}

function setMetric(key, value) {
  localStorage.setItem(metricKeys[key], String(value));
  updateMetricDisplay();
}

function incrementMetric(key) {
  setMetric(key, getMetric(key) + 1);
}

function updateMetricDisplay() {
  Object.keys(metricKeys).forEach((key) => {
    const element = document.getElementById(key);
    if (element) element.textContent = getMetric(key);
  });
}

function cleanList(value) {
  return value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(text) {
  return String(text || '').toLowerCase();
}

function getProfile(subject) {
  const lower = normalize(subject);
  return subjectProfiles.find((profile) => profile.match.some((term) => lower.includes(term))) || {
    match: [],
    focus: ['assignment review', 'notes review', 'deadline prep', 'study guide', 'project work'],
    action: 'Review the assignment instructions, organize notes, and complete the next highest-priority task.'
  };
}

function findSubjectForDeadline(deadline, classes, fallbackIndex) {
  const lowerDeadline = normalize(deadline);
  const exactMatch = classes.find((subject) => lowerDeadline.includes(normalize(subject)));
  if (exactMatch) return exactMatch;

  const profileMatch = classes.find((subject) => {
    const profile = getProfile(subject);
    return profile.match.some((term) => lowerDeadline.includes(term));
  });
  if (profileMatch) return profileMatch;

  return classes[fallbackIndex % classes.length] || 'Priority class';
}

function getDeadlineForSubject(subject, deadlines, fallbackIndex) {
  const lowerSubject = normalize(subject);
  const profile = getProfile(subject);
  const exactDeadline = deadlines.find((deadline) => normalize(deadline).includes(lowerSubject));
  if (exactDeadline) return exactDeadline;

  const profileDeadline = deadlines.find((deadline) => {
    const lowerDeadline = normalize(deadline);
    return profile.match.some((term) => lowerDeadline.includes(term));
  });
  if (profileDeadline) return profileDeadline;

  return deadlines[fallbackIndex % deadlines.length] || `next ${subject} assignment`;
}

function getFocusForSubject(subject, index) {
  const profile = getProfile(subject);
  return profile.focus[index % profile.focus.length];
}

function getActionForSubject(subject) {
  return getProfile(subject).action;
}

function getTimeBlock(preference, index) {
  const options = {
    Morning: ['9:00 AM', '10:30 AM', '8:30 AM', '9:30 AM'],
    Afternoon: ['1:00 PM', '2:30 PM', '3:30 PM', '12:30 PM'],
    Evening: ['6:00 PM', '7:30 PM', '8:00 PM', '6:30 PM'],
    Mixed: ['10:00 AM', '2:00 PM', '6:30 PM', '4:00 PM'],
  };
  return options[preference][index % options[preference].length];
}

function getStressRecommendation(stress) {
  if (stress === 'Extreme') {
    return 'Use shorter blocks, schedule a reset break after every study session, and focus only on the most urgent deadlines first.';
  }
  if (stress === 'High') {
    return 'Limit multitasking, use 45-minute work blocks, and leave at least one recovery window open during the week.';
  }
  if (stress === 'Moderate') {
    return 'Use consistent study blocks and review your plan halfway through the week before stress builds up.';
  }
  return 'Keep the routine simple and use reminders to stay ahead before deadlines get close.';
}

function getPriority(index, totalSessions, stress) {
  if (index === 0 || stress === 'Extreme') return { label: 'High Priority', className: 'priority-high' };
  if (index <= Math.ceil(totalSessions / 2) || stress === 'High') return { label: 'Medium Priority', className: 'priority-medium' };
  return { label: 'Low Priority', className: 'priority-low' };
}

function getWorkload(totalHours, stress) {
  if (totalHours >= 16 || stress === 'Extreme') return 'Heavy';
  if (totalHours >= 9 || stress === 'High') return 'Moderate';
  return 'Light';
}

function generatePlan(data) {
  const classes = cleanList(data.classes);
  const deadlines = cleanList(data.deadlines);
  const totalHours = Math.max(1, Number(data.hours));
  const sessions = Math.min(7, Math.max(3, Math.ceil(totalHours / 2)));
  const hoursPerSession = Math.max(1, Math.round((totalHours / sessions) * 10) / 10);

  const prioritySubjects = [];
  deadlines.forEach((deadline, index) => {
    const subject = findSubjectForDeadline(deadline, classes, index);
    if (!prioritySubjects.includes(subject)) prioritySubjects.push(subject);
  });
  classes.forEach((subject) => {
    if (!prioritySubjects.includes(subject)) prioritySubjects.push(subject);
  });

  const blocks = Array.from({ length: sessions }, (_, index) => {
    const day = dayTemplates[index];
    const time = getTimeBlock(data.studyTime, index);
    const subject = prioritySubjects[index % prioritySubjects.length] || 'Priority class';
    const deadline = getDeadlineForSubject(subject, deadlines, index);
    const focus = getFocusForSubject(subject, index);
    const action = getActionForSubject(subject);
    const priority = getPriority(index, sessions, data.stress);
    return { day, time, subject, deadline, focus, action, hours: hoursPerSession, priority };
  });

  return { blocks, hoursPerSession, totalHours, classes, deadlines, workload: getWorkload(totalHours, data.stress) };
}

function renderPlan(data, plan) {
  const blocksHtml = plan.blocks.map((block) => `
    <div class="plan-item">
      <strong>${block.day}<br>${block.time}</strong>
      <span>
        <span class="priority-badge ${block.priority.className}">${block.priority.label}</span><br>
        <b>${block.subject}</b> — ${block.hours} hour(s)<br>
        Focus: ${block.focus}<br>
        Assignment: ${block.deadline}<br>
        <em>${block.action}</em>
      </span>
    </div>
  `).join('');

  const reminderText = `${data.support} should be sent before each study block, with one progress check-in near the end of the week.`;
  const stressText = getStressRecommendation(data.stress);
  const priorityText = `Start with ${plan.blocks[0]?.subject || 'your highest-priority class'} because it connects to ${plan.blocks[0]?.deadline || 'your closest deadline'}.`;

  planResult.innerHTML = `
    <div class="plan-card">
      <h3>${data.studentName}'s Updated Weekly StudySync Plan</h3>
      <p>This Test 2 version uses approximately <strong>${plan.totalHours} study hours</strong> across ${plan.blocks.length} focused sessions. Each daily focus is matched to the subject and assignment it supports.</p>
      <div class="plan-summary">
        <div class="summary-item"><strong>${plan.blocks.length}</strong><span>Sessions</span></div>
        <div class="summary-item"><strong>${plan.totalHours}</strong><span>Hours</span></div>
        <div class="summary-item"><strong>${data.stress}</strong><span>Stress</span></div>
        <div class="summary-item"><strong>${plan.workload}</strong><span>Workload</span></div>
      </div>
      <div class="plan-list">${blocksHtml}</div>
      <div class="recommendations">
        <div><strong>Priority</strong>${priorityText}</div>
        <div><strong>Stress Support</strong>${stressText}</div>
        <div><strong>Accountability</strong>${reminderText}</div>
      </div>
      <div class="calendar-note">
        <strong>📅 Calendar Integration Coming Soon</strong>
        Test 1 feedback showed that students wanted easier assignment tracking and reminders, so this version previews calendar syncing as the next major development step.
      </div>
    </div>
  `;

  latestPlanText = `${data.studentName}'s Updated Weekly StudySync Plan\n\n` +
    plan.blocks.map((block) => `${block.day} at ${block.time}: ${block.hours} hour(s) on ${block.subject}\nPriority: ${block.priority.label}\nFocus: ${block.focus}\nAssignment: ${block.deadline}\nAction: ${block.action}`).join('\n\n') +
    `\n\nWorkload: ${plan.workload}\nPriority: ${priorityText}\nStress Support: ${stressText}\nAccountability: ${reminderText}\nCalendar: Calendar integration coming soon.`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const plan = generatePlan(data);
  renderPlan(data, plan);
  emptyState.classList.add('hidden');
  planResult.classList.remove('hidden');
  resultActions.classList.remove('hidden');
  incrementMetric('plansGenerated');
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(latestPlanText);
    incrementMetric('copyCount');
    copyButton.textContent = 'Copied!';
    setTimeout(() => { copyButton.textContent = 'Copy Plan'; }, 1400);
  } catch (error) {
    alert('Copying was not available in this browser. You can highlight and copy the plan manually.');
  }
});

if (feedbackLink) {
  feedbackLink.addEventListener('click', () => incrementMetric('feedbackClicks'));
}

document.querySelectorAll('a[href*="docs.google.com/forms"]').forEach((link) => {
  link.addEventListener('click', () => incrementMetric('feedbackClicks'));
});

if (waitlistForm) {
  waitlistForm.addEventListener('submit', (event) => {
    event.preventDefault();
    incrementMetric('waitlistCount');
    waitlistForm.reset();
    waitlistMessage.classList.remove('hidden');
  });
}

updateMetricDisplay();
