// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Mattato",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(
            name: "Mattato",
            targets: ["Mattato"]
        ),
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "Mattato",
            dependencies: [],
            path: "MacOS/Sources/Mattato",
            exclude: ["Resources/Info.plist"],
            resources: [
                .process("Resources", localization: .none)
            ]
        ),
    ]
)
