document.addEventListener("DOMContentLoaded", () => {
  let googleUser = null;

  const CLIENT_ID =
    "424180784069-bo0lo5dms4vcn59mianh5j7oa85nioou.apps.googleusercontent.com";

  const API_KEY = "AIzaSyBjN0DWe-DASx8aOv4jrq0YIbv3Vsf56R8";

  const SCOPE = "https://www.googleapis.com/auth/drive.file";

  function loadGapi(retries = 3) {
    return new Promise((resolve, reject) => {
      gapi.load("client", async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
            ],
          });
          resolve();
        } catch (e) {
          if (retries > 0) {
            setTimeout(() => resolve(loadGapi(retries - 1)), 800);
          } else {
            show("Drive service temporarily unavailable");
            reject(e);
          }
        }
      });
    });
  }

  function showLoader() {
    $("loader").style.display = "grid";
  }

  function hideLoader() {
    $("loader").style.display = "none";
  }

  // ——— BUTTONS ———
  const driveLogin = $("driveLogin");
  const driveBackup = $("driveBackup");
  const driveRestore = $("driveRestore");

  // ——— SIGN IN ———
  driveLogin.onclick = async () => {
    try {
      showLoader();
      await loadGapi();

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (t) => {
          googleUser = t;
          hideLoader();
          show("Signed in successfully");
        },
      });

      tokenClient.requestAccessToken();
    } catch (e) {
      hideLoader();
      console.error(e);
      show("Login failed — please try again");
    }
  };

  // ——— BACKUP ———
  driveBackup.onclick = async () => {
    if (!googleUser) return show("Sign in first");

    driveBackup.disabled = true;
    showLoader();

    try {
      await loadGapi();

      const data = {
        daily: daily(),
        history: history(),
        presets: jget("presets", [60, 45, 90]),
        urgeLog: urgeLog(),
        skips: skipLog(),
      };

      const file = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });

      const form = new FormData();
      form.append(
        "metadata",
        new Blob(
          [
            JSON.stringify({
              name: "smoketimer-backup.json",
              mimeType: "application/json",
            }),
          ],
          { type: "application/json" }
        )
      );
      form.append("file", file);

      const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${googleUser.access_token}` },
          body: form,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      show("Backed up to Drive");
    } catch (e) {
      console.error(e);
      show("Backup failed — please try again");
    } finally {
      hideLoader();
      driveBackup.disabled = false;
    }
  };

  // ——— RESTORE ———
  driveRestore.onclick = async () => {
    if (!googleUser) return show("Sign in first");

    driveRestore.disabled = true;
    showLoader();

    try {
      await loadGapi();

      const res = await gapi.client.drive.files.list({
        q: "name='smoketimer-backup.json'",
        fields: "files(id,name)",
        spaces: "drive",
      });

      if (!res.result.files?.length) {
        show("No backup found");
        return;
      }

      const fileId = res.result.files[0].id;

      const download = await gapi.client.drive.files.get({
        fileId,
        alt: "media",
      });

      const data = JSON.parse(download.body);

Object.entries(data).forEach(([k, v]) => jset(k, v));

updateCounts();
draw();
show("Restored from Drive — data updated");

    } catch (e) {
      console.error(e);
      show("Restore failed — try again");
    } finally {
      hideLoader();
      driveRestore.disabled = false;
    }
  };
});
