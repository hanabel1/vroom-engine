import { createRoot } from 'react-dom/client';
import { Reshaped } from 'reshaped';
import 'reshaped/themes/figma/theme.css';
import App from './ui/App';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <Reshaped theme="figma">
    <App />
  </Reshaped>,
);
