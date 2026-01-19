const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Config plugin to add Android TV (Leanback) support
 */
const withAndroidTV = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // Add uses-feature for leanback (not required, so app works on both)
    if (!manifest["uses-feature"]) {
      manifest["uses-feature"] = [];
    }

    // Add leanback feature
    const hasLeanback = manifest["uses-feature"].some(
      (f) => f.$?.["android:name"] === "android.software.leanback",
    );
    if (!hasLeanback) {
      manifest["uses-feature"].push({
        $: {
          "android:name": "android.software.leanback",
          "android:required": "false",
        },
      });
    }

    // Add touchscreen not required
    const hasTouchscreen = manifest["uses-feature"].some(
      (f) => f.$?.["android:name"] === "android.hardware.touchscreen",
    );
    if (!hasTouchscreen) {
      manifest["uses-feature"].push({
        $: {
          "android:name": "android.hardware.touchscreen",
          "android:required": "false",
        },
      });
    }

    // Add banner to application for TV
    const application = manifest.application?.[0];
    if (application) {
      application.$["android:banner"] = "@mipmap/ic_launcher";

      // Find main activity and add leanback launcher
      const mainActivity = application.activity?.find(
        (activity) => activity.$?.["android:name"] === ".MainActivity",
      );

      if (mainActivity) {
        // Change orientation to unspecified
        mainActivity.$["android:screenOrientation"] = "unspecified";

        // Add LEANBACK_LAUNCHER intent filter
        if (!mainActivity["intent-filter"]) {
          mainActivity["intent-filter"] = [];
        }

        const hasLeanbackLauncher = mainActivity["intent-filter"].some(
          (filter) =>
            filter.category?.some(
              (cat) =>
                cat.$?.["android:name"] ===
                "android.intent.category.LEANBACK_LAUNCHER",
            ),
        );

        if (!hasLeanbackLauncher) {
          mainActivity["intent-filter"].push({
            action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
            category: [
              {
                $: {
                  "android:name": "android.intent.category.LEANBACK_LAUNCHER",
                },
              },
            ],
          });
        }
      }
    }

    return config;
  });
};

module.exports = withAndroidTV;
