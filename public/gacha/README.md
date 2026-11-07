# Gacha animation assets

Upload the approved gacha animation to this directory as **kokoro_gacha.gif**.

- Path: public/gacha/kokoro_gacha.gif
- Source: user's approved purple medical capsule gacha GIF (longer mixing animation).
- Current source: 16 frames, 309x307px, 240ms per frame (total 3840ms).
- UI: src/RewardPanel.tsx plays the GIF once on completed draw, then reveals the actual awarded item.
- If the GIF fails to load, the real result popup displays immediately without losing the prize.
- Keep file names and the animation's total duration in sync.
