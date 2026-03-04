import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const openApiPath = join(root, 'docs', 'api', 'openapi.yaml');
const openApiText = readFileSync(openApiPath, 'utf8');

function parsePathMethods(yamlText) {
  const result = new Map();
  const lines = yamlText.split(/\r?\n/);
  let currentPath = null;

  for (const line of lines) {
    const pathMatch = line.match(/^  (\/[^:]+):\s*$/);
    if (pathMatch) {
      currentPath = pathMatch[1];
      result.set(currentPath, new Set());
      continue;
    }

    if (currentPath) {
      const methodMatch = line.match(/^    (get|post|put|delete|patch):\s*$/i);
      if (methodMatch) {
        result.get(currentPath).add(methodMatch[1].toLowerCase());
        continue;
      }

      const outOfPathBlock = /^  [a-zA-Z]/.test(line);
      if (outOfPathBlock) {
        currentPath = null;
      }
    }
  }

  return result;
}

const requiredContract = {
  '/events': ['get', 'post'],
  '/events/{id}': ['put', 'delete'],
  '/events/{id}/calibrate': ['post'],
  '/products': ['get', 'post'],
  '/products/{id}': ['get', 'patch', 'delete'],
  '/transactions': ['get', 'post'],
  '/dashboard/metrics': ['get'],
  '/dashboard/sales-chart': ['get'],
  '/dashboard/category-sales': ['get'],
  '/users': ['get'],
  '/users/me': ['get', 'put'],
  '/settings/store': ['get', 'put'],
  '/categories': ['get', 'post'],
  '/forecast/train': ['post'],
  '/forecast/predict': ['post'],
  '/forecast/predict/{storeId}': ['post'],
  '/forecast/model/accuracy': ['get'],
  '/chat': ['post'],
};

const forbiddenLegacyPatterns = [
  '/calendar/events',
  '/events/confirm',
  '${this.baseUrl}/train/${storeId}',
  '${this.baseUrl}/predict/${storeId}',
  '/forecast/accuracy?store_id=',
];

const parsed = parsePathMethods(openApiText);
const failures = [];

for (const [path, expectedMethods] of Object.entries(requiredContract)) {
  const existingMethods = parsed.get(path);
  if (!existingMethods) {
    failures.push(`Missing path in OpenAPI: ${path}`);
    continue;
  }

  for (const method of expectedMethods) {
    if (!existingMethods.has(method)) {
      failures.push(`Missing method in OpenAPI: ${method.toUpperCase()} ${path}`);
    }
  }
}

const frontendFiles = [
  join(root, 'src', 'services', 'api.ts'),
  join(root, 'src', 'context', 'StoreContext.tsx'),
  join(root, 'src', 'pages', 'CalendarImproved.tsx'),
];
const frontendContent = frontendFiles
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

for (const pattern of forbiddenLegacyPatterns) {
  if (frontendContent.includes(pattern)) {
    failures.push(`Legacy endpoint usage detected in frontend: "${pattern}"`);
  }
}

if (failures.length > 0) {
  console.error('Contract test failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Contract test passed: OpenAPI and frontend endpoint usage are aligned.');
