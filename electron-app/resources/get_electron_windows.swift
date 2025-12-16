#!/usr/bin/env swift
// get_electron_windows.swift
// Electronベースのアプリ（VS Code、Antigravityなど）のウィンドウを取得するヘルパー
// AXManualAccessibilityを有効にしてからウィンドウ情報を取得します

import Cocoa
import ApplicationServices

// Electronベースのアプリを識別（プロセス名が"Electron"だが表示名が異なる）
let apps = NSWorkspace.shared.runningApplications.filter { 
    $0.activationPolicy == .regular  // GUI アプリのみ
}

var results: [[String: Any]] = []

for app in apps {
    let name = app.localizedName ?? "Unknown"
    let pid = app.processIdentifier
    let axApp = AXUIElementCreateApplication(pid)
    
    // まずAXManualAccessibilityを有効化してElectronアプリのアクセシビリティツリーを公開
    AXUIElementSetAttributeValue(axApp, "AXManualAccessibility" as CFString, kCFBooleanTrue)
    
    // ウィンドウを取得
    var windowsValue: CFTypeRef?
    let result = AXUIElementCopyAttributeValue(axApp, kAXWindowsAttribute as CFString, &windowsValue)
    
    if result == .success, let windows = windowsValue as? [AXUIElement] {
        for window in windows {
            var titleValue: CFTypeRef?
            let titleResult = AXUIElementCopyAttributeValue(window, kAXTitleAttribute as CFString, &titleValue)
            
            if titleResult == .success, let title = titleValue as? String, !title.isEmpty {
                // JSON形式で出力
                print("\(name)|||" + title)
            }
        }
    }
}
