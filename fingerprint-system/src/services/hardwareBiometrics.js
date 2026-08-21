/**
 * Cross-platform Service to communicate with the local Biometric Proxy Server (http://localhost:5000)
 * Works on both Linux (sfe_linux_middleman) and Windows (sfe_middleman64.exe)
 */

const LOCAL_PROXY_URL = 'http://localhost:5000';

/**
 * Checks if the local Biometric Proxy server is active
 * @returns {Promise<boolean>}
 */
export async function checkHardwareProxyStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${LOCAL_PROXY_URL}/status`, {
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return data.success === true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Trigger a hardware fingerprint capture from the local scanner via the proxy server
 * @param {number} sensorType Default 4 (SENSOR_EB6048)
 * @param {number} timeoutMs Default 20000ms (20 seconds)
 * @returns {Promise<{success: boolean, templateBase64: string, qualityScore: number, imageBase64?: string, imageDataUrl?: string}>}
 */
export async function captureFromHardware(sensorType = 4, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${LOCAL_PROXY_URL}/capture?sensorType=${sensorType}`, {
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal
    });
    const data = await response.json();

    if (data.success && data.template) {
      const realQuality = typeof data.qualityScore === 'number' ? data.qualityScore : 0;

      return {
        success: true,
        templateBase64: data.template,
        qualityScore: realQuality,
        sensorType: data.sensorType,
        imageBase64: data.imageBase64,
        imageMime: data.imageMime || (data.imageBase64 ? "image/png" : undefined),
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        imageDataUrl: data.imageBase64 ? `data:${data.imageMime || "image/png"};base64,${data.imageBase64}` : undefined,
        diagnostics: data.diagnostics
      };
    } else {
      const message = data.diagnostics
        ? `${data.error || "Failed to capture fingerprint from scanner."} Diagnostics: ${data.diagnostics}`
        : (data.error || "Failed to capture fingerprint from scanner.");
      throw new Error(message);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Fingerprint capture timed out. Please place your finger on the sensor and try again.");
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error("Local biometric scanner proxy server (sfe_middleman) is not running on port 5000. Please start the middleman service.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Verify two fingerprint templates on the local hardware engine
 * @param {string} templateA Base64 string
 * @param {string} templateB Base64 string
 * @param {number} timeoutMs Default 15000ms
 * @returns {Promise<{success: boolean, matched: boolean, score: number}>}
 */
export async function verifyWithHardware(templateA, templateB, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${LOCAL_PROXY_URL}/verify`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ templateA, templateB })
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.diagnostics ? `${result.error} Diagnostics: ${result.diagnostics}` : result.error);
    }
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Biometric verification timed out.");
    }
    if (error.message && !error.message.includes('Failed to communicate')) {
      throw error;
    }
    throw new Error("Failed to communicate with local biometric engine.");
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Identify a fingerprint template against an array of candidate templates on the local hardware engine
 * @param {string} template Base64 string
 * @param {Array<{id: string, template: string}>} candidates List of candidates
 * @param {number} timeoutMs Default 20000ms
 * @returns {Promise<{success: boolean, matched: boolean, matchedId?: string, code?: number}>}
 */
export async function identifyWithHardware(template, candidates, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${LOCAL_PROXY_URL}/identify`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ template, candidates })
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to identify fingerprint.");
    }
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Biometric identification timed out.");
    }
    if (error.message && !error.message.includes('Failed to communicate')) {
      throw error;
    }
    throw new Error("Failed to communicate with local biometric engine.");
  } finally {
    clearTimeout(timeoutId);
  }
}
