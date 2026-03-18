import slugify from "slugify";

export function makeSlug(text) {
  if (!text) return "";
  return slugify(text, { lower: true, strict: true, remove: /[*+~.()"!:@]/g });
}
