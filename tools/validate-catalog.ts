#!/usr/bin/env node
// Catalog validation script

import { readFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

const CATALOG_DIR = 'src/catalog';

interface ValidationError {
  file: string;
  component?: string;
  field: string;
  message: string;
}

const errors: ValidationError[] = [];

// Find all catalog JSON files
const catalogFiles = glob.sync(join(CATALOG_DIR, '*.json'));

if (catalogFiles.length === 0) {
  console.error('❌ No catalog files found in', CATALOG_DIR);
  process.exit(1);
}

console.log(`🔍 Validating ${catalogFiles.length} catalog files...\n`);

for (const file of catalogFiles) {
  try {
    const content = readFileSync(file, 'utf-8');
    const catalog = JSON.parse(content);
    
    // Validate design system
    if (!catalog.id) {
      errors.push({ file, field: 'id', message: 'Missing design system id' });
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(catalog.id)) {
      errors.push({ file, field: 'id', message: 'Invalid id format (must be lowercase with hyphens)' });
    }
    
    if (!catalog.name) {
      errors.push({ file, field: 'name', message: 'Missing design system name' });
    }
    
    if (!catalog.version) {
      errors.push({ file, field: 'version', message: 'Missing version' });
    }
    
    if (!Array.isArray(catalog.components) || catalog.components.length === 0) {
      errors.push({ file, field: 'components', message: 'Missing or empty components array' });
      continue;
    }
    
    // Validate each component
    for (const component of catalog.components) {
      if (!component.id) {
        errors.push({ file, component: component.name, field: 'id', message: 'Missing component id' });
      }
      
      if (!component.name) {
        errors.push({ file, component: component.id, field: 'name', message: 'Missing component name' });
      }
      
      if (!component.category) {
        errors.push({ file, component: component.id, field: 'category', message: 'Missing category' });
      } else if (!['input', 'display', 'navigation', 'feedback', 'layout', 'surface'].includes(component.category)) {
        errors.push({ file, component: component.id, field: 'category', message: `Invalid category: ${component.category}` });
      }
      
      if (!component.html) {
        errors.push({ file, component: component.id, field: 'html', message: 'Missing HTML' });
      }
      
      if (!component.previewUrl) {
        errors.push({ file, component: component.id, field: 'previewUrl', message: 'Missing preview URL' });
      }
      
      // Validate props
      if (component.props) {
        for (const prop of component.props) {
          if (prop.type === 'enum' && (!prop.values || prop.values.length === 0)) {
            errors.push({ file, component: component.id, field: `props.${prop.name}`, message: 'Enum prop missing values' });
          }
        }
      }
    }
    
    console.log(`✅ ${file} - ${catalog.components.length} components`);
  } catch (error) {
    errors.push({ file, field: 'parse', message: error instanceof Error ? error.message : 'Parse error' });
    console.log(`❌ ${file} - Parse error`);
  }
}

console.log(`\n📊 Validation complete\n`);

if (errors.length > 0) {
  console.error(`❌ Found ${errors.length} errors:\n`);
  for (const error of errors) {
    console.error(`  ${error.file}${error.component ? ` > ${error.component}` : ''} > ${error.field}: ${error.message}`);
  }
  process.exit(1);
} else {
  console.log('✅ All catalog files are valid!');
  process.exit(0);
}
