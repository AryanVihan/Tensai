import type { TreeEntry } from './github';

export type ProjectType =
  | 'frontend'
  | 'backend'
  | 'full-stack'
  | 'ml'
  | 'mobile'
  | 'library'
  | 'monorepo'
  | 'unknown';

export type TechStackItem = { name: string; category: 'framework' | 'language' | 'tool' | 'package-manager' };

export type AnalysisResult = {
  projectType: ProjectType;
  techStack: TechStackItem[];
  entryPoints: string[];
  configFiles: string[];
  summary: string;
};

const FRAMEWORK_HINTS: Record<string, string> = {
  'package.json': 'node',
  'next.config.js': 'Next.js',
  'next.config.mjs': 'Next.js',
  'next.config.ts': 'Next.js',
  'nuxt.config.js': 'Nuxt',
  'nuxt.config.ts': 'Nuxt',
  'vite.config.js': 'Vite',
  'vite.config.ts': 'Vite',
  'angular.json': 'Angular',
  'vue.config.js': 'Vue',
  'Cargo.toml': 'Rust',
  'go.mod': 'Go',
  'pyproject.toml': 'Python',
  'requirements.txt': 'Python',
  'pom.xml': 'Maven/Java',
  'build.gradle': 'Gradle',
  'docker-compose.yml': 'Docker',
  'Dockerfile': 'Docker',
  'docker-compose.yaml': 'Docker',
};

const LANG_BY_EXT: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.rb': 'Ruby',
};

export function analyzeFromTree(tree: TreeEntry[]): AnalysisResult {
  const paths = tree.map((t) => t.path);
  const techStack: TechStackItem[] = [];
  const entryPoints: string[] = [];
  const configFiles: string[] = [];

  const pathSet = new Set(paths);
  const hasFile = (name: string) => pathSet.has(name) || paths.some((p) => p.endsWith('/' + name));

  // Config / framework hints
  for (const [file, tech] of Object.entries(FRAMEWORK_HINTS)) {
    if (hasFile(file)) {
      techStack.push({ name: tech, category: 'framework' });
      if (['next.config', 'vite.config', 'nuxt.config', 'angular.json', 'vue.config'].some((c) => file.startsWith(c)))
        configFiles.push(file);
    }
  }

  // Package managers
  if (hasFile('package.json')) {
    techStack.push({ name: 'npm', category: 'package-manager' });
    if (hasFile('pnpm-lock.yaml')) techStack.push({ name: 'pnpm', category: 'package-manager' });
    else if (hasFile('yarn.lock')) techStack.push({ name: 'yarn', category: 'package-manager' });
  }
  if (hasFile('Cargo.toml')) techStack.push({ name: 'Cargo', category: 'package-manager' });
  if (hasFile('go.mod')) techStack.push({ name: 'Go modules', category: 'package-manager' });
  if (hasFile('requirements.txt') || hasFile('pyproject.toml'))
    techStack.push({ name: 'pip/uv', category: 'package-manager' });

  // Languages from extensions
  const exts = new Set<string>();
  for (const p of paths) {
    if (p.includes('node_modules') || p.includes('.git/')) continue;
    const m = p.match(/\.([a-z0-9]+)$/i);
    if (m) exts.add('.' + m[1].toLowerCase());
  }
  for (const ext of exts) {
    const lang = LANG_BY_EXT[ext];
    if (lang && !techStack.some((t) => t.name === lang)) techStack.push({ name: lang, category: 'language' });
  }

  // Entry points
  const entryCandidates = [
    'src/main.ts', 'src/main.tsx', 'src/index.ts', 'src/index.tsx',
    'src/App.tsx', 'src/main.js', 'src/index.js', 'app/page.tsx',
    'pages/index.tsx', 'pages/index.js', 'main.py', 'app.py',
    'src/main.go', 'main.go', 'lib/main.rs', 'src/main.rs',
  ];
  for (const ep of entryCandidates) {
    if (pathSet.has(ep) || paths.some((p) => p === ep)) entryPoints.push(ep);
  }
  if (hasFile('package.json') && entryPoints.length === 0) {
    entryPoints.push('package.json (main/module)');
  }

  // Project type
  let projectType: ProjectType = 'unknown';
  const hasNext = techStack.some((t) => t.name === 'Next.js');
  const hasReact = paths.some((p) => p.includes('react') || p.endsWith('.tsx') || p.endsWith('.jsx'));
  const hasBackend = techStack.some((t) => ['Python', 'Go', 'Rust', 'Java', 'Ruby'].includes(t.name))
    || hasFile('Dockerfile') || hasFile('docker-compose.yml');
  const hasML = hasFile('requirements.txt') && (paths.some((p) => p.includes('torch') || p.includes('tensorflow')) || hasFile('pyproject.toml'));
  const isMonorepo = hasFile('pnpm-workspace.yaml') || hasFile('lerna.json') || (pathSet.has('packages') && paths.some((p) => p.startsWith('packages/')));

  if (isMonorepo) projectType = 'monorepo';
  else if (hasML) projectType = 'ml';
  else if (hasNext || (hasReact && !hasBackend)) projectType = 'frontend';
  else if (hasBackend && !hasReact && !hasNext) projectType = 'backend';
  else if (hasReact && hasBackend) projectType = 'full-stack';

  // Dedupe tech stack
  const seen = new Set<string>();
  const uniqueStack = techStack.filter((t) => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });

  const summary = buildSummary(projectType, uniqueStack, entryPoints, configFiles);
  return {
    projectType,
    techStack: uniqueStack,
    entryPoints,
    configFiles,
    summary,
  };
}

function buildSummary(
  projectType: ProjectType,
  techStack: TechStackItem[],
  entryPoints: string[],
  configFiles: string[]
): string {
  const parts: string[] = [];
  parts.push(`Project type: ${projectType}.`);
  if (techStack.length) {
    parts.push(`Tech stack: ${techStack.map((t) => t.name).join(', ')}.`);
  }
  if (entryPoints.length) {
    parts.push(`Entry points: ${entryPoints.join(', ')}.`);
  }
  if (configFiles.length) {
    parts.push(`Config files: ${configFiles.join(', ')}.`);
  }
  parts.push('Ready for Tensai AI workflows.');
  return parts.join(' ');
}
