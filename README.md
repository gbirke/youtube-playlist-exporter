# YPEE - YouTube Playlist Exporter Extension

This is a browser plugin that exports YouTube playlists to text. It does
that by reading the currently displayed playlist, jumping to the end to
trigger the loading of more items if needed.

This extension is helpful if you have a long "Watch Later" list that you
want to expert. While the YouTube API allows reading and exporting regular
playlists, you can only see the "Watch Later" list in the browser.

If YouTube decides to change the HTML markup of their playlist pages, this
extension might break.

## Installing

Currently, this extension is not available at the Chrome Store or Firefox
Add-On Registry. You have to download this repository as a ZIP file,
extract it and then follow the browser-specific install instructions.

### Chrome/Chromium

Go to your extensions page at chrome://extensions and activate "Debug
Mode". Then click the button "Load Unpacked" and choose the folder
containing the extension files.

### Firefox

See https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/

The extension will only last until you restart Firefox.

## Future improvements

I might add more features in the future.

- [ ] Copy to clipboard
- [ ] Format code with some code style
- [ ] Progress bar when loading multiple pages of playlists.
- [ ] Save to file
- [ ] I18N - Translate the text messages to other languages
- [ ] Improve styling of popup window: Colors, form field sizes, etc.
- [ ] Add icons
- [ ] Allow playlist collection from multiple tabs
- [ ] Export watch history (The watch history is not a playlist)


## Used libraries

- https://vanjs.org/ - For some reactive rendering inside the popup.
