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
} from "lucide-react";
import { toast } from "sonner";
import { useRestaurant } from "../../context/RestaurantContext";

interface KitchenUser {
  id?: string;
  username: string;
  password?: string;
  role: string;
  isOnline?: boolean;
  lastActive?: string;
}

const UserManagement = () => {
  const { restaurantSlug } = useRestaurant();
  const [users, setUsers] = useState<KitchenUser[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const getAxiosConfig = () => ({
    headers: {
      'x-restaurant-slug': restaurantSlug || '',
    }
  });
  const [showForm, setShowForm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [editingUser, setEditingUser] = useState<KitchenUser | null>(null);
  const [passwordChangeUser, setPasswordChangeUser] =
    useState<KitchenUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formData, setFormData] = useState<KitchenUser>({
    username: "",
    password: "",
    role: "kitchen",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/users/kitchen`, getAxiosConfig());
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch kitchen users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser?.id) {
        await axios.put(`${apiUrl}/api/users/${editingUser.id}`, formData, getAxiosConfig());
        toast.success("User updated successfully");
      } else {
        await axios.post(`${apiUrl}/api/users/kitchen`, formData, getAxiosConfig());
        toast.success("User added successfully");
      }
      fetchUsers();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save user");
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

  const startEdit = (user: KitchenUser) => {
    setEditingUser(user);
    setFormData({ ...user, password: "" });
    setShowForm(true);
  };

  const openPasswordChange = (user: KitchenUser) => {
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
      await axios.put(`${apiUrl}/api/users/${passwordChangeUser?.id}`, {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Kitchen Staff Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage kitchen user accounts and credentials
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Kitchen User</span>
        </button>
      </div>

      {/* Default Credentials Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {users.length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Now</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {users.filter((u) => u.isOnline).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <User className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Offline</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">
                {users.filter((u) => !u.isOnline).length}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <User className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {editingUser ? "Edit Kitchen User" : "Add New Kitchen User"}
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span className="font-medium">{user.username}</span>
                  </div>
                </td>
                <td className="py-3 px-4 capitalize">{user.role}</td>
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
    </div>
  );
};

export default UserManagement;
