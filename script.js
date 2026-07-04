const BASE_URL = 'http://localhost:5000/api';

const app = {
  data: {
    currentUser: null,
    complaints: [],
    notifications: []
  },
  
  charts: {},

  init() {
    this.checkAuth();
    this.initTheme();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('hc_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  },

  toggleTheme() {
    const currentParam = document.documentElement.getAttribute('data-theme');
    const newTheme = currentParam === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('hc_theme', newTheme);
    this.updateThemeIcon(newTheme);
    
    if (this.data.currentUser && this.data.currentUser.type === 'admin') {
       if (this.currentAdminTab === 'admin-overview') this.renderAdminOverview(false);
       else if (this.currentAdminTab === 'admin-reports') this.renderCharts();
    }
  },

  updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    if (theme === 'dark') {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  },

  checkAuth() {
    const session = sessionStorage.getItem('hc_session');
    if (session) {
      this.data.currentUser = JSON.parse(session);
      if (this.data.currentUser.type === 'admin') {
        this.navigate('admin-dashboard');
      } else {
        this.navigate('student-dashboard');
      }
    } else {
      this.navigate('home');
    }
    this.updateNav();
  },

  updateNav() {
    const authLinks = document.querySelectorAll('.auth-links');
    const loggedInLinks = document.querySelectorAll('.logged-in');
    const studentLinks = document.querySelectorAll('.student-only');
    const adminLinks = document.querySelectorAll('.admin-only');
    
    if (this.data.currentUser) {
      authLinks.forEach(el => el.classList.add('d-none'));
      loggedInLinks.forEach(el => el.classList.remove('d-none'));
      document.getElementById('current-user-name').textContent = this.data.currentUser.name;
      
      if (this.data.currentUser.type === 'student') {
        studentLinks.forEach(el => el.classList.remove('d-none'));
        adminLinks.forEach(el => el.classList.add('d-none'));
      } else {
        adminLinks.forEach(el => el.classList.remove('d-none'));
        studentLinks.forEach(el => el.classList.add('d-none'));
        this.fetchNotifications();
      }
    } else {
      authLinks.forEach(el => el.classList.remove('d-none'));
      loggedInLinks.forEach(el => el.classList.add('d-none'));
      studentLinks.forEach(el => el.classList.add('d-none'));
      adminLinks.forEach(el => el.classList.add('d-none'));
    }
  },

  navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(el => {
      el.classList.add('d-none');
    });
    
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.remove('d-none');
    }

    if(viewId === 'home') document.getElementById('footer').style.display = 'block';
    else document.getElementById('footer').style.display = 'none';

    if (viewId === 'student-dashboard' && this.data.currentUser?.type === 'student') {
      document.getElementById('student-welcome-name').textContent = this.data.currentUser.name;
      this.renderStudentDashboard();
    } else if (viewId === 'admin-dashboard' && this.data.currentUser?.type === 'admin') {
      this.adminNavigate(document.querySelector('.sidebar .nav-item.active'), 'admin-overview');
    }
  },

  adminNavigate(element, tabId) {
    document.querySelectorAll('.sidebar .nav-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');
    
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.add('d-none'));
    const tabElement = document.getElementById(tabId);
    if(tabElement) tabElement.classList.remove('d-none');
    
    this.currentAdminTab = tabId;

    if (tabId === 'admin-overview') {
      this.renderAdminOverview();
    } else if (tabId === 'admin-complaints') {
      this.renderAdminComplaints();
    } else if (tabId === 'admin-reports') {
      this.renderCharts();
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    if (password.length < 6) {
      return this.showToast('Password must be at least 6 characters long', 'error');
    }

    try {
      const res = await fetch(`${BASE_URL}/student/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        this.showToast('Registration successful! Please login.', 'success');
        document.getElementById('form-student-register').reset();
      } else {
        this.showToast(data.error, 'error');
      }
    } catch(err) {
      this.showToast('Server connection failed', 'error');
    } //end catch
  },

  async handleLogin(e, type) {
    e.preventDefault();
    let url = type === 'student' ? `${BASE_URL}/student/login` : `${BASE_URL}/admin/login`;
    let body = {};
    
    if (type === 'student') {
      body.email = document.getElementById('login-email').value;
      body.password = document.getElementById('login-password').value;
    } else {
      body.username = document.getElementById('admin-id').value;
      body.password = document.getElementById('admin-password').value;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if(res.ok) {
        data.user.token = data.token; // Store token with user details
        this.data.currentUser = data.user;
        sessionStorage.setItem('hc_session', JSON.stringify(this.data.currentUser));
        
        this.updateNav();
        this.navigate(type === 'student' ? 'student-dashboard' : 'admin-dashboard');
        this.showToast(data.message, 'success');
      } else {
        this.showToast(data.error, 'error');
      }
    } catch (err) {
      this.showToast('Server connection failed', 'error');
    }
  },

  logout() {
    this.data.currentUser = null;
    sessionStorage.removeItem('hc_session');
    this.updateNav();
    this.navigate('home');
    this.showToast('Logged out successfully', 'success');
  },

  async submitComplaint(e) {
    e.preventDefault();
    const category = document.getElementById('comp-category').value;
    const room = document.getElementById('comp-room').value;
    const desc = document.getElementById('comp-desc').value;
    
    const payload = {
      student_id: this.data.currentUser.id,
      student_name: this.data.currentUser.name,
      room_number: room,
      category,
      description: desc
    };

    try {
      const res = await fetch(`${BASE_URL}/complaints/add`, {
        method: 'POST',
        headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${this.data.currentUser.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if(res.ok) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('newComplaintModal'));
        modal.hide();
        document.getElementById('form-new-complaint').reset();
        
        this.renderStudentDashboard();
        this.showToast('Complaint raised successfully! ID: ' + data.id, 'success');
      } else {
        this.showToast(data.error, 'error');
      }
    } catch(err) {
      this.showToast('Failed to submit complaint', 'error');
    }
  },

  async renderStudentDashboard() {
    try {
      const res = await fetch(`${BASE_URL}/complaints/student/${this.data.currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${this.data.currentUser.token}` }
      });
      const data = await res.json();
      const myComplaints = data.complaints || [];
      
      const tbody = document.getElementById('student-complaints-table');
      const emptyState = document.getElementById('student-empty-state');
      const tableContainer = tbody.closest('.table-container');
      
      if (myComplaints.length === 0) {
        emptyState.classList.remove('d-none');
        tableContainer.classList.add('d-none');
        return;
      }
      
      emptyState.classList.add('d-none');
      tableContainer.classList.remove('d-none');
      
      tbody.innerHTML = myComplaints.map(c => `
        <tr>
          <td class="fw-bold">C-${c.id}</td>
          <td>${c.category}</td>
          <td>${c.room_number || 'N/A'}</td>
          <td>${new Date(c.created_at).toLocaleDateString()}</td>
          <td><span class="badge badge-status ${this.getStatusClass(c.status)}">${c.status}</span></td>
        </tr>
      `).join('');
    } catch(err) {
      console.error(err);
      this.showToast('Failed to load dashboard', 'error');
    }
  },

  async fetchAdminComplaints() {
    try {
      const res = await fetch(`${BASE_URL}/admin/complaints`, {
        headers: { 'Authorization': `Bearer ${this.data.currentUser.token}` }
      });
      const data = await res.json();
      if(data.complaints) this.data.complaints = data.complaints;
    } catch(err) {
      console.error("Failed to fetch complaints");
    }
  },

  async fetchNotifications() {
     try {
        const res = await fetch(`${BASE_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${this.data.currentUser.token}` }
        });
        const data = await res.json();
        if(data.notifications) {
           this.data.notifications = data.notifications;
           const unread = this.data.notifications.filter(n => !n.is_read).length;
           const badge = document.getElementById('notif-count');
           if(badge) {
               badge.textContent = unread;
               if(unread === 0) badge.classList.add('d-none');
               else badge.classList.remove('d-none');
           }
        }
     } catch(e) {
        console.error("Failed to load notifications");
     }
  },

  showNotificationsModal() {
     const list = document.getElementById('notifications-list');
     if(this.data.notifications.length === 0) {
         list.innerHTML = '<p class="text-center text-muted my-3">No notifications found.</p>';
     } else {
         list.innerHTML = this.data.notifications.map(n => `
            <div class="p-3 border-bottom d-flex justify-content-between align-items-center ${n.is_read ? 'bg-transparent' : 'bg-light bg-opacity-10'}">
               <div>
                  <p class="mb-1 ${n.is_read ? 'text-muted' : 'fw-bold'}">${n.message}</p>
                  <small class="text-muted"><i class="fa fa-clock"></i> ${new Date(n.created_at).toLocaleString()}</small>
               </div>
               ${!n.is_read ? `<button class="btn btn-sm btn-outline-primary shadow-sm" onclick="app.markNotificationRead(${n.id})">Mark Read</button>` : ''}
            </div>
         `).join('');
     }
     new bootstrap.Modal(document.getElementById('notificationsModal')).show();
  },

  async markNotificationRead(id) {
     try {
         await fetch(`${BASE_URL}/notifications/${id}/read`, { 
             method: 'PUT',
             headers: { 'Authorization': `Bearer ${this.data.currentUser.token}` }
         });
         await this.fetchNotifications();
         this.showNotificationsModal(); // refresh UI
     } catch(e) {}
  },

  async renderAdminOverview(fetchNew = true) {
    if(fetchNew) await this.fetchAdminComplaints();
    
    const complaints = this.data.complaints;
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const progress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-progress').textContent = progress;
    document.getElementById('stat-resolved').textContent = resolved;

    const tbody = document.getElementById('admin-recent-table');
    tbody.innerHTML = complaints.slice(0, 5).map(c => `
      <tr>
        <td class="fw-bold">C-${c.id}</td>
        <td>${c.student_name} <br><small class="text-muted">${c.room_number || 'N/A'}</small></td>
        <td>${c.category}</td>
        <td><span class="badge badge-status ${this.getStatusClass(c.status)}">${c.status}</span></td>
      </tr>
    `).join('');

    this.renderQuickChart(pending, progress, resolved);
  },

  async renderAdminComplaints() {
    await this.fetchAdminComplaints();
    this.filterAdminComplaints();
  },

  filterAdminComplaints() {
    const table = document.getElementById('admin-all-complaints-table');
    const searchQuery = document.getElementById('search-complaint').value.toLowerCase();
    const catFilter = document.getElementById('filter-category').value;
    const statFilter = document.getElementById('filter-status').value;

    const filtered = this.data.complaints.filter(c => {
      const matchSearch = `c-${c.id}`.includes(searchQuery) || 
                          c.student_name.toLowerCase().includes(searchQuery) ||
                          (c.room_number && c.room_number.toLowerCase().includes(searchQuery));
      const matchCat = catFilter === 'all' || c.category === catFilter;
      const matchStat = statFilter === 'all' || c.status === statFilter;
      return matchSearch && matchCat && matchStat;
    });

    table.innerHTML = filtered.map(c => `
      <tr>
        <td class="fw-bold">C-${c.id}</td>
        <td>${c.student_name}</td>
        <td>${c.room_number || 'N/A'}</td>
        <td>${c.category}</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
        <td><span class="badge badge-status ${this.getStatusClass(c.status)}">${c.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary rounded-pill shadow-sm" onclick="app.openUpdateModal(${c.id})">Update</button>
          <button class="btn btn-sm btn-outline-danger shadow-sm ms-1" onclick="app.deleteComplaint(${c.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },

  openUpdateModal(id) {
    const c = this.data.complaints.find(x => x.id === id);
    if (!c) return;
    document.getElementById('update-comp-id').value = c.id;
    document.getElementById('update-comp-status').value = c.status;
    document.getElementById('update-comp-worker').value = ''; // can be extended in db if needed
    
    new bootstrap.Modal(document.getElementById('adminActionModal')).show();
  },

  async updateComplaint(e) {
    e.preventDefault();
    const id = document.getElementById('update-comp-id').value;
    const status = document.getElementById('update-comp-status').value;

    try {
      const res = await fetch(`${BASE_URL}/admin/complaints/${id}/status`, {
         method: 'PUT',
         headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.data.currentUser.token}`
         },
         body: JSON.stringify({ status })
      });
      if(res.ok) {
         bootstrap.Modal.getInstance(document.getElementById('adminActionModal')).hide();
         this.showToast(`Complaint C-${id} updated`, 'success');
         this.renderAdminComplaints();
      }
    } catch(err) {
      this.showToast('Failed to update status', 'error');
    }
  },

  async deleteComplaint(id) {
    if(confirm('Are you sure you want to delete complaint C-' + id + '?')) {
      try {
         const res = await fetch(`${BASE_URL}/admin/complaints/${id}`, { 
             method: 'DELETE',
             headers: { 'Authorization': `Bearer ${this.data.currentUser.token}` }
         });
         if(res.ok) {
            this.showToast('Complaint deleted', 'success');
            this.renderAdminComplaints();
         }
      } catch(err) {
         this.showToast('Failed to delete complaint', 'error');
      }
    }
  },

  renderQuickChart(pending, progress, resolved) {
    const ctx = document.getElementById('quickChart');
    if(!ctx) return;
    
    if(this.charts.quick) this.charts.quick.destroy();
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f1f5f9' : '#212529';
    Chart.defaults.color = textColor;

    this.charts.quick = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'In Progress', 'Resolved'],
        datasets: [{
          data: [pending, progress, resolved],
          backgroundColor: ['#ffc107', '#0d6efd', '#198754'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  },

  async renderCharts() {
    await this.fetchAdminComplaints();
    const statusCtx = document.getElementById('statusChart');
    const catCtx = document.getElementById('categoryChart');
    if (!statusCtx || !catCtx) return;

    if(this.charts.status) this.charts.status.destroy();
    if(this.charts.cat) this.charts.cat.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f1f5f9' : '#212529';
    Chart.defaults.color = textColor;

    const complaints = this.data.complaints;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const progress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    this.charts.status = new Chart(statusCtx, {
      type: 'pie',
      data: {
        labels: ['Pending', 'In Progress', 'Resolved'],
        datasets: [{
          data: [pending, progress, resolved],
          backgroundColor: ['#ffc107', '#0d6efd', '#198754'],
          borderWidth: 0
        }]
      }
    });

    const cats = {};
    complaints.forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1; });

    this.charts.cat = new Chart(catCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(cats),
        datasets: [{
          label: 'Complaints by Category',
          data: Object.values(cats),
          backgroundColor: '#0d6efd',
          borderRadius: 4
        }]
      },
      options: {
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  },

  getStatusClass(status) {
    if (status === 'Pending') return 'status-pending';
    if (status === 'In Progress') return 'status-progress';
    return 'status-resolved';
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    
    const icon = type === 'success' ? '<i class="fa-solid fa-check-circle text-success fs-4"></i>' : '<i class="fa-solid fa-triangle-exclamation text-danger fs-4"></i>';
    toast.innerHTML = `${icon} <div>${message}</div>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
