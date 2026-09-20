import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const TOP_SOURCE_DIR = path.join(ROOT_DIR, 'Markdown');

export const SOURCE_DIR = path.join(ROOT_DIR, 'SubMarkdown');

export const DIRECT_SOURCE_DIR = path.join(ROOT_DIR, 'DirectMarkdown');

export const OUTPUT_DIR = path.join(ROOT_DIR, 'Post');

export const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
