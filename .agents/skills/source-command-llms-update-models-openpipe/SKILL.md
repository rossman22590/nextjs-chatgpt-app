---
name: "source-command-llms-update-models-openpipe"
description: "Update OpenPipe model definitions with latest pricing and capabilities"
---

# source-command-llms-update-models-openpipe

Use this skill when the user asks to run the migrated source command `llms-update-models-openpipe`.

## Command Template

Update `src/modules/llms/server/openai/models/openpipe.models.ts` with latest model definitions.

Reference `src/modules/llms/server/llm.server.types.ts` and `src/modules/llms/server/models.mappings.ts` for context only. Focus on the model file, do not descend into other code.

**Primary Sources:**
- Base Models: https://docs.openpipe.ai/base-models
- Pricing: https://docs.openpipe.ai/pricing/pricing

**Fallbacks if blocked:** Search "openpipe models latest pricing", "openpipe latest models", "openpipe base models", or search GitHub for latest model prices and context windows

**Important:**
- Review the full model list for additions, removals, and price changes
- Minimize whitespace/comment changes, focus on content
- Preserve comments to make diffs easy to review
- Flag broken links or unexpected content
