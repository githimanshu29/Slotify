import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  Calendar, ClipboardList, Clock, Plus, Edit3, Trash2, X,
  ChevronLeft, ChevronRight, MessageSquare, LogOut, Settings,
} from 'lucide-react';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-slate-700/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-700/60 transition-colors text-slate-500 hover:text-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('services');
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  const [keySet, setKeySet] = useState(!!localStorage.getItem('adminKey'));
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSetKey = (e) => { e.preventDefault(); localStorage.setItem('adminKey', adminKey); setKeySet(true); };
  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (!keySet) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Admin Access</h1>
          </div>
          <form onSubmit={handleSetKey} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Admin Key</label>
              <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Enter admin key..." required
                className="w-full px-4 py-3.5 rounded-xl bg-gray-800/60 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all" />
            </div>
            <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-violet-600/25 transition-all">Unlock Dashboard</button>
          </form>
          <Link to="/chat" className="mt-6 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-100 transition-colors text-sm"><ChevronLeft className="w-4 h-4" /> Back to Chat</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'services', label: 'Services', icon: Calendar },
    { key: 'availability', label: 'Availability', icon: Clock },
    { key: 'appointments', label: 'Appointments', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-slate-700/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold text-slate-100">Slotify Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/chat" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-gray-800/60 transition-all text-sm">
              <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Chat</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-700/50 bg-gray-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  tab === t.key ? 'border-violet-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-400'
                }`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tab === 'services' && <ServicesTab />}
        {tab === 'availability' && <AvailabilityTab />}
        {tab === 'appointments' && <AppointmentsTab />}
      </div>
    </div>
  );
}

function ServicesTab() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', duration: 30 });

  const fetchServices = async () => { try { const { data } = await API.get('/admin/services'); setServices(data.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', duration: 30 }); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, description: s.description || '', duration: s.duration }); setModalOpen(true); };
  const handleSave = async (e) => {
    e.preventDefault();
    try { if (editing) await API.patch(`/admin/services/${editing._id}`, form); else await API.post('/admin/services', form); setModalOpen(false); fetchServices(); }
    catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };
  const handleDelete = async (id) => { if (!confirm('Deactivate?')) return; try { await API.delete(`/admin/services/${id}`); fetchServices(); } catch (e) { alert('Failed'); } };

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-44 rounded-2xl bg-gray-800/60 animate-pulse" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100">Services</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-violet-600/25 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" /><p>No services yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s._id} className="group bg-gray-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-violet-500/30 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center"><Calendar className="w-5 h-5 text-purple-400" /></div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.isActive !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {s.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-1">{s.name}</h3>
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{s.description || 'No description'}</p>
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-4"><Clock className="w-4 h-4" />{s.duration} min</div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-700/40 text-slate-400 hover:text-purple-400 transition-colors text-sm"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => handleDelete(s._id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-700/40 text-slate-400 hover:text-red-400 transition-colors text-sm"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service' : 'New Service'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="e.g. Dentist" className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all" /></div>
          <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} placeholder="Short description..." className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all resize-none" /></div>
          <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Duration (minutes)</label>
            <input type="number" value={form.duration} onChange={(e) => setForm({...form, duration: Number(e.target.value)})} required min={5} className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-violet-500 transition-all" /></div>
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-violet-600/25 transition-all">{editing ? 'Save Changes' : 'Create Service'}</button>
        </form>
      </Modal>
    </div>
  );
}

function AvailabilityTab() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 30 });

  useEffect(() => { (async () => { try { const { data } = await API.get('/admin/services'); setServices(data.data || []); if (data.data?.length) setSelectedService(data.data[0]._id); } catch (e) {} })(); }, []);
  useEffect(() => { if (!selectedService) return; (async () => { setLoading(true); try { const { data } = await API.get(`/admin/availability/${selectedService}`); setTemplates(data.data || []); } catch (e) {} finally { setLoading(false); } })(); }, [selectedService]);

  const openCreate = () => { setEditing(null); setForm({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 30 }); setModalOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ dayOfWeek: t.dayOfWeek, startTime: t.startTime, endTime: t.endTime, slotDuration: t.slotDuration }); setModalOpen(true); };
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) await API.put(`/admin/availability/${editing._id}`, { ...form, serviceId: selectedService });
      else await API.post('/admin/availability', { ...form, serviceId: selectedService });
      setModalOpen(false); const { data } = await API.get(`/admin/availability/${selectedService}`); setTemplates(data.data || []);
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; try { await API.delete(`/admin/availability/${id}`); setTemplates(p => p.filter(t => t._id !== id)); } catch (e) { alert('Failed'); } };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-100">Availability</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gray-800/60 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-violet-500 text-sm">
            {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-violet-600/25 transition-all">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-800/60 animate-pulse" />)}</div>
       : templates.length === 0 ? <div className="text-center py-16 text-slate-500"><Clock className="w-12 h-12 mx-auto mb-4 opacity-40" /><p>No availability set.</p></div>
       : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.sort((a,b) => a.dayOfWeek - b.dayOfWeek).map(t => (
            <div key={t._id} className="group bg-gray-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-violet-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-purple-400">{dayNames[t.dayOfWeek]}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-700/60 text-slate-500 hover:text-purple-400 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-lg hover:bg-gray-700/60 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-slate-400 text-sm">{t.startTime} – {t.endTime}</p>
              <p className="text-slate-500 text-xs mt-1">{t.slotDuration} min slots</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Schedule' : 'Add Schedule'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Day</label>
            <select value={form.dayOfWeek} onChange={(e) => setForm({...form, dayOfWeek: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-violet-500 transition-all">
              {dayNames.map((d,i) => <option key={i} value={i}>{d}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Start</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} required className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-violet-500 transition-all" /></div>
            <div><label className="block text-sm font-medium text-slate-400 mb-1.5">End</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} required className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-violet-500 transition-all" /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Slot Duration (min)</label>
            <input type="number" value={form.slotDuration} onChange={(e) => setForm({...form, slotDuration: Number(e.target.value)})} required min={5} className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-violet-500 transition-all" /></div>
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-violet-600/25 transition-all">{editing ? 'Save Changes' : 'Add Schedule'}</button>
        </form>
      </Modal>
    </div>
  );
}

function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');

  const fetch = async () => { setLoading(true); try { const p = { page, limit: 10 }; if (filter) p.status = filter; const { data } = await API.get('/admin/appointments', { params: p }); setAppointments(data.data || []); } catch (e) {} finally { setLoading(false); } };
  useEffect(() => { fetch(); }, [page, filter]);

  const handleCancel = async (id) => { if (!confirm('Cancel?')) return; try { await API.patch(`/admin/appointments/${id}`, { status: 'CANCELLED' }); fetch(); } catch (e) { alert('Failed'); } };
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-100">Appointments</h2>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-gray-800/60 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-violet-500 text-sm">
          <option value="">All Status</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-gray-800/60 animate-pulse" />)}</div>
       : appointments.length === 0 ? <div className="text-center py-16 text-slate-500"><ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-40" /><p>No appointments found.</p></div>
       : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full">
              <thead><tr className="bg-gray-800/50">
                {['Ref','Service','Customer','Date & Time','Status','Action'].map((h,i) => (
                  <th key={h} className={`${i === 5 ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-700/50">
                {appointments.map(a => (
                  <tr key={a._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-mono text-purple-400">{a.refCode}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-100">{a.serviceName || a.serviceId?.name || '—'}</td>
                    <td className="px-4 py-3.5"><p className="text-sm text-slate-100">{a.customerName}</p><p className="text-xs text-slate-500">{a.customerEmail}</p></td>
                    <td className="px-4 py-3.5 text-sm text-slate-400">{fmtDate(a.date)} at {a.time}</td>
                    <td className="px-4 py-3.5"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${a.status === 'CONFIRMED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{a.status}</span></td>
                    <td className="px-4 py-3.5 text-right">{a.status === 'CONFIRMED' && <button onClick={() => handleCancel(a._id)} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Cancel</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {appointments.map(a => (
              <div key={a._id} className="bg-gray-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-purple-400">{a.refCode}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${a.status === 'CONFIRMED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{a.status}</span>
                </div>
                <p className="text-sm text-slate-100 font-medium">{a.serviceName || a.serviceId?.name}</p>
                <p className="text-xs text-slate-500 mt-1">{a.customerName} • {a.customerEmail}</p>
                <p className="text-xs text-slate-400 mt-1">{fmtDate(a.date)} at {a.time}</p>
                {a.status === 'CONFIRMED' && <button onClick={() => handleCancel(a._id)} className="mt-3 w-full py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors">Cancel</button>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-2 rounded-lg bg-gray-800/60 border border-slate-700/50 text-slate-500 hover:text-slate-100 disabled:opacity-40 transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-slate-400">Page {page}</span>
            <button onClick={() => setPage(p => p+1)} disabled={appointments.length < 10} className="p-2 rounded-lg bg-gray-800/60 border border-slate-700/50 text-slate-500 hover:text-slate-100 disabled:opacity-40 transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </>
      )}
    </div>
  );
}
