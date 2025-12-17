#!/usr/bin/env swift
// activate_window.swift
// 指定されたアプリの指定されたウィンドウをアクティブにするヘルパー
// 使用法: swift activate_window.swift "アプリ名" "ウィンドウタイトル"
// AXManualAccessibilityを有効にしてElectronアプリのウィンドウも操作可能
// 別のSpaceにあるウィンドウも正しくアクティベート

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

// アプリをアクティブにする（別Spaceにある場合はそのSpaceに移動する）
app.activate()

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
                
                // フォーカスされたウィンドウとして設定
                AXUIElementSetAttributeValue(axApp, kAXFocusedWindowAttribute as CFString, window)
                
                // 少し待ってから再度アクティベート（Spaceの切り替えを確実にする）
                usleep(100000) // 100ms待機
                app.activate()
                
                print("Activated window: \(title)")
                exit(0)
            }
        }
    }
    
    // ウィンドウが見つからなかった場合、CGWindowListから探してみる
    let windowList = CGWindowListCopyWindowInfo([.optionAll], kCGNullWindowID) as? [[String: Any]] ?? []
    
    for windowInfo in windowList {
        guard let ownerPID = windowInfo[kCGWindowOwnerPID as String] as? Int32, ownerPID == pid else {
            continue
        }
        
        guard let windowName = windowInfo[kCGWindowName as String] as? String else {
            continue
        }
        
        if windowName.contains(targetWindowTitle) || targetWindowTitle.contains(windowName) || windowName == targetWindowTitle {
            // ウィンドウIDを取得
            if let _ = windowInfo[kCGWindowNumber as String] as? CGWindowID {
                // AXUIElementでこのウィンドウを探して再度アクティベートを試みる
                app.activate()
                usleep(200000) // 200ms待機
                
                // 再度ウィンドウを取得してアクティベート
                var windowsValue2: CFTypeRef?
                let result2 = AXUIElementCopyAttributeValue(axApp, kAXWindowsAttribute as CFString, &windowsValue2)
                
                if result2 == .success, let windows2 = windowsValue2 as? [AXUIElement] {
                    for win in windows2 {
                        var titleVal: CFTypeRef?
                        let titleRes = AXUIElementCopyAttributeValue(win, kAXTitleAttribute as CFString, &titleVal)
                        if titleRes == .success, let t = titleVal as? String, t == windowName {
                            AXUIElementPerformAction(win, kAXRaiseAction as CFString)
                            AXUIElementSetAttributeValue(axApp, kAXMainWindowAttribute as CFString, win)
                            print("Activated window (via CGWindowList): \(windowName)")
                            exit(0)
                        }
                    }
                }
                
                print("Found window in CGWindowList but could not activate: \(windowName)")
            }
        }
    }
    
    print("Window not found: \(targetWindowTitle)")
    exit(1)
} else {
    print("Failed to get windows for \(targetAppName)")
    exit(1)
}
