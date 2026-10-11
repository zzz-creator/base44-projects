# KwanPro

This workflow guides the process of extracting data from the Base44 platform and migrating it to a local development environment using MSSQL.

## 1. Extraction from Base44 Platform

1. Open your application on the Base44 platform.
2. Open **Browser Developer Tools** (F12).
3. Go to the **Network** tab and check **Disable cache**.
4. Refresh the page.
5. Filter for a request named `files`.
6. Right-click the request and select **Copy** -> **Copy response**.
7. Save this response as `base44-extract.json` in a temporary folder.

## 2. Local Processing

1. Navigate to the `Base44 to Code` utility directory.
2. Run the extraction script:
   ```powershell
   python run.py
   ```
3. When prompted:
   - Select the `base44-extract.json` file you created.
   - Select a target directory for the extracted code.
**Tell the user to do the above and confirm with the directory**
## 3. Database Migration (MSSQL)

Based on the project requirements, ensure the local backend uses MSSQL.

1. **Initialize Database**: Create a new database in your local MSSQL instance.
2. **Setup Schema**: 
   - Read the exact JSON schemas in the application's `entities` directory.
   - Generate a `schema.sql` file manually (without using code/scripts) containing the `CREATE TABLE` definitions based on these entities exactly.
   - Ensure primary keys use unique identifiers (e.g., `id` columns as strings or UUIDs).
3. **Configure Connection**: Update the `.env` file in the project's backend with your MSSQL connection string:
   ```env
   DB_TYPE=mssql
   DB_HOST=localhost
   DB_NAME=YourDatabaseName
   DB_USER=YourUsername
   DB_PASS=YourPassword
   ```

## 4. Local API Client Integration

1. Replace any existing simplified API clients (e.g., standard `axios` setups) with a robust `base44-local-client.js`.
2. A reference implementation for this local client, which fully mimics the Base44 SDK behavior (including dynamic entity proxies and local authentication), can be found at: `C:\Users\mrkee\Documents\HTML\Base44\custom-sdk.js`.
3. Configure the local client to correctly handle the project's specific backend routing (`/api/` or `/api/entities/`).
4. Apply the `// @ts-ignore` directive above `import.meta.env` references to suppress TypeScript lint errors if Vite is used.

## 5. Code Refactoring

1. **Update API Client**: Ensure `src/api/base44Client.js` is configured to point and export the robust local client.
2. **Remove Plugins**: Remove the `@base44/vite-plugin` from `vite.config.js` and `package.json`. Make sure to fully remove the `base44({...})` block, including parameters like `legacySDKImports`, `hmrNotifier`, `navigationNotifier`, and `visualEditAgent`.
3. **Integrations**: Update `InvokeLLM` to explicitly initialize `@google/genai` utilizing standard `VITE_GEMINI_API_KEY`.
4. Fix any errors that come up and refractor any `@` imports.

## 6. Verification

1. Install `concurrently` in the root of your application to easily run both servers:
   ```powershell
   npm install concurrently --save-dev
   ```
2. Update the `dev` script in your root `package.json` to launch both Vite and the Node backend:
   ```json
   "scripts": {
     "dev": "concurrently \"vite\" \"node backend/server.js\""
   }
   ```
3. Start the local backend server and the frontend development server concurrently via the package script:
   ```powershell
   npm run dev
   ```
4. Verify that all data is being fetched from the local MSSQL instance and that authentication and LLM integrations work correctly.

## Complexity Audit
**Manual Complexity Override:** High

### Complex / Risky
- User marked this plan as high complexity.
