document.addEventListener("DOMContentLoaded", () => {
  let googleUser = null;

  const CLIENT_ID =
    "424180784069-bo0lo5dms4vcn59mianh5j7oa85nioou.apps.googleusercontent.com";

  const API_KEY = "AIzaSyBjN0DWe-DASx8aOv4jrq0YIbv3Vsf56R8";
  const SCOPE = "https://www.googleapis.com/auth/drive.file";

  const driveLogin = $("driveLogin");
  const driveBackup = $("driveBackup");
  const driveRestore = $("driveRestore");

  let pendingDriveAction = null;

  function isOnline() {
    return navigator.onLine;
  }

  function needInternet() {
    show("Connect to the internet to continue");
  }

  window.addEventListener("online", async () => {
    if (!pendingDriveAction) return;

    show("Back online — finishing your request…");

    const action = pendingDriveAction;
    pendingDriveAction = null;

    await action();
  });

  window.addEventListener("offline", () => {
    show("You're offline");
  });

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

  /* ---------- LOGIN STATE HELPERS ---------- */

  function isLoggedIn() {
    return !!googleUser;
  }

  function logoutDrive() {
    googleUser = null;
    localStorage.removeItem("driveToken");
    localStorage.removeItem("driveTokenExpiry");
    show("Signed out");
    updateDriveUI();
  }

  function updateDriveUI() {
    if (isLoggedIn()) {
      driveLogin.innerHTML = `<i class="bi bi-box-arrow-right"></i> Logout`;
      driveBackup.disabled = false;
      driveRestore.disabled = false;
    } else {
      driveLogin.innerHTML = `<i class="bi bi-google"></i> Sign in`;
      driveBackup.disabled = true;
      driveRestore.disabled = true;
    }
  }

  /* ---------- SILENT RESTORE (NO POPUPS) ---------- */

  async function trySilentLogin() {
    const token = localStorage.getItem("driveToken");
    const exp = parseInt(localStorage.getItem("driveTokenExpiry") || 0);

    if (!token || Date.now() > exp) {
      googleUser = null;
      updateDriveUI();
      return;
    }

    googleUser = { access_token: token };
    updateDriveUI();
  }

  trySilentLogin();

  function showLoader() {
    $("loader").style.display = "grid";
  }

  function hideLoader() {
    $("loader").style.display = "none";
  }

  /* ---------- SIGN IN / LOG OUT BUTTON ---------- */

  driveLogin.onclick = async () => {
    if (isLoggedIn()) return logoutDrive();

    if (!isOnline()) {
      needInternet();
      pendingDriveAction = driveLogin.onclick;
      return;
    }

    try {
      showLoader();
      await loadGapi();

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (t) => {
          googleUser = t;

          const expires = Date.now() + t.expires_in * 1000;
          localStorage.setItem("driveToken", t.access_token);
          localStorage.setItem("driveTokenExpiry", expires);

          hideLoader();
          show("Signed in successfully");
          updateDriveUI();
        },
      });

      tokenClient.requestAccessToken();
    } catch (e) {
      hideLoader();
      console.error(e);
      show("Login failed — please try again");
    }
  };

  /* ---------- BACKUP ---------- */

  driveBackup.onclick = async () => {
    if (!isLoggedIn()) return show("Sign in first");

    if (!isOnline()) {
      needInternet();
      pendingDriveAction = driveBackup.onclick;
      return;
    }

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
      updateDriveUI();
    }
  };

  /* ---------- RESTORE ---------- */

  driveRestore.onclick = async () => {
    if (!isLoggedIn()) return show("Sign in first");

    if (!isOnline()) {
      needInternet();
      pendingDriveAction = driveRestore.onclick;
      return;
    }

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
      updateDriveUI();
    }
  };
});
