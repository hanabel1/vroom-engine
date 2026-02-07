import React from 'react';
import type { ComponentRegistry } from '../types';

const registry: ComponentRegistry = {
  systemId: 'tailwind-ui',
  systemName: 'Tailwind UI',
  version: '3.0',
  sourceUrl: 'https://tailwindui.com/',
  components: {
    button: {
      name: 'Button',
      aliases: ['btn', 'cta'],
      category: 'input',
      description: 'Buttons allow users to take actions with a single click.',
      element: (
        <button className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm">
          Button
        </button>
      ),
    },
    input: {
      name: 'Input',
      aliases: ['textfield', 'text-input'],
      category: 'input',
      description: 'Text input field for user data entry.',
      element: (
        <input
          className="block w-full min-w-[200px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400"
          placeholder="Enter text"
        />
      ),
    },
    card: {
      name: 'Card',
      aliases: ['panel', 'container'],
      category: 'surface',
      description: 'Cards group related content and actions.',
      element: (
        <div className="min-w-[200px] rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Card Title</h3>
          <p className="text-sm text-gray-500">Card content goes here with some descriptive text.</p>
        </div>
      ),
    },
    badge: {
      name: 'Badge',
      aliases: ['tag', 'label'],
      category: 'display',
      description: 'Badges highlight important information or status.',
      element: (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          Badge
        </span>
      ),
    },
    alert: {
      name: 'Alert',
      aliases: ['notification', 'message'],
      category: 'feedback',
      description: 'Alerts communicate important information to users.',
      element: (
        <div className="flex rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="mr-3 flex h-5 w-5 items-center justify-center text-emerald-500">✓</div>
          <div>
            <h3 className="mb-1 font-medium">Success</h3>
            <p>Your changes have been saved successfully.</p>
          </div>
        </div>
      ),
    },
  },
};

export default registry;
