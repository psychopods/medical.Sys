# Smackbio Fingerprint Engine (SFE) - Linux SDK Wrapper

This directory contains a C++ command-line wrapper (`sfe_cli`) and a Node.js integration module (`sfe_sdk.js`) for the Smackbio SFE engine (`sfe.so`) dynamically loaded on Linux (x86-64).

## Structure
* `sfe_cli.cpp`: C++ code that loads `sfe.so` and performs operations using standard function codes.
* `sfe_sdk.js`: Node.js module exporting promise-based JS methods wrapping `sfe_cli` subprocess calls.
* `Makefile`: Builds the `sfe_cli` binary on Linux.

## Compilation
To compile the C++ CLI utility, run `make` inside this directory:
```bash
make
```

## CLI Usage
Ensure `sfe.so` is in the same directory, or specified in the library path.

1. **Version Check**:
   ```bash
   ./sfe_cli version
   ```

2. **Verify 1-to-1**:
   ```bash
   ./sfe_cli verify <templateA_base64> <templateB_base64>
   ```

3. **Identify 1-to-Many**:
   ```bash
   ./sfe_cli identify <candidate_base64> <database_file_path>
   ```
   *Note: The database file should contain one database entry per line, in the format `[ID] [templateBase64]`.*

## JS Module Integration
```javascript
import { getLibraryVersion, verifyTemplates, identifyTemplate } from './sfe_sdk.js';

// Get library version
const version = await getLibraryVersion();
console.log("SFE Version:", version);

// Verify templates (1-to-1)
const result = await verifyTemplates(templateA, templateB);
console.log("Matched:", result.matched);

// Identify (1-to-Many)
const templates = [
  { id: "child_id_1", templateBase64: "..." },
  { id: "child_id_2", templateBase64: "..." }
];
const match = await identifyTemplate(candidate, templates);
if (match) {
  console.log("Found match:", match.id, "with similarity:", match.similarity);
}
```
