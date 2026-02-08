import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Button } from 'reshaped';
import { useActiveComponent } from '@/ui/selectors';
import { useAppStore } from '@/ui/store';
import { HtmlPreview } from './HtmlPreview';
import { parseHTMLInUI } from '@/ui/utils/parseHtml';
import { copyToClipboard } from '@/ui/utils/copyToClipboard';
import type { Component, ComponentProp, ComponentVariant, PropType } from '@/ui/types/catalog';
import type { UIMessage } from '@/ui/types/messages';

function sendPluginMessage(message: UIMessage) {
  parent.postMessage({ pluginMessage: message }, '*');
}

const STATE_TABS = ['Default', 'Hover', 'Focus', 'Disabled'] as const;

function getDefaultPropValues(props: ComponentProp[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!props) return out;
  for (const p of props) {
    if (p.defaultValue != null) out[p.name] = p.defaultValue;
    else if (p.type === 'boolean') out[p.name] = 'false';
    else if (p.type === 'enum' && p.values?.length) out[p.name] = p.values[0].value;
  }
  return out;
}

function findVariantHtml(component: Component, selectedProps: Record<string, string>): string | undefined {
  if (!component.variants?.length) return undefined;
  let best: ComponentVariant | null = null;
  let bestScore = 0;
  for (const v of component.variants) {
    if (!v.html) continue;
    let match = true;
    let score = 0;
    for (const [k, val] of Object.entries(v.props)) {
      if (selectedProps[k] !== val) {
        match = false;
        break;
      }
      score += 1;
    }
    if (match && score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best?.html;
}

function findVariantHtmlByState(component: Component, state: string): string | undefined {
  if (!component.variants?.length) return undefined;
  const stateLower = state.toLowerCase();
  const v = component.variants.find(
    (x) =>
      x.name.toLowerCase() === stateLower || (x.props && (x.props.state === state || x.props.state === stateLower)),
  );
  return v?.html;
}

function generateJsx(componentName: string, props: Record<string, string>): string {
  const attrs = Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => {
      if (v === 'true') return k;
      if (v === 'false') return '';
      const escaped = v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `${k}="${escaped}"`;
    })
    .filter(Boolean);
  const name = componentName || 'Component';
  if (attrs.length === 0) return `<${name} />`;
  const attrsStr = attrs.join(' ');
  return `<${name} ${attrsStr}>\n  …\n</${name}>`;
}

export function ComponentDetail() {
  const component = useActiveComponent();
  const activeRef = useAppStore((s) => s.activeComponent);
  const placementStatus = useAppStore((s) => s.placementStatus);
  const placementError = useAppStore((s) => s.placementError);

  const [activeStateTab, setActiveStateTab] = useState<(typeof STATE_TABS)[number]>('Default');
  const [selectedProps, setSelectedProps] = useState<Record<string, string>>({});
  const [copyFeedback, setCopyFeedback] = useState<'code' | 'source' | null>(null);

  const designSystemId = activeRef?.designSystemId ?? '';
  const componentId = activeRef?.id ?? '';

  const currentHtml = useMemo(() => {
    if (!component) return '';
    if (activeStateTab === 'Disabled') {
      const previewProps = { ...selectedProps, disabled: 'true' };
      return (
        findVariantHtml(component, previewProps) ?? findVariantHtmlByState(component, 'disabled') ?? component.html
      );
    }
    if (activeStateTab === 'Hover') {
      return findVariantHtmlByState(component, 'hover') ?? findVariantHtml(component, selectedProps) ?? component.html;
    }
    if (activeStateTab === 'Focus') {
      return findVariantHtmlByState(component, 'focus') ?? findVariantHtml(component, selectedProps) ?? component.html;
    }
    return findVariantHtml(component, selectedProps) ?? component.html;
  }, [component, selectedProps, activeStateTab]);

  useEffect(() => {
    if (component) setSelectedProps(getDefaultPropValues(component.props));
  }, [component, activeRef?.id, activeRef?.designSystemId]);

  const updateProp = useCallback((name: string, value: string) => {
    setSelectedProps((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handlePlace = useCallback(() => {
    if (!currentHtml || !designSystemId || !componentId) return;
    const parsed = parseHTMLInUI(currentHtml);
    if (!parsed) return;
    useAppStore.getState().startPlacement();
    sendPluginMessage({
      type: 'PLACE_COMPONENT',
      payload: { designSystemId, componentId, parsedElement: parsed },
      requestId: `${Date.now()}-${Math.random()}`,
    });
  }, [currentHtml, designSystemId, componentId]);

  const handleCopySource = useCallback(() => {
    if (!currentHtml) return;
    if (copyToClipboard(currentHtml)) {
      setCopyFeedback('source');
      setTimeout(() => setCopyFeedback(null), 1500);
    }
  }, [currentHtml]);

  const handleCopyCode = useCallback(() => {
    if (!component) return;
    const propsForCode = activeStateTab === 'Disabled' ? { ...selectedProps, disabled: 'true' } : selectedProps;
    const code = generateJsx(component.name, propsForCode);
    if (copyToClipboard(code)) {
      setCopyFeedback('code');
      setTimeout(() => setCopyFeedback(null), 1500);
    }
  }, [component, selectedProps, activeStateTab]);

  const goBack = () => {
    useAppStore.getState().resetPlacement();
    useAppStore.getState().goBack();
  };

  if (!component || !activeRef) {
    return (
      <div className="detail">
        <header className="detail-header">
          <button type="button" className="detail-back" onClick={goBack} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <Text variant="body-2">Component not found</Text>
        </header>
      </div>
    );
  }

  const codeProps = activeStateTab === 'Disabled' ? { ...selectedProps, disabled: 'true' } : selectedProps;
  const jsxCode = generateJsx(component.name ?? component.id, codeProps);

  return (
    <div className="detail">
      {/* Sticky header */}
      <header className="detail-header">
        <button type="button" className="detail-back" onClick={goBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <svg
          className="detail-header-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0066ff"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <Text variant="body-2" weight="bold">
          {component.name}
        </Text>
      </header>

      {/* Scrollable body */}
      <div className="detail-body">
        {/* Preview with grid background */}
        <section className="detail-preview">
          <HtmlPreview
            html={currentHtml}
            showDimensions
            previewState={
              activeStateTab === 'Default'
                ? undefined
                : (activeStateTab.toLowerCase() as 'hover' | 'focus' | 'disabled')
            }
          />
        </section>

        {/* State tabs - inline, no section title */}
        <div className="detail-state-tabs-container">
          <div className="detail-state-tabs">
            {STATE_TABS.map((state) => (
              <button
                key={state}
                type="button"
                className={`detail-state-tab${activeStateTab === state ? ' active' : ''}`}
                onClick={() => setActiveStateTab(state)}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Properties */}
        {component.props && component.props.length > 0 && (
          <section className="detail-section">
            <h2 className="detail-section-title">Properties</h2>
            <div className="detail-props">
              {component.props.map((prop) => (
                <PropControl
                  key={prop.name}
                  prop={prop}
                  value={selectedProps[prop.name] ?? prop.defaultValue ?? ''}
                  onChange={(v) => updateProp(prop.name, v)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Code */}
        <section className="detail-section" style={{ marginTop: 'auto' }}>
          <div className="detail-section-header">
            <h2 className="detail-section-title">Code</h2>
            <button type="button" className="detail-copy-link" onClick={handleCopyCode}>
              {copyFeedback === 'code' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="detail-code-block">{jsxCode}</pre>
        </section>

        {/* Placement feedback */}
        {placementStatus === 'placing' && <p className="detail-feedback">Placing…</p>}
        {placementStatus === 'success' && <p className="detail-feedback success">Placed on canvas.</p>}
        {placementStatus === 'error' && placementError && <p className="detail-feedback error">{placementError}</p>}
      </div>

      {/* Sticky bottom action bar */}
      <footer className="detail-actions">
        <Button fullWidth variant="solid" color="primary" size="medium" onClick={handlePlace}>
          + Place on Canvas
        </Button>
        <Button fullWidth variant="outline" color="primary" size="medium" onClick={handleCopySource}>
          {copyFeedback === 'source' ? 'Copied!' : '<> Copy Source'}
        </Button>
      </footer>
    </div>
  );
}

/* ---- Prop controls ---- */

function PropControl({ prop, value, onChange }: { prop: ComponentProp; value: string; onChange: (v: string) => void }) {
  const type = prop.type as PropType;

  if (type === 'boolean') {
    return (
      <div className="detail-prop-row">
        <span className="detail-prop-label">{prop.name}</span>
        <label className="detail-toggle">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          />
          <span className="detail-toggle-track" />
        </label>
      </div>
    );
  }

  if (type === 'enum' && prop.values?.length) {
    return (
      <div className="detail-prop-row">
        <span className="detail-prop-label">{prop.name}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="detail-prop-select">
          {prop.values.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label ?? v.value}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'number' && prop.values?.length) {
    return (
      <div className="detail-prop-row">
        <span className="detail-prop-label">{prop.name}</span>
        <div className="detail-size-group">
          {prop.values.map((v) => (
            <button
              key={v.value}
              type="button"
              className={`detail-size-btn${value === v.value ? ' active' : ''}`}
              onClick={() => onChange(v.value)}
            >
              {v.label ?? v.value}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="detail-prop-row">
      <span className="detail-prop-label">{prop.name}</span>
      <input
        type={type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="detail-prop-input"
      />
    </div>
  );
}
