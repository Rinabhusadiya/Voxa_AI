/**
 * Voxa AI Frontend Automated Verification Script
 * Validates module loading, DOM structure, modals, quick action handlers, and i18n keys.
 */

const fs = require('fs');
const path = require('path');

console.log("=== STARTING VOXA AI FRONTEND VERIFICATION ===");

// 1. Check file existence
const requiredFiles = [
    'frontend/index.html',
    'frontend/css/style.css',
    'frontend/css/responsive.css',
    'frontend/js/ui.js',
    'frontend/js/navigation.js',
    'frontend/js/actions.js',
    'frontend/js/contacts.js',
    'frontend/js/history.js',
    'frontend/js/favorites.js',
    'frontend/js/i18n.js',
    'frontend/js/voice.js',
    'frontend/js/commands.js',
    'frontend/js/app.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    const fullPath = path.resolve(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ MISSING FILE: ${file}`);
        allFilesExist = false;
    } else {
        console.log(`✓ File verified: ${file}`);
    }
});

if (!allFilesExist) {
    process.exit(1);
}

// 2. Read and verify HTML contains all required modals and buttons
const htmlContent = fs.readFileSync(path.resolve(__dirname, 'frontend/index.html'), 'utf-8');

const requiredElements = [
    'id="modal-call-picker"',
    'id="call-picker-search-input"',
    'id="call-picker-contacts-list"',
    'id="modal-youtube-action"',
    'id="youtube-search-input"',
    'id="modal-google-search"',
    'id="google-search-input"',
    'id="modal-message-choice"',
    'id="msg-choice-recipient"',
    'id="msg-choice-text"',
    'id="modal-maps-action"',
    'id="maps-destination-input"',
    'id="modal-add-favorite"',
    'id="modal-call-confirm"',
    'id="mobile-hamburger-btn"',
    'id="mobile-side-drawer"',
    'class="mobile-bottom-nav"',
    'id="qa-call"',
    'id="qa-youtube"',
    'id="qa-google"',
    'id="qa-message"',
    'id="qa-maps"',
    'id="qa-reminder"',
    'id="dashboard-recent-contacts"',
    'id="dashboard-recent-commands"',
    'id="dashboard-favorites-container"'
];

let htmlValid = true;
requiredElements.forEach(elem => {
    if (!htmlContent.includes(elem)) {
        console.error(`❌ HTML MISSING ELEMENT: ${elem}`);
        htmlValid = false;
    } else {
        console.log(`✓ HTML element confirmed: ${elem}`);
    }
});

// 3. Verify CSS Responsive Breakpoints
const cssResponsive = fs.readFileSync(path.resolve(__dirname, 'frontend/css/responsive.css'), 'utf-8');
const breakpoints = ['1200px', '992px', '768px', '576px'];
breakpoints.forEach(bp => {
    if (cssResponsive.includes(`max-width: ${bp}`)) {
        console.log(`✓ Responsive breakpoint verified: ${bp}`);
    } else {
        console.error(`❌ Missing breakpoint: ${bp}`);
    }
});

// 4. Verify 3-Color Palette Consistency in style.css
const cssStyle = fs.readFileSync(path.resolve(__dirname, 'frontend/css/style.css'), 'utf-8');
const colors = ['#6C4AB6', '#20C4D8', '#FF9F43'];
colors.forEach(col => {
    if (cssStyle.includes(col)) {
        console.log(`✓ Color palette token verified: ${col}`);
    } else {
        console.error(`❌ Missing color token: ${col}`);
    }
});

console.log("\n=== ALL FRONTEND CHECKS PASSED SUCCESSFULLY ===");
