const sqlite3 = require("sqlite3");
const path = require("path");
const fs = require("fs");
const otp = require("parse-otp-message");
const cp = require("child_process");

// https://gist.github.com/mkremins/11013151
function pbcopy(data) {
  var proc = cp.spawn("pbcopy");
  proc.stdin.write(data);
  proc.stdin.end();
}

function pbpaste() {
  return cp.execSync(`pbpaste`).toString();
}

function notify({ title = "OTP Listener", subtitle = "", message }) {
  try {
    let args = [
      `display notification "${message.replace(/(["\\])/g, "\\$1")}"`,
    ];
    if (title) {
      args.push(`with title "${title.replace(/(["\\])/g, "\\$1")}"`);
    }
    if (subtitle) {
      args.push(`subtitle "${subtitle.replace(/(["\\])/g, "\\$1")}"`);
    }
    cp.execFileSync(`/usr/bin/osascript`, [`-e`, args.join(" ")]);
  } catch (err) {
    console.error(err);
  }
}

function notifyAndThrowOnError(err) {
  if (err) {
    notify({
      subtitle: `Error`,
      message: err.message || "Unspecified error.",
    });
    throw err;
  }
}

// fetch chat.cb location
const dbFile = path.resolve(`${process.env.HOME}`, `Library/Messages/chat.db`);

// open the db
const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READONLY, (err) => {
  notifyAndThrowOnError(err);

  // mark the current time as the last delivered date
  let lastDeliveredDate = Date.now();

  // setup file watcher on the write-ahead log as this updates the fastest
  fs.watchFile(`${dbFile}-wal`, () => {
    db.get(
      `select ROWID, text, date from message order by ROWID desc limit 1`,
      (err, newest) => {
        notifyAndThrowOnError(err);
        let deliveredDate =
          Date.UTC(2001, 0, 1, 0, 0, 0, 0) + newest.date / 1000000;
        if (deliveredDate > lastDeliveredDate) {
          lastDeliveredDate = deliveredDate;
          let body = newest.text;
          if (body) {
            let code = otp(body);
            if (body && code && code.code) {
              notify({
                subtitle: code.service
                  ? `New OTP (${code.service})`
                  : `New OTP`,
                message: code.code,
              });
              // the clipboard is rather complex, but we do our best to restore
              // text content
              // TODO: exactly restore the state of the clipboard
              let oldClipboard = pbpaste();
              pbcopy(code.code);
              // restore the old clipboard data after 15s
              if (oldClipboard) {
                setTimeout(() => {
                  let currentClipboard = pbpaste();
                  if (currentClipboard == code.code) {
                    pbcopy(oldClipboard);
                  }
                }, 15 * 1000);
              }
            }
          }
        }
      }
    );
  });

  notify({ message: "Ready!" });
});
