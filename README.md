This helper function was written to allow non-Safari users on OSX to be able to
handle OTP codes a little more gracefully. By default, only Safari users get the
benefit of the magic OTP handling.

Unfortunately, OSX does not allow any kind of access to a user's iMessage BUT we
can kind of get around it by monitoring the user's notifications (which has the
body of the text message embedded in it). The application watches for new
notifications via updates to the SQLite DB that houses the system notifications,
and then parses text messages for OTP codes. If an OTP code is detected, the
user is notified and it is automatically copied to the clipboard. It also tries
to be a little cute and restores the original clipboard after 15s (but only
works for text content currently). Unfortunately, it looks like it takes 2-3s
for the notification DB to update after the text message notification is
displayed (can't figure out how to access it faster than that).

EDIT: Actually we can access the iMessage DB directly so that reduces the time
significantly. However, the application now needs Full Disk Access (under the
Privacy & Security settings pane).

For this application to work, notifications for iMessage must be enabled and
text message forwarding should be enabled (https://support.apple.com/guide/messages/get-sms-texts-from-iphone-on-your-mac-icht8a28bb9a/mac).

# Installation

- `npm install` (installs dependencies, compiles binaries, copies binary to `/usr/local/bin/`, and
  copies `.plist` to `~/Library/LaunchAgents`).
- Grant the binary full disk access under the Privacy & Security panel:

  ![image](https://user-images.githubusercontent.com/2671978/232332686-fa4af1c8-4ad0-41a6-91f1-9c55159dcc14.png)

- `npm run load` (loads the job and registers it to run on startup).
