
# Libraries

* react-native-paper
* react-navigation
* react-native-nodemediaclient


# To run on iOS

npx react-native run-ios




# Helpful Links
* https://medium.com/syntx-io/video-live-streaming-with-react-native-98a0f6354077


# Lesson Learned

## useCallback
When the callback is "rendered" and memoized, the values of the variables in the function are locked in.  So if you have a boolean, it will lock whatever value it is at the time of render.  This is why you need to pass in dependencies, because it tells it that if that value changes, a new version of the function needs ot be rendered with the different value.