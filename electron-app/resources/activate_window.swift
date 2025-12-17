#!/usr/bin/env swift
// activate_window.swift
// 指定されたアプリの指定されたウィンドウをアクティブにするヘルパー
// 使用法: swift activate_window.swift "アプリ名" "ウィンドウタイトル"
// AXManualAccessibilityを有効にしてElectronアプリのウィンドウも操作可能

import Cocoa
import ApplicationServices

guard CommandLine.arguments.count >= 3 else {
    print("Usage: swift activate_window.swift <app_name> <window_title>")
    exit(1)
}

let targetAppName = CommandLine.arguments[1]
let targetWindowTitle = CommandLine.arguments[2]

// ターゲットアプリを探す
let apps = NSWorkspace.shared.runningApplications.filter { 
    $0.activationPolicy == .regular && $0.localizedName == targetAppName
}

guard let app = apps.first else {
    print("App not found: \(targetAppName)")
    exit(1)
}

let pid = app.processIdentifier
let axApp = AXUIElementCreateApplication(pid)

// AXManualAccessibilityを有効化
AXUIElementSetAttributeValue(axApp, "AXManualAccessibility" as CFString, kCFBooleanTrue)

// アプリをアクティブにする
app.activate(options: [.activateIgnoringOtherApps])

// ウィンドウを取得
var windowsValue: CFTypeRef?
let result = AXUIElementCopyAttributeValue(axApp, kAXWindowsAttribute as CFString, &windowsValue)

if result == .success, let windows = windowsValue as? [AXUIElement] {
    for window in windows {
        var titleValue: CFTypeRef?
        let titleResult = AXUIElementCopyAttributeValue(window, kAXTitleAttribute as CFString, &titleValue)
        
        if titleResult == .success, let title = titleValue as? String {
            // ウィンドウタイトルが一致するか確認（部分一致）
            if title.contains(targetWindowTitle) || targetWindowTitle.contains(title) || title == targetWindowTitle {
                // ウィンドウを前面に持ってくる（AXRaise）
                AXUIElementPerformAction(window, kAXRaiseAction as CFString)
                
                // メインウィンドウとして設定
                AXUIElementSetAttributeValue(axApp, kAXMainWindowAttribute as CFString, window)
                
                print("Activated window: \(title)")
                exit(0)
            }
        }
    }
    print("Window not found: \(targetWindowTitle)")
    exit(1)
} else {
    print("Failed to get windows for \(targetAppName)")
    exit(1)
}
