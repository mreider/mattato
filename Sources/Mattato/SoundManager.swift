import Foundation
import AppKit

class SoundManager: ObservableObject {
    static let shared = SoundManager()
    
    // Common macOS system alert sounds
    static let availableSounds = [
        "Basso",
        "Blow",
        "Bottle",
        "Frog",
        "Funk",
        "Glass",
        "Hero",
        "Morse",
        "Ping",
        "Pop",
        "Purr",
        "Sosumi",
        "Submarine",
        "Tink"
    ]
    
    private init() {}
    
    func playSound(named soundName: String) {
        guard let sound = NSSound(named: soundName) else {
            print("Could not find sound: \(soundName)")
            return
        }
        sound.play()
    }
    
    func testSound(named soundName: String) {
        playSound(named: soundName)
    }
    
    func playCompletionSound(soundName: String) {
        playSound(named: soundName)
    }
}
