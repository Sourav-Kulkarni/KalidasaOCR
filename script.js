const COLORS = ['YELLOW', 'GREEN', 'BLUE'];
let state = {
    sanskrit: { colorIndex: 0, content: "" },
    english: { colorIndex: 0, content: "" }
};
let globalHistory = [];

window.onload = () => {
    const saved = localStorage.getItem('kalidasa_pro_v4');
    if (saved) {
        state = JSON.parse(saved);
        refreshUI('sanskrit');
        refreshUI('english');
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

    // Ctrl+Shift+S: Highlight
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
            state[side].content = ed.innerHTML;
            // Decrement color index with loop back
            state[side].colorIndex = (state[side].colorIndex - 1 + COLORS.length) % COLORS.length;
            updateIndicator(side);
            refreshUI(side);
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
            sanskrit: oddNodes[i].innerText.replace(' × ', '').trim(),
            english: evenNodes[i].innerText.replace(' × ', '').trim()
        });
    }

    const blob = new Blob([JSON.stringify(mappings, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'verse_mappings.json';
    a.click();
}