function updatePreview(){
  const name = document.getElementById('rName').value || 'Your Name';
  const title = document.getElementById('rTitle').value || 'Professional Title';
  const summary = document.getElementById('rSummary').value || '';
  const skills = (localStorage.getItem('resume_skills') || '').split('|').filter(Boolean);
  const preview = document.getElementById('resumePreview');
  preview.innerHTML = `<h1>${name}</h1><div class="meta">${title}</div><div class="summary">${summary}</div><div class="skills"><strong>Skills:</strong> ${skills.map(s=>`<span class="skill-pill">${s}</span>`).join('')}</div>`;
}

document.getElementById('rName')?.addEventListener('input', updatePreview);
document.getElementById('rTitle')?.addEventListener('input', updatePreview);
document.getElementById('rSummary')?.addEventListener('input', updatePreview);

document.getElementById('addSkill')?.addEventListener('click', ()=>{
  const v = document.getElementById('rSkill').value.trim(); if(!v) return; const cur = (localStorage.getItem('resume_skills')||'').split('|').filter(Boolean); cur.push(v); localStorage.setItem('resume_skills', cur.join('|')); document.getElementById('rSkill').value=''; updatePreview();
});

document.getElementById('printResume')?.addEventListener('click', ()=>{
  window.print();
});

document.getElementById('clearResume')?.addEventListener('click', ()=>{
  document.getElementById('rName').value=''; document.getElementById('rTitle').value=''; document.getElementById('rSummary').value=''; localStorage.removeItem('resume_skills'); updatePreview();
});

updatePreview();
