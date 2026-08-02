/**
 * ImageStorageAdapter
 * 
 * Responsibility:
 * Encapsulates the encoding and decoding of binary image data to/from Base64.
 * Limits the spread of Base64 handling assumptions across the system.
 * Does not contain user authority or path logic.
 */
export class ImageStorageAdapter {
    /**
     * Converts a File or Blob into a Base64 string for storage in LRFS.
     * @param {File|Blob} fileBlob 
     * @returns {Promise<string>} Base64 data URI string representation
     */
    static encodeFileToBase64(fileBlob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(fileBlob);
        });
    }

    /**
     * Converts a Base64 data URI string back into a Blob.
     * @param {string} dataURI 
     * @returns {Blob}
     */
    static decodeBase64ToBlob(dataURI) {
        const parts = dataURI.split(',');
        if (parts.length !== 2) throw new Error('Invalid Data URI format');
        
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(':')[1].split(';')[0];
        
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([ab], { type: mimeString });
    }

    /**
     * Generates an ephemeral Object URL from a Base64 string.
     * @param {string} base64String 
     * @returns {string|null} blob:http://...
     */
    static createBlobUrlFromBase64(base64String) {
        if (!base64String || !base64String.startsWith('data:image/')) return null;
        try {
            const blob = this.decodeBase64ToBlob(base64String);
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error('[ImageStorageAdapter] Failed to decode image blob', e);
            return null;
        }
    }
}
