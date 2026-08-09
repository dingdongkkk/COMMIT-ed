/**
 * Hardcoded list of valid GitHub IDs (usernames) for account verification.
 * Usernames are normalized (lowercased, trimmed, leading @ removed).
 */
export const VALID_GITHUB_IDS = [
  'ry',
  'himaashok0410-dotcom', 'CalmOutlaws', 'Harshita-Shreevastav', 'vinay-d07', 'manaswi1710', 'nydhile77', 'shreyasmulekar', 'sakshisarraf31-gif', 'Ananya-Shetty-24', 'vismay-b-srinivas', 'achintyakumar237', 'abhishekv898', 'AnishVNairy', 'shivanvithajayam', 'NAYANA-N-13', 'bhaktichethan-bit', 'akshat-005', 'kusuma-r-dev', 'dmrudula-19', 'punithkumar-060308', 'itz1cr', 'XCcutor', 'adi-sach', 'dharyagoyal', 'anwesha01b', 'Rajen5145', 'AdithyaND12', 'Keerthana-M-06', 'pushkar-code', 'sharathprime10-coder', 'Roshni13102007', 'LAKSHITA1206', 'Kakul29', 'NaisargPurohit', 'vedxnt-10', 'saicharanraju2005', 'SaiChiranth-dev', 'anikanandish', 'achinthyam08', 'soha-k10', 'hrudaysai07', 'MishthyAgrawal', 'AdarshHegde001', 'HazalAliNachan', 'hema-ga', 'shashvath33-ux', 'Darshan-Biligiri', 'Dedeepya25', 'adarsh-mali', 'decodechinnu18'
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
 * Checks if a given username is in the valid GitHub IDs list.
 * @param {string} rawUsername
 * @returns {boolean}
 */
export function isValidGithubId(rawUsername) {
  const normalized = normalizeGithubId(rawUsername);
  if (!normalized) return false;
  return VALID_GITHUB_IDS.includes(normalized);
}
