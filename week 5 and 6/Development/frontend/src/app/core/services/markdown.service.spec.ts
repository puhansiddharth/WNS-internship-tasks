import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { MarkdownService } from './markdown.service';

describe('MarkdownService', () => {
  let service: MarkdownService;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarkdownService]
    });
    service = TestBed.inject(MarkdownService);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should safely unescape markdown outside code blocks but preserve inside code blocks', () => {
    const raw = `\\## Heading 2
\\| Col A \\| Col B \\|
\\*\\*bold text\\*\\* and \\_italic\\_&#x20;with space
\`\`\`python
# \\## this is a comment inside code block
def test():
    return "\\d+.*"
\`\`\`
\\> A blockquote`;

    const normalized = service.normalizeMarkdown(raw);

    // Outside code block: unescaped
    expect(normalized).toContain('## Heading 2');
    expect(normalized).toContain('| Col A | Col B |');
    expect(normalized).toContain('**bold text**');
    expect(normalized).toContain('_italic_ with space');
    expect(normalized).toContain('> A blockquote');

    // Inside code block: preserved backslashes
    expect(normalized).toContain('# \\## this is a comment inside code block');
    expect(normalized).toContain('return "\\d+.*"');
  });

  it('should render headings, lists, bold, italics, links, and blockquotes', () => {
    const markdown = `# Title 1
## Section 2
### Sub 3
Here is **bold** and *italic* text and [a link](https://example.com).
- Item 1
  - Nested A
  - Nested B
- Item 2
> A notable quotation`;

    const safeHtml = service.renderToSafeHtml(markdown) as any;
    const html = safeHtml.changingThisBreaksApplicationSecurity || '';

    expect(html).toContain('<h1>Title 1</h1>');
    expect(html).toContain('<h2>Section 2</h2>');
    expect(html).toContain('<h3>Sub 3</h3>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('A notable quotation');
  });

  it('should render markdown tables wrapped in responsive container', () => {
    const tableMd = `| Method | Purpose | Example |
|---|---|---|
| GET | Retrieve data | \`/api/users\` |
| POST | Create data | \`/api/users\` |`;

    const safeHtml = service.renderToSafeHtml(tableMd) as any;
    const html = safeHtml.changingThisBreaksApplicationSecurity || '';

    expect(html).toContain('table-responsive-wrapper');
    expect(html).toContain('markdown-table');
    expect(html).toContain('<th>Method</th>');
    expect(html).toContain('<td>GET</td>');
    expect(html).toContain('<td><code>/api/users</code></td>');
  });

  it('should render syntax-highlighted code blocks with copy buttons and language tags', () => {
    const codeMd = `\`\`\`javascript
const express = require('express');
const app = express();
\`\`\`

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}"
\`\`\``;

    const safeHtml = service.renderToSafeHtml(codeMd) as any;
    const html = safeHtml.changingThisBreaksApplicationSecurity || '';

    expect(html).toContain('code-block-wrapper');
    expect(html).toContain('btn-copy-code');
    expect(html).toContain('data-code');
    expect(html).toContain('code-language');
    expect(html).toContain('javascript');
    expect(html).toContain('python');
    expect(html).toContain('token keyword');
  });

  it('should sanitize malicious script tags and inline event handlers to prevent XSS', () => {
    const maliciousMd = `Normal text
<script>alert('xss')</script>
<img src="invalid" onerror="alert('xss')">
<a href="javascript:alert('xss')">Malicious link</a>`;

    const safeHtml = service.renderToSafeHtml(maliciousMd) as any;
    const html = safeHtml.changingThisBreaksApplicationSecurity || '';

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('Normal text');
  });

  it('should properly render the REST API verification sample requested by the user', () => {
    const sample = `# Understanding REST APIs

REST stands for **Representational State Transfer**. It is an architectural style used to design network-based APIs.

## Core HTTP Methods

| Method | Purpose | Example |
|---|---|---|
| GET | Retrieve data | \`/api/users\` |
| POST | Create data | \`/api/users\` |
| PUT | Replace data | \`/api/users/1\` |
| PATCH | Partially update data | \`/api/users/1\` |
| DELETE | Remove data | \`/api/users/1\` |

## Example: Express API

\`\`\`javascript
const express = require('express');

const app = express();

app.use(express.json());

app.get('/api/users', (req, res) => {
    res.status(200).json({
        success: true,
        users: []
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
\`\`\`

## Important Points

- REST APIs commonly use HTTP.
- Resources are identified through URLs.
- Requests should be stateless.
- JSON is a common data exchange format.

> REST provides a standardized way for clients and servers to communicate.`;

    const safeHtml = service.renderToSafeHtml(sample) as any;
    const html = safeHtml.changingThisBreaksApplicationSecurity || '';

    expect(html).toContain('<h1>Understanding REST APIs</h1>');
    expect(html).toContain('<strong>Representational State Transfer</strong>');
    expect(html).toContain('<h2>Core HTTP Methods</h2>');
    expect(html).toContain('table-responsive-wrapper');
    expect(html).toContain('code-block-wrapper');
    expect(html).toContain('javascript');
    expect(html).toContain('token keyword');
    expect(html).toContain('express');
    expect(html).toContain('app.listen');
    expect(html).toContain('<h2>Important Points</h2>');
    expect(html).toContain('<blockquote>');
  });

  it('should render mathematical formulas and preserve numeric currency values', () => {
    const mathContent = `The famous equation is:
$$E = mc^2$$
And Pythagorean theorem is $a^2 + b^2 = c^2$.
The price of the item is $100 and tax is $5.50.`;

    const safeHtml = service.renderToSafeHtml(mathContent) as any;
    const html = safeHtml.changingThisBreaksApplicationSecurity || '';

    expect(html).toContain('math-display');
    expect(html).toContain('E = mc^2');
    expect(html).toContain('math-inline');
    expect(html).toContain('a^2 + b^2 = c^2');
    // Currency preserved
    expect(html).toContain('$100');
    expect(html).toContain('$5.50');
  });

  it('should render external links securely with target blank and noopener', () => {
    const linkContent = `Check the [Angular Docs](https://angular.dev) for details.`;

    const safeHtml = service.renderToSafeHtml(linkContent) as any;
    const html = safeHtml.changingThisBreaksApplicationSecurity || '';

    expect(html).toContain('href="https://angular.dev"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Angular Docs');
  });
});
