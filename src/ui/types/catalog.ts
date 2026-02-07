// Catalog data model types

export type Category = 
  | 'input'
  | 'display'
  | 'navigation'
  | 'feedback'
  | 'layout'
  | 'surface';

export type PropType = 'boolean' | 'enum' | 'string' | 'number';

export interface PropValue {
  value: string;
  label?: string;
  previewUrl?: string;
}

export interface ComponentProp {
  name: string;
  type: PropType;
  description?: string;
  defaultValue?: string;
  values?: PropValue[];
}

export interface ComponentVariant {
  name: string;
  props: Record<string, string>;
  previewUrl?: string;
  html?: string;
}

export interface Component {
  id: string;
  name: string;
  aliases?: string[];
  description?: string;
  category: Category;
  previewUrl: string;
  html: string;
  props?: ComponentProp[];
  variants?: ComponentVariant[];
}

export interface DesignSystem {
  id: string;
  name: string;
  version: string;
  description?: string;
  sourceUrl?: string;
  logoUrl?: string;
  components: Component[];
}
