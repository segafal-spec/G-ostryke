import { spawn } from 'child_process';
import fs from 'fs';

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless',
  '--remote-debugging-port=9225',
  '--user-data-dir=C:\\Users\\lenovo\\AppData\\Local\\Temp\\edge-test-profile-3',
  '--window-size=1280,800',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://localhost:9225/json');
    const tabs = await res.json();
    const gameTab = tabs.find(t => t.url.includes('localhost:5173'));
    if (!gameTab) {
      console.log('No game tab found');
      edge.kill();
      return;
    }
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);
    let id = 1;
    const send = (method, params = {}) => new Promise(resolve => {
      const msgId = id++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.onopen = async () => {
      await send('Runtime.enable');
      await send('Console.enable');
      ws.addEventListener('message', (evt) => {
        const d = JSON.parse(evt.data);
        if (d.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER LOG]', d.params.type, d.params.args?.map(a => a.value || a.description).join(' '));
        }
        if (d.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', JSON.stringify(d.params.exceptionDetails));
        }
      });

      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const playBtn = btns.find(b => b.textContent.includes('Lancer') || b.textContent.includes('Jouer') || b.textContent.includes('Entraînement') || b.textContent.includes('Quotidien'));
            if (playBtn) {
              playBtn.click();
              return 'Clicked ' + playBtn.textContent;
            }
            return 'Buttons: ' + btns.map(b => b.textContent.trim()).join(' | ');
          })()
        `,
        returnByValue: true
      });
      console.log('Eval click:', evalRes);

      await new Promise(r => setTimeout(r, 4000));

      const inspectMap = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const mapEl = document.querySelector('.maplibregl-map');
            if (!mapEl) return 'No .maplibregl-map element';
            return {
              hasCanvas: Boolean(mapEl.querySelector('canvas')),
              classes: mapEl.className,
              layers: window.__mapInstance ? window.__mapInstance.getStyle().layers.map(l => l.id) : 'no window.__mapInstance'
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Inspect map:', inspectMap);

      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      if (screenshot && screenshot.data) {
        fs.writeFileSync('scratch/game-screenshot.png', Buffer.from(screenshot.data, 'base64'));
        console.log('Saved scratch/game-screenshot.png');
      }
      ws.close();
      edge.kill();
    };
  } catch (e) {
    console.error('Error:', e);
    edge.kill();
  }
}, 3000);
