
# Libraries

* react-native-paper
* react-navigation
* react-native-nodemediaclient
* react-native-create-thumbnail
* react-native-vision-camera
* react-native-bootsplash

Note: some require --legacy-peer-deps flag passed into "npm install"


# To run on iOS

```
npx react-native run-ios
npx react-native run-ios --simulator="iPhone 13 Pro"
```

List devices with:
```
xcrun simctl list devices
```

# Deploy to Test Flight
* Open in XCode
* Product -> Archive
* (After its been built)
* Go to apple developer portal at (appstoreconnect.apple.com)
* Select the App
* Go to "Testflight"


# Splashscreen

I followed https://github.com/zoontek/react-native-bootsplash to implement the splash screen

# Disable Dark Mode

Added the following to Info.plist
'''
	<key>UIUserInterfaceStyle</key>
	<string>Light</string>
'''

# Generating app icons

https://appicon.co/ -> upload a 1024x1024 png, and this tool will generate all the necessary sizes.  Then just need to download, extract, and add into the necessary ios/android folders.

# FFMPEG library

Note, had to install a separate package "min-gpl" in order to do the clip/concat functionality with a -preset flag.  So the installation instructions for the ffmpeg react native library for how to add this.

# Helpful Links
* https://medium.com/syntx-io/video-live-streaming-with-react-native-98a0f6354077


# Lesson Learned

## useCallback
When the callback is "rendered" and memoized, the values of the variables in the function are locked in.  So if you have a boolean, it will lock whatever value it is at the time of render.  This is why you need to pass in dependencies, because it tells it that if that value changes, a new version of the function needs ot be rendered with the different value.