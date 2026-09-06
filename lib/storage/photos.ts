export type StoredPhoto = {
  url: string;
  storageKey: string;
};

export interface PhotoStorage {
  upload(input: {
    userId: string;
    filename: string;
    contentType: string;
    body: Buffer;
  }): Promise<StoredPhoto>;
  delete(storageKey: string): Promise<void>;
}

export const photoStorage: PhotoStorage = {
  async upload() {
    throw new Error(
      "Progress photo storage is not configured yet. Connect Cloudinary, S3, UploadThing, or Vercel Blob."
    );
  },
  async delete() {
    throw new Error("Progress photo storage is not configured yet.");
  },
};
