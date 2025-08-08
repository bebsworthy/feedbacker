/**
 * Form component for demo application
 */

import React, { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  category: string;
  priority: string;
  description: string;
  newsletter: boolean;
}

export const FormExample: React.FC = React.memo(() => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    category: 'bug',
    priority: 'medium',
    description: '',
    newsletter: false
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form className="demo-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your email"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="improvement">Improvement</option>
            <option value="question">Question</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your feedback in detail..."
        />
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={formData.newsletter}
            onChange={(e) => handleChange('newsletter', e.target.checked)}
          />
          <span>Subscribe to newsletter updates</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitted}>
          {submitted ? 'Submitted ✓' : 'Submit Feedback'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setFormData({
          name: '',
          email: '',
          category: 'bug',
          priority: 'medium',
          description: '',
          newsletter: false
        })}>
          Clear Form
        </button>
      </div>
    </form>
  );
});