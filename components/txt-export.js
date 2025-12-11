// Universal TXT Export Utility for OIM Executive Suite
// Compatible with all devices: iOS, Android, Desktop
// Version: 1.0.0

/**
 * Export data as formatted TXT file
 * Works offline and handles iOS Safari quirks
 * 
 * @param {Object} data - Data object to export
 * @param {string} filename - Filename without extension
 * @param {Object} options - Formatting options
 */
function exportToTXT(data, filename = 'export', options = {}) {
    const {
        title = 'OIM EXECUTIVE SUITE - DATA EXPORT',
        includeTimestamp = true,
        formatStyle = 'structured', // 'simple' or 'structured'
        sections = []
    } = options;
    
    let txtContent = '';
    const timestamp = new Date().toLocaleString('en-MY', { 
        timeZone: 'Asia/Kuala_Lumpur',
        dateStyle: 'full',
        timeStyle: 'long'
    });
    
    // Header
    if (formatStyle === 'structured') {
        txtContent += '═'.repeat(70) + '\n';
        txtContent += centerText(title, 70) + '\n';
        txtContent += '═'.repeat(70) + '\n\n';
    } else {
        txtContent += `=== ${title} ===\n\n`;
    }
    
    // Timestamp
    if (includeTimestamp) {
        txtContent += `Generated: ${timestamp}\n`;
        txtContent += `Platform: ${navigator.userAgent.includes('iPhone') ? 'iPhone' : 
                                   navigator.userAgent.includes('iPad') ? 'iPad' : 
                                   navigator.userAgent.includes('Android') ? 'Android' : 'Desktop'}\n\n`;
        txtContent += '─'.repeat(70) + '\n\n';
    }
    
    // Process sections or auto-detect from data
    if (sections.length > 0) {
        sections.forEach(section => {
            txtContent += formatSection(section, data, formatStyle);
        });
    } else {
        // Auto-format all data
        txtContent += formatObjectRecursive(data, formatStyle, 0);
    }
    
    // Footer
    txtContent += '\n' + '─'.repeat(70) + '\n';
    txtContent += `End of Report\n`;
    txtContent += `© ${new Date().getFullYear()} Aziz Mohamad - Enterprise Solutions Division\n`;
    
    // Download the file
    downloadTxtFile(txtContent, filename);
}

/**
 * Format a section with title and data
 */
function formatSection(section, data, formatStyle) {
    const { title, key, formatter } = section;
    let content = '';
    
    if (formatStyle === 'structured') {
        content += `\n╔═══ ${title.toUpperCase()} ═══╗\n\n`;
    } else {
        content += `\n=== ${title.toUpperCase()} ===\n\n`;
    }
    
    const sectionData = key ? data[key] : data;
    
    if (formatter) {
        content += formatter(sectionData);
    } else if (Array.isArray(sectionData)) {
        sectionData.forEach((item, index) => {
            content += `${index + 1}. ${formatItem(item)}\n`;
        });
    } else if (typeof sectionData === 'object') {
        content += formatObjectRecursive(sectionData, formatStyle, 1);
    } else {
        content += `${sectionData}\n`;
    }
    
    content += '\n';
    return content;
}

/**
 * Format object recursively
 */
function formatObjectRecursive(obj, formatStyle, indent = 0) {
    let content = '';
    const indentStr = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim()
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        if (value === null || value === undefined) {
            continue;
        } else if (Array.isArray(value)) {
            content += `${indentStr}${formattedKey}:\n`;
            value.forEach((item, index) => {
                if (typeof item === 'object') {
                    content += `${indentStr}  ${index + 1}.\n`;
                    content += formatObjectRecursive(item, formatStyle, indent + 2);
                } else {
                    content += `${indentStr}  • ${item}\n`;
                }
            });
        } else if (typeof value === 'object') {
            content += `${indentStr}${formattedKey}:\n`;
            content += formatObjectRecursive(value, formatStyle, indent + 1);
        } else {
            content += `${indentStr}${formattedKey}: ${value}\n`;
        }
    }
    
    return content;
}

/**
 * Format individual item
 */
function formatItem(item) {
    if (typeof item === 'object') {
        return Object.entries(item)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
    }
    return item;
}

/**
 * Center text for headers
 */
function centerText(text, width) {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
}

/**
 * Download TXT file with iOS compatibility
 */
function downloadTxtFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.txt`;
    
    // Detect iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS || (isSafari && navigator.maxTouchPoints > 0)) {
        // iOS Safari - use different approach
        downloadIOS(content, fullFilename);
    } else {
        // Standard download for other browsers
        const a = document.createElement('a');
        a.href = url;
        a.download = fullFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`✅ Exported: ${fullFilename}`, 'success');
    }
}

/**
 * iOS-specific download handler
 */
function downloadIOS(content, filename) {
    // Method 1: Try opening in new window
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for iOS
    const win = window.open(url, '_blank');
    
    if (win) {
        showNotification(`✅ File opened. Tap 'Share' → 'Save to Files' to download: ${filename}`, 'info');
    } else {
        // Fallback: Copy to clipboard
        copyToClipboard(content, filename);
    }
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Copy content to clipboard (fallback for iOS)
 */
function copyToClipboard(content, filename) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(content).then(() => {
            showNotification(`📋 Content copied to clipboard! Paste to save as: ${filename}`, 'success');
        }).catch(() => {
            // Ultimate fallback - show content in textarea
            showContentModal(content, filename);
        });
    } else {
        showContentModal(content, filename);
    }
}

/**
 * Show content in modal for manual copy (ultimate fallback)
 */
function showContentModal(content, filename) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    const content_box = document.createElement('div');
    content_box.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
    `;
    
    content_box.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #1e293b;">Export: ${filename}</h3>
        <textarea readonly style="
            flex: 1;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            font-family: monospace;
            font-size: 12px;
            resize: none;
            margin-bottom: 16px;
        ">${content}</textarea>
        <button onclick="this.closest('div').parentElement.remove()" style="
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 12px;
            font-weight: 600;
            cursor: pointer;
        ">Close</button>
    `;
    
    modal.appendChild(content_box);
    document.body.appendChild(modal);
    
    // Select all text
    const textarea = content_box.querySelector('textarea');
    textarea.select();
}

/**
 * Show notification (assumes showNotification function exists)
 */
function showNotification(message, type = 'info') {
    // Try to use existing notification system
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else if (typeof window.showAlert === 'function') {
        window.showAlert(message, type);
    } else {
        // Fallback to console
        console.log(`[${type}] ${message}`);
        alert(message);
    }
}

// Make function globally available
if (typeof window !== 'undefined') {
    window.exportToTXT = exportToTXT;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { exportToTXT };
}
