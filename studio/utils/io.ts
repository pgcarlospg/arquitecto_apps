import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import yaml from 'js-yaml';

/**
 * Read a file as text
 */
export async function readTextFile(filePath: string): Promise<string> {
  return await readFile(filePath, 'utf-8');
}

/**
 * Write text to a file, creating directories if needed
 */
export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf-8');
}

/**
 * Read and parse JSON file
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T> {
  const content = await readTextFile(filePath);
  return JSON.parse(content) as T;
}

/**
 * Write object to JSON file with formatting
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await writeTextFile(filePath, content);
}

/**
 * Read and parse YAML file
 */
export async function readYamlFile<T = any>(filePath: string): Promise<T> {
  const content = await readTextFile(filePath);
  return yaml.load(content) as T;
}

/**
 * Write object to YAML file
 */
export async function writeYamlFile(filePath: string, data: unknown): Promise<void> {
  const content = yaml.dump(data, { indent: 2, lineWidth: 120 });
  await writeTextFile(filePath, content);
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all files in directory recursively
 */
export async function listFilesRecursive(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dirPath);
  return files;
}

/**
 * Append line to JSONL file
 */
export async function appendJsonLine(filePath: string, data: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const line = JSON.stringify(data) + '\n';
  const { appendFile } = await import('node:fs/promises');
  await appendFile(filePath, line, 'utf-8');
}
