import { getLibraryVersion, verifyTemplates, identifyTemplate } from './sfe_sdk.js';

async function run() {
  try {
    console.log("Testing JS SDK wrapper...");
    
    const ver = await getLibraryVersion();
    console.log("1. Version test: SUCCESS, version = " + ver);

    // Create a 1404-byte base64 template of zeros
    const zeroBuffer = Buffer.alloc(1404, 0);
    const tempZeroB64 = zeroBuffer.toString('base64');

    console.log("2. Verifying identical templates (all zeros)...");
    try {
      const result = await verifyTemplates(tempZeroB64, tempZeroB64);
      console.log("Result:", result);
    } catch (e) {
      console.log("Caught expected verify error (zeros template may fail validation in the engine):", e.message);
    }

    console.log("3. Identifying against list of templates...");
    const templates = [
      { id: "child_123", templateBase64: tempZeroB64 }
    ];
    try {
      const match = await identifyTemplate(tempZeroB64, templates);
      console.log("Match:", match);
    } catch (e) {
      console.log("Caught expected identify error:", e.message);
    }

    console.log("Test finished!");
  } catch (err) {
    console.error("Test failed with unexpected error:", err);
  }
}

run();
