# 📦 Components Usage Guide

**How to use txt-export.js and pdf-annotator.js**

---

## 📁 Folder Structure WITH Components:

```
your-deployment/
├── index.html
├── service-worker.js          ← Updated (includes components)
├── manifest.json
├── components/                 ← CREATE THIS FOLDER
│   ├── txt-export.js          ← Download and put here
│   └── pdf-annotator.js       ← Download and put here
└── pages/
    ├── OIM Assist.html
    ├── operation.html
    ├── ... (all your modules)
```

**IMPORTANT:** Create `components/` folder and put both JS files there!

---

## 🔧 Component 1: txt-export.js

### **What It Does:**
- Exports data as formatted TXT file
- Alternative to JSON export (human-readable)
- Works offline
- iOS Safari compatible

### **How to Use in Your Modules:**

#### **Step 1: Add Script to Module**
At the top of your HTML file (e.g., handover.html):

```html
<!-- Add this in <head> or before closing </body> -->
<script src="../components/txt-export.js"></script>
```

#### **Step 2: Add Export Button**
```html
<button onclick="exportHandoverTXT()">📝 Export as TXT</button>
```

#### **Step 3: Create Export Function**
```javascript
function exportHandoverTXT() {
    // Collect your data
    const data = {
        date: document.getElementById('date').value,
        safety: document.getElementById('safety').value,
        operations: document.getElementById('operations').value,
        // ... all your data
    };
    
    // Export as TXT
    exportToTXT(data, 'handover-report', {
        title: 'HANDOVER REPORT',
        formatStyle: 'structured', // or 'simple'
        includeTimestamp: true,
        sections: [
            { title: 'Safety', key: 'safety' },
            { title: 'Operations', key: 'operations' }
            // ... your sections
        ]
    });
}
```

---

## 🎨 Component 2: pdf-annotator.js

### **What It Does:**
- Drawing/annotation on PDFs
- Apple Pencil support (pressure sensitivity)
- Palm rejection
- Color selection
- Undo/Clear/Save functions

### **How to Use in share.html:**

#### **Step 1: Add Script to share.html**
```html
<!-- Add this before closing </body> -->
<script src="../components/pdf-annotator.js"></script>
```

#### **Step 2: Add Container for PDF**
```html
<div id="pdf-container" style="position: relative; width: 100%; height: 600px;">
    <!-- Your PDF viewer content here -->
</div>
```

#### **Step 3: Initialize Annotator**
```javascript
// After PDF loads
const annotator = new PDFAnnotator('pdf-container', {
    lineWidth: 2,
    color: '#e74c3c',
    eraserWidth: 20
});

// Create toolbar
const toolbar = createAnnotationToolbar(annotator);
document.body.appendChild(toolbar);
```

---

## 💡 Complete Example: Adding TXT Export to handover.html

### **Before (JSON only):**
```html
<button onclick="exportJSON()">📄 Export JSON</button>

<script>
function exportJSON() {
    const data = collectAllData();
    // ... existing JSON export code
}
</script>
```

### **After (JSON + TXT):**
```html
<!-- Add both export options -->
<button onclick="exportJSON()">📄 Export JSON</button>
<button onclick="exportTXT()">📝 Export TXT</button>

<!-- Add TXT export script -->
<script src="../components/txt-export.js"></script>

<script>
function exportJSON() {
    const data = collectAllData();
    // ... existing JSON export code (keep as is)
}

function exportTXT() {
    const data = collectAllData();
    
    exportToTXT(data, 'handover-report', {
        title: 'HANDOVER REPORT',
        formatStyle: 'structured',
        includeTimestamp: true
    });
}
</script>
```

---

## 💡 Complete Example: Adding PDF Annotation to share.html

### **Add to share.html:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Safety Document Viewer</title>
</head>
<body>
    <!-- Your existing PDF viewer -->
    <div id="pdf-container" style="position: relative; width: 100%; min-height: 600px;">
        <!-- PDF content here -->
    </div>

    <!-- Add annotation script -->
    <script src="../components/pdf-annotator.js"></script>
    
    <script>
        // Initialize after PDF loads
        window.addEventListener('DOMContentLoaded', function() {
            // Create annotator
            const annotator = new PDFAnnotator('pdf-container', {
                lineWidth: 2,
                color: '#e74c3c'
            });
            
            // Create toolbar
            const toolbar = createAnnotationToolbar(annotator);
            document.body.appendChild(toolbar);
        });
    </script>
</body>
</html>
```

---

## 📝 TXT Export Format Examples

### **Simple Format:**
```
=== HANDOVER REPORT ===

Generated: Thursday, December 12, 2024 at 10:30 AM

Safety: No incidents reported
Operations: All wells producing
Equipment: All systems operational
```

### **Structured Format:**
```
═══════════════════════════════════════
        HANDOVER REPORT
═══════════════════════════════════════

Generated: Thursday, December 12, 2024 at 10:30 AM
Platform: iOS

─────────────────────────────────────

╔═══ SAFETY ═══╗

Status: Green
Incidents: None
Last Drill: 2024-12-10

╔═══ OPERATIONS ═══╗

Wells Online: 28/28
Production: Target met
Field Changes: None

─────────────────────────────────────
End of Report
© 2025 Aziz Mohamad
```

---

## 🎨 PDF Annotator Features

### **Available Tools:**
- ✏️ **Pen** - Freehand drawing with pressure sensitivity
- 🖍️ **Highlighter** - Semi-transparent highlighting
- 🧹 **Eraser** - Remove annotations
- ↩️ **Undo** - Remove last stroke
- 🗑️ **Clear All** - Remove all annotations
- 💾 **Save** - Export annotation as image
- 🎨 **Colors** - Red, Blue, Green, Orange, Black

### **Apple Pencil Support:**
- Pressure sensitivity (line width changes with pressure)
- Palm rejection (ignores palm touches)
- Smooth, natural drawing
- Low latency

### **Functions You Can Call:**
```javascript
annotator.setTool('pen');         // Switch to pen
annotator.setTool('highlighter'); // Switch to highlighter
annotator.setTool('eraser');      // Switch to eraser
annotator.setColor('#3b82f6');    // Change color
annotator.setLineWidth(3);        // Change line width
annotator.undo();                 // Undo last stroke
annotator.clear();                // Clear all
annotator.downloadAnnotation();   // Save as image
```

---

## 🔄 Which Modules Should Use What?

### **TXT Export (Recommended):**
✅ **handover.html** - Shift reports  
✅ **operation.html** - Daily operations  
✅ **safety.html** - Incident reports  
✅ **OIM_Assist.html** - Analytics summaries  
✅ **key_equipment.html** - Equipment status  

### **PDF Annotator (Optional):**
✅ **share.html** - Safety document markup  

### **Keep JSON Export:**
✅ **All modules** - For data backup/restore

---

## ⚠️ Important Notes

### **Script Path:**
- From pages folder: `../components/txt-export.js`
- From root: `./components/txt-export.js`

### **Function Names:**
- `exportToTXT()` - Main TXT export function
- `PDFAnnotator` - Class for annotation
- `createAnnotationToolbar()` - Helper for toolbar

### **iOS Compatibility:**
TXT export automatically handles iOS Safari:
- Opens in new window
- User taps Share → Save to Files
- Or copies to clipboard
- Or shows modal with content

### **Offline:**
Both components work fully offline after cached!

---

## 📱 Testing Components

### **Test TXT Export:**
1. Add to any module
2. Enter some data
3. Click "Export TXT"
4. Check if file downloads (or opens on iOS)
5. Verify content is readable

### **Test PDF Annotator:**
1. Open share.html
2. Load a PDF
3. Try drawing with pen
4. Try highlighter
5. Try eraser
6. Try undo
7. Try save

### **Test Offline:**
1. Visit modules with internet
2. Components get cached
3. Go offline
4. Test export/annotation
5. Should work perfectly!

---

## 🎯 Quick Integration Checklist

For each module you want to add TXT export:

- [ ] Add `<script src="../components/txt-export.js"></script>`
- [ ] Add export button to UI
- [ ] Create export function
- [ ] Test with data
- [ ] Test offline
- [ ] Done!

For share.html PDF annotation:

- [ ] Add `<script src="../components/pdf-annotator.js"></script>`
- [ ] Add container div
- [ ] Initialize annotator
- [ ] Create toolbar
- [ ] Test drawing
- [ ] Test offline
- [ ] Done!

---

## 💡 Pro Tips

### **For TXT Export:**
- Use descriptive filenames
- Include timestamp in filename
- Use structured format for reports
- Keep JSON export too (both formats useful)

### **For PDF Annotator:**
- Test Apple Pencil pressure
- Adjust line width for readability
- Use colors for different types of notes
- Save annotations as separate images
- Keep original PDF unchanged

---

## 🚀 Ready to Integrate!

**Components are powerful but optional.**  
**Add them to modules as needed.**  
**PWA works fine without them too.**

Questions? Check the examples above or test on one module first!

---

*Components Version: 1.0.0*  
*Compatible with: All devices*  
*Offline: Yes*
