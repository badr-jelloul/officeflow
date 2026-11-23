# OfficeFlow

A small, private-by-default desktop app for running a small office: **tasks**, **clients** and **invoices** in one place. Built with [Tauri](https://tauri.app) and plain HTML/CSS/JavaScript. No account, no server, no tracking.

## Features

- **Tasks:** add, tick off, filter (all / open / done), optional due dates.
- **Clients:** keep names, emails and phone numbers.
- **Invoices:** numbered invoices per client, paid/unpaid toggle, outstanding total, print to paper or PDF.
- **Backup:** export and import all your data as a single JSON file.
- **Local only:** data is stored on your computer. Light and dark theme follow your system.

## Run it

You need [Node.js](https://nodejs.org) and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) (Rust).

```bash
npm install
npm run tauri dev      # run the app
npm run tauri build    # create an installer
```

You can also open `src/index.html` in a browser to try the interface without Rust.

## Project layout

```
src/         the app (HTML, CSS, JavaScript)
src-tauri/   the Tauri / Rust shell
```

## Roadmap

- Currency choice and invoice templates
- CSV export
- Recurring tasks
- Translations

Ideas and pull requests are welcome. Please open an issue first for larger changes.

## License

[MIT](LICENSE)
