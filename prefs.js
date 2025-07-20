import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export default class AdvancedTouchpadGesturesPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        
        // Create main page
        const page = new Adw.PreferencesPage({
            title: _('Touchpad Gestures'),
            icon_name: 'input-touchpad-symbolic',
        });
        
        window.add(page);
        
        // Add preference groups
        this._addGeneralGroup(page, settings);
        this._addSwipeGesturesGroup(page, settings);
        this._addTapGesturesGroup(page, settings);
        this._addCustomCommandsGroup(page, settings);
    }
    
    _addGeneralGroup(page, settings) {
        const group = new Adw.PreferencesGroup({
            title: _('General Settings'),
            description: _('Configure general gesture behavior')
        });
        
        // Intercept gestures switch
        const interceptRow = new Adw.SwitchRow({
            title: _('Enable Custom Gestures'),
            subtitle: _('Override default GNOME gesture behavior')
        });
        
        settings.bind('intercept-gestures', interceptRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        group.add(interceptRow);
        
        page.add(group);
    }
    
    _addSwipeGesturesGroup(page, settings) {
        const group = new Adw.PreferencesGroup({
            title: _('Swipe Gestures'),
            description: _('Configure 3-finger and 4-finger swipe actions')
        });

        const gestures = [
            ['three-finger-swipe-left', _('3-finger swipe left')],
            ['three-finger-swipe-right', _('3-finger swipe right')],
            ['three-finger-swipe-up', _('3-finger swipe up')],
            ['three-finger-swipe-down', _('3-finger swipe down')],
            ['four-finger-swipe-left', _('4-finger swipe left')],
            ['four-finger-swipe-right', _('4-finger swipe right')],
            ['four-finger-swipe-up', _('4-finger swipe up')],
            ['four-finger-swipe-down', _('4-finger swipe down')]
        ];

        gestures.forEach(([key, title]) => {
            const row = this._createActionRow(title, settings, key);
            group.add(row);
        });

        page.add(group);
    }

    _addTapGesturesGroup(page, settings) {
        const group = new Adw.PreferencesGroup({
            title: _('Tap Gestures'),
            description: _('Configure multi-finger tap actions')
        });

        const tapGestures = [
            ['three-finger-tap', _('3-finger tap')],
            ['four-finger-tap', _('4-finger tap')]
        ];

        tapGestures.forEach(([key, title]) => {
            const row = this._createActionRow(title, settings, key);
            group.add(row);
        });

        page.add(group);
    }
    
    _addCustomCommandsGroup(page, settings) {
        const group = new Adw.PreferencesGroup({
            title: _('Custom Commands'),
            description: _('Add custom shell commands for gesture actions')
        });
        
        const addButton = new Gtk.Button({
            label: _('Add Custom Command'),
            css_classes: ['suggested-action']
        });
        
        addButton.connect('clicked', () => {
            this._showCustomCommandDialog(settings);
        });
        
        const buttonRow = new Adw.ActionRow({
            title: _('Custom Commands'),
            subtitle: _('Create custom shell commands to run with gestures')
        });
        buttonRow.add_suffix(addButton);
        group.add(buttonRow);
        
        page.add(group);
    }
    
    _createActionRow(title, settings, key) {
        const row = new Adw.ComboRow({
            title: title
        });
        
        const model = new Gtk.StringList();
        const actions = [
            ['none', _('None')],
            ['workspace-left', _('Switch to left workspace')],
            ['workspace-right', _('Switch to right workspace')],
            ['toggle-overview', _('Toggle Activities Overview')],
            ['launch-terminal', _('Launch Terminal')],
            ['launch-browser', _('Launch Browser')],
            ['media-play-pause', _('Play/Pause Media')],
            ['volume-up', _('Volume Up')],
            ['volume-down', _('Volume Down')]
        ];
        
        actions.forEach(([value, label]) => {
            model.append(label);
        });
        
        // Add custom commands
        const customCommands = settings.get_strv('custom-commands');
        customCommands.forEach(cmd => {
            model.append(`Custom: ${cmd}`);
        });
        
        row.set_model(model);
        
        // Set current value
        const currentValue = settings.get_string(key);
        const currentIndex = actions.findIndex(([value]) => value === currentValue);
        if (currentIndex >= 0) {
            row.set_selected(currentIndex);
        }
        
        // Connect to changes
        row.connect('notify::selected', () => {
            const selectedIndex = row.get_selected();
            if (selectedIndex < actions.length) {
                const [value] = actions[selectedIndex];
                settings.set_string(key, value);
            } else {
                // Custom command selected
                const customIndex = selectedIndex - actions.length;
                const customCmd = customCommands[customIndex];
                settings.set_string(key, `custom:${customCmd}`);
            }
        });
        
        return row;
    }
    
    _showCustomCommandDialog(settings) {
        const dialog = new Adw.MessageDialog({
            heading: _('Add Custom Command'),
            body: _('Enter a shell command to execute')
        });
        
        const entry = new Gtk.Entry({
            placeholder_text: _('e.g., gnome-calculator')
        });
        
        dialog.set_extra_child(entry);
        dialog.add_response('cancel', _('Cancel'));
        dialog.add_response('add', _('Add'));
        dialog.set_response_appearance('add', Adw.ResponseAppearance.SUGGESTED);
        
        dialog.connect('response', (dialog, response) => {
            if (response === 'add') {
                const command = entry.get_text().trim();
                if (command) {
                    const currentCommands = settings.get_strv('custom-commands');
                    currentCommands.push(command);
                    settings.set_strv('custom-commands', currentCommands);
                }
            }
            dialog.destroy();
        });
        
        dialog.present();
    }
}
