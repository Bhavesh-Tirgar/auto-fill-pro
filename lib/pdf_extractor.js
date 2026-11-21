/**
 * Auto Fill Pro v2.0 - Local PDF Resume Text Extractor
 * 100% on-device, zero network requests, zero remote dependencies.
 * Extracts textual content from PDF ArrayBuffer and extracts candidate profile attributes.
 */

function extractTextFromPdfBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binaryString += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }

  const textPieces = [];

  // 1. Extract Tj commands: (string) Tj
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(binaryString)) !== null) {
    textPieces.push(decodePdfString(match[1]));
  }

  // 2. Extract TJ array commands: [(str) 20 (ing)] TJ
  const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(binaryString)) !== null) {
    const inner = match[1];
    const subRegex = /\(([^)]+)\)/g;
    let subMatch;
    let line = '';
    while ((subMatch = subRegex.exec(inner)) !== null) {
      line += decodePdfString(subMatch[1]);
    }
    if (line) textPieces.push(line);
  }

  // 3. Fallback: stream text extraction
  if (textPieces.length < 5) {
    const rawMatches = binaryString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|https?:\/\/[^\s>)]+|linkedin\.com\/in\/[a-zA-Z0-9_-]+/g);
    if (rawMatches) {
      textPieces.push(...rawMatches);
    }
  }

  return textPieces.join('\n');
}

function decodePdfString(str) {
  if (!str) return '';
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (m, oct) => String.fromCharCode(parseInt(oct, 8)));
}

/**
 * Parses raw extracted resume text into structured profile attributes
 */
function parseResumeText(rawText) {
  const profile = {};
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Email extraction
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  if (emailMatch) {
    profile.email = emailMatch[0];
  }

  // 2. Phone extraction
  const phoneMatch = rawText.match(/(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/);
  if (phoneMatch) {
    profile.phone = phoneMatch[0].replace(/[-.\s]/g, '');
  }

  // 3. LinkedIn & GitHub URLs
  const linkedinMatch = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+|linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) {
    profile.linkedinUrl = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : 'https://' + linkedinMatch[0];
  }

  const githubMatch = rawText.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+|github\.com\/[a-zA-Z0-9_-]+/i);
  if (githubMatch) {
    profile.githubUrl = githubMatch[0].startsWith('http') ? githubMatch[0] : 'https://' + githubMatch[0];
  }

  // 4. Name extraction heuristic (First line that doesn't contain email, phone or URL)
  for (const line of lines) {
    if (line.length >= 3 && line.length <= 40 && !line.includes('@') && !line.includes('http') && !/\d/.test(line)) {
      if (/^[A-Za-z\s.'-]+$/.test(line)) {
        profile.fullName = line;
        const parts = line.split(/\s+/);
        profile.firstName = parts[0] || '';
        if (parts.length > 2) {
          profile.middleName = parts.slice(1, -1).join(' ');
          profile.lastName = parts[parts.length - 1] || '';
        } else if (parts.length === 2) {
          profile.lastName = parts[1] || '';
        }
        break;
      }
    }
  }

  // 5. Skills extraction
  const knownSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
    'HTML', 'CSS', 'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Git',
    'Django', 'Spring Boot', 'Next.js', 'Tailwind', 'GraphQL', 'Express'
  ];
  const detectedSkills = [];
  for (const skill of knownSkills) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(rawText)) {
      detectedSkills.push(skill);
    }
  }
  if (detectedSkills.length > 0) {
    profile.skills = detectedSkills.join(', ');
  }

  // 6. Degree and Education extraction
  if (/\b(b\.tech|bachelor of technology|b\.e\.|bca|b\.sc|bachelor of engineering)\b/i.test(rawText)) {
    profile.gradDegree = 'B.Tech';
  } else if (/\b(m\.tech|master of technology|mca|m\.sc|mba)\b/i.test(rawText)) {
    profile.gradDegree = 'M.Tech';
  }

  // Year of passing
  const years = rawText.match(/\b(20[12]\d)\b/g);
  if (years && years.length > 0) {
    const sortedYears = [...new Set(years)].sort();
    profile.gradPassingYear = sortedYears[sortedYears.length - 1];
  }

  return profile;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractTextFromPdfBuffer,
    decodePdfString,
    parseResumeText
  };
} else {
  window.AutoFillPdfExtractor = {
    extractTextFromPdfBuffer,
    decodePdfString,
    parseResumeText
  };
}
