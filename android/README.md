# Finance Tracker - Android Studio Project Guide

This Android project is pre-configured and ready to open directly in **Android Studio**.

## Requirements
- **Android Studio**: Iguana (2023.2.1), Jellyfish (2023.3.1), Koala (2024.1.1), Ladybug (2024.2.1), Meerkat, or newer.
- **JDK**: Java 17 or Java 21 (bundled with modern Android Studio).
- **Android SDK**: API Level 35 (Android 15) with minimum support for API Level 24 (Android 7.0+).

---

## How to Open in Android Studio

1. Launch **Android Studio**.
2. Click **Open** (or **File > Open...**).
3. Select the `android` folder in this repository.
4. Wait for Android Studio to finish Gradle Sync and indexing (approx 1-2 minutes on first run).
5. Once synced, select your target device or emulator in the toolbar.
6. Click the green **Run (▶)** button or press `Shift + F10` to build and launch the app!

---

## Building an APK / Android App Bundle (AAB)

### Debug APK (For Testing)
- In Android Studio menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
- The output APK will be located at:
  `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK / Play Store Bundle
- In Android Studio menu: **Build > Generate Signed Bundle / APK...**
- Follow the wizard to sign with your keystore.

---

## Project Structure Overview
- `app/src/main/assets/public/` - Compiled offline web application assets (HTML, CSS, JS).
- `app/src/main/res/` - App icons, launcher mipmaps, splash screens, theme styles, and strings.
- `app/src/main/AndroidManifest.xml` - App permissions, orientation, and Activity configuration.
- `capacitor-preferences/` & `capacitor-filesystem/` - Native offline storage and file export bridge plugins.
