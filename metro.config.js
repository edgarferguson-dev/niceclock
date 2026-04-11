// Required for Expo Router web support.
// Without this, Metro cannot resolve expo-router/entry as the web bundle
// entry point, resulting in a blank page.
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

module.exports = config
