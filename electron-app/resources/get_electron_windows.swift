#!/usr/bin/env swift
// get_electron_windows.swift
// すべてのSpaces（仮想デスクトップ）にあるウィンドウを取得するヘルパー
// CGWindowListCopyWindowInfoとAXUIElementを併用して全ウィンドウを取得

import Cocoa
import ApplicationServices

// 実行中のGUIアプリ一覧を取得
let runningApps = NSWorkspace.shared.runningApplications.filter { 
    $0.activationPolicy == .regular
}

// PIDからアプリ名を取得するためのディクショナリを作成
var pidToAppName: [Int32: String] = [:]
for app in runningApps {
    let pid = app.processIdentifier
    pidToAppName[pid] = app.localizedName ?? "Unknown"
}

// 重複を避けるためのセット（アプリ名|||ウィンドウタイトル）
var seenWindows = Set<String>()

// 方法1: CGWindowListCopyWindowInfoを使用（全Spacesのウィンドウを取得試行）
// 注意: macOSのセキュリティ制限により、別Spaceのウィンドウが取得できない場合がある
let windowList = CGWindowListCopyWindowInfo([.optionAll], kCGNullWindowID) as? [[String: Any]] ?? []

for windowInfo in windowList {
    // ウィンドウの所有者PIDを取得
    guard let ownerPID = windowInfo[kCGWindowOwnerPID as String] as? Int32 else {
        continue
    }
    
    // GUIアプリのウィンドウのみ処理
    guard let appName = pidToAppName[ownerPID] else {
        continue
    }
    
    // ウィンドウ名を取得
    guard let windowName = windowInfo[kCGWindowName as String] as? String, !windowName.isEmpty else {
        continue
    }
    
    // 重複チェック
    let key = "\(appName)|||\(windowName)"
    if seenWindows.contains(key) {
        continue
    }
    seenWindows.insert(key)
    
    // 出力
    print("\(appName)|||\(windowName)")
}

// 方法2: AXUIElementを使用（全アプリのウィンドウを取得）
// これは現在のSpaceにあるウィンドウに加え、AXManualAccessibilityを有効にすることで
// Electronアプリのウィンドウも取得できる
for app in runningApps {
    let appName = app.localizedName ?? "Unknown"
    let pid = app.processIdentifier
    let axApp = AXUIElementCreateApplication(pid)
    
    // AXManualAccessibilityを有効化（Electronアプリのアクセシビリティツリーを公開）
    AXUIElementSetAttributeValue(axApp, "AXManualAccessibility" as CFString, kCFBooleanTrue)
    
    // ウィンドウを取得
    var windowsValue: CFTypeRef?
    let result = AXUIElementCopyAttributeValue(axApp, kAXWindowsAttribute as CFString, &windowsValue)
    
    if result == .success, let windows = windowsValue as? [AXUIElement] {
        for window in windows {
            var titleValue: CFTypeRef?
            let titleResult = AXUIElementCopyAttributeValue(window, kAXTitleAttribute as CFString, &titleValue)
            
            if titleResult == .success, let title = titleValue as? String, !title.isEmpty {
                let key = "\(appName)|||\(title)"
                if !seenWindows.contains(key) {
                    seenWindows.insert(key)
                    print("\(appName)|||\(title)")
                }
            }
        }
    }
}
