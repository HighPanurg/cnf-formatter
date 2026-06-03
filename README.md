# MySQL CNF Formatter and Linter

VS Code extension for `my.cnf` and other MySQL option files.

## Features

- Registers a `mysql-cnf` language for `.cnf`, `my.cnf`, and `my.ini` files.
- Formats option files with normalized comments, section headers, spacing, and aligned `=` signs.
- Lints malformed sections, unparsable option lines, duplicate non-repeatable options, tabs, trailing whitespace, missing include paths, unknown option groups, and common boolean, integer, and size values.
- Allows template placeholders such as `{{ server_id }}` by default for generated configs.

## Local Development

Open this folder in VS Code and run the extension in an Extension Development Host. The sample [my.cnf](my.cnf) can be used to try formatting and diagnostics.

Useful command:

```sh
npm run check
```

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
