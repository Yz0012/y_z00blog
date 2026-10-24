import fs from 'node:fs';
import matter from 'gray-matter';

export function readFrontMatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return matter(raw); // { data, content }
}

export function getOutputPath(data) {
  return data.outputDir || false;
}

export function getParentHtmlPath(data) {
  return data.parentPath || false;
}

export function stringifyFrontMatter(data) {
  if (!data || Object.keys(data).length === 0) {
    return '';
  }
  return matter.stringify('', data).trimEnd();
}
