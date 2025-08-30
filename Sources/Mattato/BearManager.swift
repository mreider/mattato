import Foundation
import AppKit

class BearManager: ObservableObject {
    static let shared = BearManager()
    
    private init() {}
    
    // MARK: - Bear Icon Loading (for UI purposes)
    
    func loadBearIcon() -> NSImage? {
        guard let resourcePath = Bundle.main.path(forResource: "bear-icon", ofType: "png"),
              let bearImage = NSImage(contentsOfFile: resourcePath) else {
            return nil
        }
        return bearImage
    }
}
