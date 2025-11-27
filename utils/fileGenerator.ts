import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';

export const generateFile = async (format: string, title: string, content: string) => {
  const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.${format.toLowerCase()}`;

  switch (format.toUpperCase()) {
    case 'PDF': {
      try {
        const doc = new jsPDF();
        // Basic configuration
        doc.setFont("helvetica");
        doc.setFontSize(16);
        doc.text(title.replace(/_/g, ' '), 10, 15);
        
        doc.setFontSize(10);
        // Simple text wrapping
        const splitText = doc.splitTextToSize(content, 180);
        
        let y = 25;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 10;
        
        for (let i = 0; i < splitText.length; i++) {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin + 5;
          }
          doc.text(splitText[i], margin, y);
          y += 5; // Line height
        }
        
        doc.save(filename);
      } catch (e) {
        console.error("PDF Generation failed", e);
        alert("Failed to generate PDF. Please try again.");
      }
      break;
    }

    case 'PPTX': {
      try {
        const pptx = new PptxGenJS();
        
        // Define slide master
        pptx.defineSlideMaster({
          title: "MASTER_SLIDE",
          background: { color: "FFFFFF" },
          objects: [
            { rect: { x: 0, y: 0, w: "100%", h: 0.5, fill: { color: "003366" } } },
          ],
        });

        // Split content by '---' to detect slides
        const slidesContent = content.split('---');
        
        slidesContent.forEach((slideText) => {
            const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
            const lines = slideText.trim().split('\n').filter(l => l.trim().length > 0);
            
            if (lines.length > 0) {
                // Heuristic: First line is title
                const slideTitle = lines[0].replace(/^#+\s*/, '').trim(); 
                const slideBody = lines.slice(1).join('\n');
                
                slide.addText(slideTitle, { x: 0.5, y: 0.8, w: '90%', fontSize: 24, bold: true, color: '003366' });
                
                if (slideBody) {
                    slide.addText(slideBody, { 
                        x: 0.5, y: 1.5, w: '90%', h: '70%', 
                        fontSize: 14, color: '363636', 
                        bodyProp: { autoFit: true },
                        bullet: true 
                    });
                }
            }
        });

        await pptx.writeFile({ fileName: filename });
      } catch (e) {
        console.error("PPTX Generation failed", e);
        alert("Failed to generate Presentation. Please try again.");
      }
      break;
    }

    case 'DOCX': {
      try {
        // Simple HTML based DOCX export
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Document</title></head><body style='font-family: Calibri, sans-serif;'>";
        const postHtml = "</body></html>";
        
        // Basic Markdown-ish to HTML conversion for the DOC
        let htmlContent = content
            .replace(/</g, "&lt;").replace(/>/g, "&gt;") // Escape HTML
            .replace(/\n/g, '<br/>') // Newlines
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
            .replace(/#(.*?)<br\/>/g, '<h2>$1</h2>') // Headings (approx)
            .replace(/- (.*?)<br\/>/g, '<li>$1</li>'); // Lists (approx)

        const html = preHtml + "<h1>" + title + "</h1>" + htmlContent + postHtml;
        
        const blob = new Blob(['\ufeff', html], {
            type: 'application/msword'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename; // .docx or .doc
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error("DOCX Generation failed", e);
        alert("Failed to generate Document.");
      }
      break;
    }

    case 'TXT': {
      try {
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      } catch (e) {
        console.error("TXT Generation failed", e);
      }
      break;
    }

    default:
        alert("Unsupported file format: " + format);
  }
};