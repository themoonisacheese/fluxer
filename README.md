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

**How to set up:**
1. Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Register an **Android app** with the package name of your choice and app ID **`website.poggers.chat`** — the mobile fork is already configured to use this app ID for dynamic initialization.
3. Download `google-services.json` from your project settings, or grab the values directly:
   - **App ID** — `firebase_app_id` (e.g., `1:123456789:android:abc123`)
   - **API Key** — `firebase_api_key` (the **Web API Key** from project settings)
   - **Project ID** — `firebase_project_id`
   - **Sender ID** — `firebase_sender_id` (this is the **Project Number**)
   - **Project Number** — `firebase_project_number`
4. Set these as environment variables on your API server:

   ```env
   ANDROID_FCM_APP_ID=1:123456789:android:abc123
   ANDROID_FCM_API_KEY=AIzaSy...
   ANDROID_FCM_PROJECT_ID=my-fluxer-project
   ANDROID_FCM_SENDER_ID=123456789
   ANDROID_FCM_PROJECT_NUMBER=123456789
   ```

5. Restart your API server. The credentials are exposed at `/.well-known/fluxer` (via the app-proxy) and `/api/.well-known/fluxer`.

The Android client fetches this config on startup, initializes Firebase dynamically, and registers for push notifications. No client-side build changes or `google-services.json` in the repo needed.

### Self-Hosted Desktop Login Fix

Desktop login fix for self-hosted instances (works on official clients!)
