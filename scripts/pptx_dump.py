import sys, io
from pptx import Presentation
from pptx.util import Emu

path = sys.argv[1]
prs = Presentation(path)
out = []
for i, slide in enumerate(prs.slides, 1):
    texts = []
    for shape in slide.shapes:
        if shape.has_text_frame:
            t = "\n".join(p.text for p in shape.text_frame.paragraphs if p.text.strip())
            if t.strip():
                texts.append(t.strip())
        elif shape.shape_type == 13:
            texts.append("[HÌNH ẢNH]")
        if shape.has_table:
            for row in shape.table.rows:
                texts.append(" | ".join(c.text for c in row.cells))
    out.append(f"--- Slide {i} ---\n" + "\n".join(texts))
sys.stdout.write("\n\n".join(out))
