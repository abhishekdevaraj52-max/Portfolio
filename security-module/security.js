(function (root) {
  "use strict";

  var SEVERITIES = ["critical", "high", "medium", "low", "info"];
  var DEFAULT_MAX_LENGTH = 500;

  function finding(severity, title, explanation, element) {
    var result = {
      severity: severity,
      title: title,
      explanation: explanation
    };

    if (element) {
      result.element = element;
    }

    return result;
  }

  function validateTextInput(value, options) {
    var settings = options || {};
    var text = typeof value === "string" ? value : "";
    var minLength = Number.isInteger(settings.minLength) && settings.minLength >= 0
      ? settings.minLength
      : 0;
    var maxLength = Number.isInteger(settings.maxLength) && settings.maxLength >= minLength
      ? settings.maxLength
      : DEFAULT_MAX_LENGTH;
    var required = settings.required === true;
    var trimmed = text.trim();
    var findings = [];

    if (required && trimmed.length === 0) {
      findings.push(finding("medium", "Text is required", "Enter a value before submitting."));
    } else if (text.length < minLength) {
      findings.push(finding("medium", "Text is too short", "The value is shorter than the configured minimum."));
    }

    if (text.length > maxLength) {
      findings.push(finding("medium", "Text is too long", "The value exceeds the configured maximum length."));
    }

    return { valid: findings.length === 0, findings: findings };
  }

  function validateEmail(value) {
    var email = typeof value === "string" ? value.trim() : "";
    var valid = email.length > 0
      && email.length <= 254
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    var findings = valid
      ? []
      : [finding("medium", "Email format is invalid", "Enter an address in a basic name@domain format.")];

    return { valid: valid, findings: findings };
  }

  function inspectUrlScheme(value) {
    var text = typeof value === "string" ? value : "";
    var normalized = text.trim().replace(/[\u0000-\u0020\u007f]/g, "");
    var schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(normalized);
    var scheme = schemeMatch ? schemeMatch[1].toLowerCase() : "";
    var dangerousSchemes = ["javascript", "vbscript", "data", "file"];
    var isDangerous = dangerousSchemes.indexOf(scheme) !== -1;

    return {
      safe: !isDangerous,
      scheme: scheme || null,
      findings: isDangerous
        ? [finding("high", "Potentially dangerous URL scheme", "The URL uses a scheme that should not be trusted in a link or navigation context.")]
        : []
    };
  }

  function auditNewTabLinks(doc) {
    var documentToInspect = doc || (typeof document !== "undefined" ? document : null);
    var findings = [];

    if (!documentToInspect || typeof documentToInspect.querySelectorAll !== "function") {
      return findings;
    }

    var links = documentToInspect.querySelectorAll("a[target], area[target]");

    Array.prototype.forEach.call(links, function (link, index) {
      if ((link.getAttribute("target") || "").toLowerCase() !== "_blank") {
        return;
      }

      var rel = (link.getAttribute("rel") || "").toLowerCase().split(/\s+/);
      if (rel.indexOf("noopener") === -1) {
        findings.push(finding(
          "medium",
          "New-tab link lacks noopener",
          "Add rel=\"noopener\" to prevent the opened page from accessing its opener window.",
          describeElement(link, index)
        ));
      }
    });

    return findings;
  }

  function hasAccessibleName(control) {
    if (control.hasAttribute("aria-label") && control.getAttribute("aria-label").trim()) {
      return true;
    }

    if (control.hasAttribute("aria-labelledby") && control.getAttribute("aria-labelledby").trim()) {
      return true;
    }

    if (control.labels && control.labels.length > 0) {
      return true;
    }

    return Boolean(control.closest && control.closest("label"));
  }

  function describeElement(element, index) {
    var tag = element.tagName ? element.tagName.toLowerCase() : "element";
    var type = element.getAttribute && element.getAttribute("type");
    return type
      ? tag + '[type="' + type + '"] #' + (index + 1)
      : tag + " #" + (index + 1);
  }

  function auditFormFields(doc) {
    var documentToInspect = doc || (typeof document !== "undefined" ? document : null);
    var findings = [];
    var ignoredTypes = ["hidden", "submit", "reset", "button", "image"];

    if (!documentToInspect || typeof documentToInspect.querySelectorAll !== "function") {
      return findings;
    }

    var controls = documentToInspect.querySelectorAll("input, select, textarea");
    Array.prototype.forEach.call(controls, function (control, index) {
      var type = (control.getAttribute("type") || "").toLowerCase();
      if (ignoredTypes.indexOf(type) !== -1 || hasAccessibleName(control)) {
        return;
      }

      findings.push(finding(
        "medium",
        "Form field may lack an accessible name",
        "Provide a visible label or an appropriate aria-label/aria-labelledby attribute. Placeholder text alone is not a label.",
        describeElement(control, index)
      ));
    });

    return findings;
  }

  function auditDocument(doc) {
    var documentToInspect = doc || (typeof document !== "undefined" ? document : null);
    var findings = [];

    if (!documentToInspect || typeof documentToInspect.querySelectorAll !== "function") {
      return findings;
    }

    findings = findings.concat(auditNewTabLinks(documentToInspect));
    findings = findings.concat(auditFormFields(documentToInspect));

    var links = documentToInspect.querySelectorAll("a[href], area[href]");
    Array.prototype.forEach.call(links, function (link, index) {
      var result = inspectUrlScheme(link.getAttribute("href"));
      if (result.findings.length) {
        result.findings[0].element = describeElement(link, index);
        findings.push(result.findings[0]);
      }
    });

    return findings;
  }

  root.PortfolioSecurity = Object.freeze({
    severities: SEVERITIES.slice(),
    validateTextInput: validateTextInput,
    validateEmail: validateEmail,
    inspectUrlScheme: inspectUrlScheme,
    auditNewTabLinks: auditNewTabLinks,
    auditFormFields: auditFormFields,
    auditDocument: auditDocument
  });
}(typeof window !== "undefined" ? window : globalThis));
