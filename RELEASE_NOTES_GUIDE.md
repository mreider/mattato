# Release Notes Guide

This repository uses a custom release notes system that allows you to write detailed release notes for each version.

## How It Works

1. **Edit `RELEASE_NOTES.md`** - Update this file with your custom release notes before pushing to main/master
2. **Push to main/master** - The GitHub Actions workflow will automatically use your custom notes
3. **Automatic fallback** - If no `RELEASE_NOTES.md` exists, it uses a default template

## Release Notes Format

The `RELEASE_NOTES.md` file should contain your release notes in Markdown format. The workflow will automatically:

- Add the version number as a header
- Include build information (build number, commit hash)
- Add download instructions
- Include a link to the full changelog

## Example Release Notes Structure

```markdown
# Release Notes

## What's New in This Release

### 🔧 Improvements
- Improvement 1
- Improvement 2

### 🐛 Bug Fixes
- Bug fix 1
- Bug fix 2
```

