// Unit tests for the contact endpoint's pure core (src/lib/contact.ts): input
// validation, the HTML notification render, and the Resend payload shaping + send.
// No server, no network - the send path injects a fake fetch. The route handler
// (app/v1/contact) is a thin shell over these and the shared http-guards, whose
// honeypot / same-origin / rate-limit behavior is covered by http-guards.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  validateContact,
  escapeHtml,
  renderContactNotification,
  buildResendPayload,
  sendViaResend,
} from "../src/lib/contact.ts";

test("validateContact accepts and trims a good submission", () => {
  const r = validateContact({
    name: "  Ada  ",
    email: " ada@example.com ",
    message: "  hi there  ",
  });
  assert.ok(r.ok);
  assert.deepEqual(r.data, {
    name: "Ada",
    email: "ada@example.com",
    message: "hi there",
  });
});

test("validateContact rejects missing or blank fields", () => {
  for (const bad of [
    { name: "", email: "a@b.co", message: "hi" },
    { name: "A", email: "", message: "hi" },
    { name: "A", email: "a@b.co", message: "   " },
    {},
  ]) {
    assert.equal(validateContact(bad).ok, false);
  }
});

test("validateContact rejects a malformed email", () => {
  for (const email of ["nope", "a@b", "a b@c.co", "@c.co", "a@.co", "a@b."]) {
    assert.equal(
      validateContact({ name: "A", email, message: "hi" }).ok,
      false,
      `expected "${email}" to be rejected`,
    );
  }
});

test("validateContact enforces length caps", () => {
  assert.equal(
    validateContact({
      name: "x".repeat(LIMITS.name + 1),
      email: "a@b.co",
      message: "hi",
    }).ok,
    false,
  );
  assert.equal(
    validateContact({
      name: "A",
      email: "a@" + "b".repeat(LIMITS.email) + ".co",
      message: "hi",
    }).ok,
    false,
  );
  assert.equal(
    validateContact({
      name: "A",
      email: "a@b.co",
      message: "x".repeat(LIMITS.message + 1),
    }).ok,
    false,
  );
});

test("validateContact accepts values exactly at the caps (guards > vs >=)", () => {
  const r = validateContact({
    name: "x".repeat(LIMITS.name),
    email: "a".repeat(LIMITS.email - 5) + "@b.co", // exactly LIMITS.email chars
    message: "y".repeat(LIMITS.message),
  });
  assert.ok(r.ok, "a value exactly at the cap must be accepted");
});

test("validateContact ignores non-string inputs", () => {
  assert.equal(validateContact({ name: 5, email: {}, message: [] }).ok, false);
});

test("escapeHtml neutralizes the five HTML-significant characters", () => {
  assert.equal(
    escapeHtml(`<script>alert("x") & 'y'</script>`),
    "&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;",
  );
  // Ampersand is escaped first, so an already-safe entity is not double-mangled.
  assert.equal(escapeHtml("a & b"), "a &amp; b");
});

test("renderContactNotification fills placeholders with escaped values", () => {
  const tpl =
    "<p>[[NAME]] &lt;[[EMAIL]]&gt; on [[DATE]]</p><div>[[MESSAGE]]</div>";
  const out = renderContactNotification(tpl, {
    name: "Ada",
    email: "ada@x.co",
    message: "line one\nline two",
    date: "July 11, 2026",
  });
  assert.match(out, /Ada &lt;ada@x\.co&gt; on July 11, 2026/);
  // Message newlines become <br> so line breaks survive in the HTML email.
  assert.match(out, /line one<br>line two/);
  assert.ok(!out.includes("[["), "no placeholder tokens should remain");
});

test("renderContactNotification escapes injected markup (no HTML injection)", () => {
  const tpl = "<div>[[NAME]] [[MESSAGE]]</div>";
  const out = renderContactNotification(tpl, {
    name: `<img src=x onerror=alert(1)>`,
    email: "a@b.co",
    message: `</div><script>evil()</script>`,
    date: "now",
  });
  assert.ok(!/<script>/.test(out), "a script tag must never survive into the email");
  assert.ok(!/<img /.test(out), "an injected img tag must be escaped");
  assert.match(out, /&lt;script&gt;evil\(\)&lt;\/script&gt;/);
});

test("buildResendPayload wires reply_to + body from the visitor, to/from/html from caller", () => {
  const p = buildResendPayload({
    name: "Ada",
    email: "ada@x.co",
    message: "hello world",
    to: "me@private.co",
    from: "Rogue Oak <contact@rogueoak.com>",
    html: "<p>rendered</p>",
  });
  assert.equal(p.to, "me@private.co");
  assert.equal(p.from, "Rogue Oak <contact@rogueoak.com>");
  assert.equal(p.reply_to, "ada@x.co");
  assert.match(p.subject, /Rogue Oak contact: Ada/);
  assert.match(p.text, /hello world/);
  assert.match(p.text, /ada@x\.co/);
  assert.equal(p.html, "<p>rendered</p>");
});

test("buildResendPayload keeps the subject single-line (no header injection)", () => {
  const p = buildResendPayload({
    name: "Ada\r\nBcc: evil@x.co",
    email: "a@b.co",
    message: "hi",
    to: "t",
    from: "f",
    html: "<p>x</p>",
  });
  assert.ok(!/[\r\n]/.test(p.subject), "subject must not contain CR/LF");
  assert.match(p.subject, /Ada/);
});

test("sendViaResend posts to Resend with bearer auth and resolves on 2xx", async () => {
  let captured;
  const fakeFetch = async (url, opts) => {
    captured = { url, opts };
    return { ok: true, status: 200, text: async () => "" };
  };
  await sendViaResend(
    { from: "f", to: "t", reply_to: "r", subject: "s", text: "b", html: "<p>b</p>" },
    "key123",
    fakeFetch,
  );
  assert.equal(captured.url, "https://api.resend.com/emails");
  assert.equal(captured.opts.method, "POST");
  assert.equal(captured.opts.headers.Authorization, "Bearer key123");
  assert.equal(captured.opts.headers["Content-Type"], "application/json");
  assert.match(captured.opts.body, /"to":"t"/);
  assert.match(captured.opts.body, /"reply_to":"r"/);
});

test("sendViaResend throws on a non-2xx response", async () => {
  const fakeFetch = async () => ({
    ok: false,
    status: 422,
    text: async () => "bad request",
  });
  await assert.rejects(
    () => sendViaResend({}, "key", fakeFetch),
    /Resend responded 422/,
  );
});
