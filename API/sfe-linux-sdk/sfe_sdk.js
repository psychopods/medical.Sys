import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, 'sfe_cli');

export function getLibraryVersion() {
  return new Promise((resolve, reject) => {
    execFile(CLI_PATH, ['version'], (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      try {
        const res = JSON.parse(stdout);
        if (res.success) {
          resolve(res.version);
        } else {
          reject(new Error(res.error));
        }
      } catch (err) {
        reject(new Error("Failed to parse CLI output: " + stdout));
      }
    });
  });
}

export function verifyTemplates(tempA_b64, tempB_b64) {
  return new Promise((resolve, reject) => {
    execFile(CLI_PATH, ['verify', tempA_b64, tempB_b64], (error, stdout, stderr) => {
      try {
        // Parse stdout if exists, fallback to stderr
        const output = stdout.trim() ? stdout : stderr;
        const res = JSON.parse(output);
        if (res.success) {
          resolve({ matched: res.matched, code: res.code });
        } else {
          reject(new Error(res.error || "Verification failed"));
        }
      } catch (err) {
        reject(new Error("Failed to parse verify output: " + stdout + " err: " + err.message));
      }
    });
  });
}

export function identifyTemplate(candidate_b64, templates) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(templates) || templates.length === 0) {
      return resolve(null);
    }

    const tempFilePath = path.join(os.tmpdir(), `sfe_db_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.txt`);
    
    // Write templates to temp file: [id] [templateBase64]
    const content = templates
      .map(t => `${t.id} ${t.templateBase64}`)
      .join('\n');
      
    try {
      fs.writeFileSync(tempFilePath, content);
    } catch (writeErr) {
      return reject(writeErr);
    }

    execFile(CLI_PATH, ['identify', candidate_b64, tempFilePath], (error, stdout, stderr) => {
      // Clean up the temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (unlinkErr) {
        console.error("Failed to delete temp file:", unlinkErr);
      }

      if (error && !stdout) {
        return reject(error);
      }

      try {
        const res = JSON.parse(stdout);
        if (res.success) {
          if (res.matched) {
            resolve({ id: res.id, similarity: res.similarity });
          } else {
            resolve(null);
          }
        } else {
          reject(new Error(res.error || "Identification failed"));
        }
      } catch (err) {
        reject(new Error("Failed to parse identify output: " + stdout));
      }
    });
  });
}
