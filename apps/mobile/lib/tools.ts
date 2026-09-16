/**
 * The plumbing the Toolbox screens share — and nothing else.
 *
 * Two jobs only: turn "the user picked a file" into the same shape on a browser
 * and on a phone, and post one multipart job to `/api/job`.
 *
 * Screens keep their own layout, their own colour and their own copy. File
 * picking and the job call live here because two implementations of "pick a
 * file" is exactly how the web build and the phone build drift apart.
 *
 * On the web the picker is a real `<input type="file">` rather than a wrapper
 * around expo-image-picker: expo-image-picker has to be installed to be
 * require-able, and shipping a tools screen that cannot be used in a browser
 * would make it untestable without a device.
 */
import { Platform } from "react-native";

export type PickedFile = {
  /** Blob URL on the web, file:// on a phone. */
  uri: string;
  name: string;
  type: string;
  size?: number;
  /** The real File the browser handed us — FormData wants it as-is. */
  blob?: Blob;
};

export type JobResult = {
  previewUrl: string | null;
  outputUrl: string | null;
  extraUrls: string[];
  meta: Record<string, unknown> | null;
  /** Which job this was — the handle the paywall needs. */
  jobId: number | null;
  /** True when the clean file is behind the paywall (paid products). */
  locked: boolean;
  free: boolean;
  pricePaise: number;
  product: string | null;
};

/** Where the paywall page for a job lives, on the web host. */
export function unlockUrl(jobId: number): string {
  const base = Platform.OS === "web" ? "" : WEB_BASE();
  return `${base}/unlock/${jobId}`;
}

/**
 * Send the customer to the paywall for this job.
 *
 * The checkout runs in the browser (OTP + Razorpay), never in the app: no card
 * details and no payment SDK inside the binary. On a phone it opens the in-app
 * browser so the customer comes straight back to the app afterwards.
 */
export async function openPaywall(jobId: number): Promise<void> {
  const url = unlockUrl(jobId);
  if (Platform.OS === "web") {
    (globalThis as any).open?.(url, "_blank");
    return;
  }
  const WebBrowser = require("expo-web-browser");
  await WebBrowser.openBrowserAsync(url);
}

function WEB_BASE(): string {
  try {
    const { WEB_BASE_URL } = require("@/lib/config") as { WEB_BASE_URL: string };
    return WEB_BASE_URL.replace(/\/+$/, "");
  } catch {
    throw new Error("This build has no server address configured.");
  }
}

type FileKind = "image" | "pdf";

const ACCEPT: Record<FileKind, string> = { image: "image/*", pdf: "application/pdf" };

/**
 * The most files one job may carry. The route caps `photos-to-pdf` at 20 and
 * `collage` at 4 differently, so a screen that combines photos passes its own
 * smaller limit to `pickFiles` — this is only the outer bound the picker can
 * offer before the upload is wasted.
 */
export const MULTI_MAX = 20;

/** Picks one file, or resolves null when the user backs out. Throws with a
 *  sentence a user can act on when the platform has no picker. */
export async function pickFile(kind: FileKind): Promise<PickedFile | null> {
  const files = await pickFiles(kind, { multiple: false });
  return files[0] ?? null;
}

/**
 * Picks one or more files, in the order the user chose them — the order is the
 * job for the products that combine photos (a collage's cells, the pages of a
 * PDF), so it is never sorted or guessed at here.
 *
 * `multiple` is true only for those products. A single-file product that gets a
 * second file answers 400 from the route, and that is the right behaviour to
 * keep — but the screens should not offer what the route will refuse.
 */
export async function pickFiles(
  kind: FileKind,
  { multiple = false }: { multiple?: boolean } = {},
): Promise<PickedFile[]> {
  return Platform.OS === "web" ? pickOnWeb(kind, multiple) : pickOnDevice(kind, multiple);
}

function pickOnWeb(kind: FileKind, multiple: boolean): Promise<PickedFile[]> {
  const doc: any = (globalThis as any).document;
  if (!doc?.createElement) throw new Error("This platform has no file picker.");

  return new Promise((resolve, reject) => {
    let input: any;
    try {
      input = doc.createElement("input");
    } catch (e) {
      reject(e);
      return;
    }
    input.type = "file";
    input.accept = ACCEPT[kind];
    input.multiple = multiple;
    input.style.display = "none";

    let settled = false;
    const finish = (v: PickedFile[]) => {
      if (settled) return;
      settled = true;
      (globalThis as any).removeEventListener?.("focus", onFocus);
      input.remove?.();
      resolve(v);
    };

    // Browsers fire `cancel` when the dialog is dismissed; the window regaining
    // focus is the fallback for the ones that never do, and a dialog that closed
    // with no file chosen means no file. Without this the call would hang for
    // the rest of the session after one dismissed dialog.
    const onFocus = () => {
      (globalThis as any).setTimeout?.(() => {
        if (!input.files?.length) finish([]);
      }, 400);
    };

    input.onchange = () => {
      const list: any[] = Array.from(input.files ?? []);
      if (!list.length) return finish([]);
      const url = (globalThis as any).URL;
      finish(
        list.map((f) => ({
          uri: url?.createObjectURL ? url.createObjectURL(f) : "",
          name: f.name || (kind === "pdf" ? "document.pdf" : "photo.jpg"),
          type: f.type || ACCEPT[kind],
          size: f.size,
          blob: f,
        })),
      );
    };
    input.oncancel = () => finish([]);

    (globalThis as any).addEventListener?.("focus", onFocus);
    doc.body.appendChild(input);
    input.click();
  });
}

async function pickOnDevice(kind: FileKind, multiple: boolean): Promise<PickedFile[]> {
  if (kind === "image") {
    // Lazy: these native modules must not be required on a platform that has no
    // implementation, and both are install-time dependencies (see report).
    const ImagePicker = require("expo-image-picker");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
    if (perm?.granted === false) {
      throw new Error("Photo access is off. Turn it on in Settings to choose a picture.");
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? "images",
      quality: 1,
      allowsMultipleSelection: multiple,
      // The cap is the engine's and the route's (20 photos per job); asking the
      // gallery for more than the job can take would fail after the upload.
      selectionLimit: multiple ? MULTI_MAX : 1,
    });
    if (res.canceled || !res.assets?.length) return [];
    return res.assets.map((a: any) => ({
      uri: a.uri,
      name: a.fileName || "photo.jpg",
      type: a.mimeType || "image/jpeg",
      size: a.fileSize,
    }));
  }

  const DocumentPicker = require("expo-document-picker");
  const res = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
    multiple,
  });
  if (res.canceled || !res.assets?.length) return [];
  return res.assets.map((a: any) => ({
    uri: a.uri,
    name: a.name || "document.pdf",
    type: a.mimeType || "application/pdf",
    size: a.size,
  }));
}

/**
 * Where the job goes. On the web the page and the route share an origin, so a
 * relative path is correct and works on localhost and in production alike; on a
 * phone there is no origin, so the configured web host is the only answer.
 */
export function jobEndpoint(): string {
  if (Platform.OS === "web") return "/api/job";
  try {
    const { WEB_BASE_URL } = require("@/lib/config") as { WEB_BASE_URL: string };
    return `${WEB_BASE_URL.replace(/\/+$/, "")}/api/job`;
  } catch {
    throw new Error("This build has no server address configured, so the job cannot be sent.");
  }
}

function collectUrls(j: any): string[] {
  const out: string[] = [];
  const list = Array.isArray(j?.files) ? j.files : Array.isArray(j?.outputs) ? j.outputs : [];
  for (const item of list) {
    const url = typeof item === "string" ? item : (item?.url ?? item?.output_url);
    if (typeof url === "string" && url) out.push(url);
  }
  return out;
}

export async function runJob(opts: {
  product: string;
  fields?: Record<string, string | number | undefined>;
  files?: { field: string; file: PickedFile }[];
}): Promise<JobResult> {
  const form = new FormData();
  form.append("product", opts.product);
  for (const [k, v] of Object.entries(opts.fields ?? {})) {
    if (v !== undefined && v !== "") form.append(k, String(v));
  }
  for (const { field, file } of opts.files ?? []) {
    // The browser hands FormData a File; native has no FormData part type and
    // needs the { uri, name, type } triple instead.
    form.append(
      field,
      Platform.OS === "web" && file.blob
        ? (file.blob as any)
        : ({ uri: file.uri, name: file.name, type: file.type } as any),
    );
  }

  const res = await fetch(jobEndpoint(), { method: "POST", body: form });
  const type = res.headers.get("content-type") || "";

  if (!res.ok) {
    let msg = "";
    if (type.includes("json")) {
      msg = (await res.json().catch(() => null))?.error ?? "";
    }
    // A 404 here means the route is not deployed yet. Saying so is more useful
    // than "something went wrong", and it is the truth.
    if (!msg && res.status === 404) msg = "The server has no job endpoint yet.";
    // The engine ships one product at a time, so a product it does not implement
    // yet answers 404 "Unknown product". That is a fact about the server, not
    // about what the user did, so it gets said in words.
    if (res.status === 404 && /unknown product/i.test(msg)) {
      msg = `This tool is built, but "${opts.product}" is not switched on at the server yet. Nothing was charged.`;
    }
    throw new Error(msg || `The job failed (${res.status}). Nothing was charged.`);
  }

  if (type.includes("json")) {
    const j: any = await res.json();
    return {
      previewUrl: j.preview_url ?? j.previewUrl ?? j.url ?? null,
      outputUrl: j.output_url ?? j.outputUrl ?? j.download_url ?? null,
      extraUrls: collectUrls(j),
      meta: j.meta ?? null,
      jobId: typeof j.job_id === "number" ? j.job_id : null,
      // A paid product answers `locked: true` with only the watermarked preview.
      // Defaulting to false keeps a future free endpoint working unchanged.
      locked: j.locked === true,
      free: j.free === true,
      pricePaise: Number(j.price_paise ?? 0),
      product: typeof j.product === "string" ? j.product : opts.product,
    };
  }

  // The engine can answer with the file itself instead of a stored link. Show
  // that, rather than pretending we have a URL we do not have.
  if (Platform.OS === "web") {
    const url = (globalThis as any).URL;
    if (!url?.createObjectURL) throw new Error("The server returned a file this browser cannot show.");
    const objectUrl = url.createObjectURL(await res.blob());
    return {
      previewUrl: objectUrl, outputUrl: objectUrl, extraUrls: [], meta: null,
      jobId: null, locked: false, free: true, pricePaise: 0, product: opts.product,
    };
  }
  throw new Error("The server returned a file, not a link. This build can only open linked files.");
}

/** True when the platform can write a file the user keeps (web only today). */
export function canDownloadFile(): boolean {
  return Platform.OS === "web";
}

/**
 * Web: a real download, named. Native: hand the URL to the OS, which is what a
 * phone user expects from "open".
 */
export async function openResult(url: string, filename: string): Promise<void> {
  if (Platform.OS !== "web") {
    const { Linking } = require("react-native");
    await Linking.openURL(url);
    return;
  }
  const g: any = globalThis as any;
  const a = g.document?.createElement?.("a");
  if (!a) return;
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  g.document.body.appendChild(a);
  a.click();
  a.remove?.();
}

/** Saves a data: URL (the signature PNG) on the web. Returns false elsewhere. */
export function saveDataUrl(dataUrl: string, filename: string): boolean {
  if (Platform.OS !== "web") return false;
  const g: any = globalThis as any;
  const a = g.document?.createElement?.("a");
  if (!a) return false;
  a.href = dataUrl;
  a.download = filename;
  g.document.body.appendChild(a);
  a.click();
  a.remove?.();
  return true;
}

export function formatBytes(n?: number): string {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
