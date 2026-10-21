# Standalone Security Module

This directory contains a small, dependency-free set of browser-side checks and a self-contained demo. It is separate from the portfolio and does not import or modify portfolio code.

## Files

- `security.js` exposes reusable utilities through the `PortfolioSecurity` browser global.
- `security-demo.html` provides an interactive email check and a DOM audit.
- `README.md` documents the checks, their limits, and local testing.

The module does not collect, persist, or transmit values. It does not use external scripts, analytics, or network APIs.

## Run the demo locally

From the repository root, start a local HTTP server with Python:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000/security-module/security-demo.html`. Stop the server with Ctrl+C. If the `py` launcher is unavailable but Python is installed, use `python -m http.server 8000` instead.

## Use and test the utilities

Load `security.js` as a local script, then call its methods:

```js
PortfolioSecurity.validateTextInput("Hello", { required: true, minLength: 1, maxLength: 20 });
PortfolioSecurity.validateEmail("person@example.com");
PortfolioSecurity.inspectUrlScheme("javascript:alert(1)");
PortfolioSecurity.auditNewTabLinks(document);
PortfolioSecurity.auditFormFields(document);
PortfolioSecurity.auditDocument(document);
```

Each validation returns a `valid` or `safe` boolean and findings where applicable. A finding includes a severity, short title, and explanation. The module does not include the tested field's value in findings.

To manually try the checks, use a nonempty email such as `person@example.com`, an invalid value such as `not-an-email`, and a long text value with a `maxLength` lower than its length. To exercise DOM checks, temporarily add a link with `target="_blank"` and no `rel="noopener"`, a form control without a visible label or accessible name, or an anchor whose `href` uses `javascript:`. Run the audit button and remove any temporary test markup afterward.

## What the checks detect

- **Text input:** required blank values and values below a configured minimum or above a maximum. Length uses JavaScript string length (UTF-16 code units).
- **Email:** a basic non-whitespace `local@domain.suffix` shape and a maximum length of 254 characters. This is not a complete email-standard parser.
- **URL scheme:** flags `javascript:`, `vbscript:`, `data:`, and `file:` schemes after trimming and removing ASCII control/space characters. It does not prove that other URLs are trustworthy.
- **New-tab links:** checks anchors and image-map areas using `target="_blank"` for a `noopener` token in `rel`.
- **Form-field names:** flags input, select, and textarea controls without a nonempty `aria-label`, `aria-labelledby`, associated `<label for>`, or wrapping `<label>`. Hidden and button-like input types are skipped.
- **Findings:** emits severity labels and explanations; the DOM audit combines the link-scheme, new-tab, and accessible-name checks without changing the inspected page.

## Limitations and false positives

These are lightweight heuristics, not a comprehensive security scanner. An `aria-labelledby` value can reference a missing or empty element and still pass; label visibility and accessible-name computation are not evaluated. The field audit may flag custom widgets or fields labelled by mechanisms it does not recognize. Some `data:` URLs may contain harmless content but are still flagged as potentially dangerous. The email check does not verify mailbox existence, deliverability, or every valid address form. URL checks inspect the scheme only, not host reputation, redirects, or context-specific URL policies.

## Frontend validation is not server-side validation

Users can bypass or alter all client-side checks. Validate and constrain data again on the server, authorize each operation there, and encode output for its destination context. Never rely on browser validation to protect a database, account, or server-side resource.

## GitHub Pages and response headers

GitHub Pages serves static files and does not interpret a simple `_headers` file as an arbitrary HTTP response-header configuration mechanism. A file with that name in a Pages repository does not by itself configure headers such as Content-Security-Policy. Use hosting that supports response-header configuration or a supported proxy/CDN configuration when custom headers are required; check the host's current documentation for available controls.
