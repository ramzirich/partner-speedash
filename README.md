This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Prerequisites

This project pins specific native toolchain versions. Version mismatches here are the most common cause of a failed first build, so check these before anything else:

| Tool | Version | Notes |
| --- | --- | --- |
| Node | >= 22.11.0 | Enforced by `engines` in `package.json`. |
| JDK | 17 | Required by React Native 0.86. Newer JDKs are not a safe substitute. |
| Android SDK Platform | 36 | `compileSdkVersion` / `targetSdkVersion`; `minSdkVersion` is 24. |
| Android Build Tools | 36.0.0 | Pinned in `android/build.gradle`. |
| Android NDK | 27.1.12297006 | Pinned exactly — the build fails if only another version is installed. |
| Gradle | 9.3.1 | No action needed; the wrapper downloads it on first build. |

Install the SDK pieces via Android Studio (**Settings → Languages & Frameworks → Android SDK**), enabling **Show Package Details** to select the exact build-tools and NDK versions above.

`ANDROID_HOME` must point at your SDK, and its `platform-tools` should be on your `PATH` so `adb` resolves:

```sh
# macOS / Linux (~/.zshrc or ~/.bashrc)
export ANDROID_HOME="$HOME/Library/Android/sdk"   # Linux: $HOME/Android/Sdk
export PATH="$PATH:$ANDROID_HOME/platform-tools"
```

On Windows, set `ANDROID_HOME` to `%LOCALAPPDATA%\Android\Sdk` via **System → Environment Variables**.

iOS requires macOS with Xcode. On Windows or Linux, Android is the only target.

## Step 0: Clone and install

```sh
git clone <repo-url>
cd partner-speedash
npm install
```

Then confirm your machine is set up correctly:

```sh
npx react-native doctor
```

Start an Android emulator (or connect a device with USB debugging on) before building, and verify it is visible:

```sh
adb devices    # should list one device, not an empty list
```

### Windows: `gradlew.bat is not recognized`

If `npm run android` fails with:

```
'gradlew.bat' is not recognized as an internal or external command
```

check whether the `NoDefaultCurrentDirectoryInExePath` environment variable is set:

```powershell
echo $env:NoDefaultCurrentDirectoryInExePath   # "1" means it is set
```

This is a Windows hardening flag that stops the shell from resolving executables in the current directory. The React Native CLI invokes the Gradle wrapper as a bare `gradlew.bat`, so it cannot be found while this is set — in any shell. Either clear it for the session:

```powershell
$env:NoDefaultCurrentDirectoryInExePath = ''
npm run android
```

...or bypass the CLI and invoke the wrapper by explicit path:

```powershell
cd android
.\gradlew.bat app:installDebug
```

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
