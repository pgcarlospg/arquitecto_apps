import Ajv from 'ajv/dist/2020.js';
import type { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { readJsonFile } from './io.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Schema validator using AJV with custom formats
 */
export class SchemaValidator {
  private ajv: any; // Using any to work around ESM type resolution issues
  private validators = new Map<string, ValidateFunction>();
  private schemasLoaded = false;

  constructor() {
    // @ts-ignore - ESM type resolution issue with AJV default export
    this.ajv = new Ajv({
      strict: true,
      allErrors: true,
      verbose: true,
      loadSchema: this.loadSchemaAsync.bind(this),
    });

    (addFormats as any)(this.ajv);
    this.registerCustomFormats();
  }

  /**
   * Register custom formats
   */
  private registerCustomFormats(): void {
    // SHA-256 hash format
    this.ajv.addFormat('sha256-hash', {
      type: 'string',
      validate: (x: string) => /^sha256:[a-f0-9]{64}$/.test(x),
    });

    // Semantic version format
    this.ajv.addFormat('semver', {
      type: 'string',
      validate: (x: string) => /^\d+\.\d+\.\d+(-.+)?(\+.+)?$/.test(x),
    });
  }

  /**
   * Async schema loader for $ref resolution
   */
  private async loadSchemaAsync(uri: string): Promise<any> {
    // Convert schema URI to file path
    const schemaPath = this.uriToFilePath(uri);
    try {
      return await readJsonFile(schemaPath);
    } catch (error) {
      throw new Error(`Failed to load schema ${uri}: ${error}`);
    }
  }

  /**
   * Convert schema URI to file system path
   */
  private uriToFilePath(uri: string): string {
    const baseUrl = 'https://architect-studio/schemas/';
    if (!uri.startsWith(baseUrl)) {
      throw new Error(`Invalid schema URI: ${uri}`);
    }
    
    const relativePath = uri.substring(baseUrl.length);
    const schemasDir = join(__dirname, '..', 'schemas');
    return join(schemasDir, relativePath);
  }

  /**
   * Load all schemas from the schemas directory
   */
  async loadSchemas(): Promise<void> {
    if (this.schemasLoaded) return;

    const schemasDir = join(__dirname, '..', 'schemas');
    const schemaFiles = [
      'common/base.schema.json',
      'functional-spec.schema.json',
      'design-brief.schema.json',
      'domain-model.schema.json',
      'component-map.schema.json',
      'adr.schema.json',
      'prompt-pack.schema.json',
      'build-plan.schema.json',
      'gate-report.schema.json',
    ];

    for (const file of schemaFiles) {
      const schemaPath = join(schemasDir, file);
      try {
        const schema = await readJsonFile(schemaPath);
        this.ajv.addSchema(schema);
      } catch (error) {
        console.warn(`Warning: Could not load schema ${file}:`, error);
      }
    }

    this.schemasLoaded = true;
  }

  /**
   * Validate data against a schema
   */
  async validate<T = unknown>(schemaId: string, data: unknown): Promise<ValidationResult<T>> {
    await this.loadSchemas();

    let validate = this.validators.get(schemaId);
    if (!validate) {
      validate = this.ajv.getSchema(schemaId) ?? undefined;
      if (!validate) {
        return {
          success: false,
          errors: [`Schema not found: ${schemaId}`],
        };
      }
      this.validators.set(schemaId, validate);
    }

    const valid = validate(data);
    
    if (valid) {
      return { success: true, data: data as T };
    }

    const errors = this.formatErrors(validate.errors ?? []);
    return { success: false, errors };
  }

  /**
   * Format AJV errors into readable messages
   */
  private formatErrors(errors: ErrorObject[]): string[] {
    return errors.map(err => {
      const path = err.instancePath || '/';
      const message = err.message || 'validation failed';
      
      if (err.params && Object.keys(err.params).length > 0) {
        const params = JSON.stringify(err.params);
        return `${path}: ${message} (${params})`;
      }
      
      return `${path}: ${message}`;
    });
  }

  /**
   * Compile schema for faster repeated validation
   */
  async compileSchema(schemaId: string): Promise<ValidateFunction | null> {
    await this.loadSchemas();
    const validate = this.ajv.getSchema(schemaId);
    if (validate) {
      this.validators.set(schemaId, validate);
    }
    return validate ?? null;
  }
}

// Singleton instance
let validatorInstance: SchemaValidator | null = null;

export function getValidator(): SchemaValidator {
  if (!validatorInstance) {
    validatorInstance = new SchemaValidator();
  }
  return validatorInstance;
}
