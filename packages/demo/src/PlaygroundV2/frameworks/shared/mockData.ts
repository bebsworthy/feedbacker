/**
 * Shared mock data for all framework demos
 */

import { User, Activity, Comment, Stat, ChartData, Settings } from '../../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'Admin',
    status: 'active',
    lastActive: '2 minutes ago'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    role: 'Developer',
    status: 'active',
    lastActive: '1 hour ago'
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    role: 'Designer',
    status: 'inactive',
    lastActive: '3 days ago'
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    role: 'Manager',
    status: 'active',
    lastActive: '5 minutes ago'
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    role: 'Developer',
    status: 'pending',
    lastActive: 'Never'
  }
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    user: 'Sarah Johnson',
    action: 'created',
    target: 'Project Alpha',
    timestamp: '10 minutes ago',
    type: 'create'
  },
  {
    id: '2',
    user: 'Michael Chen',
    action: 'updated',
    target: 'Dashboard Component',
    timestamp: '1 hour ago',
    type: 'update'
  },
  {
    id: '3',
    user: 'Emily Davis',
    action: 'commented on',
    target: 'Design Review',
    timestamp: '2 hours ago',
    type: 'comment'
  },
  {
    id: '4',
    user: 'James Wilson',
    action: 'deleted',
    target: 'Old Documentation',
    timestamp: '3 hours ago',
    type: 'delete'
  },
  {
    id: '5',
    user: 'Lisa Anderson',
    action: 'created',
    target: 'Bug Report #123',
    timestamp: '5 hours ago',
    type: 'create'
  }
];

export const mockComments: Comment[] = [
  {
    id: '1',
    author: 'Sarah Johnson',
    content: 'Great work on the new feature! The UI looks clean and intuitive.',
    timestamp: '2 hours ago',
    likes: 5
  },
  {
    id: '2',
    author: 'Michael Chen',
    content: 'I think we should consider adding more validation to the form fields.',
    timestamp: '3 hours ago',
    likes: 3
  },
  {
    id: '3',
    author: 'Emily Davis',
    content: 'The color scheme works well with our brand guidelines.',
    timestamp: '5 hours ago',
    likes: 8
  }
];

export const mockStats: Stat[] = [
  {
    label: 'Total Users',
    value: '12,543',
    change: 12.5,
    trend: 'up'
  },
  {
    label: 'Active Projects',
    value: '89',
    change: -3.2,
    trend: 'down'
  },
  {
    label: 'Revenue',
    value: '$45,678',
    change: 8.7,
    trend: 'up'
  },
  {
    label: 'Completion Rate',
    value: '94.2%',
    change: 0,
    trend: 'neutral'
  }
];

export const mockChartData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Sales',
      data: [30, 45, 60, 70, 85, 95],
      color: '#667eea'
    },
    {
      label: 'Revenue',
      data: [20, 35, 45, 55, 70, 80],
      color: '#764ba2'
    }
  ]
};

export const mockSettings: Settings = {
  notifications: true,
  darkMode: false,
  language: 'English',
  timezone: 'UTC-8',
  emailUpdates: true,
  twoFactorAuth: false
};

export const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];