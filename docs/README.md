# Mattato GitHub Pages

This directory contains the GitHub Pages site for Mattato, a Pomodoro timer for macOS.

## Files

- `index.html` - The main landing page with responsive design
- `tomato-512x512.png` - The tomato icon used in the page
- `README.md` - This file

## Features

The landing page includes:

- 🍅 Animated tomato icon at the top
- 📱 Responsive design that works on all devices
- 🔗 Dynamic download link that fetches the latest release from GitHub API
- ☕ Buy Me a Coffee button linking to https://buymeacoffee.com/mreider
- 🎨 Beautiful gradient design with glassmorphism effects
- 📊 Feature showcase grid
- 🔍 SEO optimized with Open Graph and Twitter meta tags

## Deployment

The site is automatically deployed via GitHub Actions when changes are pushed to the main branch. The workflow:

1. Builds and releases the macOS app
2. Deploys the `docs/` directory to GitHub Pages
3. The page dynamically fetches the latest release info via JavaScript

## Local Development

To test locally, simply open `index.html` in a web browser. The JavaScript will fetch the latest release information from the GitHub API.

## URL

The site will be available at: https://mreider.github.io/mattato/
