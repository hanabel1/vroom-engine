export interface HtmlPreviewProps {
  html: string;
  className?: string;
  showDimensions?: boolean;
  previewState?: 'default' | 'hover' | 'focus' | 'disabled';
}

export function HtmlPreview({ html, className, showDimensions = false, previewState }: HtmlPreviewProps) {
  return (
    <div
      className={className ? `html-preview ${className}` : 'html-preview'}
      data-preview-state={previewState ?? undefined}
      style={{ width: '100%', height: '100%', position: 'relative', display: 'flex' }}
    >
      <div
        className="html-preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'hidden',
          maxWidth: '100%',
          maxHeight: '100%',
          placeItems: 'center',
        }}
      />
    </div>
  );
}
