import { v2 as cloudinary } from "cloudinary";

function configured() {
  const ok =
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_API_SECRET;
  if (ok) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
      secure: true,
    });
  }
  return ok;
}

export function isCloudinaryConfigured(): boolean {
  return configured();
}

export interface CloudUpload {
  publicId: string;
  url: string;
  durationSec?: number;
  width?: number;
  height?: number;
}

export async function uploadVideo(
  buffer: Buffer,
  folder = "creativeintel/refs"
): Promise<CloudUpload> {
  if (!configured()) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.");
  }

  const res = await new Promise<{ public_id: string; secure_url: string; duration?: number; width?: number; height?: number }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "video", folder },
        (err, result) => {
          if (err || !result) return reject(err || new Error("upload failed"));
          resolve(result as { public_id: string; secure_url: string; duration?: number; width?: number; height?: number });
        }
      );
      stream.end(buffer);
    }
  );

  return {
    publicId: res.public_id,
    url: res.secure_url,
    durationSec: res.duration,
    width: res.width,
    height: res.height,
  };
}

export interface ShortsifyTransformOpts {
  publicId: string;
  start: number;
  end: number;
  hookText?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
}

// Builds a Cloudinary URL that crops the source to vertical, trims to the
// highlight window, and burns the hook text on top. No ffmpeg / no rendering
// on our server — Cloudinary's CDN does it on demand.
export function shortsifyURL(opts: ShortsifyTransformOpts): string {
  if (!configured()) {
    throw new Error("Cloudinary is not configured.");
  }
  const aspect = opts.aspectRatio ?? "9:16";
  const [w, h] =
    aspect === "9:16"
      ? [1080, 1920]
      : aspect === "16:9"
        ? [1920, 1080]
        : [1080, 1080];

  const duration = Math.max(1, opts.end - opts.start);

  const transforms = [
    `so_${opts.start.toFixed(2)},du_${duration.toFixed(2)}`,
    `c_fill,g_auto,w_${w},h_${h}`,
  ];

  if (opts.hookText) {
    const text = encodeURIComponent(opts.hookText.slice(0, 80))
      .replace(/%2C/g, "%252C")
      .replace(/%2F/g, "%252F")
      .replace(/'/g, "%27");
    transforms.push(
      `l_text:Arial_56_bold:${text},co_white,bo_4px_solid_black,g_north,y_140`,
      `fl_layer_apply`
    );
  }

  // Output as mp4
  const transformStr = transforms.join("/");
  return cloudinary.url(opts.publicId, {
    resource_type: "video",
    format: "mp4",
    transformation: [{ raw_transformation: transformStr }],
    secure: true,
  });
}

export async function deleteVideo(publicId: string): Promise<void> {
  if (!configured()) return;
  await cloudinary.uploader
    .destroy(publicId, { resource_type: "video" })
    .catch(() => {});
}
