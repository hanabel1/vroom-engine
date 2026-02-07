import React from 'react';
import { Alert, Button, Card, CardContent, Chip, TextField, Typography } from '@mui/material';
import type { ComponentRegistry } from '../types';

const registry: ComponentRegistry = {
  systemId: 'mui-v5',
  systemName: 'Material UI',
  version: '5.15',
  sourceUrl: 'https://mui.com/material-ui/',
  components: {
    button: {
      name: 'Button',
      aliases: ['btn', 'cta', 'action-button'],
      category: 'input',
      description: 'Buttons allow users to take actions and make choices with a single tap.',
      element: <Button variant="contained">Button</Button>,
    },
    textfield: {
      name: 'TextField',
      aliases: ['input', 'text-input', 'form-field'],
      category: 'input',
      description: 'Text fields let users enter and edit text.',
      element: <TextField label="Label" placeholder="Placeholder" variant="outlined" />,
    },
    card: {
      name: 'Card',
      aliases: ['panel', 'container'],
      category: 'surface',
      description: 'Cards contain content and actions about a single subject.',
      element: (
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" component="h3">
              Card Title
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Card content goes here
            </Typography>
          </CardContent>
        </Card>
      ),
    },
    chip: {
      name: 'Chip',
      aliases: ['tag', 'badge-label'],
      category: 'display',
      description: 'Chips are compact elements that represent an input, attribute, or action.',
      element: <Chip label="Chip" />,
    },
    alert: {
      name: 'Alert',
      aliases: ['notification', 'message', 'banner'],
      category: 'feedback',
      description:
        "An alert displays a short, important message in a way that attracts the user's attention without interrupting the user's task.",
      element: <Alert severity="success">This is a success alert</Alert>,
    },
  },
};

export default registry;
