/**
 * Quick test to verify all new component imports work
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const componentsToCheck = [
  {
    name: 'FormField',
    path: 'packages/frontend/src/components/ui/FormField/index.ts',
    expectedExports: ['FormField', 'FormGroup', 'FormFieldProps', 'FormGroupProps']
  },
  {
    name: 'ConfirmModal',
    path: 'packages/frontend/src/components/ui/ConfirmModal/index.ts',
    expectedExports: ['ConfirmModal', 'FormModal', 'ConfirmModalProps', 'FormModalProps']
  },
  {
    name: 'Tooltip',
    path: 'packages/frontend/src/components/ui/Tooltip/index.ts',
    expectedExports: ['Tooltip', 'Popover', 'TooltipProps', 'PopoverProps']
  }
];

console.log('🔍 Verifying new component exports...\n');

let allPassed = true;

for (const component of componentsToCheck) {
  try {
    const content = readFileSync(component.path, 'utf-8');
    const missingExports = component.expectedExports.filter(exp => !content.includes(exp));

    if (missingExports.length === 0) {
      console.log(`✅ ${component.name}: All exports found`);
    } else {
      console.log(`❌ ${component.name}: Missing exports: ${missingExports.join(', ')}`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${component.name}: File not found or error reading`);
    allPassed = false;
  }
}

console.log('\n' + (allPassed ? '✅ All components verified!' : '❌ Some components have issues'));

process.exit(allPassed ? 0 : 1);
