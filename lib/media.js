/**
 * Cloudinary video URL helpers — balanced quality vs load time.
 * Prefer capped width + q_auto:good over eco/UHD sources.
 */
export function cloudinaryVideo(pathAfterUpload, width = 1280) {
  return `https://res.cloudinary.com/bsaqrrl4/video/upload/f_mp4,q_auto:good,w_${width},c_limit/${pathAfterUpload}`;
}

export function cloudinaryPoster(pathAfterUpload, width = 1400) {
  return `https://res.cloudinary.com/bsaqrrl4/video/upload/so_1,w_${width},q_auto,f_jpg/${pathAfterUpload}`;
}
