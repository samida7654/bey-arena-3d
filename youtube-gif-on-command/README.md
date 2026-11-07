# YouTube GIF on Command

A Chrome Manifest V3 extension that adds a **GIF on Command** button to YouTube.

## Features
- Select a start time and a clip duration (up to 6 seconds).
- Set frame rate (2–12 FPS) and output width.
- Encode frames locally in the browser and download an animated `.gif`.
- Add an **Insert GIF link** helper beside YouTube's comment editor.

## Install in Chrome
1. Download this folder from the repository (or download the repository source).
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select the `youtube-gif-on-command` folder.
5. Open or refresh YouTube. The button appears over the video player.

## Important notes
- GIF creation happens locally in the browser; the extension does not upload your video or GIF.
- YouTube comments do not provide a general image/GIF file attachment feature. The comment helper inserts a URL to a GIF that is already hosted publicly; it does not upload or embed a local GIF image.
- Some YouTube videos may prevent canvas frame extraction. If that happens, the extension will show an error instead of producing a file.
- Use only clips you have permission to download or reuse, and follow YouTube's terms and copyright rules.

## Files
- `manifest.json` — extension configuration
- `content.js` — YouTube button, clip capture, GIF encoder, and comment link helper

MIT License
