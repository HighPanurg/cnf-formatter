# MySQL CNF Formatter and Linter

VS Code extension for `my.cnf` and other MySQL option files.

## Features

- Registers a `mysql-cnf` language for `.cnf`, `my.cnf`, and `my.ini` files.
- Formats option files with normalized comments, section headers, spacing, and aligned `=` signs across blank- or comment-separated option groups.
- Lints malformed sections, unparsable option lines, duplicate non-repeatable options, tabs, trailing whitespace, missing include paths, unknown option groups, and common boolean, integer, and size values.
- Uses a shared option catalog for hover descriptions, enum and range checks, completions, and selected MySQL/MariaDB compatibility warnings.
- Suggests section names, section-aware option names, and boolean or enum values. Preserves underscore spelling, existing assignments, quotes, and inline comments.
- Links hover documentation to official MySQL or MariaDB documentation and marks known deprecated options.
- Offers a trailing-whitespace quick fix and a duplicate-review action that shows both declarations before asking for removal confirmation.
- Allows template placeholders such as `{{ server_id }}` by default for generated configs.
- Supports local, remote, and untitled documents in **MySQL CNF** language mode. Files explicitly switched to another language are left alone.
- Debounces linting while typing by 250 ms; opening, saving, manual linting, and relevant settings changes refresh diagnostics immediately.

## Compatibility and Editor Assistance

The default `generic` target accepts vendor-specific options without compatibility warnings. Select a database family and version in workspace or folder settings to enable the curated compatibility rules:

```json
{
  "mysqlCnf.target.flavor": "mysql",
  "mysqlCnf.target.version": "8.4.0"
}
```

Use `mariadb` for MariaDB. An empty version disables version-specific warnings, but family-specific checks still apply. A missing patch component means `.0`, so `8.0` means `8.0.0`.

The catalog is intentionally partial, not a complete validator for every server, client, plugin, or version. Unknown options remain allowed. Group filtering is advisory and custom groups remain permissive. Compatibility checks cover selected introductions, deprecations, and removals; they do not connect to a database or evaluate included files. The `loose-` prefix suppresses compatibility warnings, but known value types are still checked.

Completions omit known unsupported or removed options and already-declared non-repeatable options in the same group, including repeated group headers. Additional repeatable options and accepted group names can be configured below.

Duplicate warnings link to the first declaration. The review quick fix navigates there and asks before removing the later declaration, since later values may intentionally override earlier ones. Cancellation makes no changes; edits made while the dialog is open invalidate removal. An inline comment on a removed declaration is retained as a standalone comment.

## Local Development

Open this folder in VS Code and run the extension in an Extension Development Host. The sample [my.cnf.example](my.cnf.example) can be used to try formatting and diagnostics.

Requires Node.js 20 or later for local tests. No test dependencies need installing.

Useful commands:

```sh
npm run check
npm test
npm run package:vsix
```

Tests cover parsing and formatting regressions, escaping, path preservation, idempotence, CRLF, catalog compatibility boundaries, value constraints, completion ranges, duplicate confirmation, and document/settings lifecycle behavior. VS Code interactions use an API mock, not a real Extension Development Host.

For a manual editor smoke test, try an untitled document in MySQL CNF mode, request completions inside `[mysqld]` and `[client]`, inspect a deprecated option with a versioned target, and review a duplicate through Quick Fix. Also check different folder settings in a multi-root workspace and a remote document when available.

## GitHub Actions Publishing

The workflow in [.github/workflows/vscode-extension.yml](.github/workflows/vscode-extension.yml) packages the extension on pull requests and pushes to `main` or `master`. After a PR is merged, the push to `main` packages the merged code and checks [package.json](package.json). If the package version does not already have a matching tag such as `v0.0.2`, the workflow publishes the VSIX to the VS Code Marketplace, creates that GitHub release tag, and attaches the VSIX to the release.

The workflow also supports publishing from an existing version tag such as `v0.0.2`, or from a manual workflow run with `publish` enabled.

Before publishing:

- Make sure `publisher` in [package.json](package.json) exactly matches your VS Code Marketplace publisher ID.
- Create a VS Code Marketplace Personal Access Token.
- Add that token in GitHub as `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret` named `VSCE_PAT`.

To publish from a PR, bump the extension version without creating a local git tag:

```sh
npm version patch --no-git-tag-version
git add package.json
git commit -m "Bump extension version"
git push origin your-branch
```

Open a PR and merge it into `main`. The merged push creates the release automatically if the matching `vX.Y.Z` tag does not already exist.

If you publish from a tag instead, the workflow verifies that the pushed tag, for example `v0.0.2`, matches the version in [package.json](package.json) before publishing.

## Commands

- `MySQL CNF: Format Document`
- `MySQL CNF: Lint Document`

## Settings

All settings are resource-scoped, so separate workspace folders can use different formatting and database targets.

- `mysqlCnf.target.flavor`: `generic` (default), `mysql`, or `mariadb`.
- `mysqlCnf.target.version`: empty (default) or `major.minor[.patch]`.
- `mysqlCnf.format.alignEquals`
- `mysqlCnf.format.inlineCommentColumn`
- `mysqlCnf.format.finalNewline`
- `mysqlCnf.lint.allowTemplatePlaceholders`
- `mysqlCnf.lint.warnOnUnknownSections`
- `mysqlCnf.lint.allowedSections`
- `mysqlCnf.lint.repeatableOptions`
