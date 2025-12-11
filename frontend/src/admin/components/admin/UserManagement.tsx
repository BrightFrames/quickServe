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
} from "lucide-react";
import { toast } from "sonner";
import { useRestaurant } from "../../context/RestaurantContext";
import { GlowCard } from "../ui/spotlight-card";

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

  const getAxiosConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-restaurant-slug': restaurantSlug || '',
      }
    };
  };

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
  const [formData, setFormData] = useState<StaffUser>({
    username: "",
    password: "",
    role: "kitchen",
  });

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
    } catch (error) {
      toast.error("Failed to fetch staff users");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardPasswordStatus = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/restaurant/dashboard-password-status`, getAxiosConfig());
      setIsUsingDefaultDashboard(response.data.isUsingDefault || false);
    } catch (error) {
      console.error("Error fetching dashboard password status:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = localStorage.getItem('restaurantSlug');
      if (!slug) {
        toast.error('Restaurant slug is missing');
        return;
      }
      
      if (editingUser?.id) {
        await axios.put(`${apiUrl}/api/users/${editingUser.id}`, formData, getAxiosConfig());
        toast.success("User updated successfully");
      } else {
        // Use unified staff creation endpoint
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
        {
          oldPassword: dashboardOldPassword,
          newPassword: dashboardNewPassword
        },
        getAxiosConfig()
      );
      toast.success("Dashboard password updated successfully");
      setShowDashboardPassword(false);
      setDashboardOldPassword("");
      setDashboardNewPassword("");
      setDashboardConfirmPassword("");
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

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      role: "kitchen",
    });
    setEditingUser(null);
    setShowForm(false);
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const slug = localStorage.getItem('restaurantSlug');
      if (!slug) {
        toast.error('Restaurant slug is missing');
        return;
      }
      
      await axios.put(`${apiUrl}/api/users/${passwordChangeUser?.id}?slug=${slug}`, {
        username: passwordChangeUser?.username,
        role: passwordChangeUser?.role,
        password: newPassword,
      }, getAxiosConfig());
      toast.success("Password changed successfully");
      setShowPasswordChange(false);
      setPasswordChangeUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const allUsers = [...kitchenUsers, ...captainUsers];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Staff Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage kitchen and captain user accounts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDashboardPassword(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Shield className="w-5 h-5" />
            <span>Dashboard Password</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Dashboard Password Warning */}
      {isUsingDefaultDashboard && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="text-yellow-800 font-semibold">Security Warning</h3>
              <p className="text-yellow-700 text-sm mt-1">
                You are using the default dashboard password (admin123). Please change it immediately for security.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Default Credentials Info Banner */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Default Kitchen Login Credentials
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-4 bg-white rounded px-3 py-2 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Username:</span>
                    <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-xs font-semibold">
                      kitchen1
                    </code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Password:</span>
                    <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-xs font-semibold">
                      kitchen123
                    </code>
                  </div>
                </div>
                <p className="text-blue-700 text-xs mt-2">
                  💡 <strong>Tip:</strong> You can edit username, change password,
                  or delete this account using the actions below. Click{" "}
                  <strong>"Change Password"</strong> to update credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlowCard glowColor="orange" customSize className="w-full h-auto">
          <div className="bg-white/80 rounded-lg shadow p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Staff</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {allUsers.length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <User className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="blue" customSize className="w-full h-auto">
          <div className="bg-white/80 rounded-lg shadow p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Kitchen Staff</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {kitchenUsers.length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ChefHat className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="purple" customSize className="w-full h-auto">
          <div className="bg-white/80 rounded-lg shadow p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Captains</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {captainUsers.length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <UserCog className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="green" customSize className="w-full h-auto">
          <div className="bg-white/80 rounded-lg shadow p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Now</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {allUsers.filter((u) => u.isOnline).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <User className="w-8 h-8 text-green-600" />
            </div>
          </div>
          </div>
        </GlowCard>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {editingUser ? "Edit Staff User" : "Add New Staff User"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="cook">Cook</option>
                  <option value="captain">Captain</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  {editingUser ? "Update" : "Add"} User
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center">
                <Key className="w-6 h-6 mr-2 text-blue-600" />
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordChangeUser(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Changing password for:{" "}
                <strong>{passwordChangeUser?.username}</strong>
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>

              {newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Passwords do not match</span>
                  </div>
                )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  disabled={newPassword !== confirmPassword}
                >
                  <Key className="w-5 h-5 inline mr-2" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordChangeUser(null);
                  }}
                  className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <GlowCard glowColor="orange" customSize className="w-full h-auto">
        <div className="bg-white/80 rounded-lg shadow overflow-hidden border-0">
          <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Username
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Role
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Last Active
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    {user.role === 'captain' ? (
                      <UserCog className="w-4 h-4 text-purple-600" />
                    ) : (
                      <ChefHat className="w-4 h-4 text-blue-600" />
                    )}
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span className="font-medium">{user.username}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    user.role === 'captain' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'captain' ? 'Captain' : 'Kitchen'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      user.isOnline
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.isOnline ? "Online" : "Offline"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {user.lastActive
                    ? new Date(user.lastActive).toLocaleString()
                    : "Never"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openPasswordChange(user)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                      title="Change Password"
                    >
                      <Key className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => startEdit(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit User"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete User"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </GlowCard>

      {/* Dashboard Password Change Modal */}
      {showDashboardPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-blue-600" />
                  Dashboard Password
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Change your restaurant dashboard password
                </p>
              </div>
              <button
                onClick={() => setShowDashboardPassword(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isUsingDefaultDashboard && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ You're using the default password. Change it for security.
                </p>
              </div>
            )}

            <form onSubmit={handleDashboardPasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={dashboardOldPassword}
                  onChange={(e) => setDashboardOldPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={dashboardNewPassword}
                  onChange={(e) => setDashboardNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={dashboardConfirmPassword}
                  onChange={(e) => setDashboardConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>

              {dashboardNewPassword &&
                dashboardConfirmPassword &&
                dashboardNewPassword !== dashboardConfirmPassword && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Passwords do not match</span>
                  </div>
                )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  disabled={dashboardNewPassword !== dashboardConfirmPassword}
                >
                  <Shield className="w-5 h-5 inline mr-2" />
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowDashboardPassword(false)}
                  className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
