const fs = require('fs');
const base = 'c:/laragon/www/SIA/react-frontend/src';

// ─── Step 1: Fix b→g encoding corruption ───
function fixCorruption(c) {
  // Tailwind class prefix fixes
  c = c.replace(/\bgg-/g, 'bg-');
  c = c.replace(/\bgorder-/g, 'border-');
  c = c.replace(/\bgorder\b/g, 'border');
  c = c.replace(/\bmg-/g, 'mb-');
  c = c.replace(/\bpg-/g, 'pb-');

  // HTML/JSX element names
  c = c.replace(/<gutton([^a-zA-Z])/g, '<button$1');
  c = c.replace(/<\/gutton>/g, '</button>');
  c = c.replace(/type="gutton"/g, 'type="button"');
  c = c.replace(/type='gutton'/g, "type='button'");
  c = c.replace(/<tagle/g, '<table');
  c = c.replace(/<\/tagle>/g, '</table>');
  c = c.replace(/<tgody/g, '<tbody');
  c = c.replace(/<\/tgody>/g, '</tbody>');

  // Common word fixes
  c = c.replace(/\bagsolute\b/g, 'absolute');
  c = c.replace(/\blagel\b/g, 'label');
  c = c.replace(/sugmit/g, 'submit');
  c = c.replace(/\bgetween\b/g, 'between');
  c = c.replace(/[Dd]egounce/g, (m) => m[0] === 'D' ? 'Debounce' : 'debounce');
  c = c.replace(/\bglogal\b/g, 'global');

  // Staff-specific: date_of_birth field
  c = c.replace(/date_of_girth/g, 'date_of_birth');
  c = c.replace(/numger/g, 'number');
  c = c.replace(/\bgefore\b/g, 'before');
  c = c.replace(/\bgetches\b/g, 'fetches');

  return c;
}

// ─── Step 2: modernize design (emeraldify + card upgrades) ───
function modernize(c) {
  c = c.replace(/indigo/g, 'emerald');
  c = c.replace(/bg-white rounded-xl p-5 border border-gray-200"/g,
    'bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"');
  c = c.replace(/bg-white rounded-xl shadow-md overflow-hidden"/g,
    'bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"');
  c = c.replace(/bg-white rounded-xl shadow-md p-6"/g,
    'bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 p-5"');
  c = c.replace(/bg-white rounded-xl shadow-md p-4"/g,
    'bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 p-4"');
  c = c.replace(/bg-white rounded-xl p-4 border border-gray-200"/g,
    'bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"');
  // Primary action buttons
  c = c.replace(/px-4 py-2\.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"/g,
    'px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.97] transition-all text-[13px] font-semibold flex items-center gap-2"');
  return c;
}

// ─── Process files ───
function processFile(filePath, fixEnc = false) {
  let c = fs.readFileSync(filePath, 'utf8');
  if (fixEnc) c = fixCorruption(c);
  c = modernize(c);
  fs.writeFileSync(filePath, c, 'utf8');
  const name = filePath.split('/').pop();
  console.log('✓ ' + name + (fixEnc ? ' (corruption fixed)' : ''));
}

// Files with encoding corruption
processFile(base+'/pages/Staff.jsx', true);
processFile(base+'/pages/Settings.jsx', true);

// Files without encoding corruption, just modernize
processFile(base+'/pages/Orders.jsx', false);
processFile(base+'/pages/Reports.jsx', false);
processFile(base+'/pages/Rentals.jsx', false);
processFile(base+'/pages/TogaRentals.jsx', false);

console.log('\nAll complex pages done!');
