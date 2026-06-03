# MySQL CNF Formatter and Linter

VS Code extension for `my.cnf` and other MySQL option files.

## Features

- Registers a `mysql-cnf` language for `.cnf`, `my.cnf`, and `my.ini` files.
- Formats option files with normalized comments, section headers, spacing, and aligned `=` signs.
- Lints malformed sections, unparsable option lines, duplicate non-repeatable options, tabs, trailing whitespace, missing include paths, unknown option groups, and common boolean, integer, and size values.
- Allows template placeholders such as `{{ server_id }}` by default for generated configs.

## Local Development

Open this folder in VS Code and run the extension in an Extension Development Host. The sample [my.cnf.example](my.cnf.example) can be used to try formatting and diagnostics.

Useful command:

```sh
npm run check
npm run package:vsix
```

## GitHub Actions Publishing

The workflow in [.github/workflows/vscode-extension.yml](.github/workflows/vscode-extension.yml) packages the extension on pull requests and pushes to `main` or `master`. It publishes to the VS Code Marketplace when you push a version tag such as `v0.0.1`, or when you manually run the workflow with `publish` enabled.

Before publishing:

- Make sure `publisher` in [package.json](package.json) exactly matches your VS Code Marketplace publisher ID.
- Create a VS Code Marketplace Personal Access Token.
- Add that token in GitHub as `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret` named `VSCE_PAT`.

To publish a new version:

```sh
npm version patch
git push origin main --follow-tags
```

The workflow verifies that the pushed tag, for example `v0.0.2`, matches the version in [package.json](package.json) before publishing.

## Commands

- `MySQL CNF: Format Document`
- `MySQL CNF: Lint Document`

## Settings

- `mysqlCnf.format.alignEquals`
- `mysqlCnf.format.inlineCommentColumn`
- `mysqlCnf.format.finalNewline`
- `mysqlCnf.lint.allowTemplatePlaceholders`
- `mysqlCnf.lint.warnOnUnknownSections`
- `mysqlCnf.lint.allowedSections`
- `mysqlCnf.lint.repeatableOptions`
