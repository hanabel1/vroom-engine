import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Button } from 'reshaped';
import { useActiveComponent } from '@/ui/selectors';
import { useAppStore } from '@/ui/store';
import { usePluginMessage } from '@/ui/hooks/usePluginMessage';
import { HtmlPreview } from './HtmlPreview';
import { parseHTMLInUI } from '@/ui/utils/parseHtml';
import { copyToClipboard } from '../utils/copyToClipboard';
import type { Component, ComponentProp, ComponentVariant, PropType } from '@/ui/types/catalog';

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
      x.name.toLowerCase() === stateLower ||
      (x.props && (x.props.state === state || x.props.state === stateLower))
  );
  return v?.html;
}

/** Generate JSX snippet using the catalog component name (e.g. Button, TextField, Card). */
function generateJsx(componentName: string, props: Record<string, string>): string {
  const attrs = Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => {
      if (v === 'true') return k;
      if (v === 'false') return '';
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)) return `${k}={${v}}`;
      return `${k}="${v}"`;
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
  const { sendMessage } = usePluginMessage(() => {});

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
        findVariantHtml(component, previewProps) ??
        findVariantHtmlByState(component, 'disabled') ??
        component.html
      );
    }
    if (activeStateTab === 'Hover') {
      return (
        findVariantHtmlByState(component, 'hover') ??
        findVariantHtml(component, selectedProps) ??
        component.html
      );
    }
    if (activeStateTab === 'Focus') {
      return (
        findVariantHtmlByState(component, 'focus') ??
        findVariantHtml(component, selectedProps) ??
        component.html
      );
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
    sendMessage({
      type: 'PLACE_COMPONENT',
      payload: { designSystemId, componentId, parsedElement: parsed },
      requestId: `${Date.now()}-${Math.random()}`,
    });
  }, [currentHtml, designSystemId, componentId, sendMessage]);

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

  if (!component || !activeRef) {
    return (
      <div className="component-detail">
        <div className="component-detail-header">
          <button
            type="button"
            className="component-detail-back"
            onClick={() => {
              useAppStore.getState().resetPlacement();
              useAppStore.getState().goBack();
            }}
            aria-label="Back"
          >
            ←
          </button>
          <Text variant="body-2">Component not found</Text>
        </div>
      </div>
    );
  }

  const codeProps =
    activeStateTab === 'Disabled' ? { ...selectedProps, disabled: 'true' } : selectedProps;
  const jsxCode = generateJsx(component.name ?? component.id, codeProps);

  return (
    <div className="component-detail">
      <header className="component-detail-header">
        <button
          type="button"
          className="component-detail-back"
          onClick={() => {
            useAppStore.getState().resetPlacement();
            useAppStore.getState().goBack();
          }}
          aria-label="Back"
        >
          ←
        </button>
        <Text variant="body-2" weight="bold">
          {component.name}
        </Text>
      </header>

      <div className="component-detail-body">
        <section className="component-detail-section">
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

        <section className="component-detail-section">
          <h2 className="component-detail-section-title">State</h2>
          <div className="component-detail-state-tabs">
            {STATE_TABS.map((state) => (
              <button
                key={state}
                type="button"
                className={`component-detail-state-tab ${activeStateTab === state ? 'active' : ''}`}
                onClick={() => setActiveStateTab(state)}
              >
                {state}
              </button>
            ))}
          </div>
        </section>

        {component.props && component.props.length > 0 && (
          <section className="component-detail-section">
            <h2 className="component-detail-section-title">Properties</h2>
            <div className="component-detail-props">
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

        <section className="component-detail-section">
          <h2 className="component-detail-section-title">Code</h2>
          <div className="component-detail-code-block">
            <button type="button" className="component-detail-code-copy" onClick={handleCopyCode}>
              {copyFeedback === 'code' ? 'Copied!' : 'Copy'}
            </button>
            <pre className="component-detail-code-pre" aria-label={`JSX for ${component.name}`}>
              {jsxCode}
            </pre>
          </div>
        </section>

        <section className="component-detail-section">
          <div className="component-detail-actions">
            <Button variant="solid" color="primary" size="small" onClick={handlePlace}>
              Place on Canvas
            </Button>
            <Button variant="outline" color="primary" size="small" onClick={handleCopySource}>
              {copyFeedback === 'source' ? 'Copied!' : 'Copy Source'}
            </Button>
          </div>
          {placementStatus === 'placing' && (
            <p className="component-detail-placement-feedback">Placing…</p>
          )}
          {placementStatus === 'success' && (
            <p className="component-detail-placement-feedback success">Placed on canvas.</p>
          )}
          {placementStatus === 'error' && placementError && (
            <p className="component-detail-placement-feedback error">{placementError}</p>
          )}
        </section>
      </div>
    </div>
  );
}

function PropControl({
  prop,
  value,
  onChange,
}: {
  prop: ComponentProp;
  value: string;
  onChange: (v: string) => void;
}) {
  const type = prop.type as PropType;

  if (type === 'boolean') {
    const checked = value === 'true';
    return (
      <div className="component-detail-prop-row">
        <span className="component-detail-prop-label">{prop.name}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="component-detail-prop-toggle"
        />
      </div>
    );
  }

  if (type === 'enum' && prop.values?.length) {
    return (
      <div className="component-detail-prop-row">
        <span className="component-detail-prop-label">{prop.name}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="component-detail-prop-select"
        >
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
      <div className="component-detail-prop-row">
        <span className="component-detail-prop-label">{prop.name}</span>
        <View direction="row" gap={2}>
          {prop.values.map((v) => (
            <button
              key={v.value}
              type="button"
              className={`component-detail-state-tab ${value === v.value ? 'active' : ''}`}
              onClick={() => onChange(v.value)}
            >
              {v.label ?? v.value}
            </button>
          ))}
        </View>
      </div>
    );
  }

  return (
    <div className="component-detail-prop-row">
      <span className="component-detail-prop-label">{prop.name}</span>
      <input
        type={type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="component-detail-prop-input"
      />
    </div>
  );
}
