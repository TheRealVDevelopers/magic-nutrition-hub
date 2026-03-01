import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import type { LandingImage } from "@/types/firestore";

// ─── Upload an image for a club's landing page ──────────────────────────

export function useUploadLandingImage(clubId: string) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    async function upload(file: File, label: string): Promise<LandingImage> {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            const storagePath = `clubs/${clubId}/images/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);
            const uploadTask = uploadBytesResumable(storageRef, file);

            const url = await new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                    (err) => reject(err),
                    async () => {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadUrl);
                    }
                );
            });

            const image: LandingImage = {
                id: `img_${Date.now()}`,
                name: label,
                url,
                path: storagePath,
                uploadedAt: Timestamp.now(),
            };

            await updateDoc(doc(db, "clubs", clubId), {
                landingPageImages: arrayUnion(image),
            });

            return image;
        } catch (err: any) {
            setError(err?.message ?? "Upload failed");
            throw err;
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }

    return { upload, uploading, progress, error };
}

// ─── Delete a landing image ─────────────────────────────────────────────

export function useDeleteLandingImage(clubId: string) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function deleteImage(image: LandingImage) {
        setDeleting(true);
        setError(null);

        try {
            const storageRef = ref(storage, image.path);
            await deleteObject(storageRef);
            await updateDoc(doc(db, "clubs", clubId), {
                landingPageImages: arrayRemove(image),
            });
        } catch (err: any) {
            setError(err?.message ?? "Delete failed");
            throw err;
        } finally {
            setDeleting(false);
        }
    }

    return { deleteImage, deleting, error };
}

// ─── Upload landing page HTML ───────────────────────────────────────────

export function useUploadLandingHTML(clubId: string) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function uploadHTML(htmlContent: string): Promise<string> {
        setUploading(true);
        setError(null);

        try {
            const blob = new Blob([htmlContent], { type: "text/html" });
            const storagePath = `clubs/${clubId}/landing/index.html`;
            const storageRef = ref(storage, storagePath);
            const uploadTask = uploadBytesResumable(storageRef, blob, {
                contentType: "text/html",
            });

            const url = await new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    null,
                    (err) => reject(err),
                    async () => {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadUrl);
                    }
                );
            });

            await updateDoc(doc(db, "clubs", clubId), {
                landingPageUrl: url,
            });

            return url;
        } catch (err: any) {
            setError(err?.message ?? "Upload failed");
            throw err;
        } finally {
            setUploading(false);
        }
    }

    return { uploadHTML, uploading, error };
}
