import fitz
import cv2
import numpy as np
from pathlib import Path

def create_mock_pdf(output_path):
    print(f"Creating mock PDF: {output_path}")
    doc = fitz.open()
    
    # Create 5 spreads (10 pages)
    # Each spread has two pages. Let's make them out of order.
    # Spread 1: Pages 3 & 4
    # Spread 2: Pages 1 & 2
    # Spread 3: Pages 9 & 10
    # Spread 4: Pages 7 & 8
    # Spread 5: Pages 5 & 6
    
    sequence = [(3, 4), (1, 2), (9, 10), (7, 8), (5, 6)]
    
    for left_num, right_num in sequence:
        # Create a spread image (landscape)
        w, h = 1000, 700
        img = np.full((h, w, 3), 255, dtype=np.uint8)
        
        # Draw a "spine" line
        cv2.line(img, (w//2, 0), (w//2, h), (200, 200, 200), 2)
        
        # Draw page numbers (bottom corner)
        # Left page number
        cv2.putText(img, str(left_num), (w//4 - 20, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
        # Right page number
        cv2.putText(img, str(right_num), ((3*w//4) - 20, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
        
        # Add some random "text" blocks
        cv2.putText(img, "Lorem Ipsum Dolor Sit Amet", (100, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (50, 50, 50), 2)
        cv2.putText(img, "Consectetur Adipiscing Elit", (w//2 + 100, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (50, 50, 50), 2)
        
        # Convert to PDF page
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pix = fitz.Pixmap(fitz.csRGB, w, h, img_rgb.tobytes())
        page = doc.new_page(width=w, height=h)
        page.insert_image(page.rect, pixmap=pix)
        
    doc.save(str(output_path))
    doc.close()
    print("Mock PDF created.")

if __name__ == "__main__":
    create_mock_pdf("test_input.pdf")
