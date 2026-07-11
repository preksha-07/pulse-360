## Pull Request Checklist

### Description
Provide a clear summary of the changes introduced by this PR. Mention any related issues.

### Requirements Checked
- [ ] Code is fully typed with strict TypeScript.
- [ ] No Tailwind compiler dependencies re-introduced. All UI changes use Vanilla CSS custom properties.
- [ ] New APIs have Zod input validation schemas.
- [ ] General API request limits (100 req/min) and AI routes (20 req/min) are maintained.
- [ ] Interactive elements are fully accessible (ARIA labels, keyboard navigation, color contrast AA compliant).

### Verification Performed
Describe the verification steps performed:
- [ ] Executed `npm run build` locally with no compilation errors.
- [ ] Tested live SSE data stream connections.
- [ ] Verified Gemini AI briefing and chatbot fallback methods.

### Screenshots (if visual changes are made)
Attach screenshots of before/after UI modifications.
