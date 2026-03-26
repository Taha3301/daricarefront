package com.daricare.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable DOM storage for modern web app performance
            settings.setDomStorageEnabled(true);
            
            // Allow disk caching
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // Optimize for performance
            settings.setAllowFileAccess(true);
            settings.setDatabaseEnabled(true);
            
            // Explicitly enable hardware acceleration for the webview content
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        }
    }
}
