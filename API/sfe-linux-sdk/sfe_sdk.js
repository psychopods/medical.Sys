import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, 'sfe_cli');
const DEFAULT_MIDDLEMAN_URL = 'http://localhost:5000';

/**
 * Check if the SFE Middleman HTTP server is active
 */
export function checkMiddlemanStatus(baseUrl = DEFAULT_MIDDLEMAN_URL) {
  return new Promise((resolve) => {
    try {
      const u = new URL('/status', baseUrl);
      const req = http.get(u, { timeout: 1500 }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data.success === true);
          } catch {
            resolve(false);
          }
        });
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Capture a fingerprint template from physical scanner via middleman
 */
export function captureTemplate(sensorType = 4, baseUrl = DEFAULT_MIDDLEMAN_URL) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(`/capture?sensorType=${sensorType}`, baseUrl);
      const req = http.get(u, { timeout: 15000 }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.success && data.template) {
              resolve(data);
            } else {
              reject(new Error(data.error || 'Capture failed'));
            }
          } catch (err) {
            reject(new Error('Failed to parse capture response: ' + body));
          }
        });
      });
      req.on('error', err => reject(err));
      req.on('timeout', () => { req.destroy(); reject(new Error('Capture request timed out')); });
    } catch (err) {
      reject(err);
    }
  });
}

export function getLibraryVersion() {
  return new Promise((resolve, reject) => {
    execFile(CLI_PATH, ['version'], (error, stdout) => {
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

export async function verifyTemplates(tempA_b64, tempB_b64, baseUrl = DEFAULT_MIDDLEMAN_URL) {
  // Try HTTP middleman first
  const middlemanActive = await checkMiddlemanStatus(baseUrl);
  if (middlemanActive) {
    return new Promise((resolve, reject) => {
      try {
        const u = new URL('/verify', baseUrl);
        const reqData = JSON.stringify({ templateA: tempA_b64, templateB: tempB_b64 });
        const req = http.request(u, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(reqData)
          },
          timeout: 5000
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.success) {
                resolve({ matched: data.matched, code: data.code, diagnostics: data.diagnostics, similarity: data.similarity });
              } else {
                const message = data.diagnostics
                  ? `${data.error || 'Verification failed'} Diagnostics: ${data.diagnostics}`
                  : (data.error || 'Verification failed');
                reject(new Error(message));
              }
            } catch (err) {
              reject(new Error('Failed to parse verify response: ' + body));
            }
          });
        });
        req.on('error', err => reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('Verify request timed out')); });
        req.write(reqData);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback to sfe_cli
  return new Promise((resolve, reject) => {
    execFile(CLI_PATH, ['verify', tempA_b64, tempB_b64], (error, stdout, stderr) => {
      try {
        const output = stdout.trim() ? stdout : stderr;
        const res = JSON.parse(output);
        if (res.success) {
          resolve({ matched: res.matched, code: res.code, diagnostics: res.diagnostics, similarity: res.similarity });
        } else {
          const message = res.diagnostics
            ? `${res.error || "Verification failed"} Diagnostics: ${res.diagnostics}`
            : (res.error || "Verification failed");
          reject(new Error(message));
        }
      } catch (err) {
        reject(new Error("Failed to parse verify output: " + stdout + " err: " + err.message));
      }
    });
  });
}

export async function identifyTemplate(candidate_b64, templates, baseUrl = DEFAULT_MIDDLEMAN_URL) {
  if (!Array.isArray(templates) || templates.length === 0) {
    return null;
  }

  const middlemanActive = await checkMiddlemanStatus(baseUrl);
  if (middlemanActive) {
    return new Promise((resolve, reject) => {
      try {
        const u = new URL('/identify', baseUrl);
        const reqData = JSON.stringify({ candidate: candidate_b64, templates });
        const req = http.request(u, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(reqData)
          },
          timeout: 10000
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.success) {
                if (data.matched) {
                  resolve({ id: data.id, similarity: data.similarity });
                } else {
                  resolve(data.diagnostics ? { matched: false, diagnostics: data.diagnostics } : null);
                }
              } else {
                const message = data.diagnostics
                  ? `${data.error || 'Identification failed'} Diagnostics: ${data.diagnostics}`
                  : (data.error || 'Identification failed');
                reject(new Error(message));
              }
            } catch (err) {
              reject(new Error('Failed to parse identify response: ' + body));
            }
          });
        });
        req.on('error', err => reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('Identify request timed out')); });
        req.write(reqData);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback to sfe_cli file mode
  return new Promise((resolve, reject) => {
    const tempFilePath = path.join(os.tmpdir(), `sfe_db_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.txt`);
    const content = templates.map(t => `${t.id} ${t.templateBase64}`).join('\n');

    try {
      fs.writeFileSync(tempFilePath, content);
    } catch (writeErr) {
      return reject(writeErr);
    }

    execFile(CLI_PATH, ['identify', candidate_b64, tempFilePath], (error, stdout, stderr) => {
      try { fs.unlinkSync(tempFilePath); } catch {}

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
