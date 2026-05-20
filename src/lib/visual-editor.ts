export const editableAttrs = (id: string, label: string) => ({
  "data-editor-id": id,
  "data-editor-label": label,
});

export const textBindingAttrs = (field: string) => ({
  "data-editor-field": field,
});

export const linkBindingAttrs = (field: string) => ({
  "data-editor-link-field": field,
});

export const richTextBindingAttrs = (field: string) => ({
  "data-editor-field": field,
  "data-editor-format": "html",
});

export const imageBindingAttrs = (
  field: string,
  options?: {
    altField?: string;
    frame?: "landscape" | "portrait" | "square";
  },
) => ({
  "data-editor-image-field": field,
  "data-editor-image-alt-field": options?.altField,
  "data-editor-image-frame": options?.frame ?? "landscape",
});
