let jobData = [];

async function fetchJobsFromBackend() {
  try {
    const res = await fetch('http://localhost:5001/api/jobs/all');
    if (!res.ok) throw new Error('Failed to fetch jobs');
    const backendJobs = await res.json();
    
    // Map backend jobs to frontend UI requirements dynamically
    const colors = [
      { lc:"#006699", lb:"#e6f2f8" }, { lc:"#ea4335", lb:"#fef0ef" }, { lc:"#3395ff", lb:"#eaf3ff" },
      { lc:"#86bc25", lb:"#f0f8e6" }, { lc:"#fc8019", lb:"#fff3e8" }, { lc:"#e1251b", lb:"#fef0ef" },
      { lc:"#2874f0", lb:"#eaf0fe" }, { lc:"#003087", lb:"#e6eaf5" }
    ];
    
    jobData = backendJobs.map((j, i) => {
      const colorSet = colors[i % colors.length];
      return {
        id: j._id,
        title: j.title || "Position",
        company: j.company || "Company",
        logo: (j.company || "C").substring(0, 2).toUpperCase(),
        lc: colorSet.lc,
        lb: colorSet.lb,
        type: "full", // defaulting for UI since not in backend schema
        cat: "eng",   // defaulting for UI
        tags: j.skills && j.skills.length > 0 ? j.skills : ["General"],
        salary: "₹15L+", // Default mock wage
        period: "/yr",
        loc: j.location || "Remote",
        date: "Today",
        featured: i < 2 // Feature the first two
      };
    });
  } catch (err) {
    console.error("Error fetching jobs from backend:", err);
    // Fallback if backend is not running
    jobData = [];
  }
}

function jobCardHTML(j, highlight='') {
  function hl(str) {
    if (!highlight) return str;
    const re = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')})`, 'gi');
    return str.replace(re, '<mark>$1</mark>');
  }
  return `
    <div class="job-row${j.featured?' featured':''}">
      <div class="jlogo" style="background:${j.lb};color:${j.lc}">${j.logo}</div>
      <div class="jinfo">
        <div class="jinfo-top">
          <span class="jtitle">${hl(j.title)}</span>
          ${j.featured?'<span class="badge b-featured">Featured</span>':''}
          <span class="badge ${j.type==='intern'?'b-intern':'b-full'}">${j.type==='intern'?'Internship':'Full-time'}</span>
          ${j.loc.includes('Remote')?'<span class="badge b-remote">Remote</span>':''}
          ${j.loc.includes('Hybrid')?'<span class="badge b-hybrid">Hybrid</span>':''}
        </div>
        <div class="jcomp">${hl(j.company)} &nbsp;·&nbsp; ${j.loc}</div>
        <div class="jtags">${j.tags.map(t=>`<span class="jtag">${hl(t)}</span>`).join('')}</div>
      </div>
      <div class="jmeta">
        <div class="jsalary">${j.salary} <small>${j.period}</small></div>
        <div class="jdate">${j.date}</div>
        <button class="apply-btn" onclick="openModal('${j.title}','${j.company}')">Apply Now</button>
      </div>
    </div>`;
}

function renderJobs(filter) {
  const list = (!filter || filter==='all') ? jobData : jobData.filter(j => j.type===filter || j.cat===filter);
  const container = document.getElementById('jobsContainer');
  container.innerHTML = list.map(j => jobCardHTML(j)).join('');
  staggerAnimate(container, '.job-row', 70);
}

// --- SEARCH LOGIC ---
let searchTimeout = null;

function getSearchTerms() {
  return {
    kw: document.getElementById('searchKeyword').value.trim().toLowerCase(),
    loc: document.getElementById('searchLocation').value.trim().toLowerCase(),
    lvl: document.getElementById('searchLevel').value.toLowerCase()
  };
}

function matchJob(j, kw, loc, lvl) {
  const inTitle = j.title.toLowerCase().includes(kw);
  const inCompany = j.company.toLowerCase().includes(kw);
  const inTags = j.tags.some(t => t.toLowerCase().includes(kw));
  const kwMatch = !kw || inTitle || inCompany || inTags;
  const locMatch = !loc || j.loc.toLowerCase().includes(loc);
  const lvlMatch = !lvl || (lvl.includes('intern') && j.type==='intern') || (lvl.includes('entry') && j.type==='full') || (lvl.includes('mid') && j.type==='full') || (lvl.includes('senior') && j.type==='full') || true;
  return kwMatch && locMatch;
}

function handleSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(showDropdown, 120);
}

function handleSearchKey(e) {
  if (e.key === 'Enter') { closeDropdown(); runFullSearch(); }
  if (e.key === 'Escape') closeDropdown();
}

function showDropdown() {
  const { kw, loc } = getSearchTerms();
  const dd = document.getElementById('searchDropdown');
  if (!kw && !loc) { closeDropdown(); return; }
  const matches = jobData.filter(j => matchJob(j, kw, loc));
  let html = `<div class="sd-header">Suggested Roles</div>`;
  if (matches.length === 0) {
    html += `<div class="sd-empty">No results for "<strong>${kw || loc}</strong>" — try a different keyword.</div>`;
  } else {
    html += matches.slice(0,5).map(j => `
      <div class="sd-item" onclick="selectSuggestion('${j.title}','${j.company}')">
        <div class="sd-logo" style="background:${j.lb};color:${j.lc}">${j.logo}</div>
        <div class="sd-info">
          <div class="sd-title">${highlight(j.title, kw)}</div>
          <div class="sd-meta">${j.company} · ${j.loc} · <span class="badge ${j.type==='intern'?'b-intern':'b-full'}" style="font-size:0.65rem;padding:0.1rem 0.4rem">${j.type==='intern'?'Internship':'Full-time'}</span></div>
        </div>
        <div class="sd-salary">${j.salary}<small style="font-size:0.68rem;color:var(--gray-400);font-weight:400">${j.period}</small></div>
      </div>`).join('');
    if (matches.length > 5) html += `<div class="sd-footer" onclick="runFullSearch()">View all ${matches.length} results →</div>`;
  }
  dd.innerHTML = html;
  dd.classList.add('visible');
}

function highlight(str, term) {
  if (!term) return str;
  const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')})`, 'gi');
  return str.replace(re, '<mark>$1</mark>');
}

function closeDropdown() {
  document.getElementById('searchDropdown').classList.remove('visible');
}

function selectSuggestion(title, company) {
  document.getElementById('searchKeyword').value = title;
  closeDropdown();
  runFullSearch();
}

function runFullSearch() {
  closeDropdown();
  const { kw, loc } = getSearchTerms();
  if (!kw && !loc) { clearSearch(); return; }
  const matches = jobData.filter(j => matchJob(j, kw, loc));
  const section = document.getElementById('searchResultsSection');
  const container = document.getElementById('searchResultsContainer');
  const title = document.getElementById('searchResultsTitle');
  const queryParts = [kw, loc].filter(Boolean);
  title.textContent = `"${queryParts.join(' · ')}" — ${matches.length} result${matches.length!==1?'s':''}`;
  if (matches.length === 0) {
    container.innerHTML = `<div style="background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius);padding:3rem;text-align:center;color:var(--gray-400)"><div style="font-size:2rem;margin-bottom:0.75rem">🔍</div><div style="font-weight:700;color:var(--navy);margin-bottom:0.4rem">No jobs found</div><div style="font-size:0.875rem">Try different keywords or broaden your location filter.</div></div>`;
  } else {
    container.innerHTML = matches.map(j => jobCardHTML(j, kw)).join('');
    // animate newly-rendered result cards
    staggerAnimate(container, '.job-row', 50);
  }
  section.classList.add('visible');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearSearch() {
  document.getElementById('searchKeyword').value = '';
  document.getElementById('searchLocation').value = '';
  document.getElementById('searchLevel').value = '';
  document.getElementById('searchResultsSection').classList.remove('visible');
  closeDropdown();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  if (!document.getElementById('searchWrapper').contains(e.target)) closeDropdown();
});

const companies = [
  { name:"Tata Consultancy Services", short:"TCS", ind:"IT Services & Consulting", lc:"#003893", lb:"#e6ecf7", banner:"#0d1f3c", employees:"600K+", openings:"142", rating:"4.1" },
  { name:"Infosys", short:"IN", ind:"Software & Technology", lc:"#006699", lb:"#e6f2f8", banner:"#0a1e2e", employees:"335K+", openings:"89", rating:"3.9" },
  { name:"Google India", short:"G", ind:"Technology", lc:"#ea4335", lb:"#fef0ef", banner:"#1e0d0a", employees:"50K+", openings:"48", rating:"4.6" },
  { name:"Flipkart", short:"FK", ind:"E-Commerce", lc:"#2874f0", lb:"#eaf0fe", banner:"#0a1220", employees:"30K+", openings:"67", rating:"4.0" },
  { name:"Deloitte India", short:"DL", ind:"Professional Services", lc:"#86bc25", lb:"#f0f8e6", banner:"#141e0a", employees:"80K+", openings:"110", rating:"4.2" },
  { name:"Amazon India", short:"AM", ind:"E-Commerce & Cloud", lc:"#ff9900", lb:"#fff6e6", banner:"#1e1500", employees:"90K+", openings:"95", rating:"4.0" },
  { name:"Wipro", short:"WI", ind:"IT & Consulting", lc:"#5a2d82", lb:"#f3edf9", banner:"#16082a", employees:"250K+", openings:"76", rating:"3.8" },
  { name:"HDFC Bank", short:"HD", ind:"Banking & Finance", lc:"#004c8f", lb:"#e6eff9", banner:"#021528", employees:"170K+", openings:"54", rating:"4.3" },
];

function renderCompanies() {
  const grid = document.getElementById('companyGrid');
  grid.innerHTML = companies.map(c => `
    <div class="comp-card">
      <div class="comp-banner" style="background:${c.banner}">
        <div class="comp-logo-wrap" style="background:${c.lb};color:${c.lc}">${c.short}</div>
      </div>
      <div class="comp-body">
        <div class="comp-name">${c.name}</div>
        <div class="comp-industry">${c.ind}</div>
        <div class="comp-stats">
          <div class="cs"><span class="cs-num">${c.employees}</span><span class="cs-lbl">Employees</span></div>
          <div class="cs"><span class="cs-num">${c.openings}</span><span class="cs-lbl">Open Roles</span></div>
          <div class="cs"><span class="cs-num">★ ${c.rating}</span><span class="cs-lbl">Rating</span></div>
        </div>
        <button class="view-btn">View Company Profile</button>
      </div>
    </div>`).join('');
    // mark company cards for the slightly slower entrance animation
    staggerAnimate(grid, '.comp-card', 90, true);
}

function filterChip(el, type) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderJobs(type);
}

function openModal(title, company) {
  document.getElementById('modalTitle').textContent = 'Apply — ' + title;
  document.getElementById('modalSub').textContent = company + ' · Submit your application below.';
  document.getElementById('applyOverlay').classList.add('open');
}
function closeModal(e) { if (e.target === document.getElementById('applyOverlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('applyOverlay').classList.remove('open'); }
// --- AI AUTO APPLY MODAL LOGIC ---
function submitApp() {
  closeModalDirect();
  alert('✅ Application submitted successfully!\n\nThe hiring team will be in touch within 5 business days.');
}

function openAiModal() {
  document.getElementById('aiApplyOverlay').classList.add('open');
  document.getElementById('aiSkillsInput').value = '';
  document.getElementById('aiStatus').style.display = 'none';
  document.getElementById('aiSubmitBtn').disabled = false;
  document.getElementById('aiSubmitBtn').textContent = 'Deploy Agent 🚀';
}
function closeAiModal(e) { if (e.target === document.getElementById('aiApplyOverlay')) closeAiModalDirect(); }
function closeAiModalDirect() { document.getElementById('aiApplyOverlay').classList.remove('open'); }

async function submitAiApp() {
  const skills = document.getElementById('aiSkillsInput').value.trim();
  if (!skills) return alert('Please enter your skills to proceed.');
  
  const statusBox = document.getElementById('aiStatus');
  const submitBtn = document.getElementById('aiSubmitBtn');
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Agent Running...';
  statusBox.style.display = 'block';
  statusBox.style.background = '#eaf3ff';
  statusBox.style.color = '#006699';
  statusBox.innerHTML = 'Connecting to Google Gemini to scan jobs...';

  try {
    // 1. Create a dynamic dummy user to get an ID for the application
    let randomNum = Math.floor(Math.random() * 9999);
    await fetch('http://localhost:5001/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "AI Applicant", email: `temp${randomNum}@ai.com`, password: "123", role: "student" })
    });

    const loginRes = await fetch('http://localhost:5001/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `temp${randomNum}@ai.com`, password: "123" })
    });
    
    if (!loginRes.ok) throw new Error("Failed to authenticate AI user.");
    const loginData = await loginRes.json();
    const userId = loginData.user._id;

    statusBox.innerHTML = 'Analyzing requirements... matching skills...';
    
    // 2. Actually trigger the auto-apply agent!
    const agentRes = await fetch('http://localhost:5001/api/agent/auto-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, studentSkills: skills })
    });

    if (!agentRes.ok) throw new Error("Agent failed completely.");
    const agentData = await agentRes.json();

    // 3. Show Results!
    statusBox.style.background = '#e6f8df';
    statusBox.style.color = '#2e7d32';
    statusBox.innerHTML = `✅ <b>Agent Finished!</b><br>Scanned Jobs: ${agentData.scannedJobsCount}<br><b>Successfully Applied to: ${agentData.autoAppliedCount} matching jobs!</b>`;
    submitBtn.textContent = 'Mission Accomplished';
  } catch (err) {
    statusBox.style.background = '#fef0ef';
    statusBox.style.color = '#d32f2f';
    statusBox.innerHTML = `❌ Error: ${err.message}`;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Retry Deploy 🚀';
  }
}


// Stagger + IntersectionObserver helper to animate lists on load and when scrolled into view
function staggerAnimate(containerOrEl, childSelector, baseDelay = 70, isComp){
  const container = (typeof containerOrEl === 'string') ? document.querySelector(containerOrEl) : containerOrEl;
  if (!container) return;
  const items = container.querySelectorAll(childSelector);
  items.forEach((el, i) => {
    el.style.animationDelay = (i * baseDelay) + 'ms';
    if (isComp) el.classList.add('comp-will-animate'); else el.classList.add('will-animate');
  });
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('card-animate');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(it => io.observe(it));
}

// kick off initial renders and micro-animations
fetchJobsFromBackend().then(() => {
  renderJobs();
});
renderCompanies();

// animate small brand element
document.querySelectorAll('.logo-icon').forEach(l => l.classList.add('animate'));

// Check Login Session
const loggedInUser = localStorage.getItem("userEmail");
if (loggedInUser) {
  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    navActions.innerHTML = `
      <span style="margin-right:1.5rem; font-weight:600; color:var(--navy);">👋 Welcome, ${loggedInUser.split('@')[0]}!</span>
      <button class="btn-ghost" onclick="localStorage.removeItem('userEmail'); window.location.reload();">Logout</button>
    `;
  }
}
