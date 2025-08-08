/**
 * Shared types for the PlaygroundV2 components
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'comment';
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface Stat {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface Settings {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
  emailUpdates: boolean;
  twoFactorAuth: boolean;
}