# App-wide UX and design audit

Summary of the ultra-thorough pass across the whole app: what was checked, what was fixed, and what remains.

---

## 1. Accessibility (aria-labels)

**Rule:** Every icon-only button (`IconButton` with no visible text) must have an `aria-label` so screen readers and assistive tech can announce the action.

### Fixed in this pass

- **OptimaBar:** Open drawer, Back, App menu (open/close).
- **Attachment sources:** Attach files, Attach from clipboard, Attach screen capture, Attach from camera, Attach from web, Attach new document, Attach from Google Drive.
- **PersonaSelector:** Clear search, Edit tiles / Done editing.
- **ChatDrawer:** Toggle folders, Clear filters.
- **ChatBarBeam:** Maximize Beam; Close already had label.
- **ChatBeamWrapper:** Exit maximized mode.
- **CameraCaptureModal:** Add to message, Switch camera, Show/Hide info, Download capture.
- **CleanerMessage:** Close.
- **InReferenceToBubble:** Remove reference.
- **FormInputKey, FormSecretField:** Show/Hide key or password.
- **DarkModeToggleButton:** Switch to light/dark mode.
- **ButtonOptionsDraw:** Image settings.
- **ButtonMicContinuation:** Voice continuation.
- **BeamRay:** Generate/Regenerate, Stop, Remove ray.
- **CreatorDrawerItem:** Delete persona, Cancel delete.
- **CreatorDrawer:** Select personas / Done selecting.
- **ChatDrawerItem:** Change folder / Add to folder.
- **LLMOptionsModal:** Star/Unstar model, Hide/Show model in app.
- **ImportOutcomeModal:** Copy JSON to clipboard.
- **BedrockServiceSetup:** Show/Hide setup instructions.
- **LocalAIAdmin:** Close.
- **ScratchClip:** Clear scratchpad history.
- **LLMAttachmentsPromptsButton:** Get/More attachment ideas.
- **PaneTitleOverlay:** Close other tabs, Edit chat title, Delete chat, Close tab.
- **reset-password (pages):** Show/Hide password and confirm password.

### Already had aria-labels (unchanged)

- ChatMessage (message options, apply/discard edits, reply, highlight, strike, bold, cut, diagram, imagine, speak, copy).
- Composer (choose send mode).
- OptimaDrawerHeader (Close drawer).
- DebouncedInput (Clear search).
- GoodModal (Fullscreen).
- RenderImageURL (Close alert).
- ChromelessFloatingButtons (Open drawer, Exit chromeless, Open menu).
- ScrollToBottomButton.
- ModelsList (Hide, Configure LLM).
- RenderCode (ButtonGroups have aria-label).

### Lower priority / not changed this pass

- **useLLMSelect:** Assign domain model IconButton.
- **useFormEditTextArray:** Reset string IconButton.
- **PromptComposer (draw):** Temp count +/- and other IconButtons.
- **PersonaDashboard:** Delete, Clear query.
- **FlattenerModal:** Retry IconButton.
- **ModelsServiceSelector:** Show vendors IconButton.
- **LLMParametersEditor:** Multiple toggles (overheat, ant thinking, web search, web fetch, gem thinking).
- **FolderListItem:** IconButton in list.
- **AzureServiceSetup, OpenAIServiceSetup:** Restart/clear label IconButtons.
- **AppAdmin:** Edit limit, Refresh, Load – admin-only UI.

---

## 2. Design tokens and theme alignment

**Rule:** Prefer theme tokens (`bgcolor: 'background.body'`, `color: 'primary.solidBg'`, etc.) over hardcoded hex or rgba so the app stays consistent and respects light/dark mode.

### Fixed in this pass

- **PasswordProtection:** Full-screen and card use `bgcolor: 'background.body'`, Card with `boxShadow: 'lg'`, icon circle and button use `primary.solidBg` / `color="primary"` (no #667eea/#764ba2).
- **pages/auth/signout:** Background `bgcolor: 'background.body'`, Card `variant="outlined"` + theme shadow/radius, icon circle `danger.solidBg`/`danger.solidColor`, Sign Out button uses theme `color="danger"` (no custom gradients).
- **pages/auth/reset-password:** Same pattern: `bgcolor: 'background.body'`, Card theme, success state uses `success.solidBg`/`success.solidColor`, form state uses `primary.solidBg`/`primary.solidColor`, submit button `color="primary"`, plus aria-labels on visibility toggles.
- **pages/auth/error:** Background changed from gradient to `bgcolor: 'background.body'`.
- **pages/profile:** Removed hardcoded `color: '#fff'` from primary Chip (theme already provides contrast).

### Intentionally unchanged

- **app.theme.ts, app.styles.css:** Define the design system (primary #a020f0, etc.).
- **PersonaSelector, CMLZeroConversation, ChatDrawerItem, ChatDrawer:** Use brand purple (#a020f0 and family) for emphasis; can be refactored to theme tokens later if desired.
- **UserAnalytics:** Chart palettes and fallbacks for third-party chart lib.
- **AppAdmin:** Dedicated admin palette (separate from main app theme).

---

## 3. Composer and chat input (from earlier pass)

- Send + mode-expand (^) spacing: `gap` on ButtonGroup, `ml` on IconButton, soft variant for expand so it reads as secondary.
- Right column: `gap: { xs: 1, md: 1.5 }`, consistent min touch targets (40px), aria-labels on Beam/Call and mode expander.
- Design language doc: `kb/design-language.md` with usage guidelines.

---

## 4. Files touched (summary)

| Area | Files |
|------|--------|
| Layout/nav | OptimaBar.tsx, OptimaDrawerHeader.tsx, ChromelessFloatingButtons.tsx, ScratchClip.tsx |
| Attachments | ButtonAttachFiles, ButtonAttachClipboard, ButtonAttachScreenCapture, ButtonAttachCamera, ButtonAttachWeb, ButtonAttachNewDoc, ButtonAttachGoogleDrive |
| Chat | ChatDrawer.tsx, ChatDrawerItem.tsx, ChatBarBeam.tsx, ChatBeamWrapper.tsx, PersonaSelector.tsx, CleanerMessage.tsx, InReferenceToBubble.tsx, PaneTitleOverlay.tsx, Composer.tsx, ButtonBeam, ButtonCall, ButtonOptionsDraw, ButtonMicContinuation, LLMAttachmentsPromptsButton.tsx |
| Message | ChatMessage.tsx (already had labels) |
| Beam | BeamRay.tsx |
| Modals/camera | CameraCaptureModal.tsx, ImportOutcomeModal.tsx |
| Forms | FormInputKey.tsx, FormSecretField.tsx, DarkModeToggleButton.tsx |
| Personas | CreatorDrawer.tsx, CreatorDrawerItem.tsx |
| LLM/settings | LLMOptionsModal.tsx, BedrockServiceSetup.tsx, LocalAIAdmin.tsx |
| Auth/pages | PasswordProtection.tsx, pages/auth/signout.tsx, pages/auth/reset-password.tsx, pages/auth/error.tsx, pages/profile.tsx |
| Section | Section.tsx (collapse/expand) |

---

## 5. Recommendations for next pass

1. **Remaining IconButtons:** Add `aria-label` to useLLMSelect, useFormEditTextArray, PromptComposer, PersonaDashboard, FlattenerModal, ModelsServiceSelector, LLMParametersEditor, FolderListItem, Azure/OpenAI service setup, AppAdmin (if a11y is required for admin).
2. **Theme tokens in src:** Replace remaining hardcoded purple hex in PersonaSelector, ChatDrawer, ChatDrawerItem, CMLZeroConversation with theme tokens where it doesn’t break intent.
3. **Sign-in/sign-up:** Review pages/auth/signin.tsx and signup.tsx for any leftover non-theme gradients or colors and align with PasswordProtection/signout pattern.
4. **Lint:** Run `tsc --noEmit` and `npm run lint` after any further changes.

This audit and the design language doc (`design-language.md`) together give a clear baseline for UX and design consistency across the app.
