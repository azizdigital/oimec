// PDF Annotator with Apple Pencil Support
// For OIM Executive Suite - share.html module
// Optimized for iPad/iPhone with pressure sensitivity
// Version: 1.0.0

class PDFAnnotator {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            lineWidth: options.lineWidth || 2,
            color: options.color || '#e74c3c',
            eraserWidth: options.eraserWidth || 20,
            ...options
        };
        
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentTool = 'pen'; // 'pen', 'eraser', 'highlighter'
        this.lastPoint = null;
        this.strokes = [];
        this.currentStroke = [];
        this.isApplePencil = false;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.detectApplePencil();
    }
    
    createCanvas() {
        // Create canvas overlay
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'annotation-canvas';
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            touch-action: none;
            cursor: crosshair;
            z-index: 10;
        `;
        
        this.container.style.position = 'relative';
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d', {
            desynchronized: true, // Better performance
            willReadFrequently: false
        });
        
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.redrawStrokes();
    }
    
    detectApplePencil() {
        // Check for Apple Pencil support
        if (window.PointerEvent) {
            this.isApplePencil = true;
            console.log('✏️ Apple Pencil support detected');
        }
    }
    
    setupEventListeners() {
        // Use Pointer Events for better Apple Pencil support
        if (window.PointerEvent) {
            this.canvas.addEventListener('pointerdown', this.handleStart.bind(this));
            this.canvas.addEventListener('pointermove', this.handleMove.bind(this));
            this.canvas.addEventListener('pointerup', this.handleEnd.bind(this));
            this.canvas.addEventListener('pointercancel', this.handleEnd.bind(this));
        } else {
            // Fallback to touch events
            this.canvas.addEventListener('touchstart', this.handleStart.bind(this));
            this.canvas.addEventListener('touchmove', this.handleMove.bind(this));
            this.canvas.addEventListener('touchend', this.handleEnd.bind(this));
            this.canvas.addEventListener('touchcancel', this.handleEnd.bind(this));
            
            // Mouse events for desktop
            this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
            this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));
        }
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        
        // Handle resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    handleStart(e) {
        e.preventDefault();
        
        // Detect Apple Pencil vs finger
        const isStylus = e.pointerType === 'pen';
        const isPalmRejection = e.touches?.length > 1;
        
        // Ignore if palm (multiple touch points)
        if (isPalmRejection) return;
        
        this.isDrawing = true;
        this.currentStroke = [];
        
        const point = this.getPoint(e);
        point.pressure = isStylus ? (e.pressure || 0.5) : 0.5;
        point.isStylus = isStylus;
        
        this.lastPoint = point;
        this.currentStroke.push(point);
    }
    
    handleMove(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        
        const point = this.getPoint(e);
        const isStylus = e.pointerType === 'pen';
        point.pressure = isStylus ? (e.pressure || 0.5) : 0.5;
        point.isStylus = isStylus;
        
        this.currentStroke.push(point);
        this.drawLine(this.lastPoint, point);
        this.lastPoint = point;
    }
    
    handleEnd(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        
        this.isDrawing = false;
        
        if (this.currentStroke.length > 0) {
            this.strokes.push({
                tool: this.currentTool,
                color: this.options.color,
                width: this.options.lineWidth,
                points: [...this.currentStroke]
            });
        }
        
        this.currentStroke = [];
        this.lastPoint = null;
    }
    
    getPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        let x, y;
        
        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else if (e.clientX !== undefined) {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        } else {
            x = 0;
            y = 0;
        }
        
        return { x, y };
    }
    
    drawLine(from, to) {
        this.ctx.save();
        
        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.options.eraserWidth;
        } else if (this.currentTool === 'highlighter') {
            this.ctx.globalAlpha = 0.3;
            this.ctx.lineWidth = this.options.lineWidth * 4;
            this.ctx.strokeStyle = this.options.color;
        } else {
            // Pen - use pressure sensitivity
            const pressure = to.pressure || 0.5;
            const width = this.options.lineWidth * (0.5 + pressure);
            this.ctx.lineWidth = width;
            this.ctx.strokeStyle = this.options.color;
        }
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    redrawStrokes() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.strokes.forEach(stroke => {
            const oldTool = this.currentTool;
            const oldColor = this.options.color;
            const oldWidth = this.options.lineWidth;
            
            this.currentTool = stroke.tool;
            this.options.color = stroke.color;
            this.options.lineWidth = stroke.width;
            
            for (let i = 1; i < stroke.points.length; i++) {
                this.drawLine(stroke.points[i - 1], stroke.points[i]);
            }
            
            this.currentTool = oldTool;
            this.options.color = oldColor;
            this.options.lineWidth = oldWidth;
        });
    }
    
    setTool(tool) {
        this.currentTool = tool;
        
        if (tool === 'eraser') {
            this.canvas.style.cursor = 'cell';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
    }
    
    setColor(color) {
        this.options.color = color;
    }
    
    setLineWidth(width) {
        this.options.lineWidth = width;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes = [];
    }
    
    undo() {
        if (this.strokes.length > 0) {
            this.strokes.pop();
            this.redrawStrokes();
        }
    }
    
    exportAsImage() {
        return this.canvas.toDataURL('image/png');
    }
    
    downloadAnnotation(filename = 'annotation') {
        const dataUrl = this.exportAsImage();
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Toolbar helper function
function createAnnotationToolbar(annotator) {
    const toolbar = document.createElement('div');
    toolbar.id = 'annotation-toolbar';
    toolbar.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 12px;
        padding: 12px;
        display: flex;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
    `;
    
    const tools = [
        { icon: '✏️', tool: 'pen', title: 'Pen' },
        { icon: '🖍️', tool: 'highlighter', title: 'Highlighter' },
        { icon: '🧹', tool: 'eraser', title: 'Eraser' },
        { icon: '↩️', action: 'undo', title: 'Undo' },
        { icon: '🗑️', action: 'clear', title: 'Clear All' },
        { icon: '💾', action: 'save', title: 'Save' }
    ];
    
    tools.forEach(({ icon, tool, action, title }) => {
        const btn = document.createElement('button');
        btn.textContent = icon;
        btn.title = title;
        btn.style.cssText = `
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            width: 44px;
            height: 44px;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s;
        `;
        
        btn.onclick = () => {
            if (tool) {
                annotator.setTool(tool);
                // Update active state
                toolbar.querySelectorAll('button').forEach(b => {
                    b.style.background = '#f8fafc';
                    b.style.borderColor = '#e2e8f0';
                });
                btn.style.background = '#3b82f6';
                btn.style.borderColor = '#3b82f6';
                btn.style.color = 'white';
            } else if (action === 'undo') {
                annotator.undo();
            } else if (action === 'clear') {
                if (confirm('Clear all annotations?')) {
                    annotator.clear();
                }
            } else if (action === 'save') {
                annotator.downloadAnnotation('pdf-annotation');
            }
        };
        
        toolbar.appendChild(btn);
    });
    
    // Color picker
    const colors = ['#e74c3c', '#3b82f6', '#10b981', '#f59e0b', '#000000'];
    colors.forEach(color => {
        const btn = document.createElement('button');
        btn.style.cssText = `
            background: ${color};
            border: 2px solid #e2e8f0;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        btn.onclick = () => annotator.setColor(color);
        toolbar.appendChild(btn);
    });
    
    return toolbar;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.PDFAnnotator = PDFAnnotator;
    window.createAnnotationToolbar = createAnnotationToolbar;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PDFAnnotator, createAnnotationToolbar };
}
