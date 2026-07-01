/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Citizen' | 'Officer' | 'Admin' | 'MLA' | 'Collector';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward: string;
  phone: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  text: string;
  created_at: string;
}

export interface AIAnalysis {
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  sentiment: 'Angry' | 'Neutral' | 'Urgent' | 'Frustrated' | 'Constructive';
  department: string;
  estimated_cost: number; // in INR (₹)
  priority_score: number; // 0-100
  summary: string;
  recommendation: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: 'Roads' | 'Water Supply' | 'Garbage/Sanitation' | 'Street Lights' | 'Health/Sewage' | 'Education' | 'Other';
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Resolved' | 'Escalated';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  latitude: number;
  longitude: number;
  ward: string;
  created_by: string;
  created_by_name: string;
  image?: string;
  created_at: string;
  updated_at: string;
  comments: Comment[];
  ai_analysis?: AIAnalysis;
}

export interface Ward {
  id: string;
  name: string;
  district: string;
  population: number;
  budget: number; // Annual budget in INR lakhs (e.g. 50 = ₹50 Lakhs)
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface BudgetSuggestion {
  id: string;
  ward: string;
  road: number;      // percentage (e.g. 35)
  water: number;     // percentage (e.g. 25)
  garbage: number;   // percentage (e.g. 20)
  health: number;    // percentage (e.g. 15)
  education: number; // percentage (e.g. 5)
  ai_comment: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  created_at: string;
}
