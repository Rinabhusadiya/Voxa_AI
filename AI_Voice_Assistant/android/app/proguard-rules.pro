# Keep JavaScript Interface annotations
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.voxa.ai.bridge.VoxaWebInterface {
    *;
}
