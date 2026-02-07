import React from 'react';
import {
  Badge,
  Button,
  ButtonGroup,
  Content,
  Dialog,
  Heading,
  Provider,
  Text,
  TextField,
  Well,
  defaultTheme,
} from '@adobe/react-spectrum';
import type { ComponentRegistry } from '../types';

const SpectrumWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider theme={defaultTheme}>{children}</Provider>
);

const registry: ComponentRegistry = {
  systemId: 'spectrum',
  systemName: 'Adobe Spectrum',
  version: '3.0',
  sourceUrl: 'https://spectrum.adobe.com/',
  wrapper: SpectrumWrapper,
  components: {
    button: {
      name: 'Button',
      aliases: ['action-button', 'cta'],
      category: 'input',
      description: 'Buttons allow users to take actions within workflows.',
      element: <Button variant="accent">Button</Button>,
    },
    textfield: {
      name: 'TextField',
      aliases: ['input', 'text-input'],
      category: 'input',
      description: 'Text fields let users enter and edit text.',
      element: <TextField label="Label" placeholder="Placeholder" />,
    },
    card: {
      name: 'Card',
      aliases: ['panel', 'container'],
      category: 'surface',
      description: 'Cards contain content and actions about a single subject.',
      element: (
        <Well>
          <Heading level={4}>Card Title</Heading>
          <Text>Card content goes here</Text>
        </Well>
      ),
    },
    badge: {
      name: 'Badge',
      aliases: ['tag', 'label'],
      category: 'display',
      description: 'Badges highlight status or metadata.',
      element: <Badge variant="positive">Badge</Badge>,
    },
    dialog: {
      name: 'Dialog',
      aliases: ['modal', 'overlay'],
      category: 'feedback',
      description: 'Dialogs communicate information or request user input.',
      element: (
        <Dialog>
          <Heading>Dialog Title</Heading>
          <Content>Dialog content goes here</Content>
          <ButtonGroup>
            <Button variant="accent">Confirm</Button>
            <Button variant="secondary">Cancel</Button>
          </ButtonGroup>
        </Dialog>
      ),
    },
  },
};

export default registry;
