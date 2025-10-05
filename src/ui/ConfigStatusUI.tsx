/**
 * Configuration Status UI Component
 * Shows configuration status and setup instructions when API key is missing
 */

import React from 'react';
import { ConfigStatus } from '../services/openai.types';
import './ConfigStatusUI.css';

interface ConfigStatusUIProps {
  status: ConfigStatus;
}

export function ConfigStatusUI({ status }: ConfigStatusUIProps) {
  if (status.configured) {
    return (
      <div className="config-status-panel configured">
        <div className="status-icon">✅</div>
        <div className="status-content">
          <h4 className="status-title">{status.message}</h4>
          {status.model && (
            <p className="status-model">Using model: <strong>{status.model}</strong></p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="config-status-panel not-configured">
      <div className="status-icon">⚙️</div>
      <div className="status-content">
        <h4 className="status-title">AI Features Not Available</h4>
        <p className="status-message">{status.message}</p>
        {status.instructions && (
          <p className="status-instructions">{status.instructions}</p>
        )}

        <div className="setup-guide">
          <h5>For Administrators:</h5>
          <ol className="setup-steps">
            <li>
              Get an API key from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="external-link"
              >
                OpenAI Platform
              </a>
            </li>
            <li>
              Set the environment variable:
              <pre className="env-example">OPENAI_API_KEY=sk-your-key-here</pre>
            </li>
            <li>Restart the application</li>
          </ol>

          <h5>For Local Development:</h5>
          <div className="dev-setup">
            <p>Create a <code>.env.local</code> file in your project root:</p>
            <pre className="env-file-example">
{`# .env.local
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview  # optional`}
            </pre>
          </div>

          <div className="security-note">
            <div className="note-icon">🔒</div>
            <div className="note-content">
              <strong>Security Note:</strong> API keys are managed securely by the host application 
              and never stored in browser storage. Contact your administrator to enable AI features.
            </div>
          </div>

          <div className="cost-info">
            <div className="info-icon">💰</div>
            <div className="info-content">
              <strong>Cost Information:</strong>
              <ul>
                <li>GPT-4: ~$0.02-0.05 per component</li>
                <li>GPT-3.5-Turbo: ~$0.002-0.005 per component</li>
              </ul>
              <p>Set spending limits in your OpenAI dashboard.</p>
            </div>
          </div>
        </div>

        <div className="help-links">
          <h5>Need Help?</h5>
          <ul className="help-list">
            <li>
              <a 
                href="https://platform.openai.com/docs/quickstart" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                OpenAI API Documentation
              </a>
            </li>
            <li>
              <a 
                href="https://platform.openai.com/account/billing" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Manage Billing & Usage
              </a>
            </li>
            <li>
              <a 
                href="https://platform.openai.com/account/limits" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Set Usage Limits
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
