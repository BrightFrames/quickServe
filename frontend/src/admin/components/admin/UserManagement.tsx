import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  User,
  Key,
  AlertCircle,
  Shield,
  ChefHat,
  UserCog,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { useRestaurant } from "../../context/RestaurantContext";

interface StaffUser {
  id?: string;
  username: string;
  password?: string;
  role: string;
  isOnline?: boolean;
  lastActive?: string;
  restaurantId?: number;
}

const UserManagement = () => {
  const { restaurantSlug } = useRestaurant();
  const [kitchenUsers, setKitchenUsers] = useState<StaffUser[]>([]);
  const [captainUsers, setCaptainUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [showForm, setShowForm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDashboardPassword, setShowDashboardPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [passwordChangeUser, setPasswordChangeUser] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUsingDefaultDashboard, setIsUsingDefaultDashboard] = useState(true);
  const [dashboardOldPassword, setDashboardOldPassword] = useState("");
  const [dashboardNewPassword, setDashboardNewPassword] = useState("");
  const [dashboardConfirmPassword, setDashboardConfirmPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<StaffUser>({
    username: "",
    password: "",
    role: "kitchen",
  });

  const getAxiosConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-restaurant-slug': restaurantSlug || '',
      }
    };
  };

  useEffect(() => {
    fetchUsers();
    fetchDashboardPasswordStatus();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const config = getAxiosConfig();
      const [kitchenResponse, captainResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/users/kitchen`, config),
        axios.get(`${apiUrl}/api/users/captains`, config)
      ]);
      setKitchenUsers(kitchenResponse.data || []);
      setCaptainUsers(captainResponse.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch staff users");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardPasswordStatus = async () => {
    try {
      const config = getAxiosConfig();
      const response = await axios.get(`${apiUrl}/api/restaurant/dashboard-password-status`, config);
      setIsUsingDefaultDashboard(response.data.isUsingDefault || false);
    } catch (error) {
      console.error('Error fetching dashboard password status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = localStorage.getItem('restaurantSlug');
      if (!slug) return;

      if (editingUser?.id) {
        await axios.put(`${apiUrl}/api/users/${editingUser.id}`, formData, getAxiosConfig());
        toast.success("User updated successfully");
      } else {
        await axios.post(`${apiUrl}/api/users/staff`, formData, getAxiosConfig());
        toast.success("User added successfully");
      }
      fetchUsers();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save user");
    }
  };

  const handleDashboardPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dashboardNewPassword !== dashboardConfirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (dashboardNewPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await axios.patch(
        `${apiUrl}/api/restaurant/dashboard-password`,
        { oldPassword: dashboardOldPassword, newPassword: dashboardNewPassword },
        getAxiosConfig()
      );
      toast.success("Dashboard password updated successfully");
      setShowDashboardPassword(false);
      resetDashboardForm();
      fetchDashboardPasswordStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${apiUrl}/api/users/${id}`, getAxiosConfig());
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");

    try {
      const slug = localStorage.getItem('restaurantSlug');
      if (!slug) return;
      await axios.put(`${apiUrl}/api/users/${passwordChangeUser?.id}?slug=${slug}`, {
        username: passwordChangeUser?.username,
        role: passwordChangeUser?.role,
        password: newPassword,
      }, getAxiosConfig());
      toast.success("Password changed successfully");
      setShowPasswordChange(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  const resetForm = () => {
    setFormData({ username: "", password: "", role: "kitchen" });
    setEditingUser(null);
    setShowForm(false);
  };

  const resetDashboardForm = () => {
    setDashboardOldPassword("");
    setDashboardNewPassword("");
    setDashboardConfirmPassword("");
  };

  const startEdit = (user: StaffUser) => {
    setEditingUser(user);
    setFormData({ ...user, password: "" });
    setShowForm(true);
  };

  const openPasswordChange = (user: StaffUser) => {
    setPasswordChangeUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordChange(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const allUsers = [...kitchenUsers, ...captainUsers];
  const filteredUsers = allUsers.filter(user => user.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Staff Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage kitchen staff and captain access.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDashboardPassword(true)}
            className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Shield className="w-4 h-4" />
            <span>Dashboard Access</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Security Warning */}
      {isUsingDefaultDashboard && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">Security Recommendation</h3>
            <p className="text-sm text-amber-700 mt-1">
              You are using the default dashboard password. Please update it to secure your restaurant's admin panel.
            </p>
          </div>
        </div>
      )}

      {/* Default Credentials Reference */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
          <UserCog className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">Default Login Credentials</h3>
          <p className="text-xs text-blue-700 mb-3">Use these defaults for initial setup. You can modify them below.</p>
          <div className="flex flex-wrap gap-3">
            <code className="bg-white px-2 py-1 rounded border border-blue-200 text-xs font-mono text-blue-800">User: kitchen1</code>
            <code className="bg-white px-2 py-1 rounded border border-blue-200 text-xs font-mono text-blue-800">Pass: kitchen123</code>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Staff</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{allUsers.length}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <User className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Kitchen</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{kitchenUsers.length}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ChefHat className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Captains</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{captainUsers.length}</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <UserCog className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Now</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{allUsers.filter(u => u.isOnline).length}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-green-500 border-4 border-green-100"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Staff List Grid (replaces Table for better visuals) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${user.role === 'captain' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                    {user.role === 'captain' ? <UserCog className={`w-6 h-6 text-purple-600`} /> : <ChefHat className={`w-6 h-6 text-blue-600`} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{user.username}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.role === 'captain' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role === 'captain' ? 'Captain' : 'Kitchen Staff'}
                    </span>
                  </div>
                </div>
                <span className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} title={user.isOnline ? "Online" : "Offline"}></span>
              </div>

              <div className="text-sm text-gray-500 mb-6">
                Last Active: <span className="text-gray-900 font-medium">{user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}</span>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openPasswordChange(user)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Key className="w-3.5 h-3.5" /> Pass
                </button>
                <button
                  onClick={() => startEdit(user)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id!)}
                  className="flex-none p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingUser ? "Edit Staff" : "Add New Staff"}</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingUser && "(leave blank to keep)"}</label>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" required={!editingUser} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="cook">Cook</option>
                  <option value="captain">Captain</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Save Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
              <button onClick={() => { setShowPasswordChange(false); setPasswordChangeUser(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 pt-6 pb-2">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">
                Changing password for <strong>{passwordChangeUser?.username}</strong>
              </div>
            </div>
            <form onSubmit={handlePasswordChange} className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" minLength={6} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" minLength={6} required />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setShowPasswordChange(false); setPasswordChangeUser(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Password Modal */}
      {showDashboardPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Dashboard Password</h3>
              <button onClick={() => setShowDashboardPassword(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleDashboardPasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" value={dashboardOldPassword} onChange={e => setDashboardOldPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={dashboardNewPassword} onChange={e => setDashboardNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" minLength={6} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={dashboardConfirmPassword} onChange={e => setDashboardConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" minLength={6} required />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowDashboardPassword(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
