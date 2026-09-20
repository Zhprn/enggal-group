export function formatImageUrl(value: any): any {
  if (!value) return value;

  if (Array.isArray(value)) {
    return value.map((item) => formatImageUrl(item));
  }
  if (typeof value === 'object' && value !== null) {
    const formattedObj: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      formattedObj[key] = formatImageUrl(value[key]);
    }
    return formattedObj;
  }

  if (typeof value === 'string') {
    const isImageFile = /\.(png|jpe?g|webp|gif|svg)$/i.test(value);
    const isUploadPath = value.startsWith('/uploads/') || value.startsWith('uploads/');

    if (isImageFile || isUploadPath) {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
      }

      const filename = value.replace(/^\/?(uploads\/)?/, '');
      const baseUrl = process.env.R2_PUBLIC_URL;

      return `${baseUrl}/uploads/${filename}`;
    }
  }

  return value;
}