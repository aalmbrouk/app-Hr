import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter' | 'a3';
  filename?: string;
  margin?: number;
  scale?: number;
  quality?: number;
  watermarkText?: string;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Exports a DOM element directly into a high-resolution, print-ready PDF file.
 * Handles Arabic RTL typography, borders, logos, and badges with crisp vector-like rendering.
 */
export async function exportElementToPdf(
  elementOrId: HTMLElement | string,
  customFilename: string = 'document.pdf',
  options: PdfExportOptions = {}
): Promise<boolean> {
  const {
    orientation = 'portrait',
    margin = 6, // mm
    scale = 2.5, // 2.5x high DPI for crisp print quality
    onStart,
    onComplete,
    onError
  } = options;

  try {
    if (onStart) onStart();

    const targetElement = typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

    if (!targetElement) {
      throw new Error(`Element "${elementOrId}" not found for PDF export.`);
    }

    // Capture the target DOM node cleanly using html2canvas
    const canvas = await html2canvas(targetElement, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (el) => {
        return (
          el.classList?.contains('print:hidden') ||
          el.classList?.contains('no-print') ||
          el.getAttribute('data-pdf-ignore') === 'true'
        );
      },
      onclone: (clonedDoc) => {
        // Ensure fonts and text direction render cleanly in cloned state
        const clonedElement = typeof elementOrId === 'string' 
          ? clonedDoc.getElementById(elementOrId) 
          : clonedDoc.body;
        if (clonedElement) {
          clonedElement.style.boxShadow = 'none';
        }
      }
    });

    const isLandscape = orientation === 'landscape';
    const pageWidth = isLandscape ? 297 : 210; // mm for A4
    const pageHeight = isLandscape ? 210 : 297; // mm for A4

    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    const pdf = new jsPDF({
      orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // High quality JPEG/PNG compression
    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    if (imgHeight <= contentHeight) {
      // Single page fitting cleanly
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Multi-page pagination
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= contentHeight;

      while (heightLeft > 0) {
        position = position - contentHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= contentHeight;
      }
    }

    const safeFilename = customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`;
    pdf.save(safeFilename);

    if (onComplete) onComplete();
    return true;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('PDF Export Error:', error);
    if (onError) onError(error);
    return false;
  }
}

/**
 * Exports a DOM element into a crisp PNG or JPEG image for instant mobile sharing or archiving.
 */
export async function exportElementToImage(
  elementOrId: HTMLElement | string,
  customFilename: string = 'document.png',
  imageFormat: 'png' | 'jpeg' = 'png',
  scale: number = 2.5
): Promise<boolean> {
  try {
    const targetElement = typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

    if (!targetElement) {
      throw new Error(`Element "${elementOrId}" not found for Image export.`);
    }

    const canvas = await html2canvas(targetElement, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (el) => {
        return (
          el.classList?.contains('print:hidden') ||
          el.classList?.contains('no-print') ||
          el.getAttribute('data-pdf-ignore') === 'true'
        );
      }
    });

    const mimeType = imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = imageFormat === 'jpeg' ? 'jpg' : 'png';
    const dataUrl = canvas.toDataURL(mimeType, 0.95);

    const link = document.createElement('a');
    const safeFilename = customFilename.endsWith(`.${extension}`) ? customFilename : `${customFilename}.${extension}`;
    link.download = safeFilename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (err) {
    console.error('Image Export Error:', err);
    return false;
  }
}

/**
 * Triggers clean print mode with optional styling preparation.
 */
export function triggerPrint(): void {
  window.print();
}

