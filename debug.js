
// --- DATA LISTS ---
const DATA = {
  languages: ["English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Gujarati", "Urdu", "Kannada", "Odia", "Malayalam", "Punjabi", "Spanish", "French", "German", "Mandarin"],
  speciality: ["Cardiology", "Dermatology", "Endocrinology", "Gastroenterology", "General Medicine", "Gynaecology", "Neurology", "Ophthalmology", "Orthopedics", "Pediatrics", "Psychiatry", "Radiology", "Urology", "Oncology", "Nephrology", "General Surgery"],
  designation: ["Consultant", "Senior Consultant", "Medical Director", "Chief Surgeon", "HOD", "Resident Doctor", "Associate Professor", "Clinical Lead", "Visiting Consultant"],
  qualifications: ["MBBS", "MD", "MS", "DNB", "DM", "MCh", "Diploma", "BDS", "MDS", "PhD", "Fellowship", "Other"]
};

// Initialization moved to the end of the script block

// --- SEARCHABLE DROPDOWNS ---
function initDropdown(id, isMulti = false) {
  const wrap = document.getElementById(`sd-${id}`);
  const inp = document.getElementById(`inp-${id}`);
  const list = document.getElementById(`list-${id}`);
  const pills = document.getElementById(`pills-${id}`);
  let selected = [];

  function renderList(filter = '') {
    const filtered = DATA[id].filter(opt => opt.toLowerCase().includes(filter.toLowerCase()) && !selected.includes(opt));
    list.innerHTML = filtered.map(opt => `<div class="sd-opt" onclick="selectOpt('${id}', '${opt}', ${isMulti})">${opt}</div>`).join('');
    list.style.display = filtered.length ? 'block' : 'none';
  }

  inp.onfocus = () => renderList(inp.value);
  inp.oninput = () => renderList(inp.value);
  
  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) list.style.display = 'none';
  });

  window.selectOpt = (dropdownId, val, multi) => {
    const dInp = document.getElementById(`inp-${dropdownId}`);
    const dList = document.getElementById(`list-${dropdownId}`);
    const dPills = document.getElementById(`pills-${dropdownId}`);
    
    if (multi) {
      if (!selected.includes(val)) {
        selected.push(val);
        const p = document.createElement('div');
        p.className = 'lang-pill';
        p.style.margin = '0';
        p.innerHTML = `${val} <button onclick="removeSelected('${dropdownId}', '${val}')">×</button>`;
        dPills.appendChild(p);
      }
      dInp.value = '';
    } else {
      dInp.value = val;
    }
    dList.style.display = 'none';
    calcCompletion();
  };

  window.removeSelected = (dropdownId, val) => {
    selected = selected.filter(x => x !== val);
    const dPills = document.getElementById(`pills-${dropdownId}`);
    Array.from(dPills.children).forEach(c => {
      if (c.textContent.includes(val)) c.remove();
    });
    calcCompletion();
  };
}

// --- MAP & LOCATION SEARCH ---
let map, marker, searchTimeout;
const mapSearchInp = document.getElementById('map-search');
const mapResults = document.getElementById('map-search-results');

function initMap() {
  try {
    map = L.map('profile-map').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    marker = L.marker([28.6139, 77.2090], {draggable:true}).addTo(map);
    map.on('click', e => { marker.setLatLng(e.latlng); reverseGeocode(e.latlng.lat, e.latlng.lng); });
    marker.on('dragend', e => { const ll=e.target.getLatLng(); reverseGeocode(ll.lat, ll.lng); });
  } catch(e) { console.error('Leaflet Init Error:', e); }
}

mapSearchInp.oninput = () => {
  clearTimeout(searchTimeout);
  const q = mapSearchInp.value.trim();
  if (q.length < 3) { mapResults.style.display='none'; return; }
  searchTimeout = setTimeout(() => execMapSearch(q), 400);
};

async function execMapSearch(q) {
  mapResults.innerHTML = '<div class="ms-loading">Searching local areas...</div>';
  mapResults.style.display = 'block';
  try {
    const ep = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&countrycodes=in&limit=6`;
    const r = await fetch(ep, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });
    const results = await r.json();
    if (!results.length) { 
      mapResults.innerHTML = '<div class="ms-loading">No results found in India</div>';
      return; 
    }
    
    mapResults.innerHTML = results.map(res => `
      <div class="ms-item" onclick="selectMapResult(${res.lat}, ${res.lon}, '${res.display_name.replace(/'/g, "\\'")}')">
        <strong>${res.name || 'Location'}</strong><br/>
        <span style="font-size:.72rem;opacity:.8;">${res.display_name}</span>
      </div>
    `).join('');
  } catch(e) { 
    console.warn(e);
    mapResults.innerHTML = '<div class="ms-loading" style="color:var(--danger)">Search failed. Please try manual pinning.</div>';
  }
}

window.selectMapResult = (lat, lng, name) => {
  const ll = [lat, lng];
  map.setView(ll, 16);
  marker.setLatLng(ll);
  mapResults.style.display = 'none';
  mapSearchInp.value = name;
  reverseGeocode(lat, lng);
};

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
    const d = await r.json();
    const a = d.address || {};
    document.getElementById('p-address').value = d.display_name || '';
    document.getElementById('p-state').value = a.state || '';
    document.getElementById('p-city').value = a.city || a.town || a.village || a.suburb || '';
    document.getElementById('p-zip').value = a.postcode || '';
    document.getElementById('p-street').value = a.road || a.quarter || '';
    calcCompletion();
  } catch(err) { console.warn(err); }
}

// --- PHOTO LOGIC ---
function handlePhotoUpload(input) {
  if(!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('photo-preview');
    prev.style.backgroundImage = `url(${e.target.result})`;
    prev.style.backgroundSize = 'cover';
    prev.style.backgroundPosition = 'center';
    prev.style.color = 'transparent';
    document.getElementById('btn-photo-remove').style.display = 'block';
  };
  reader.readAsDataURL(input.files[0]);
}

function removePhoto() {
  const prev = document.getElementById('photo-preview');
  prev.style.backgroundImage = '';
  prev.style.color = '';
  document.getElementById('btn-photo-remove').style.display = 'none';
  document.getElementById('file-photo').value = '';
}

// switchTab moved to the end of the script block

function toggleCard(id) {
  const body = document.getElementById(`body-${id}`);
  const chev = document.getElementById(`chev-${id}`);
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  chev?.classList.toggle('open', !isOpen);
}

function updateBioCount() {
  const len = document.getElementById('p-bio').value.length;
  document.getElementById('bio-count').textContent = len;
}

const tracked = ['p-fname','p-lname','p-gender','p-dob','p-email','p-phone','p-address','p-zip','p-exp','p-bio'];
function calcCompletion() {
  const filled = tracked.filter(id => { const el=document.getElementById(id); return el && el.value.trim(); }).length;
  const pct = Math.round((filled/tracked.length)*100);
  document.getElementById('completion-pct').textContent = pct+'%';
  document.getElementById('completion-ring').style.setProperty('--pct', pct);
}

function saveProfile() {
  toast('Profile saved successfully!', 'success');
  setTimeout(()=> window.location.href='doctor.html', 1000);
}

function toast(msg, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type==='success'?'✓':'ℹ'}</span> ${msg}`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// --- CLINIC FORM LOGIC ---
let clinicMap, clinicMarker, cSearchTimeout;
const clinicTags = { amenities: [], services: [] };

window.showClinicForm = function(id = null) {
  document.getElementById('clinic-list-view').style.display = 'none';
  const fv = document.getElementById('clinic-form-view');
  fv.style.display = 'flex';
  document.getElementById('form-clinic-title').textContent = id ? 'Edit Clinic Details' : 'Register New Clinic';
  
  // Hide main footer CTA bar on register form via layout state
  document.querySelector('.p-layout')?.classList.add('clinic-form-active');
  
  if (!clinicMap) {
    initClinicMap();
  } else {
    setTimeout(() => clinicMap.invalidateSize(), 150);
  }
};

window.hideClinicForm = function() {
  document.getElementById('clinic-form-view').style.display = 'none';
  document.getElementById('clinic-list-view').style.display = 'flex';
  
  // Show main footer CTA bar when back to list
  document.querySelector('.p-layout')?.classList.remove('clinic-form-active');
};

function initClinicMap() {
  try {
    clinicMap = L.map('clinic-map').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(clinicMap);
    clinicMarker = L.marker([28.6139, 77.2090], {draggable:true}).addTo(clinicMap);
    
    clinicMap.on('click', e => { 
      clinicMarker.setLatLng(e.latlng); 
      reverseGeocodeClinic(e.latlng.lat, e.latlng.lng); 
    });
    clinicMarker.on('dragend', e => { 
      const ll = e.target.getLatLng(); 
      reverseGeocodeClinic(ll.lat, ll.lng); 
    });
  } catch(e) { console.error('Clinic Map Init Error:', e); }

  const cInp = document.getElementById('c-map-search');
  const cRes = document.getElementById('c-map-results');

  cInp.oninput = () => {
    clearTimeout(cSearchTimeout);
    const q = cInp.value.trim();
    if (q.length < 3) { cRes.style.display='none'; return; }
    cSearchTimeout = setTimeout(async () => {
      cRes.innerHTML = '<div class="ms-loading">Searching...</div>';
      cRes.style.display = 'block';
      try {
        const ep = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&countrycodes=in&limit=5`;
        const r = await fetch(ep);
        const results = await r.json();
        if (!results.length) { cRes.innerHTML = '<div class="ms-loading">No results</div>'; return; }
        cRes.innerHTML = results.map(res => `
          <div class="ms-item" onclick="selectClinicMapResult(${res.lat}, ${res.lon}, '${res.display_name.replace(/'/g, "\\'")}')">
            ${res.display_name}
          </div>
        `).join('');
      } catch(e) { cRes.style.display='none'; }
    }, 400);
  };
}

window.selectClinicMapResult = (lat, lng, name) => {
  const ll = [lat, lng];
  clinicMap.setView(ll, 16);
  clinicMarker.setLatLng(ll);
  document.getElementById('c-map-results').style.display = 'none';
  document.getElementById('c-map-search').value = name;
  reverseGeocodeClinic(lat, lng);
};

async function reverseGeocodeClinic(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
    const d = await r.json();
    const a = d.address || {};
    document.getElementById('c-address').value = d.display_name || '';
    document.getElementById('c-zip').value = a.postcode || '';
    document.getElementById('c-state').value = a.state || '';
    document.getElementById('c-city').value = a.city || a.town || '';
  } catch(e) {}
}

window.addClinicTag = function(type) {
  const inp = document.getElementById(`inp-${type.slice(0, -3)}`);
  const val = inp.value.trim();
  if (!val || clinicTags[type].includes(val)) return;
  clinicTags[type].push(val);
  renderClinicTags(type);
  inp.value = '';
};

function renderClinicTags(type) {
  const container = document.getElementById(`${type}-container`);
  if (!clinicTags[type].length) {
    container.innerHTML = '<div style="color:var(--text-3); font-size:.8rem;">No tags added</div>';
    return;
  }
  container.innerHTML = clinicTags[type].map(tag => `
    <div class="tag">${tag} <button onclick="removeClinicTag('${type}', '${tag}')">×</button></div>
  `).join('');
}

window.removeClinicTag = (type, val) => {
  clinicTags[type] = clinicTags[type].filter(t => t !== val);
  renderClinicTags(type);
};

// --- CLINIC MEDIA ---
window.handleClinicMedia = function(input, type) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const prev = document.getElementById(`c-${type}-preview`);
    prev.style.backgroundImage = `url(${ev.target.result})`;
    prev.style.backgroundSize = 'cover';
    prev.style.backgroundPosition = 'center';
    prev.innerHTML = '';
  };
  reader.readAsDataURL(input.files[0]);
};

// --- SERVICE OFFERINGS LOGIC ---
const STORAGE_KEYS = {
  SERVICES: 'nc_services_data',
  SCHEDULE: 'nc_schedule_data',
  BLOCKS: 'nc_blocks_data'
};

let servicesData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || [
  { id: 1, type: 'consultation', modes: ['in-clinic'], price: 500, discount: 450, duration: 30 },
  { id: 2, type: 'followup', modes: ['video'], price: 300, discount: null, duration: 15 }
];
let editingServiceId = null;

window.openServiceManager = function() {
  document.getElementById('service-manager-modal').style.display = 'flex';
  renderServices();
};

window.closeServiceManager = function() {
  document.getElementById('service-manager-modal').style.display = 'none';
};

window.renderServices = function(filter = 'all') {
  const list = document.getElementById('service-list');
  const filtered = filter === 'all' ? servicesData : servicesData.filter(s => s.type === filter);
  
  if (!filtered.length) {
    list.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-3); font-size:.9rem;">No services found. Click "+ Add Service Offering" to create one.</div>';
    return;
  }

  list.innerHTML = filtered.map(s => `
    <div class="sm-list-item">
      <div class="sm-item-info">
        <div class="sm-item-name">${s.type}</div>
        <div class="sm-item-meta">
          Rs. ${s.price} <div class="sm-item-dots"></div> 
          ${s.duration}m <div class="sm-item-dots"></div> 
          ${s.modes.join(' & ')}
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-icon" onclick="openCreateService(${s.id})">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon" style="color:#FF4D6A;" onclick="deleteServiceOffering(${s.id})">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');
};

window.filterServices = function(type, el) {
  document.querySelectorAll('.sm-side-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sm-list-title').textContent = type === 'all' ? 'All Service Offerings' : (type.charAt(0).toUpperCase() + type.slice(1) + ' Offerings');
  renderServices(type);
};

window.openCreateService = function(id = null) {
  editingServiceId = id;
  const modal = document.getElementById('create-service-modal');
  modal.style.display = 'flex';
  
  // Reset form
  document.getElementById('create-service-title').textContent = id ? 'Edit Service' : 'Create Service';
  document.querySelectorAll('input[name="srv-mode"]').forEach(c => c.checked = false);
  document.getElementById('srv-price').value = '';
  document.getElementById('srv-discount').value = '';
  document.getElementById('err-srv-mode').parentElement.classList.remove('has-error');

  if (id) {
    const s = servicesData.find(x => x.id === id);
    document.querySelector(`input[name="srv-type"][value="${s.type}"]`).checked = true;
    s.modes.forEach(m => {
      const chk = document.querySelector(`input[name="srv-mode"][value="${m}"]`);
      if (chk) chk.checked = true;
    });
    document.getElementById('srv-price').value = s.price;
    document.getElementById('srv-discount').value = s.discount || '';
    document.getElementById('srv-duration').value = s.duration;
  }
};

window.closeCreateService = function() {
  document.getElementById('create-service-modal').style.display = 'none';
};

window.saveServiceOffering = function() {
  const type = document.querySelector('input[name="srv-type"]:checked').value;
  const modes = Array.from(document.querySelectorAll('input[name="srv-mode"]:checked')).map(c => c.value);
  const price = document.getElementById('srv-price').value;
  const discount = document.getElementById('srv-discount').value;
  const duration = document.getElementById('srv-duration').value;

  if (!modes.length) {
    document.getElementById('field-srv-mode').classList.add('has-error');
    return;
  }
  if (!price) {
    toast('Price is required', 'warning');
    return;
  }

  const newSrv = {
    id: editingServiceId || Date.now(),
    type,
    modes,
    price: parseInt(price),
    discount: discount ? parseInt(discount) : null,
    duration: parseInt(duration)
  };

  if (editingServiceId) {
    const idx = servicesData.findIndex(x => x.id === editingServiceId);
    servicesData[idx] = newSrv;
    toast('Service updated', 'success');
  } else {
    servicesData.push(newSrv);
    toast('New service created', 'success');
  }

  closeCreateService();
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(servicesData));
  renderServices();
  populateSmServiceDropdown();
};

window.deleteServiceOffering = function(id) {
  if (!confirm('Are you sure you want to delete this service? It may be linked to existing schedules.')) return;
  servicesData = servicesData.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(servicesData));
  renderServices();
  populateSmServiceDropdown();
};


// --- SCHEDULE MANAGER LOGIC (ENHANCED) ---
let scheduleData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULE)) || [
  { id: 1, startTime: "09:00", endTime: "18:00", when: "week", days: [1, 2, 3, 4, 5], services: [1, 2], repeat: "off" }
];
let selectedSmDays = [1, 2, 3, 4, 5];
let selectedSmServices = [];
let smWhenMode = 'week';
let smRepeatMode = 'off';
let smRepeatInterval = 2;
let smEndDate = null;
let editingScheduleId = null;

// --- BLOCK CALENDAR LOGIC [NEW] ---
let blocksData = JSON.parse(localStorage.getItem(STORAGE_KEYS.BLOCKS)) || [];
let selectedBlockTimes = []; // [{ from: '09:00', to: '11:00' }]
let blockTimeMode = 'full'; // 'full' or 'time'
let editingBlockId = null;

window.showScheduleForm = function(id = null) {
  editingScheduleId = id;
  document.getElementById('availability-list-view').style.display = 'none';
  document.getElementById('availability-form-view').style.display = 'block';
  document.querySelector('.p-layout').classList.add('sm-form-active');
  
  // Reset/Populate form
  populateSmServiceDropdown();
  
  if (id) {
    const s = scheduleData.find(x => x.id === id);
    document.getElementById('sm-form-title').textContent = "Edit Schedule Slot";
    document.getElementById('sm-start-time').value = s.startTime;
    document.getElementById('sm-end-time').value = s.endTime;
    selectedSmServices = [...(s.services || [])];
    setWhenMode(s.when || 'week');
    selectedSmDays = [...(s.days || [])];
    if (s.when === 'day') document.getElementById('sm-single-date').value = s.date || '';
    setRepeatMode(s.repeat || 'off');
    smRepeatInterval = s.interval || 2;
    smEndDate = s.endDate || null;
  } else {
    document.getElementById('sm-form-title').textContent = "New Schedule Slot";
    document.getElementById('sm-start-time').value = "09:00";
    document.getElementById('sm-end-time').value = "14:00";
    selectedSmServices = [];
    setWhenMode('week');
    selectedSmDays = [1, 2, 3, 4, 5];
    setRepeatMode('off');
    smRepeatInterval = 2;
    smEndDate = null;
  }
  
  updateSmFormUI();
};

window.hideScheduleForm = function() {
  document.getElementById('availability-list-view').style.display = 'block';
  document.getElementById('availability-form-view').style.display = 'none';
  document.querySelector('.p-layout')?.classList.remove('sm-form-active');
  editingScheduleId = null;
};

function updateSmFormUI() {
  renderSmDayPicker();
  document.getElementById('sm-repeat-interval').textContent = smRepeatInterval;
  updateEndDateDisplay();
  
  // Update services text
  const textEl = document.getElementById('sm-selected-services-text');
  if (selectedSmServices.length === 0) {
    textEl.textContent = "Select services";
    textEl.style.color = 'var(--text-3)';
  } else {
    const names = selectedSmServices.map(sid => {
      const s = servicesData.find(x => x.id === sid);
      return s ? s.type : 'Service';
    });
    textEl.textContent = names.join(', ');
    textEl.style.color = 'var(--text-1)';
  }
}

window.setWhenMode = function(mode) {
  smWhenMode = mode;
  document.getElementById('btn-when-week').classList.toggle('active', mode === 'week');
  document.getElementById('btn-when-day').classList.toggle('active', mode === 'day');
  document.getElementById('sm-week-picker').style.display = mode === 'week' ? 'flex' : 'none';
  document.getElementById('sm-day-picker').style.display = mode === 'day' ? 'block' : 'none';
};

window.setRepeatMode = function(mode) {
  smRepeatMode = mode;
  document.getElementById('btn-repeat-off').classList.toggle('active', mode === 'off');
  document.getElementById('btn-repeat-custom').classList.toggle('active', mode === 'custom');
  document.getElementById('sm-custom-area').style.display = mode === 'custom' ? 'block' : 'none';
};

window.stepRepeat = function(delta) {
  smRepeatInterval = Math.max(1, smRepeatInterval + delta);
  document.getElementById('sm-repeat-interval').textContent = smRepeatInterval;
};

window.toggleEndDateSelection = function() {
  const inp = document.getElementById('sm-end-date-input');
  inp.showPicker();
};

window.updateEndDateDisplay = function() {
  const input = document.getElementById('sm-end-date-input');
  const status = document.getElementById('sm-end-status');
  const trigger = document.getElementById('btn-end-date-trigger');
  
  if (input.value) {
    smEndDate = input.value;
    status.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> <span>Until ${new Date(smEndDate).toLocaleDateString()}</span>`;
    trigger.textContent = "Change";
  } else {
    smEndDate = null;
    status.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M10 10c0-1.657 1.343-3 3-3s3 1.343 3 3c0 1.22-.733 2.27-1.786 2.73C14.157 11.2 13 10.15 13 9.4c0-.75 2.5-3.5 2.5-3.5"/></svg> <span>Forever</span>`;
    trigger.textContent = "+ Set date";
  }
};

window.toggleSmDay = function(day) {
  const idx = selectedSmDays.indexOf(day);
  if (idx > -1) selectedSmDays.splice(idx, 1);
  else selectedSmDays.push(day);
  renderSmDayPicker();
};

function renderSmDayPicker() {
  document.querySelectorAll('#sm-week-picker .day-circle').forEach((c, i) => {
    c.classList.toggle('active', selectedSmDays.includes(i));
  });
}

// Custom Multi-select Dropdown for Services
window.toggleSmServiceDropdown = function(e) {
  e.stopPropagation();
  const list = document.getElementById('sm-service-dropdown');
  const isOpen = list.style.display === 'block';
  list.style.display = isOpen ? 'none' : 'block';
};

function populateSmServiceDropdown() {
  const list = document.getElementById('sm-service-dropdown');
  if (!list) return;
  list.innerHTML = servicesData.map(s => `
    <div class="sd-opt ${selectedSmServices.includes(s.id) ? 'selected' : ''}" onclick="selectSmService(event, ${s.id})">
      <div style="display:flex; justify-content:space-between; width:100%;">
        <span>${s.type} - Rs.${s.price}</span>
        ${selectedSmServices.includes(s.id) ? '✓' : ''}
      </div>
    </div>
  `).join('');
}

window.selectSmService = function(e, id) {
  e.stopPropagation();
  const idx = selectedSmServices.indexOf(id);
  if (idx > -1) selectedSmServices.splice(idx, 1);
  else selectedSmServices.push(id);
  
  populateSmServiceDropdown();
  updateSmFormUI();
};

document.addEventListener('click', () => {
  const sList = document.getElementById('sm-service-dropdown');
  if (sList) sList.style.display = 'none';
});

window.saveSchedule = function() {
  const start = document.getElementById('sm-start-time').value;
  const end = document.getElementById('sm-end-time').value;
  
  // Validation
  const srvField = document.getElementById('field-sm-services');
  srvField.classList.toggle('has-error', selectedSmServices.length === 0);
  if (selectedSmServices.length === 0) return;

  if (smWhenMode === 'week' && selectedSmDays.length === 0) {
    toast('Please select at least one day', 'warning');
    return;
  }
  
  if (smWhenMode === 'day' && !document.getElementById('sm-single-date').value) {
    document.getElementById('sm-day-picker').classList.add('has-error');
    return;
  }

  const newSched = {
    id: editingScheduleId || Date.now(),
    startTime: start,
    endTime: end,
    when: smWhenMode,
    days: smWhenMode === 'week' ? [...selectedSmDays] : [],
    date: smWhenMode === 'day' ? document.getElementById('sm-single-date').value : null,
    services: [...selectedSmServices],
    repeat: smRepeatMode,
    interval: smRepeatMode === 'custom' ? smRepeatInterval : null,
    endDate: smRepeatMode === 'custom' ? smEndDate : null
  };

  if (editingScheduleId) {
    const idx = scheduleData.findIndex(x => x.id === editingScheduleId);
    scheduleData[idx] = newSched;
    toast('Schedule updated successfully', 'success');
  } else {
    scheduleData.unshift(newSched);
    toast('New schedule added', 'success');
  }

  hideScheduleForm();
  localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(scheduleData));
  renderSchedules();
};

window.deleteSchedule = function(id) {
  if (!confirm('Are you sure you want to delete this schedule slot?')) return;
  scheduleData = scheduleData.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(scheduleData));
  renderSchedules();
};

function renderSchedules() {
  const grid = document.getElementById('sm-sched-grid');
  const count = document.getElementById('sm-slot-count');
  if (!grid || !count) return;

  count.textContent = `${scheduleData.length} ${scheduleData.length === 1 ? 'CARD' : 'CARDS'}`;
  grid.innerHTML = scheduleData.length ? '' : '<div style="text-align:center; padding:40px; color:var(--text-3); font-size:.9rem; background:var(--bg-sidebar); border-radius:var(--r-lg); border:1px dashed var(--border);">No scheduled slots yet. Click "+ Add Schedule" to begin.</div>';

  scheduleData.forEach(s => {
    const card = document.createElement('div');
    card.className = 'sched-card';
    const srvNames = s.services.map(sid => {
      const srv = servicesData.find(x => x.id === sid);
      return srv ? srv.type : 'Service';
    }).join(', ');

    let repeatText = s.repeat === 'off' ? 'Does not repeat' : (s.repeat === 'custom' ? `Every ${s.interval} days` : 'Weekly');
    if (s.repeat === 'custom' && s.endDate) repeatText += ` until ${new Date(s.endDate).toLocaleDateString()}`;

    card.innerHTML = `
      <div class="sched-card-top">
        <div class="sched-time">${formatTime(s.startTime)} - ${formatTime(s.endTime)}</div>
        <div style="display:flex; gap:10px;">
          <button class="sb-ic" onclick="showScheduleForm(${s.id})" style="width:28px;height:28px;color:var(--text-2);"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="sb-ic" onclick="deleteSchedule(${s.id})" style="width:28px;height:28px;color:#FF6700;"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>
      </div>
      <div class="sched-services">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        ${srvNames}
      </div>
      ${s.when === 'week' ? `
      <div class="day-picker">
        ${['S','M','T','W','T','F','S'].map((d, i) => `<div class="day-circle ${s.days.includes(i) ? 'active' : ''}" style="width:30px;height:30px;font-size:.65rem;cursor:default;">${d}</div>`).join('')}
      </div>` : `
      <div style="font-size:.8rem; color:var(--text-2); display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        ${new Date(s.date).toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'})}
      </div>`}
      <div class="sched-meta">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
        ${repeatText}
      </div>
    `;
    grid.appendChild(card);
  });
}


function formatTime(time) {
  const [h, m] = time.split(':');
  const hh = parseInt(h);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// Initial Render moved to DOMContentLoaded listener

window.showBlockForm = function(id = null) {
  editingBlockId = id;
  document.getElementById('availability-list-view').style.display = 'none';
  document.getElementById('availability-form-view').style.display = 'none';
  document.getElementById('availability-block-form-view').style.display = 'block';
  document.querySelector('.p-layout').classList.add('sm-form-active');
  
  if (id) {
    const b = blocksData.find(x => x.id === id);
    document.getElementById('block-start-date').value = b.startDate || '';
    document.getElementById('block-end-date').value = b.endDate || '';
    setBlockTimeMode(b.allDay ? 'full' : 'time');
    selectedBlockTimes = [...(b.times || [])];
  } else {
    document.getElementById('block-start-date').value = '';
    document.getElementById('block-end-date').value = '';
    setBlockTimeMode('full');
    selectedBlockTimes = [{ from: '09:00', to: '11:00' }];
  }
  renderBlockTimeList();
  validateBlockForm();
};

window.hideBlockForm = function() {
  document.getElementById('availability-list-view').style.display = 'block';
  document.getElementById('availability-block-form-view').style.display = 'none';
  document.querySelector('.p-layout')?.classList.remove('sm-form-active');
  editingBlockId = null;
};

window.setBlockTimeMode = function(mode) {
  blockTimeMode = mode;
  document.getElementById('btn-block-full').classList.toggle('active', mode === 'full');
  document.getElementById('btn-block-time').classList.toggle('active', mode === 'time');
  document.getElementById('block-specific-times').style.display = mode === 'time' ? 'block' : 'none';
  validateBlockForm();
};

window.addBlockTimeRange = function() {
  selectedBlockTimes.push({ from: '09:00', to: '11:00' });
  renderBlockTimeList();
};

window.removeBlockTimeRange = function(idx) {
  selectedBlockTimes.splice(idx, 1);
  renderBlockTimeList();
};

function renderBlockTimeList() {
  const container = document.getElementById('block-time-list');
  if (!container) return;
  container.innerHTML = selectedBlockTimes.map((t, i) => `
    <div class="sm-block-time-item">
      <div class="sm-time-row" style="flex:1;">
        <div class="sm-time-field">
          <div class="sm-time-label">From</div>
          <input type="time" class="sm-time-val" value="${t.from}" onchange="updateBlockTime(${i}, 'from', this.value)">
        </div>
        <div class="sm-time-field">
          <div class="sm-time-label">To</div>
          <input type="time" class="sm-time-val" value="${t.to}" onchange="updateBlockTime(${i}, 'to', this.value)">
        </div>
      </div>
      <button class="btn-icon" onclick="removeBlockTimeRange(${i})" style="color:#FF4D6A; margin-left:8px;">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  `).join('');
}

window.updateBlockTime = function(idx, field, val) {
  selectedBlockTimes[idx][field] = val;
};

window.validateBlockForm = function() {
  const start = document.getElementById('block-start-date').value;
  const end = document.getElementById('block-end-date').value;
  const isValid = start && end;
  const btn = document.getElementById('btn-save-block');
  const icon = document.getElementById('block-save-icon');
  if (btn) {
    btn.classList.toggle('disabled', !isValid);
    btn.disabled = !isValid;
    if (icon) icon.style.opacity = isValid ? '1' : '0.4';
  }
};

window.saveBlock = function() {
  const start = document.getElementById('block-start-date').value;
  const end = document.getElementById('block-end-date').value;
  
  if (!start || !end) return;

  const newBlock = {
    id: editingBlockId || Date.now(),
    startDate: start,
    endDate: end,
    allDay: blockTimeMode === 'full',
    times: blockTimeMode === 'time' ? [...selectedBlockTimes] : []
  };

  if (editingBlockId) {
    const idx = blocksData.findIndex(x => x.id === editingBlockId);
    if (idx > -1) blocksData[idx] = newBlock;
    toast('Block updated', 'success');
  } else {
    blocksData.unshift(newBlock);
    toast('Calendar blocked successfully', 'success');
  }

  hideBlockForm();
  localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(blocksData));
  renderBlocks();
};

window.deleteBlock = function(id) {
  if (!confirm('Are you sure you want to remove this block?')) return;
  blocksData = blocksData.filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(blocksData));
  renderBlocks();
};

window.renderBlocks = function() {
  const section = document.getElementById('sm-block-section');
  const grid = document.getElementById('sm-block-grid');
  const countCount = document.getElementById('sm-block-count');
  
  if (!section || !grid) return;

  if (!blocksData || !blocksData.length) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  if (countCount) countCount.textContent = `${blocksData.length} ${blocksData.length === 1 ? 'CARD' : 'CARDS'}`;
  
  grid.innerHTML = blocksData.map(b => {
    const startStr = new Date(b.startDate).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
    const endStr = new Date(b.endDate).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
    const timeStr = b.allDay ? 'Whole Day' : b.times.map(t => `${formatTime(t.from)}-${formatTime(t.to)}`).join(', ');
    
    return `
      <div class="sm-block-card">
        <div class="sm-block-info">
          🚫 <div>${startStr} – ${endStr} <span>· ${timeStr}</span></div>
        </div>
        <div class="sm-block-actions">
          <button class="btn-icon" onclick="showBlockForm(${b.id})">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon" style="color:#FF4D6A;" onclick="deleteBlock(${b.id})">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

let expData = [];
const STORAGE_EXP = 'nc_exp_data';

function initializeExperience() {
  const cached = localStorage.getItem(STORAGE_EXP);
  if (cached) {
    try { expData = JSON.parse(cached); } catch(e){}
  }
}

window.renderExperience = function() {
  const container = document.getElementById('exp-list-container');
  if(!container) return;

  if (expData.length === 0) {
    container.innerHTML = '<div class="exp-empty">No experience found</div>';
    return;
  }

  container.innerHTML = expData.map(e => {
    const sDate = e.start ? new Date(e.start + '-01') : new Date();
    const startStr = sDate.toLocaleDateString('en-US', {month:'short', year:'numeric'});
    let endStr = 'Present';
    if (!e.current && e.end) {
      const eDate = new Date(e.end + '-01');
      endStr = eDate.toLocaleDateString('en-US', {month:'short', year:'numeric'});
    }

    return `
      <div class="exp-card">
        <div class="exp-body">
          <div class="exp-title">${e.desig}</div>
          <div class="exp-clinic">${e.clinic}</div>
          <div class="exp-date">${startStr} – ${endStr}</div>
        </div>
        <div class="exp-actions">
          <button class="btn-icon" style="background:#f4f6fa; color:#0e52f0; padding:8px; border-radius:6px;" onclick="showExpForm(${e.id})">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon" style="background:#fff0f2; color:#ff4d6a; padding:8px; border-radius:6px;" onclick="deleteExperience(${e.id})">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.showExpForm = function(id = null) {
  document.getElementById('exp-id').value = id || '';
  document.getElementById('exp-desc').value = '';
  document.getElementById('exp-desc-count').textContent = '0';
  document.getElementById('inp-exp-desig').value = '';
  document.getElementById('exp-clinic').value = '';
  document.getElementById('exp-current').checked = false;
  document.getElementById('exp-start').value = '';
  document.getElementById('exp-end').value = '';
  toggleExpEndDate();

  if (id) {
    const matched = expData.find(x => x.id === id);
    if (matched) {
      document.getElementById('inp-exp-desig').value = matched.desig || '';
      document.getElementById('exp-clinic').value = matched.clinic || '';
      document.getElementById('exp-current').checked = matched.current || false;
      document.getElementById('exp-start').value = matched.start || '';
      document.getElementById('exp-end').value = matched.end || '';
      document.getElementById('exp-desc').value = matched.desc || '';
      document.getElementById('exp-desc-count').textContent = (matched.desc || '').length;
      toggleExpEndDate();
    }
  }
  document.getElementById('exp-form-modal').style.display = 'flex';
};

window.hideExpForm = function() {
  document.getElementById('exp-form-modal').style.display = 'none';
};

window.toggleExpEndDate = function() {
  const isChecked = document.getElementById('exp-current').checked;
  const endInput = document.getElementById('exp-end');
  const endReq = document.getElementById('exp-end-req');
  if (isChecked) {
    endInput.value = '';
    endInput.disabled = true;
    endInput.style.opacity = '0.5';
    if(endReq) endReq.style.display = 'none';
  } else {
    endInput.disabled = false;
    endInput.style.opacity = '1';
    if(endReq) endReq.style.display = 'inline';
  }
};

window.saveExperience = function() {
  const vId = document.getElementById('exp-id').value;
  const vDesig = document.getElementById('inp-exp-desig').value.trim();
  const vClinic = document.getElementById('exp-clinic').value.trim();
  const vCur = document.getElementById('exp-current').checked;
  const vStart = document.getElementById('exp-start').value;
  const vEnd = document.getElementById('exp-end').value;
  const vDesc = document.getElementById('exp-desc').value.trim();

  if(!vDesig || !vClinic || !vStart || (!vCur && !vEnd)) {
    alert("Please fill in required fields: Designation, Clinic, and Dates.");
    return;
  }

  const obj = {
    id: vId ? parseInt(vId, 10) : Date.now(),
    desig: vDesig,
    clinic: vClinic,
    current: vCur,
    start: vStart,
    end: vCur ? null : vEnd,
    desc: vDesc
  };

  if (vId) {
    const i = expData.findIndex(x => x.id === parseInt(vId, 10));
    if (i !== -1) expData[i] = obj;
  } else {
    expData.push(obj);
  }

  localStorage.setItem(STORAGE_EXP, JSON.stringify(expData));
  hideExpForm();
  renderExperience();
  toast('Experience saved successfully!', 'success');
};

window.deleteExperience = function(id) {
  if(!confirm('Are you sure you want to remove this experience?')) return;
  expData = expData.filter(x => x.id !== id);
  localStorage.setItem(STORAGE_EXP, JSON.stringify(expData));
  renderExperience();
  toast('Experience removed.', 'success');
};
