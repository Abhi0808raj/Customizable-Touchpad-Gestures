import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {SwipeTracker} from 'resource:///org/gnome/shell/ui/swipeTracker.js';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';
import Gio from 'gi://Gio?version=2.0';
import Clutter from 'gi://Clutter';

export default class AdvancedTouchpadGestures extends Extension {
    constructor(metadata) {
        super(metadata);
        this._settings = null;
        this._touchpadGestureAction = null;
        this._gestureCallbackId = null;
        this._swipeTracker = null;
    }

    enable() {
        console.log('Advanced Touchpad Gestures: Enabling extension');
        
        try {
            this._settings = this.getSettings();
            console.log('Advanced Touchpad Gestures: Settings loaded successfully');

            // Get the touchpad gesture action from the stage
            this._touchpadGestureAction = global.stage.get_action('touchpad');
            
            if (this._touchpadGestureAction) {
                console.log('Advanced Touchpad Gestures: Found touchpad gesture action, connecting signals');
                // Connect to the gesture signals
                this._gestureCallbackId = this._touchpadGestureAction.connect('gesture', 
                    (action, device, sequence, gestureType, fingerCount, dx, dy) => {
                        this._onGesture(gestureType, fingerCount, dx, dy);
                    });
            } else {
                console.log('Advanced Touchpad Gestures: No touchpad gesture action found, using fallback');
                // Fallback: Create our own gesture recognizer
                this._setupFallbackGestureRecognizer();
            }
            
            console.log('Advanced Touchpad Gestures: Extension enabled successfully');
        } catch (error) {
            console.error(`Advanced Touchpad Gestures: Failed to enable extension: ${error}`);
        }
    }

    disable() {
        console.log('Advanced Touchpad Gestures: Disabling extension');
        
        if (this._gestureCallbackId && this._touchpadGestureAction) {
            this._touchpadGestureAction.disconnect(this._gestureCallbackId);
            this._gestureCallbackId = null;
            console.log('Advanced Touchpad Gestures: Disconnected gesture callback');
        }
        
        if (this._swipeTracker) {
            this._swipeTracker.destroy();
            this._swipeTracker = null;
            console.log('Advanced Touchpad Gestures: Destroyed swipe tracker');
        }
        
        this._touchpadGestureAction = null;
        this._settings = null;
        
        console.log('Advanced Touchpad Gestures: Extension disabled successfully');
    }

    _setupFallbackGestureRecognizer() {
        try {
            this._swipeTracker = new SwipeTracker(global.stage,
                Clutter.Orientation.BOTH,
                Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
                { allowDrag: false, allowScroll: false });

            this._swipeTracker.connect('begin', (tracker, monitor) => {
                // Gesture begin
                console.log('Advanced Touchpad Gestures: Gesture tracking has begun!');
            });

            this._swipeTracker.connect('update', (tracker, progress) => {
                // Gesture update
            });

            this._swipeTracker.connect('end', (tracker, duration, endProgress) => {
                // Gesture end - determine the gesture here
                const fingers = tracker._touchpadGesture ? tracker._touchpadGesture.get_n_current_points() : 3;
                this._handleSwipeEnd(fingers, endProgress);
            });
        } catch (error) {
            console.error(`Failed to setup fallback gesture recognizer: ${error}`);
        }
    }

    _onGesture(gestureType, fingerCount, dx, dy) {
        if (!this._settings.get_boolean('intercept-gestures')) return;

        console.log(`Advanced Touchpad Gestures: Gesture detected - Type: ${gestureType}, Fingers: ${fingerCount}, dx: ${dx}, dy: ${dy}`);

        // Handle different gesture types
        if (gestureType === Clutter.TouchpadGesturePhase.END) {
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                const direction = dx > 0 ? 'right' : 'left';
                console.log(`Advanced Touchpad Gestures: Horizontal swipe detected - ${fingerCount} fingers, direction: ${direction}`);
                this._executeSwipeGesture(fingerCount, direction);
            } else if (Math.abs(dy) > 20) { // Threshold for vertical swipes
                // Vertical swipe
                const direction = dy > 0 ? 'down' : 'up';
                console.log(`Advanced Touchpad Gestures: Vertical swipe detected - ${fingerCount} fingers, direction: ${direction}`);
                this._executeSwipeGesture(fingerCount, direction);
            } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                // Tap gesture (minimal movement)
                console.log(`Advanced Touchpad Gestures: Tap gesture detected - ${fingerCount} fingers`);
                this._executeTapGesture(fingerCount);
            }
        }
    }

    _handleSwipeEnd(fingerCount, progress) {
        if (!this._settings.get_boolean('intercept-gestures')) return;

        // Determine direction based on progress
        let direction;
        if (Math.abs(progress) > 0.3) { // Threshold for gesture recognition
            if (progress > 0) {
                direction = 'right';
            } else {
                direction = 'left';
            }
            this._executeSwipeGesture(fingerCount, direction);
        }
    }

    _executeSwipeGesture(fingers, direction) {
        const fingerWord = fingers === 3 ? 'three' : fingers === 4 ? 'four' : null;
        if (!fingerWord) return;

        const actionKey = `${fingerWord}-finger-swipe-${direction}`;
        const action = this._settings.get_string(actionKey);
        this._executeAction(action);
    }

    _executeTapGesture(fingers) {
        const fingerWord = fingers === 3 ? 'three' : fingers === 4 ? 'four' : null;
        if (!fingerWord) return;

        const actionKey = `${fingerWord}-finger-tap`;
        const action = this._settings.get_string(actionKey);
        this._executeAction(action);
    }

    _executeAction(action) {
        if (!action || action === 'none') return;

        try {
            switch (action) {
                case 'workspace-left':
                    this._switchWorkspace(Meta.MotionDirection.LEFT);
                    break;
                case 'workspace-right':
                    this._switchWorkspace(Meta.MotionDirection.RIGHT);
                    break;
                case 'toggle-overview':
                    Main.overview.toggle();
                    break;
                case 'launch-terminal':
                    this._launchApp('org.gnome.Terminal.desktop');
                    break;
                case 'launch-browser':
                    Gio.AppInfo.launch_default_for_uri('https://www.google.com', global.create_app_launch_context(0, -1));
                    break;
                case 'media-play-pause':
                    this._executeMediaControl('play-pause');
                    break;
                case 'volume-up':
                    this._executeVolumeControl(true);
                    break;
                case 'volume-down':
                    this._executeVolumeControl(false);
                    break;
                default:
                    if (action.startsWith('custom:')) {
                        const command = action.substring(7);
                        this._executeCustomCommand(command);
                    }
                    break;
            }
        } catch (error) {
            console.error(`Failed to execute gesture action: ${error}`);
        }
    }

    _switchWorkspace(direction) {
        const workspaceManager = global.workspace_manager;
        const activeWs = workspaceManager.get_active_workspace();
        let newWs = activeWs.get_neighbor(direction);
        if (newWs && newWs !== activeWs) {
            newWs.activate(global.get_current_time());
        }
    }

    _launchApp(appId) {
        const app = Shell.AppSystem.get_default().lookup_app(appId);
        if (app) {
            app.activate();
        } else {
            try {
                const appName = appId.replace('.desktop', '').toLowerCase();
                GLib.spawn_command_line_async(appName);
            } catch (e) {
                console.log(`Failed to launch app '${appId}': ${e.message}`);
            }
        }
    }

    _executeMediaControl(action) {
        try {
            GLib.spawn_command_line_async(`playerctl ${action}`);
        } catch (e) {
            // Fallback to DBus media control
            try {
                GLib.spawn_command_line_async(`dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.PlayPause`);
            } catch (e2) {
                console.log(`Failed to control media: ${e2.message}`);
            }
        }
    }

    _executeVolumeControl(increase) {
        try {
            // Try PulseAudio first
            const change = increase ? '+5%' : '-5%';
            GLib.spawn_command_line_async(`pactl set-sink-volume @DEFAULT_SINK@ ${change}`);
        } catch (e) {
            try {
                // Fallback to ALSA
                GLib.spawn_command_line_async(`amixer set Master 5%${increase ? '+' : '-'}`);
            } catch (e2) {
                console.log(`Failed to control volume: ${e2.message}`);
            }
        }
    }

    _executeCustomCommand(command) {
        try {
            GLib.spawn_command_line_async(command);
        } catch (e) {
            console.log(`Failed to run custom command '${command}': ${e.message}`);
        }
    }
}