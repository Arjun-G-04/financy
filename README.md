# Financy

A privacy-focused personal finance manager app built on Expo (React Native) and backed by your personal Google Sheets.

## Features

- **Google Sheets Database**: Direct sync with Google Sheets. No intermediate servers store your financial transactions or banking keys.
- **Google Sign-In**: Native Google OAuth2 authentication requesting read-only access to sheets.
- **Interactive Financial Dashboard**: Dynamic overview of income, expenses, and savings with transaction ledgers.

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native) with [Expo Router](https://docs.expo.dev/router/introduction/) (v56 / SDK 56)
- **Language**: TypeScript
- **Auth**: `@react-native-google-signin/google-signin`
- **Secure Storage**: `expo-secure-store`
- **Package Manager**: `pnpm`

---

## Get Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start the App

Start the local Metro bundler:
```bash
pnpm start
```

---

## Google Cloud Console OAuth Setup (For Live Sync)

To connect the application to your actual Google Sheets, you must register client credentials:

1. **Google Cloud Project**: Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. **Enable Sheets API**: Search for "Google Sheets API" in the library and click **Enable**.
3. **Configure OAuth Consent Screen**:
   - Set user type to External (or Internal if under a GSuite domain).
   - Add the scopes: `.../auth/userinfo.profile`, `.../auth/userinfo.email`, and `https://www.googleapis.com/auth/spreadsheets.readonly`.
   - Add your test user emails.
4. **Create OAuth Client Credentials**:
   - **Web Application Client ID**: Required for Android and Web. Use this client ID inside the app configuration.
   - **Android Client ID**: Create an Android credential. Register the Package Name as `com.anonymous.financy`. Generate and register your SHA-1 signing certificate.
5. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
   ```
6. **Build and Prebuild**:
   Since the Google Sign-in library contains native code, you must prebuild the app to generate native files:
   ```bash
   pnpm expo prebuild
   ```
    Then compile your development build for Android:
    ```bash
    eas build --platform android --profile development
    ```

## Building the Production APK Locally

The build is configured to compile only for modern physical devices (`arm64-v8a`) with code minification and resource shrinking enabled to achieve a lightweight package size (reducing it from ~116MB to ~30MB).

To build the APK:

1. **Prebuild the Android platform**:
   ```bash
   pnpm expo prebuild --platform android
   ```
2. **Clean up old build cache** (do NOT use `./gradlew clean` due to CMake codegen dependency constraints in React Native New Architecture):
   ```bash
   rm -rf android/app/build android/build android/app/.cxx
   ```
3. **Compile the Release APK**:
   ```bash
   cd android && ./gradlew assembleRelease 2>&1 | tee ../build-logs.txt
   ```
   *The final APK will be generated at:* `android/app/build/outputs/apk/release/app-release.apk`
