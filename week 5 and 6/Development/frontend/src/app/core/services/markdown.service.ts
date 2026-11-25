import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';

// Import essential Prism.js syntax definitions
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-docker';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  private sanitizer = inject(DomSanitizer);

  constructor() {
    this.configureMarked();
  }

  private configureMarked(): void {
    const renderer = {
      code: (arg1: any, arg2?: string): string => {
        const text = typeof arg1 === 'object' && arg1 !== null ? arg1.text : arg1;
        const lang = (typeof arg1 === 'object' && arg1 !== null ? arg1.lang : arg2) || 'plaintext';
        const cleanLang = (lang || 'plaintext').trim().toLowerCase().split(/\s+/)[0];

        // Language alias normalization
        let grammarLang = cleanLang;
        if (cleanLang === 'js') grammarLang = 'javascript';
        if (cleanLang === 'ts') grammarLang = 'typescript';
        if (cleanLang === 'py') grammarLang = 'python';
        if (cleanLang === 'sh' || cleanLang === 'shell' || cleanLang === 'zsh') grammarLang = 'bash';
        if (cleanLang === 'yml') grammarLang = 'yaml';
        if (cleanLang === 'html' || cleanLang === 'xml' || cleanLang === 'svg') grammarLang = 'markup';
        if (cleanLang === 'cs') grammarLang = 'csharp';
        if (cleanLang === 'cpp' || cleanLang === 'c++') grammarLang = 'cpp';
        if (cleanLang === 'golang') grammarLang = 'go';
        if (cleanLang === 'rs') grammarLang = 'rust';
        if (cleanLang === 'dockerfile') grammarLang = 'docker';

        const grammar = Prism.languages[grammarLang] || Prism.languages['plaintext'] || Prism.languages['text'];
        let highlighted = '';

        try {
          highlighted = grammar ? Prism.highlight(text, grammar, grammarLang) : this.escapeHtml(text);
        } catch {
          highlighted = this.escapeHtml(text);
        }

        const encodedCode = encodeURIComponent(text);
        const displayLang = cleanLang === 'plaintext' ? 'code' : cleanLang;

        return `
<div class="code-block-wrapper">
  <div class="code-block-header">
    <span class="code-language">${this.escapeHtml(displayLang)}</span>
    <button type="button" class="btn-copy-code" data-code="${encodedCode}" title="Copy code snippet">
      <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="copy-label">Copy</span>
    </button>
  </div>
  <pre class="language-${this.escapeHtml(grammarLang)}"><code class="language-${this.escapeHtml(grammarLang)}">${highlighted}</code></pre>
</div>`;
      },

      link: (arg1: any, arg2?: string, arg3?: string): string => {
        const href = typeof arg1 === 'object' && arg1 !== null ? arg1.href : arg1;
        const title = typeof arg1 === 'object' && arg1 !== null ? arg1.title : arg2;
        const text = typeof arg1 === 'object' && arg1 !== null ? arg1.text : arg3 || href;
        const titleAttr = title ? ` title="${this.escapeHtml(title)}"` : '';
        return `<a href="${this.escapeHtml(href)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
      }
    };

    marked.use({
      renderer,
      gfm: true,
      breaks: true
    });
  }

  /**
   * Safely normalizes escaped markdown markers (e.g., \##, \|, \*\*, &#x20;)
   * and formats LaTeX math while STRICTLY preserving code blocks and their content.
   */
  public normalizeMarkdown(rawContent: string): string {
    if (!rawContent) return '';

    // Split by fenced code blocks (```...```) so code is NEVER altered
    const parts = rawContent.split(/(```[\s\S]*?```)/g);

    for (let i = 0; i < parts.length; i += 2) {
      let part = parts[i];

      // Decode explicit HTML space entity and non-breaking space
      part = part.replace(/&#x20;/g, ' ');
      part = part.replace(/&nbsp;/g, ' ');

      // Normalize escaped headings at line start: e.g. "\## Heading" -> "## Heading"
      part = part.replace(/(^|\n)[ \t]*\\+(#{1,6}[ \t]+)/g, '$1$2');

      // Normalize escaped table column separators: e.g. "\| Method \|" -> "| Method |"
      part = part.replace(/\\+\|/g, '|');

      // Normalize escaped bold / italic syntax
      part = part.replace(/\\+\*\\+\*/g, '**');
      part = part.replace(/\\+\*/g, '*');
      part = part.replace(/\\+_\\+_/g, '__');
      part = part.replace(/\\+_/g, '_');

      // Normalize escaped blockquotes
      part = part.replace(/(^|\n)[ \t]*\\+>[ \t]*/g, '$1> ');

      // Normalize escaped bullet list items
      part = part.replace(/(^|\n)[ \t]*\\+([*-][ \t]+)/g, '$1$2');

      // Normalize escaped ordered list items
      part = part.replace(/(^|\n)[ \t]*\\+(\d+\.[ \t]+)/g, '$1$2');

      // Normalize escaped link and brackets
      part = part.replace(/\\+\[/g, '[');
      part = part.replace(/\\+\]/g, ']');
      part = part.replace(/\\+\(/g, '(');
      part = part.replace(/\\+\)/g, ')');

      // Normalize escaped backticks in prose
      part = part.replace(/\\+`/g, '`');

      // Normalize escaped horizontal rules: e.g. "\-\-\-" -> "---"
      part = part.replace(/(^|\n)[ \t]*\\+-[ \t]*\\+-[ \t]*\\+-[ \t]*(?=\n|$)/g, '$1---');

      // Format LaTeX display math: $$ ... $$ or \[ ... \]
      part = part.replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula) => {
        return `\n\n<div class="math-display"><span class="math-text">${this.escapeHtml(formula.trim())}</span></div>\n\n`;
      });
      part = part.replace(/\\\[([\s\S]+?)\\\]/g, (_match, formula) => {
        return `\n\n<div class="math-display"><span class="math-text">${this.escapeHtml(formula.trim())}</span></div>\n\n`;
      });

      // Format LaTeX inline math: \( ... \) or $...$ (strictly excluding currency like $100)
      part = part.replace(/\\\(([\s\S]+?)\\\)/g, (_match, formula) => {
        return `<span class="math-inline">${this.escapeHtml(formula.trim())}</span>`;
      });
      part = part.replace(/(^|[^\$\\])\$(?!\s|\d)([^\$\n]+?)(?<!\s)\$/g, (_match, prefix, formula) => {
        return `${prefix}<span class="math-inline">${this.escapeHtml(formula.trim())}</span>`;
      });

      parts[i] = part;
    }

    return parts.join('');
  }

  /**
   * Parses, highlights, sanitizes, and returns SafeHtml for the template.
   */
  public renderToSafeHtml(rawMarkdown: string): SafeHtml {
    if (!rawMarkdown) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    // 1. Normalize escaped markdown characters and math safely
    const normalized = this.normalizeMarkdown(rawMarkdown);

    // 2. Parse markdown into HTML string
    let parsedHtml = marked.parse(normalized) as string;

    // 3. Wrap standard markdown tables in a responsive horizontal-scrolling container
    parsedHtml = parsedHtml
      .replace(/<table>/g, '<div class="table-responsive-wrapper"><table class="markdown-table">')
      .replace(/<\/table>/g, '</table></div>');

    // 4. Sanitize against XSS attacks using DOMPurify with strict whitelist
    const sanitizedHtml = DOMPurify.sanitize(parsedHtml, {
      ADD_TAGS: ['button', 'svg', 'path', 'rect', 'line', 'span', 'pre', 'code', 'div'],
      ADD_ATTR: [
        'data-code',
        'target',
        'rel',
        'class',
        'viewBox',
        'fill',
        'stroke',
        'stroke-width',
        'stroke-linecap',
        'stroke-linejoin',
        'd',
        'x',
        'y',
        'width',
        'height',
        'rx',
        'ry',
        'title'
      ]
    });

    // 5. Return SafeHtml for Angular's DomSanitizer
    return this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml);
  }

  public escapeHtml(text: string): string {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
