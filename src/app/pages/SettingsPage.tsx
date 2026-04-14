import { User, Lock, Bell, Palette, Save, CheckCircle2, Link } from 'lucide-react'
import { useState } from 'react'

import { DataConnectorsPage } from './DataConnectorsPage'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Separator } from '../components/ui/separator'
import { Switch } from '../components/ui/switch'
import { apiClient } from '../services/api/client'

type TabKey = 'profile' | 'security' | 'notifications' | 'connectors' | 'preferences'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [saved, setSaved] = useState(false)

  // Profile state
  const user = apiClient.getStoredUser()
  const [name, setName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  // Security state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notification state
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [modelTrainingNotif, setModelTrainingNotif] = useState(true)

  // Preference state
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('Asia/Dhaka')

  const handleSaveProfile = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'connectors', label: 'Integrations', icon: Link },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'preferences', label: 'Preferences', icon: Palette },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account, security, and preferences</p>
      </div>

      {/* Success Toast */}
      {saved && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400">Settings saved successfully!</p>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-56 shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-100">Profile Information</h2>
              <Separator className="bg-slate-800" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100"
                    placeholder="your@email.com"
                    type="email"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Role</Label>
                <div className="mt-1.5 px-4 py-2.5 bg-slate-800 rounded-lg text-slate-400 text-sm">
                  {user?.role ?? 'viewer'} (contact admin to change)
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-100">Change Password</h2>
              <Separator className="bg-slate-800" />

              <div className="space-y-4 max-w-md">
                <div>
                  <Label className="text-slate-300">Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>

              <Separator className="bg-slate-800" />

              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Active Sessions</h3>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-200">Current Session</p>
                      <p className="text-xs text-slate-500">Logged in now</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-100">Notification Preferences</h2>
              <Separator className="bg-slate-800" />

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Email Alerts</p>
                    <p className="text-xs text-slate-500">
                      Receive alerts and notifications via email
                    </p>
                  </div>
                  <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>
                <Separator className="bg-slate-800" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Weekly Report</p>
                    <p className="text-xs text-slate-500">Get a weekly summary of your metrics</p>
                  </div>
                  <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                </div>
                <Separator className="bg-slate-800" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Model Training Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      Get notified when model training completes
                    </p>
                  </div>
                  <Switch checked={modelTrainingNotif} onCheckedChange={setModelTrainingNotif} />
                </div>
              </div>

              <Button
                onClick={() => {
                  setSaved(true)
                  setTimeout(() => setSaved(false), 2000)
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'connectors' && <DataConnectorsPage />}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-100">
                Display & Regional Preferences
              </h2>
              <Separator className="bg-slate-800" />

              <div className="space-y-5 max-w-md">
                <div>
                  <Label className="text-slate-300">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark (Default)</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">বাংলা (Bangla)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Dhaka">Bangladesh (GMT+6)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => {
                  setSaved(true)
                  setTimeout(() => setSaved(false), 2000)
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
