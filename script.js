const COLORS = ['YELLOW', 'GREEN', 'BLUE'];
let state = {
    sanskrit: { colorIndex: 0, content: "", lastHighlightLine: 0 },
    english: { colorIndex: 0, content: "", lastHighlightLine: 0 }
};
let globalHistory = [];

window.onload = () => {
    const saved = localStorage.getItem('kalidasa_pro_v4');
    if (saved) {
        state = JSON.parse(saved);
        refreshUI('sanskrit');
        refreshUI('english');
        scrollToLastHighlight('sanskrit');
        scrollToLastHighlight('english');
    }
    checkEmpty();
};``

function persist() {
    localStorage.setItem('ocr_project', JSON.stringify(state));
}

function takeSnapshot() {
    globalHistory.push(JSON.parse(JSON.stringify(state)));
    if (globalHistory.length > 30) globalHistory.shift();
}

// Global Keyboard Listener
document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl+Z: Undo
    if (cmdKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (globalHistory.length > 0) {
            state = globalHistory.pop();
            refreshUI('sanskrit'); refreshUI('english');
            persist();
        }
    }

    // Ctrl+S: Save Project
    if (cmdKey && e.key.toLowerCase() === 's' && !e.shiftKey) {
        e.preventDefault();
        saveToDisk();
    }

    // Ctrl+Shift+S: Highlight (with preventDefault to disable default behavior)
    if (cmdKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const editor = (container.nodeType === 3 ? container.parentNode : container).closest('.editor');

            if (editor) {
                const side = editor.id.split('-')[0];
                takeSnapshot();
                applyHighlight(side, selection);
            }
        }
    }
});

// Click outside highlight to deactivate it
document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.hl-node')) {
        document.querySelectorAll('.hl-node').forEach(n => n.classList.remove('active-hl'));
    }
});

function refreshUI(side) {
    document.getElementById(`${side}-editor`).innerHTML = state[side].content;
    updateIndicator(side);
    updateCount(side);
    updateHighlightNumbers(side);
    updateLineNumbers(side);
    updateAnalysisProgress(side);
    checkEmpty();
}

function updateIndicator(side) {
    const label = document.querySelector(`#${side}-indicator .color-label`);
    label.innerText = COLORS[state[side].colorIndex];
    label.style.backgroundColor = `var(--color${state[side].colorIndex})`;
}

function updateCount(side) {
    const count = document.getElementById(`${side}-editor`).querySelectorAll('.hl-node').length;
    document.getElementById(`${side}-count`).innerText = count;
}

function updateHighlightNumbers(side) {
    const ed = document.getElementById(`${side}-editor`);
    const highlights = ed.querySelectorAll('.hl-node');
    
    highlights.forEach((highlight, index) => {
        // Update highlight number
        let hlNumber = highlight.querySelector('.hl-number');
        if (!hlNumber) {
            hlNumber = document.createElement('span');
            hlNumber.className = 'hl-number';
            hlNumber.contentEditable = 'false';
            highlight.appendChild(hlNumber);
        }
        hlNumber.textContent = index + 1;
        
        // Update color class based on position
        const colorIndex = index % COLORS.length;
        // Remove old color classes
        highlight.classList.remove('hl-0', 'hl-1', 'hl-2');
        // Add new color class
        highlight.classList.add(`hl-${colorIndex}`);
        
        // Ensure delete button exists
        if (!highlight.querySelector('.del-btn')) {
            const delBtn = document.createElement('span');
            delBtn.innerHTML = '&times;';
            delBtn.className = 'del-btn';
            delBtn.contentEditable = 'false';
            highlight.appendChild(delBtn);
        }
    });
}

function checkEmpty() {
    ['sanskrit', 'english'].forEach(side => {
        const isEmpty = document.getElementById(`${side}-editor`).innerText.trim() === "";
        document.getElementById(`${side}-empty`).style.display = isEmpty ? 'flex' : 'none';
    });
}

document.querySelectorAll('.editor').forEach(ed => {
    ed.addEventListener('focus', () => takeSnapshot());
    ed.addEventListener('input', () => {
        const side = ed.id.split('-')[0];
        state[side].content = ed.innerHTML;
        persist();
        updateCount(side);
        updateHighlightNumbers(side);
        updateLineNumbers(side);
    });

    // Sync gutter scroll with editor
    ed.addEventListener('scroll', () => {
        const side = ed.id.split('-')[0];
        const gutter = document.getElementById(`${side}-gutter`);
        if (gutter) gutter.scrollTop = ed.scrollTop;
    });

    ed.addEventListener('click', (e) => {
        const side = ed.id.split('-')[0];
        const highlight = e.target.closest('.hl-node');

        if (e.target.classList.contains('del-btn')) {
            takeSnapshot();
            const node = e.target.parentElement;
            node.replaceWith(...node.childNodes);
            // Clean up text nodes
            ed.querySelectorAll('.del-btn').forEach(b => b.remove());
            ed.querySelectorAll('.hl-number').forEach(n => n.remove());
            state[side].content = ed.innerHTML;
            // Decrement color index with loop back
            state[side].colorIndex = (state[side].colorIndex - 1 + COLORS.length) % COLORS.length;
            updateIndicator(side);
            refreshUI(side);
            // Save updated content after highlights are refreshed and renumbered
            state[side].content = ed.innerHTML;
            persist();
        } else if (highlight) {
            // Activate highlight on click
            document.querySelectorAll('.hl-node').forEach(n => n.classList.remove('active-hl'));
            highlight.classList.add('active-hl');
        }
    });
});

function applyHighlight(side, selection) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = `hl-node hl-${state[side].colorIndex}`;

    const delBtn = document.createElement('span');
    delBtn.innerHTML = '&times;';
    delBtn.className = 'del-btn';
    delBtn.contentEditable = 'false';

    try {
        range.surroundContents(span);
        span.appendChild(delBtn);
    } catch (e) {
        alert("Selection overlap. Highlight a clean segment of text.");
        return;
    }

    state[side].colorIndex = (state[side].colorIndex + 1) % 3;
    state[side].content = document.getElementById(`${side}-editor`).innerHTML;
    selection.removeAllRanges();
    refreshUI(side);
    persist();
}

function updateLineNumbers(side) {
    const ed = document.getElementById(`${side}-editor`);
    const gutter = document.getElementById(`${side}-gutter`);
    if (!ed || !gutter) return;

    // Count rendered lines using innerText newlines
    const text = ed.innerText || '';
    const lines = text.split(/\r\n|\r|\n/).length || 1;
    let nums = '';
    for (let i = 1; i <= lines; i++) nums += i + '\n';
    gutter.querySelector('.line-numbers').innerText = nums;
    // Keep gutter scroll synced
    gutter.scrollTop = ed.scrollTop;
}

function getLastHighlightLine(side) {
    const ed = document.getElementById(`${side}-editor`);
    const highlights = ed.querySelectorAll('.hl-node');
    if (highlights.length === 0) return 0;
    
    const lastHighlight = highlights[highlights.length - 1];
    const editorText = ed.innerText;
    const highlightText = lastHighlight.innerText.replace(' × ', '').trim();
    
    // Count lines from start of editor to the last highlight
    const textUpToHighlight = ed.textContent.substring(0, ed.textContent.indexOf(highlightText));
    const lineNum = textUpToHighlight.split(/\r\n|\r|\n/).length;
    return lineNum;
}

function getTotalLines(side) {
    const ed = document.getElementById(`${side}-editor`);
    const text = ed.innerText || '';
    return text.split(/\r\n|\r|\n/).length || 1;
}

function updateAnalysisProgress(side) {
    const lastLine = getLastHighlightLine(side);
    const totalLines = getTotalLines(side);
    state[side].lastHighlightLine = lastLine;
    
    const percentage = totalLines > 0 ? Math.round((lastLine / totalLines) * 100) : 0;
    const paneTitle = document.querySelector(`#${side}-indicator`).parentElement.querySelector('.pane-title');
    paneTitle.innerText = `${side.toUpperCase()} (${percentage}%)`;
}

function scrollToLastHighlight(side) {
    const ed = document.getElementById(`${side}-editor`);
    if (!ed || state[side].lastHighlightLine === 0) return;
    
    const lineHeight = parseFloat(window.getComputedStyle(ed).lineHeight);
    const scrollPosition = (state[side].lastHighlightLine - 1) * lineHeight;
    ed.scrollTop = scrollPosition;
    document.getElementById(`${side}-gutter`).scrollTop = scrollPosition;
}


// --- FILE OPERATIONS ---

function handleTxtFile(input, side) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        takeSnapshot();
        state[side].content = e.target.result;
        refreshUI(side);
        persist();
    };
    reader.readAsText(file);
}

function saveToDisk() {
    const data = JSON.stringify(state);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kalidasa_project.json';
    a.click();
}

function loadProject(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        takeSnapshot();
        state = JSON.parse(e.target.result);
        refreshUI('sanskrit'); refreshUI('english');
        scrollToLastHighlight('sanskrit');
        scrollToLastHighlight('english');
    };
    reader.readAsText(file);
}

function exportMappings() {
    const oddNodes = document.getElementById('sanskrit-editor').querySelectorAll('.hl-node');
    const evenNodes = document.getElementById('english-editor').querySelectorAll('.hl-node');

    const mappings = [];
    const len = Math.min(oddNodes.length, evenNodes.length);

    for (let i = 0; i < len; i++) {
        mappings.push({
            map_id: i + 1,
            sanskrit: oddNodes[i].innerText.replace(' × ', '').split('\n').map(l => l.trim()).filter(l => l).join('\n'),
            english: evenNodes[i].innerText.replace(' × ', '').split('\n').map(l => l.trim()).filter(l => l).join('\n')
        });
    }

    const blob = new Blob([JSON.stringify(mappings, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'verse_mappings.json';
    a.click();
}