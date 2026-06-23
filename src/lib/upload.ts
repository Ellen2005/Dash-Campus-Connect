/**
 * Upload a file to Supabase storage or fallback to a data URL.
 * This handles the RLS issues by using the service role or client-side uploads.
 */

export async function uploadFile(
  file: File,
  bucket: string = "uploads",
  userId?: string
): Promise<{ url?: string; error?: string }> {
  try {
    // Try Supabase storage upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    if (userId) formData.append("userId", userId);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) return { url: data.url };
    }

    // Fallback: Convert to data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ url: reader.result as string });
      };
      reader.onerror = () => {
        resolve({ error: "Failed to read file" });
      };
      reader.readAsDataURL(file);
    });
  } catch (error: any) {
    // Final fallback: data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ url: reader.result as string });
      };
      reader.onerror = () => {
        resolve({ error: error?.message || "Upload failed" });
      };
      reader.readAsDataURL(file);
    });
  }
}