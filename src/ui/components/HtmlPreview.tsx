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
    >
      <div
        className="html-preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
