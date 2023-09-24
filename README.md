# YPEE - YouTube Playlist Exporter Extension

This is a browser plugin that exports YouTube playlists to text. It does
that by reading the currently displayed playlist, jumping to the end to
trigger the loading of more items if needed.

This extension is helpful if you have a long "Watch Later" list that you
want to expert. While the YouTube API allows reading and exporting regular
playlists, you can only see the "Watch Later" list in the browser.

## Installing

Currently, this extension is not available at the Chrome Store or Firefox
Addon Registry. You have to download This repository as a ZIP file,
extract it and then follow the browser-specific install instructions.

### Chrome/Chromium

Go to your extensions page at chrome://extensions and activate "Debug
Mode". Then click the button "Load Unpacked" and choose the folder
containing the extension files.

### Firefox

See https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/


## TODO / Next steps
- [x] Render Playlist in popup
- [x] Show status in popup
- [x] 2nd field for render template, with buttons to insert different templates:
  - Markdown
  - URLs only
  - CSV
- [ ] Polish manifest
  - [ ] Name and description
  - [ ] Contact information in case of errors
  - [ ] Icons
- [ ] Check (and maybe fix) Firefox compatibility

## Future improvements

- [ ] Copy to clipboard
- [ ] Format code with some code style
- [ ] Progress bar when loading multiple pages of playlists.
- [ ] Save to file
- [ ] I18N
- [ ] Style popup
- [ ] Allow playlist collection from multiple tabs
- [ ] Export watch history (The watch history is not a playlist)
