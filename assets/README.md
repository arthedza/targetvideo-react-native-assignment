# Demo assets

Last updated: **2026-10-21** · Last reviewed: **2026-10-21** · Implementation: **1.0.0**

## Artwork

Individual illustrations supplied with the assignment are used with permission.
They are bundled locally; the interface uses React Native components for layout,
text and controls.

The opaque source images were resized and encoded as JPEG at quality 88:

- Avatar: 96 × 96 for a 32-point image.
- Cast portraits: 216 × 216 for 72-point images.
- Episode thumbnails: 336 × 192 for 112 × 63-point frames.
- Poster rails: approximately 386 × 579; the landscape source is center-cropped
  to the visible portrait frame, without stretching.
- Full-size hero artwork retains its original 864-pixel width.
- Unlock thumbnail: 330 × 452; dimmed background: 768 × 1344.

Artwork totals 1,757,033 bytes. Frame cropping is handled by the image component, without stretching.

## Typography

`fonts/PlayfairDisplay-Bold.ttf` is the static 700-weight Playfair Display face,
loaded once by the root layout. It is distributed under the **SIL Open Font
License 1.1**, included in [fonts/OFL.txt](fonts/OFL.txt).

- [Font source](https://github.com/expo/google-fonts/tree/master/font-packages/playfair-display)
- [Upstream font and license](https://github.com/google/fonts/tree/main/ofl/playfairdisplay)

## Video

Three excerpts from **Big Buck Bunny** are bundled as H.264/AAC:

| File         | Original interval | Duration   | Demo episodes |
| ------------ | ----------------- | ---------- | ------------- |
| `demo.mp4`   | 01:40–01:56       | 16 seconds | 1 and 3       |
| `garden.mp4` | 02:30–02:42       | 12 seconds | 2             |
| `flight.mp4` | 04:00–04:14       | 14 seconds | 4             |

Each is shortened and re-encoded from the original. The player labels the sample
footage; it does not depict the fictional series.

(c) copyright 2008, Blender Foundation / www.bigbuckbunny.org

- [Original source archive](https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4.zip)
- [Blender license and attribution information](https://peach.blender.org/about/)
- [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/)

The excerpt is shortened and re-encoded from the original movie. No endorsement
by Blender Foundation is implied.
