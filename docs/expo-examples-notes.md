# `expo/examples` — the three patterns worth copying (queue item 8)

Written 2026-09-16 by the hourly build job. **No code was copied** — the item asks
for the patterns written down, and that is all this file is.

## Provenance and licence — checked through the GitHub API, not a blurb

| fact | value | how |
|---|---|---|
| licence | **MIT** (`spdx_id: MIT`, "MIT License") | `GET /repos/expo/examples` |
| stars / last push / archived | 3,728★ · `2026-09-03T10:23:08Z` · `false` | same call |
| default branch | `master` | same call |
| size | 755 blobs, `truncated: false` | `GET /git/trees/master?recursive=1` |

MIT is a copy-freely licence, but the more useful fact is the **stack match**: every
example I read pins

```
"expo": "^57.0.1", "react": "19.2.3", "react-native": "0.86.0", "react-native-web": "^0.21.0"
```

(`with-camera/package.json`, `with-s3/package.json`, `with-formdata-image-upload/package.json`)
— the same generation `apps/mobile` runs (Expo SDK 57, RN 0.86.3). These are not stale
snippets to translate; they are the same API surface we call.

## What the repo does *not* contain (measured, so nobody re-hunts for it)

GitHub code search over the repo, authenticated:

| query | hits |
|---|---|
| `expo-image-picker repo:expo/examples` | **12** files |
| `expo-sharing repo:expo/examples` | **0** |
| `expo-document-picker repo:expo/examples` | **0** |

So of the three patterns item 8 names — permission denial, capture layout, **share
sheet** — the third has no example here at all (`with-storybook/stories/assets/share.png`
is a decorative PNG, not a share sheet). The share-sheet half must come from
`expo-sharing`'s own docs or our own screen; it cannot be "copied from expo/examples"
and this note will not pretend otherwise.

---

## Pattern 1 — permission, then render; never render blind

`with-camera/App.tsx` (lines 15, 22–35):

```tsx
const [permission, requestPermission] = useCameraPermissions();
if (!permission) return null;              // hydrating: render nothing, not the camera
if (!permission.granted) return (          // denied: the whole surface becomes the ask
  <View style={styles.container}>
    <Text>We need your permission to use the camera</Text>
    <Button onPress={requestPermission} title="Grant permission" />
  </View>
);
```

Three things worth keeping:

1. **`permission === null` is a state.** The hook resolves asynchronously; the example
   renders `null` rather than a camera it knows nothing about. Our lazy
   `require("expo-image-picker")` path has the same "no answer yet" moment.
2. **Denial replaces the surface.** The user is not left looking at an inert shutter
   they cannot press — the only control on screen is the one that fixes it.
3. **A sentence a human can act on**, then one button. Ours already says
   `"Photo access is off. Turn it on in Settings to choose a picture."`
   (`apps/mobile/lib/tools.ts:173-175`) and `"Photo permission is needed to make your
   passport photo."` (`apps/mobile/app/passport.tsx:57-60`).

**Gap the example shares with us, and the part actually worth adding.** Neither the
example nor our code reads `canAskAgain`. On iOS a second denial comes back
`granted: false, canAskAgain: false` and the OS will not re-prompt, so the button
silently does nothing and "turn it on in Settings" is advice with no route —
`Linking.openSettings()` is the missing half. The example's own `requestPermission`
button has this defect; copy the shape, not the omission.

## Pattern 2 — the capture screen is two states in one view, not a modal

`with-camera/App.tsx` (lines 74–120 layout, 129–163 styles, 124 the switch):

```
View(absoluteFill) → uri ? renderPicture(uri) : renderCamera()   // line 124
cameraContainer / camera : StyleSheet.absoluteFillObject
shutterContainer         : position absolute, bottom 44, width 100%,
                           flexDirection row, justifyContent space-between,
                           paddingHorizontal 30
shutterBtn               : 85×85, borderWidth 5 white, borderRadius 45
shutterBtnInner          : 70×70 disc, colour = mode ("white" photo / "red" video)
```

- The preview is **the same screen** with the camera swapped out, and
  `Take another picture` (line 69) puts the camera back. No navigation, no modal.
- The control bar is one absolutely-positioned row of three: mode toggle, shutter,
  flip — so the primary action never moves when the mode or the camera flips.
- Press feedback is the children-as-function form: `({ pressed }) => opacity: pressed ? 0.5 : 1`
  (lines 94–101). This matters to us beyond looks: **that Pressable has an `onPress`**,
  which is exactly the prop whose absence made tap-sprint's field deaf to every tap
  shorter than 50 ms (queue item 21 — react-native-web only activates a press on
  release when `onPress` is present). Adopting this pattern cannot reintroduce that bug;
  inventing a "custom" press surface can.

**Our angle:** `apps/mobile/app/passport.tsx:69-81` posts the job the moment the picker
returns. A passport photo is ₹49; a review state ("this is the photo — retake / use it")
costs one state variable and stops a bad upload from spending a job.

## Pattern 3 — every picker reduces to `{ uri, name, type }`, and mimeType is the contract

`with-formdata-image-upload/App.js`:

```js
formData.append("photo", { uri, name: `photo.${fileType}`, type: `image/${fileType}` });
```

`with-s3/app/index.tsx` (the SDK 57 / expo-router version of the same idea):

```tsx
if (!image?.mimeType) { Alert.alert("Image mime type could not be determined"); return; }
const { url } = await (await fetch("/api/signed-url", { method: "POST",
  body: JSON.stringify({ contentType: image.mimeType }) })).json();
const imageBlob = await (await fetch(image.uri)).blob();   // one blob, both platforms
await fetch(url, { method: "PUT", body: imageBlob });
```

Two defects in the older file, both worth knowing **so they are not copied**:

- `if (!pickerResult.cancelled && …)` uses the SDK ≤47 spelling. SDK 57 answers
  `canceled` (one `l`) and `assets`; `with-s3` gets it right. A stale guard here reads
  `undefined`, i.e. always-true — the cancel path survives only because `assets` is empty.
- `type: image/${fileType}` builds **`image/jpg`** from a `.jpg` name, which is not a
  MIME type, and cannot describe HEIC at all. Our `apps/mobile/lib/tools.ts:185-190`
  (images) and `:200-205` (PDFs) prefer the asset's own `mimeType` and fall back to
  `image/jpeg` / `application/pdf`. That is the correct shape; the example is the
  counter-example.

What is worth adopting from `with-s3` if an upload ever moves off multipart: refuse to
start without a mimeType, take the destination (key + extension) from the server's
signed response rather than the file name, and convert once — `fetch(uri).blob()` behaves
the same on web and native, which removes our `Platform.OS === "web" ? asset.file : {uri,…}`
special case at `passport.tsx:75-77`.

---

## The three deltas this produces (not applied — item 1's frame owns these screens)

1. `apps/mobile/lib/tools.ts` `pickOnDevice`: branch on `canAskAgain === false` and say
   *Settings*, offering the route to them; today the message names Settings with no way there.
2. `apps/mobile/app/passport.tsx`: a review state before the job is sent, per pattern 2.
3. The tool frame's result card should have room for **one** secondary affordance
   (retake / pick another) so the two patterns above have somewhere to live.

## Evidence for this hour

- `GET https://api.github.com/repos/expo/examples` → `spdx_id MIT`, `3728`★,
  `pushed_at 2026-09-03T10:23:08Z`, `archived false`.
- `GET /repos/expo/examples/git/trees/master?recursive=1` → `755` blobs, `truncated False`.
- `GET /search/code?q=…&repo:expo/examples` → image-picker **12**, sharing **0**,
  document-picker **0**.
- Files read in full: `with-camera/App.tsx` (163 lines), `with-s3/app/index.tsx`,
  `with-formdata-image-upload/App.js`, plus the three `package.json`s above.
- Our side re-read, not remembered: `apps/mobile/lib/tools.ts:102-206`,
  `apps/mobile/app/passport.tsx:46-90`.
