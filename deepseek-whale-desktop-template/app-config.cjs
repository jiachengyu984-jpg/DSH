const fs = require('node:fs');
const path = require('node:path');

// Only configuration enters here. Never put API keys in config.local.json.
function loadConfig({root, appData, env = process.env}) {
  const file = path.resolve(root, env.WHALE_CONFIG || 'config.local.json');
  let input = {};
  if (fs.existsSync(file)) {
    try { input = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
    catch { throw Error('配置文件不是有效 JSON，请检查 config.local.json。'); }
  }
  const object = (value, field) => {
    if (value === undefined) return {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(field + ' 必须是对象');
    return value;
  };
  input = object(input, '配置');
  const o = object(input.ollama, 'ollama'), h = object(input.harness, 'harness');
  const str = (v, fallback, name) => {
    if (v === undefined) return fallback;
    if (typeof v !== 'string') throw Error(name + ' 必须是字符串');
    return v.trim();
  };
  const bool = (v, fallback, name) => {
    if (v === undefined) return fallback;
    if (typeof v !== 'boolean') throw Error(name + ' 必须是 true 或 false');
    return v;
  };
  let base;
  try { base = new URL(str(o.baseUrl, 'http://127.0.0.1:11434', 'ollama.baseUrl')); }
  catch { throw Error('ollama.baseUrl 必须是有效的本机 HTTP 地址'); }
  if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
    throw Error('ollama.baseUrl 仅支持本机 http://127.0.0.1、localhost 或 [::1]，可指定端口');
  }
  const localPath = (value, name) => { const s = str(value, '', name); return s ? path.resolve(root, s) : ''; };
  const command = (value, fallback, name) => {
    const s = str(value, fallback, name) || fallback;
    return /[/\\]/.test(s) ? path.resolve(root, s) : s;
  };
  const defaultOllama = env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, 'Programs', 'Ollama', 'ollama.exe') : '';
  const dataDir = path.resolve(root, env.WHALE_DATA_DIR || str(input.dataDir, '', 'dataDir') || path.join(appData, 'DeepSeekWhaleTemplate'));
  return {
    dataDir,
    ollama: {baseUrl: base.origin, executable: command(o.executable, defaultOllama && fs.existsSync(defaultOllama) ? defaultOllama : 'ollama', 'ollama.executable'), autoStart: bool(o.autoStart, true, 'ollama.autoStart'), model: str(o.model, 'deepseek-r1:8b', 'ollama.model')},
    harness: {enabled: bool(h.enabled, false, 'harness.enabled'), cliPath: localPath(h.cliPath, 'harness.cliPath'), nodePath: command(h.nodePath, 'node', 'harness.nodePath'), patchPath: localPath(h.patchPath, 'harness.patchPath'), workspace: localPath(h.workspace, 'harness.workspace') || path.join(dataDir, 'harness-workspace')}
  };
}
module.exports = {loadConfig};
