import fitz  # PyMuPDF
import cv2
import numpy as np
import pytesseract
from PIL import Image
import os
import sys
import argparse
import logging
import shutil
from pathlib import Path
try:
    from tqdm import tqdm
except ImportError:
    tqdm = None

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# --- Configuration ---
# Common Tesseract paths on Windows
TESSERACT_PATHS = [
    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    os.path.join(os.environ.get('LOCALAPPDATA', ''), r'Tesseract-OCR\tesseract.exe')
]

for p in TESSERACT_PATHS:
    if os.path.exists(p):
        pytesseract.pytesseract.tesseract_cmd = p
        break

class BookOrganizer:
    def __init__(self, input_pdf, output_pdf=None, tesseract_path=None, dpi=300):
        self.input_pdf_path = Path(input_pdf)
        self.output_pdf_path = Path(output_pdf) if output_pdf else self.input_pdf_path.parent / f"{self.input_pdf_path.stem}_ordenado.pdf"
        self.dpi = dpi
        
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        self.temp_dir = Path("temp_pages_organizer")
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
        self.temp_dir.mkdir(exist_ok=True)
        
        self.pages_data = []

    def check_tesseract(self):
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    def extract_and_process(self):
        """Extract pages from PDF and split them."""
        logger.info(f"Abriendo PDF: {self.input_pdf_path}")
        try:
            doc = fitz.open(self.input_pdf_path)
        except Exception as e:
            logger.error(f"No se pudo abrir el PDF: {e}")
            return

        total_sheets = len(doc)
        iterator = range(total_sheets)
        if tqdm:
            iterator = tqdm(iterator, desc="Procesando hojas", unit="hoja")

        for i in iterator:
            page = doc.load_page(i)
            # Use high resolution for extraction
            zoom = self.dpi / 72
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
            if pix.n == 3: # RGB
                img_bgr = cv2.cvtColor(img_data, cv2.COLOR_RGB2BGR)
            elif pix.n == 4: # RGBA
                img_bgr = cv2.cvtColor(img_data, cv2.COLOR_RGBA2BGR)
            else:
                img_bgr = img_data

            # Split logic
            left_img, right_img = self.split_page(img_bgr)
            
            # Save and OCR
            for side, img in [("L", left_img), ("R", right_img)]:
                page_num = self.detect_page_number(img)
                img_filename = f"sheet_{i+1:04d}_{side}.png"
                img_path = self.temp_dir / img_filename
                cv2.imwrite(str(img_path), img)
                
                self.pages_data.append({
                    "path": img_path,
                    "num": page_num,
                    "sheet": i + 1,
                    "side": side
                })

        doc.close()

    def split_page(self, img):
        """Find the spine/gutter and split the image in two."""
        h, w = img.shape[:2]
        
        # Convert to grayscale and find edges to emphasize the gutter
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Focus on the center 30% to find the vertical gutter
        center_margin = 0.15
        center_l = int(w * (0.5 - center_margin))
        center_r = int(w * (0.5 + center_margin))
        center_clip = edges[:, center_l:center_r]
        
        # Use vertical projection of edges - the spine usually has more vertical edges
        # or a clear line. We can also use the original image's brightness projection.
        # Here we use a combination: sum of intensities in the original image (seeking dark gutter)
        # combined with edge density.
        
        gray_clip = gray[:, center_l:center_r]
        projection = np.sum(gray_clip, axis=0).astype(float)
        
        # Normalize projection
        projection -= np.min(projection)
        projection /= np.max(projection)
        
        # Find the minimum (darkest vertical line in the center area)
        split_in_clip = np.argmin(projection)
        split_idx = center_l + split_in_clip
        
        left_img = img[:, :split_idx]
        right_img = img[:, split_idx:]
        
        return left_img, right_img

    def detect_page_number(self, img):
        """Apply OCR to the bottom and top corners to find the number."""
        h, w = img.shape[:2]
        
        # We'll check two areas: bottom corner/center (most common) and top center (less common)
        # ROI 1: Bottom 15%
        roi_bottom = img[int(h * 0.85):h, :]
        # ROI 2: Top 10% (some books have numbers there)
        roi_top = img[0:int(h * 0.10), :]
        
        found_num = self._ocr_roi(roi_bottom)
        if found_num is None:
            found_num = self._ocr_roi(roi_top)
            
        return found_num

    def _ocr_roi(self, roi):
        if roi.size == 0:
            return None
            
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Clean image: thresholding
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        
        # Remove small noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

        # OCR config: digits only, treat as single line/block
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789'
        text = pytesseract.image_to_string(thresh, config=custom_config).strip()
        
        # Try to find the largest number in the text (sometimes OCR grabs debris)
        import re
        numbers = re.findall(r'\d+', text)
        if numbers:
            # Usually the page number is the most prominent or only number
            # Return the first one for now
            return int(numbers[0])
        return None

    def organize_and_save(self):
        """Sort pages and generate the final PDF."""
        # Heuristic: if a page number is missing, try to interpolate if neighbors exist
        self._interpolate_missing_numbers()
        
        # Sort
        def sort_key(x):
            # If no number even after interpolation, use sheet and side
            num = x["num"] if x["num"] is not None else (x["sheet"] * 2 + (0 if x["side"] == "L" else 1))
            return num
        
        self.pages_data.sort(key=sort_key)
        
        logger.info(f"Generando PDF final: {self.output_pdf_path}")
        new_doc = fitz.open()
        
        iterator = self.pages_data
        if tqdm:
            iterator = tqdm(iterator, desc="Reconstruyendo PDF", unit="página")

        for data in iterator:
            img_path = data["path"]
            # We use the raw bytes to avoid PIL overhead where possible, 
            # but fitz handles image files well
            img = fitz.open(img_path)
            rect = img[0].rect
            img_pdf_bytes = img.convert_to_pdf()
            img_pdf = fitz.open("pdf", img_pdf_bytes)
            new_doc.insert_pdf(img_pdf)
            img.close()
            img_pdf.close()
            
        new_doc.save(str(self.output_pdf_path))
        new_doc.close()
        
        # Cleanup
        logger.info("Limpiando archivos temporales...")
        shutil.rmtree(self.temp_dir)
        
        logger.info(f"¡Hecho! Archivo guardado como: {self.output_pdf_path}")

    def _interpolate_missing_numbers(self):
        """Try to fill in None values in self.pages_data based on sequence."""
        # This is a bit complex since pages might not be perfectly sequential in the input
        # but let's do a simple pass if they appear to follow a pattern locally.
        for i in range(len(self.pages_data)):
            if self.pages_data[i]["num"] is None:
                # Check previous
                if i > 0 and self.pages_data[i-1]["num"] is not None:
                    # If this is the 'R' side of the same sheet where 'L' was N
                    if self.pages_data[i]["sheet"] == self.pages_data[i-1]["sheet"]:
                        self.pages_data[i]["num"] = self.pages_data[i-1]["num"] + 1
                # Check next (if possible)
                elif i < len(self.pages_data) - 1 and self.pages_data[i+1]["num"] is not None:
                    if self.pages_data[i]["sheet"] == self.pages_data[i+1]["sheet"]:
                         self.pages_data[i]["num"] = self.pages_data[i+1]["num"] - 1

def main():
    parser = argparse.ArgumentParser(description="Organizador automático de libros en PDF (doble página).")
    parser.add_argument("input", help="Ruta al archivo PDF original.")
    parser.add_argument("-o", "--output", help="Ruta de salida (opcional).")
    parser.add_argument("-t", "--tesseract", help="Ruta al ejecutable de Tesseract.")
    parser.add_argument("--dpi", type=int, default=300, help="DPI para la extracción (por defecto 300).")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        logger.error(f"El archivo de entrada no existe: {args.input}")
        sys.exit(1)
        
    organizer = BookOrganizer(args.input, args.output, args.tesseract, args.dpi)
    
    if not organizer.check_tesseract():
        logger.warning("No se encontró Tesseract OCR automáticamente.")
        if not args.tesseract:
            logger.info("Buscando tesseract en el sistema...")
            # We already searched in common patches, if it fails here we need manual input
            path = input("Por favor, ingresa la ruta completa a tesseract.exe: ")
            if path:
                organizer = BookOrganizer(args.input, args.output, path, args.dpi)
                if not organizer.check_tesseract():
                    logger.error("Ruta inválida. El reconocimiento de números no funcionará.")
    
    organizer.extract_and_process()
    organizer.organize_and_save()

if __name__ == "__main__":
    main()

def main():
    parser = argparse.ArgumentParser(description="Organizador automático de libros en PDF (doble página).")
    parser.add_argument("input", help="Ruta al archivo PDF original.")
    parser.add_argument("-o", "--output", help="Ruta de salida (opcional).")
    parser.add_argument("-t", "--tesseract", help="Ruta al ejecutable de Tesseract.")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        logger.error(f"El archivo de entrada no existe: {args.input}")
        sys.exit(1)
        
    organizer = BookOrganizer(args.input, args.output, args.tesseract)
    
    if not organizer.check_tesseract():
        logger.warning("No se encontró Tesseract OCR. Por favor indícalo con -t o instálalo.")
        if not args.tesseract:
            path = input("Ingresa la ruta de tesseract.exe (ej: C:\\Program Files\\Tesseract-OCR\\tesseract.exe): ")
            if path:
                organizer = BookOrganizer(args.input, args.output, path)
                if not organizer.check_tesseract():
                    logger.error("La ruta de Tesseract sigue siendo inválida. El OCR no funcionará.")
    
    organizer.extract_and_process()
    organizer.organize_and_save()

if __name__ == "__main__":
    main()
