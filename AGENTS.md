# Expo v56
Docs: https://docs.expo.dev/versions/v56.0.0/

## Project Rules
- Skills: Start every convo by reading `.agents/skills/caveman`. Prefix response with `skills: <name1>, <name2>` at the very top.
- PM: pnpm (install, run android, run web)
- Google OAuth: @react-native-google-signin/google-signin. Pkg: com.anonymous.financy. Scope: https://www.googleapis.com/auth/spreadsheets. iOS disabled. Build/Version:
  - Version bumping:
    1. Increment "version" (e.g., "1.0.1") and "versionCode" (under "android") in app.json.
  - Automated Release (via GitHub Actions):
    1. Push changes: git commit -am "chore: bump version to vX.Y.Z" && git push origin main
    2. Tag release: git tag vX.Y.Z && git push origin vX.Y.Z (triggers APK build & GitHub Release)
  - Manual Local Build:
    1. Sync config to native files: pnpm expo prebuild --platform android
    2. Clean manual build folders: rm -rf android/app/build android/build android/app/.cxx (do NOT use ./gradlew clean)
    3. Build local APK: cd android && ./gradlew assembleRelease (Outputs to android/app/build/outputs/apk/release/app-release.apk)
- Routing: Expo Router (src/app). AuthProvider wraps root layout. Protection in src/context/AuthContext.tsx (redirects: unauth -> /, auth -> /(app)).
- Design: Follow design-taste-frontend. Colors in src/constants/theme.ts (deep zinc/black, emerald/rose accents for dark mode).
- Android: Focus exclusively on Android. Web and iOS are not supported or cared about. CLI tools (no emulator). Run via adb devices & pnpm expo run:android. Setup: brew install --cask android-commandlinetools android-platform-tools. ANDROID_HOME=/opt/homebrew/share/android-commandlinetools. Testing is exclusively on Android devices (no web SQLite fallback needed).
- Code Review: When asking for code review, use `.agents/skills/thermo-nuclear-code-quality-review`.
- Keyboard Avoidance: Use `behavior="padding"` for `KeyboardAvoidingView` inside `Modal` on Android. Do not use `height` (causes layout loop oscillation) or `undefined` (causes keyboard overlap).