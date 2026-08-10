/**
 * Hardcoded list of valid GitHub IDs (usernames) for account verification.
 * Usernames are normalized (lowercased, trimmed, leading @ removed).
 */
export const VALID_GITHUB_IDS = [
  'ry',
  'himaashok0410-dotcom', 'devjain010', 'CalmOutlaws', 'Harshita-Shreevastav', 'vinay-d07', 'natalipawar', 'manaswi1710', 'decodechinnu18', 'nydhile77', 'shreyasmulekar', 'Kritika-Panwar-151', 'sakshisarraf31-gif', 'Ananya-Shetty-24', 'vismay-b-srinivas', 'achintyakumar237', 'abhishekv898', 'AnishVNairy', 'shivanvithajayam', 'NAYANA-N-13', 'bhaktichethan-bit', 'akshat-005', 'kusuma-r-dev', 'dmrudula-19', 'punithkumar-060308', 'itz1cr', 'XCcutor', 'AdiIrl18', 'adi-sach', 'dharyagoyal', 'anwesha01b', 'Rajen5145', 'AdithyaND12', 'smruthi006', 'Keerthana-M-06', 'archirkhatri', 'pushkar-code', 'sharathprime10-coder', 'Roshni13102007', 'LAKSHITA1206', 'Kakul29', 'NaisargPurohit', 'vedxnt-10', 'saicharanraju2005', 'SaiChiranth-dev', 'anikanandish', 'achinthyam08', 'soha-k10', 'hrudaysai07', 'MishthyAgrawal', 'Harryhist', 'AdarshHegde001', 'HazalAliNachan', 'hema-ga', 'shashvath33-ux', 'Darshan-Biligiri', 'Dedeepya25', 'adarsh-mali',
  'aishwaryagaler', 'swatinz-jpg'
];

/**
 * Normalizes a raw GitHub username.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeGithubId(raw) {
  return String(raw || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase();
}

/**
 * The list above is written the way GitHub displays each handle, capitals and
 * all, while the input is lowercased before comparison. Normalising the list
 * once here is what makes the two meet — comparing raw entries rejected every
 * username containing a capital letter.
 */
const VALID_GITHUB_ID_SET = new Set(VALID_GITHUB_IDS.map(normalizeGithubId));

/**
 * Checks if a given username is in the valid GitHub IDs list. GitHub handles
 * are case-insensitive, so @AdarshHegde001 and @adarshhegde001 are one person.
 * @param {string} rawUsername
 * @returns {boolean}
 */
export function isValidGithubId(rawUsername) {
  const normalized = normalizeGithubId(rawUsername);
  if (!normalized) return false;
  return VALID_GITHUB_ID_SET.has(normalized);
}
