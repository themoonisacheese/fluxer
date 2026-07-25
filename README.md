> [!CAUTION]
> As of this writing (15 June 2026), we are working to finalise the API and self-hosting documentation over the next few days.
>
> We apologise for the brief delay in open-source releases. We paused after spam waves created safety concerns while we built out Fluxer's trust and safety infrastructure. During that same stretch, we have been fixing hundreds of bugs, adding new features, and preparing a much improved audio and video system.
>
> You can already try that work in the Fluxer Canary client: [download Canary](https://canary.fluxer.app/download) or [open Canary on the web](https://web.canary.fluxer.app). The latest stable client remains out of date for now, but over the coming weeks we are finalising the remaining work needed to stabilise the current latest code out in the open.

> [!NOTE]
> Learn about the developer behind Fluxer, the goals of the project, the tech stack, and what's coming next.
>
> [Read the launch blog post](https://blog.fluxer.app/how-i-built-fluxer-a-discord-like-chat-app/) | [View full roadmap](https://blog.fluxer.app/roadmap-2026/)

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./fluxer_static/marketing/branding/logo-white.svg">
    <img src="./fluxer_static/marketing/branding/logo-color.svg" alt="Fluxer logo" width="400">
  </picture>
</p>

<p align="center">
  <a href="https://fluxer.app/donate">
    <img src="https://img.shields.io/badge/Donate-fluxer.app%2Fdonate-brightgreen" alt="Donate" /></a>
  <a href="https://docs.fluxer.app">
    <img src="https://img.shields.io/badge/Docs-docs.fluxer.app-blue" alt="Documentation" /></a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-AGPLv3-purple" alt="AGPLv3 License" /></a>
</p>

# Fluxer

Fluxer is a free and open source instant messaging and VoIP chat app built for friends, groups, and communities.

<p align="center">
  <img src="./fluxer_static/marketing/screenshots/desktop-1920w.png" alt="Fluxer app showcase" width="900">
</p>

---

## Fork Changes

This fork adds several features on top of upstream Fluxer, focused on improving self-hosted instance usability and administration.

### Configurable Welcome DM

Send an automatic direct message from the system bot to every newly registered user. The message content and toggle are configurable via the admin panel.

**How to use:**
1. Navigate to **Admin Panel → Instance Config**.
2. In the **Community & Policy** section, find the **Welcome DM** card.
3. Toggle **Enable welcome DM** on and enter your desired message content.
4. Click **Save**.

When enabled, new users will receive a DM from the system bot immediately after registration. The feature is disabled by default.

### Dynamic Android FCM Configuration

Self-hosted instances can now serve dynamic Firebase Cloud Messaging (FCM) configuration to Android clients via a well-known endpoint, enabling push notifications without hardcoding Firebase credentials in the client build.

> **Note:** This only works with our companion mobile fork — the Android client is already wired up to handle dynamic FCM initialization when the server provides credentials. See [fluxer-crescent](https://github.com/themoonisacheese/fluxer-crescent).

Setup involves two parts: configuring the **Android client credentials** (served to the mobile app via the well-known endpoint) and the **server-side FCM service account** (used to send push messages).

#### 1. Create a Firebase Project

Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).

#### 2. Register an Android App

Register an **Android app** with the package name **`website.poggers.chat`** — the mobile fork's canary build uses this as its application ID. Firebase generates the **App ID** automatically; you don't set it yourself.

#### 3. Configure Android Client Credentials (Well-Known Endpoint)

Download `google-services.json` from your Firebase project settings. Extract the following values from it:

| `google-services.json` field | Env var |
|---|---|
| `client[].client_info.mobilesdk_app_id` | `FLUXER_PUSH_ANDROID_FCM_APP_ID` |
| `project_info.project_id` | `FLUXER_PUSH_ANDROID_FCM_PROJECT_ID` |
| `client[].api_key[].current_key` | `FLUXER_PUSH_ANDROID_FCM_API_KEY` |
| `project_info.project_number` | `FLUXER_PUSH_ANDROID_FCM_SENDER_ID` |
| `project_info.storage_bucket` | `FLUXER_PUSH_ANDROID_FCM_STORAGE_BUCKET` *(optional)* |

Set these as environment variables on your API server:

```env
FLUXER_PUSH_ANDROID_FCM_ENABLED=true
FLUXER_PUSH_ANDROID_FCM_APP_ID=1:123456789:android:abc123
FLUXER_PUSH_ANDROID_FCM_API_KEY=AIzaSy...
FLUXER_PUSH_ANDROID_FCM_PROJECT_ID=my-fluxer-project
FLUXER_PUSH_ANDROID_FCM_SENDER_ID=123456789
FLUXER_PUSH_ANDROID_FCM_STORAGE_BUCKET=my-fluxer-project.appspot.com
```

Restart your API server. The credentials are exposed at `/.well-known/fluxer` (via the app-proxy) and `/api/.well-known/fluxer`.

The Android client fetches this config on startup, initializes Firebase dynamically, and registers for push notifications. No client-side build changes or `google-services.json` in the repo needed.

#### 4. Configure Server-Side Push Sending (Service Account)

To send push notifications from your server, you need a Firebase service account key.

1. In the Firebase Console, go to **Project Settings → Service Accounts → Generate New Private Key**.
2. Save the downloaded JSON file to your server (e.g., `/etc/fluxer/fcm-sa.json`).
3. Extract the `project_id`, `client_email`, and `token_uri` from the JSON file.
4. Set these environment variables:

```env
FLUXER_PUSH_FCM_ENABLED=true
FLUXER_PUSH_FCM_PROJECT_ID=my-fluxer-project
FLUXER_PUSH_FCM_CLIENT_EMAIL=firebase-adminsdk-fbsvc@my-fluxer-project.iam.gserviceaccount.com
FLUXER_PUSH_FCM_TOKEN_URI=https://oauth2.googleapis.com/token
FLUXER_PUSH_FCM_SERVICE_ACCOUNT_JSON_PATH=/etc/fluxer/fcm-sa.json
```

Alternatively, you can provide the private key directly instead of a file path:

```env
FLUXER_PUSH_FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

Restart your API server. Push notifications will now be sent via Firebase Admin using the service account credentials.

### Self-Hosted Desktop Login Fix

Desktop login fix for self-hosted instances (works on official clients!)
