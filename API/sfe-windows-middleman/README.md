# SFE Windows Biometric Proxy Server

This proxy server acts as a middleman between your browser-based web application (React frontend) and the physical Smackbio SB1001U USB fingerprint scanner on Windows. 

It starts a local HTTP server on `http://localhost:5000` and translates web requests into hardware-level calls via the proprietary Windows SDK DLLs.

---

## Folder Contents
*   **`SfeMiddleman.cs`**: The complete C# source code for the proxy server. It contains no external dependencies and compiles natively.
*   **`compile.bat`**: Searches for the built-in Windows C# compiler (`csc.exe`) and builds both 32-bit and 64-bit executables.
*   **`run.bat`**: Automatically runs the compiled proxy server.

---

## Setup & Running on Windows

### Step 1: Copy files to Windows
Copy this entire directory (`sfe-windows-middleman`) to your Windows PC where the fingerprint scanner will be connected.

### Step 2: Copy SDK DLLs
Copy the required DLLs from the **SB1001U SDK** into this folder:
*   **For 64-bit execution**: Copy `SFE64.dll` and `SFEMediator64.dll` from the SDK's `Win/BIN/` directory.
*   **For 32-bit execution**: Copy `SFE.dll` and `SFEMediator.dll` from the SDK's `Win/BIN/` directory.

> [!NOTE]
> Make sure you copy these DLLs directly into the same directory as `SfeMiddleman.cs`.

### Step 3: Compile
Double-click **`compile.bat`**. 
It will search for the native .NET Framework compiler on your system and output:
*   `sfe_middleman64.exe` (64-bit)
*   `sfe_middleman32.exe` (32-bit)

### Step 4: Run
Make sure the fingerprint scanner is plugged into a USB port on your Windows machine.
Double-click **`run.bat`** (or execute `sfe_middleman64.exe` or `sfe_middleman32.exe` directly).
*   The console window will open and output: `Proxy server is listening on http://localhost:5000/`.

---

## API Endpoints (CORS Enabled)

The proxy server exposes the following endpoints to localhost clients:

### 1. Status Check
*   **URL**: `GET http://localhost:5000/status`
*   **Response**:
    ```json
    {
      "success": true,
      "status": "running",
      "details": "SFE Biometric Proxy Server"
    }
    ```

### 2. Capture Fingerprint
*   **URL**: `GET http://localhost:5000/capture?sensorType=4`
*   **Description**: Opens the fingerprint scanner, waits for a finger to be placed on the sensor (up to 10 seconds timeout), captures the print, extracts the template, and returns it as a Base64-encoded string.
*   **Parameters**:
    *   `sensorType` *(Optional)*: `4` (SENSOR_EB6048 - default), `5` (SENSOR_GC0307), or `6` (SENSOR_EB6048_20).
*   **Success Response**:
    ```json
    {
      "success": true,
      "template": "S0FOS1d...[1404-bytes decoded base64 string]..."
    }
    ```
*   **Error Response** (e.g. timeout or no reader connected):
    ```json
    {
      "success": false,
      "error": "Timeout waiting for finger placement"
    }
    ```

### 3. Verify / Match Templates
*   **URL**: `POST http://localhost:5000/verify`
*   **Headers**: `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "templateA": "Base64StringA...",
      "templateB": "Base64StringB..."
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "matched": true,
      "code": 142
    }
    ```

---

## React Frontend Integration Example

You can trigger a fingerprint capture directly from your React application with a simple fetch request:

```javascript
async function captureFingerprint() {
  try {
    const response = await fetch("http://localhost:5000/capture?sensorType=4");
    const data = await response.json();
    
    if (data.success) {
      console.log("Captured Base64 Template:", data.template);
      // Send data.template to your backend to save or verify
    } else {
      alert("Capture Failed: " + data.error);
    }
  } catch (error) {
    console.error("Local proxy server is not running:", error);
  }
}
```
