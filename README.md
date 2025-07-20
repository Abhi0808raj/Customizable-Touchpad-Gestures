# Customizable Touchpad Gestures

A GNOME Shell extension for customizing 3-finger and 4-finger touchpad gestures on Wayland.

## ⚠️ Current Status: Development Paused

This extension is currently **not working** due to a low-level system issue. Development has been paused to save progress while investigating the root cause.

### The Problem

The extension fails to detect touchpad gestures due to a `libinput` error at the system level:

```
libinput error: event6 - CUST0001:00 06CB:7E7E Touchpad: kernel bug: Touch jump detected and discarded.
```

**What this means:**
- The `libinput` library (which handles all input devices) is receiving faulty data from the touchpad driver
- To prevent cursor jumping, `libinput` discards these touch events
- Since the touch data never reaches GNOME Shell, the extension cannot detect or process gestures
- This is **not a bug in the extension code** - it's a hardware/driver compatibility issue

### Hardware Context

Tested on: **MSI GF63 Thin 9SCXR** laptop
- Touchpad: `CUST0001:00 06CB:7E7E`
- The issue may be specific to this hardware or similar touchpads

## Features (Intended)

When working, this extension would provide:

### Gesture Support
- **3-finger swipes** (left, right, up, down)
- **4-finger swipes** (left, right, up, down)  
- **3-finger taps**
- **4-finger taps**

### Built-in Actions
- Switch workspaces (left/right)
- Toggle Activities Overview
- Launch Terminal
- Launch Browser
- Media controls (play/pause)
- Volume controls (up/down)
- Custom shell commands

### Customization
- Modern preferences UI using Adwaita widgets
- Per-gesture action configuration
- Support for custom shell commands
- Enable/disable gesture interception

## Installation

```bash
# Clone the repository
git clone https://github.com/Abhi0808raj/Customizable-Touchpad-Gestures.git

# Navigate to the extension directory
cd Customizable-Touchpad-Gestures

# Install the extension
cp -r . ~/.local/share/gnome-shell/extensions/customizable-touchpad-gestures@wayland.com/

# Compile the settings schema
glib-compile-schemas ~/.local/share/gnome-shell/extensions/customizable-touchpad-gestures@wayland.com/schemas/

# Restart GNOME Shell (X11 only - on Wayland, log out and back in)
Alt+F2 → type 'r' → Enter

# Enable the extension
gnome-extensions enable customizable-touchpad-gestures@wayland.com
```

## Troubleshooting

### If the extension doesn't work:

1. **Check for `libinput` errors:**
   ```bash
   journalctl -f | grep libinput
   ```

2. **Look for touchpad-related issues:**
   ```bash
   journalctl -f | grep -i touchpad
   ```

3. **Common error patterns:**
   - `Touch jump detected and discarded` - Hardware/driver issue
   - `kernel bug` - System-level problem requiring OS/driver updates

### Potential Solutions

1. **Update your system:**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Check libinput documentation:**
   Visit: https://wayland.freedesktop.org/libinput/doc/1.25.0/touchpad-jumping-cursors.html

3. **Search for hardware-specific solutions:**
   - Look up your laptop model + "libinput touch jump"
   - Check for BIOS updates
   - Look for kernel parameter workarounds

## Technical Details

### Architecture
- **Main Extension** (`extension.js`): Core gesture detection and action execution
- **Preferences** (`prefs.js`): Modern GTK4/Adwaita settings interface  
- **Schema** (`schemas/`): GSettings configuration definitions

### Gesture Detection Strategy
The extension uses a dual-approach for gesture detection:

1. **Primary**: Connects to GNOME Shell's existing touchpad gesture action
2. **Fallback**: Creates a custom `SwipeTracker` instance

### Supported GNOME Shell Versions
- 45, 46, 47, 48

## File Structure

```
customizable-touchpad-gestures@wayland.com/
├── extension.js          # Main extension logic
├── prefs.js             # Preferences UI
├── metadata.json        # Extension metadata
├── schemas/
│   └── org.gnome.shell.extensions.advanced-touchpad-gestures.gschema.xml
├── README.md
└── .gitattributes
```

## Development Notes

### Debugging
Enable debug logging in `extension.js` by checking the console output:
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

### Key Classes Used
- `SwipeTracker`: GNOME Shell's gesture tracking system
- `Meta.MotionDirection`: Workspace switching directions
- `Shell.AppSystem`: Application launching
- `GLib.spawn_command_line_async`: Command execution

### Settings Keys
All gesture actions are configurable via GSettings:
- `three-finger-swipe-{left|right|up|down}`
- `four-finger-swipe-{left|right|up|down}`
- `three-finger-tap`, `four-finger-tap`
- `custom-commands` (array of shell commands)

## Contributing

This project is currently paused due to hardware compatibility issues. If you:

- Have experience with `libinput` debugging
- Know solutions for touchpad driver issues
- Have successfully tested this on different hardware

Your contributions would be greatly appreciated!

## License

This project is open source. Please check the repository for license details.

## Acknowledgments

- GNOME Shell developers for the gesture APIs
- The `libinput` project for input device management
- Community members who helped with debugging

---

**Note**: This README documents both the intended functionality and current limitations. The extension code is complete and should work on systems without the `libinput` compatibility issue.