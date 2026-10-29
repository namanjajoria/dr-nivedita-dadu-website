'use strict';

const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

// Minimal HTML templating (no engine dependency):
//   {{> partial}}              inserts views/partials/partial.html
//   {{key}}  {{a.b}}           inserts an HTML-escaped value
//   {{{key}}}                  inserts a raw value (only for trusted, pre-serialised output such as JSON-LD)
//   {{#each list}}…{{/each}}   repeats for every item; inside, names resolve on the item first,
//                              then outwards. {{@index}} (0-based) and {{@number}} (1-based) are available
//   {{#if key}}…{{else}}…{{/if}}  empty strings, empty lists, false, null and 0 count as false
// A missing value throws, so a typo can never ship an empty tag. Content that may be
// absent is normalised to '' or [] before it reaches a template (see services/content).
const VIEWS_DIR = path.join(config.root, 'views');
const sourceCache = new Map();
const treeCache = new Map();

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const TAG = /\{\{\{\s*([\w.@]+)\s*\}\}\}|\{\{\s*(#each|#if|\/each|\/if|else)?\s*([\w.@]*)\s*\}\}/g;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

function expandPartials(source) {
  return source.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, partial) => loadView(`partials/${partial}`));
}

function loadView(name) {
  if (config.isProduction && sourceCache.has(name)) return sourceCache.get(name);
  const file = path.join(VIEWS_DIR, `${name}.html`);
  const source = expandPartials(fs.readFileSync(file, 'utf8'));
  if (config.isProduction) sourceCache.set(name, source);
  return source;
}

// Turns template source into a tree of text, value and block nodes.
function parse(source, name) {
  const root = { type: 'root', children: [] };
  root.target = root.children;
  const stack = [root];
  let last = 0;
  for (const match of source.matchAll(TAG)) {
    const [whole, rawKey, keyword, key] = match;
    const current = stack[stack.length - 1];
    if (match.index > last) current.target.push({ type: 'text', value: source.slice(last, match.index) });
    last = match.index + whole.length;

    if (rawKey) {
      current.target.push({ type: 'value', key: rawKey, raw: true });
    } else if (!keyword) {
      if (!key) throw new Error(`Template "${name}": empty {{ }} tag.`);
      current.target.push({ type: 'value', key, raw: false });
    } else if (keyword === '#each' || keyword === '#if') {
      if (!key) throw new Error(`Template "${name}": {{${keyword}}} needs a name.`);
      const block = { type: keyword.slice(1), key, children: [], otherwise: null };
      block.target = block.children;
      current.target.push(block);
      stack.push(block);
    } else if (keyword === 'else') {
      if (current.type !== 'if' || current.otherwise) throw new Error(`Template "${name}": unexpected {{else}}.`);
      current.otherwise = [];
      current.target = current.otherwise;
    } else {
      if (current.type !== keyword.slice(1)) throw new Error(`Template "${name}": unexpected {{${keyword}}}.`);
      stack.pop();
    }
  }
  if (stack.length > 1) throw new Error(`Template "${name}": {{#${stack[stack.length - 1].type}}} is never closed.`);
  if (last < source.length) root.children.push({ type: 'text', value: source.slice(last) });
  return root.children;
}

function lookup(scopes, key, name) {
  const [head, ...rest] = key.split('.');
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i];
    if (scope !== null && typeof scope === 'object' && head in scope) {
      let value = scope[head];
      for (const part of rest) value = value === null || value === undefined ? undefined : value[part];
      if (value === undefined || value === null) break;
      return value;
    }
  }
  throw new Error(`Template "${name}" needs a value for "${key}".`);
}

function isTruthy(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function renderNodes(nodes, scopes, name) {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') out += node.value;
    else if (node.type === 'value') {
      const value = lookup(scopes, node.key, name);
      out += node.raw ? String(value) : escapeHtml(value);
    } else if (node.type === 'if') {
      const branch = isTruthy(lookup(scopes, node.key, name)) ? node.children : node.otherwise || [];
      out += renderNodes(branch, scopes, name);
    } else if (node.type === 'each') {
      const list = lookup(scopes, node.key, name);
      if (!Array.isArray(list)) throw new Error(`Template "${name}": "${node.key}" is not a list.`);
      list.forEach((item, index) => {
        out += renderNodes(node.children, [...scopes, { '@index': index, '@number': index + 1 }, item], name);
      });
    }
  }
  return out;
}

function render(name, data) {
  let tree = config.isProduction ? treeCache.get(name) : undefined;
  if (!tree) {
    tree = parse(loadView(name), name);
    if (config.isProduction) treeCache.set(name, tree);
  }
  return renderNodes(tree, [data], name);
}

// Renders template source that is not a view file (a page frame built in code). `key`
// names it in errors and caches its parsed form in production.
function renderSource(key, source, data) {
  let tree = config.isProduction ? treeCache.get(`source:${key}`) : undefined;
  if (!tree) {
    tree = parse(expandPartials(source), key);
    if (config.isProduction) treeCache.set(`source:${key}`, tree);
  }
  return renderNodes(tree, [data], key);
}

module.exports = { render, renderSource, loadView, escapeHtml };
