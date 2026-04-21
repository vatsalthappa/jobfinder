// sample salary dataset (demo)
const salaryData = [
  {role:'Software Engineer', company:'Infosys', loc:'Pune', median:2400000, low:1500000, high:3200000},
  {role:'Frontend Engineer', company:'Swiggy', loc:'Bengaluru', median:1800000, low:1200000, high:2400000},
  {role:'Data Scientist', company:'Flipkart', loc:'Bengaluru', median:2800000, low:1800000, high:4200000},
  {role:'Product Designer', company:'Razorpay', loc:'Remote', median:2000000, low:1400000, high:2600000},
  {role:'Data Science Intern', company:'Google India', loc:'Bengaluru', median:60000, low:30000, high:90000}
];

function fmtINR(n){ if(n<100000) return '₹'+(n).toLocaleString(); return '₹'+(Math.round(n/1000)/1000).toLocaleString()+ 'L'; }

function populateRoles(){
  const roles = Array.from(new Set(salaryData.map(s=>s.role)));
  const sel = document.getElementById('roleSelect'); sel.innerHTML = '<option value="">All Roles</option>'+roles.map(r=>`<option>${r}</option>`).join('');
}

function renderTable(filtered){
  const tbody = document.querySelector('#salaryTable tbody');
  tbody.innerHTML = filtered.map(s=>`<tr><td>${s.role}</td><td>${s.company}</td><td>${s.loc}</td><td>${fmtINR(s.median)}</td><td class="salary-row-range">${fmtINR(s.low)} — ${fmtINR(s.high)}</td></tr>`).join('');
}

function runLookup(){
  const role = document.getElementById('roleSelect').value;
  const loc = document.getElementById('locInput').value.trim().toLowerCase();
  let list = salaryData.filter(s => (!role || s.role===role) && (!loc || s.loc.toLowerCase().includes(loc)));
  if(list.length===0) list = salaryData;
  renderTable(list);
  const avg = Math.round(list.reduce((a,b)=>a+b.median,0)/list.length);
  document.getElementById('salarySummary').innerHTML = `<strong>Median salary (sample):</strong> ${fmtINR(avg)} · ${list.length} item(s)`;
}

document.getElementById('runLookup')?.addEventListener('click', runLookup);
document.getElementById('exportSalary')?.addEventListener('click', ()=>{
  const rows = [['Role','Company','Location','Median','Low','High']];
  salaryData.forEach(s=>rows.push([s.role,s.company,s.loc,s.median,s.low,s.high]));
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='salaries.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

populateRoles(); runLookup();
