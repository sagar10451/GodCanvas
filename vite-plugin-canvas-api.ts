/**
 * Vite plugin that adds two API endpoints to the dev server:
 * 
 * POST /__save-public-canvas — saves public canvas JSON to the correct folder
 * POST /__publish — commits and pushes to GitHub via deploy key
 * 
 * Only active during development (localhost). Production builds ignore this.
 */

import type { Plugin } from 'vite';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export function canvasApiPlugin(): Plugin {
  return {
    name: 'canvas-api',
    configureServer(server) {
      // POST /__save-public-canvas
      // Body: { siteId, topicSlug, subtopicSlug, data }
      server.middlewares.use('/__save-public-canvas', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { siteId, topicSlug, subtopicSlug, data } = JSON.parse(body);
            
            // Build the target path
            const dir = join(process.cwd(), 'public', 'notes', siteId, topicSlug, subtopicSlug);
            const filePath = join(dir, 'public-canvas.json');
            
            // Create directory if it doesn't exist
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
            
            // Write the file
            writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, path: filePath }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      // POST /__publish
      // Commits public canvas changes and pushes to GitHub
      server.middlewares.use('/__publish', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { message } = JSON.parse(body || '{}');
            const commitMsg = message || 'Update public canvas';
            const cwd = process.cwd();
            const sshCmd = 'ssh -i ~/.ssh/godcanvas_key';

            // Stage public/notes changes
            execSync('git add public/notes/', { cwd, stdio: 'pipe' });

            // Check if there are changes to commit
            try {
              execSync('git diff --cached --quiet', { cwd, stdio: 'pipe' });
              // No changes
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true, message: 'No changes to publish' }));
              return;
            } catch {
              // There are changes — continue to commit
            }

            // Commit
            execSync(`git commit -m "${commitMsg}"`, { cwd, stdio: 'pipe' });

            // Push
            execSync(`GIT_SSH_COMMAND="${sshCmd}" git push`, { cwd, stdio: 'pipe' });

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, message: 'Published successfully' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: false, error: err.message || err.stderr?.toString() }));
          }
        });
      });

      // Handle CORS preflight for all endpoints
      server.middlewares.use((req, res, next) => {
        if (req.method === 'OPTIONS' && (req.url?.startsWith('/__save-public-canvas') || req.url?.startsWith('/__publish') || req.url?.startsWith('/__save-grid-config') || req.url?.startsWith('/__save-label-config'))) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end();
          return;
        }
        next();
      });

      // POST /__save-grid-config — updates gridConfig.ts with new column value
      server.middlewares.use('/__save-grid-config', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { path: pagePath, columns } = JSON.parse(body);
            const configFile = join(process.cwd(), 'src', 'data', 'gridConfig.ts');
            let content = readFileSync(configFile, 'utf-8');

            // Check if path already exists in gridColumns
            const pathEscaped = pagePath.replace(/'/g, "\\'");
            const regex = new RegExp(`'${pathEscaped}':\\s*\\d+`);

            if (regex.test(content)) {
              // Update existing entry
              content = content.replace(regex, `'${pathEscaped}': ${columns}`);
            } else {
              // Add new entry before the closing };
              content = content.replace(
                /(\n};)/,
                `\n  '${pathEscaped}': ${columns},$1`
              );
            }

            writeFileSync(configFile, content, 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      // POST /__save-label-config — updates gridConfig.ts with new count label value
      server.middlewares.use('/__save-label-config', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { path: pagePath, label } = JSON.parse(body);
            const configFile = join(process.cwd(), 'src', 'data', 'gridConfig.ts');
            let content = readFileSync(configFile, 'utf-8');

            // Check if path already exists in countLabels
            const pathEscaped = pagePath.replace(/'/g, "\\'");
            const labelEscaped = label.replace(/'/g, "\\'");
            const regex = new RegExp(`'${pathEscaped}':\\s*'[^']*'`);

            if (regex.test(content)) {
              // Update existing entry
              content = content.replace(regex, `'${pathEscaped}': '${labelEscaped}'`);
            } else {
              // Add new entry before the closing }; of countLabels
              // Find the countLabels block's closing };
              const countLabelsEnd = content.lastIndexOf('};');
              if (countLabelsEnd !== -1) {
                content = content.slice(0, countLabelsEnd) + `  '${pathEscaped}': '${labelEscaped}',\n` + content.slice(countLabelsEnd);
              }
            }

            writeFileSync(configFile, content, 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
    },
  };
}
