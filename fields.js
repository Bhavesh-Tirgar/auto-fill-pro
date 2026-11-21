/**
 * Auto Fill Pro v2.0 - Field Definitions & Matching Engine
 * 100% on-device, zero-dependency field taxonomy and fuzzy matcher.
 */

// HARD SAFETY RULES: Never fill or store sensitive credentials or government ID numbers.
const HARD_SAFETY_BLACKLIST = [
  /password/i,
  /\bpass\b/i,
  /\bpin\b(?!\s*code|\s*pincode)/i, // Matches security/ATM PIN, excludes postal "pin code"
  /security[_\s-]?code/i,
  /secret/i,
  /otp\b/i,
  /one[_\s-]?time[_\s-]?password/i,
  /verification[_\s-]?code/i,
  /captcha/i,
  /cvv/i,
  /cvc/i,
  /card[_\s-]?number/i,
  /credit[_\s-]?card/i,
  /debit[_\s-]?card/i,
  /expir(y|ation)/i,
  /bank[_\s-]?acc(ount)?/i,
  /account[_\s-]?number/i,
  /ifsc/i,
  /micr/i,
  /aadhaar/i,
  /adhar/i,
  /uidai/i,
  /\bpan\b(?!\s*el)/i, // Matches PAN card, excludes "panel"
  /pan[_\s-]?card/i,
  /ssn/i,
  /social[_\s-]?security/i,
  /national[_\s-]?id/i,
  /tax[_\s-]?id/i,
  /routing[_\s-]?number/i,
  /security[_\s-]?question/i,
  /security[_\s-]?answer/i
];

/**
 * Standard Field Taxonomy
 * Organized by category with rich synonym lists covering Indian portals,
 * scholarship engines (NSP, state e-pass), and global ATS platforms (Greenhouse, Lever, Workday).
 */
const FIELD_DEFINITIONS = {
  // === BASIC PERSONAL ===
  fullName: {
    category: 'personal',
    label: 'Full Name',
    synonyms: [
      'full name', 'name of applicant', 'name of candidate', 'candidate name',
      'applicant name', 'complete name', 'student name', 'your name',
      'legal name', 'candidate full name', 'naam', 'candidate_name', 'full_name'
    ]
  },
  firstName: {
    category: 'personal',
    label: 'First Name',
    synonyms: ['first name', 'given name', 'fname', 'first_name', 'forename', 'first']
  },
  middleName: {
    category: 'personal',
    label: 'Middle Name',
    synonyms: ['middle name', 'mname', 'middle_name', 'middle']
  },
  lastName: {
    category: 'personal',
    label: 'Last Name',
    synonyms: ['last name', 'surname', 'family name', 'lname', 'last_name', 'last']
  },
  email: {
    category: 'personal',
    label: 'Email Address',
    synonyms: [
      'email', 'e-mail', 'email address', 'mail id', 'email id',
      'applicant email', 'candidate email', 'primary email', 'user email'
    ]
  },
  phone: {
    category: 'personal',
    label: 'Phone Number',
    synonyms: [
      'phone', 'mobile', 'mobile no', 'mobile number', 'contact number',
      'contact no', 'cell phone', 'cell number', 'telephone', 'phone number',
      'whatsapp no', 'whatsapp number', 'primary mobile', 'primary phone'
    ]
  },
  altPhone: {
    category: 'personal',
    label: 'Alternate Phone',
    synonyms: [
      'alternate phone', 'alt phone', 'alternate mobile', 'secondary phone',
      'secondary mobile', 'alt mobile', 'other contact', 'emergency contact'
    ]
  },
  dob: {
    category: 'personal',
    label: 'Date of Birth',
    synonyms: [
      'date of birth', 'dob', 'birth date', 'birthdate', 'born on',
      'date_of_birth', 'd.o.b'
    ]
  },
  gender: {
    category: 'personal',
    label: 'Gender',
    synonyms: ['gender', 'sex', 'male / female', 'gender identity']
  },
  maritalStatus: {
    category: 'personal',
    label: 'Marital Status',
    synonyms: ['marital status', 'civil status', 'married / single', 'marriage status']
  },
  bloodGroup: {
    category: 'personal',
    label: 'Blood Group',
    synonyms: ['blood group', 'blood type', 'blood_group']
  },
  nationality: {
    category: 'personal',
    label: 'Nationality',
    synonyms: ['nationality', 'citizenship', 'country of citizenship']
  },

  // === DEMOGRAPHICS & DIVERSITY (Indian Portals) ===
  category: {
    category: 'demographics',
    label: 'Social Category',
    synonyms: [
      'category', 'caste category', 'social category', 'reservation category',
      'community', 'caste' // General, OBC, SC, ST, EWS
    ]
  },
  religion: {
    category: 'demographics',
    label: 'Religion',
    synonyms: ['religion', 'faith', 'religious belief']
  },
  domicile: {
    category: 'demographics',
    label: 'Domicile State',
    synonyms: ['domicile', 'domicile state', 'state of domicile', 'native state']
  },
  motherTongue: {
    category: 'demographics',
    label: 'Mother Tongue',
    synonyms: ['mother tongue', 'native language', 'first language']
  },
  pwd: {
    category: 'demographics',
    label: 'Person with Disability (PwD)',
    synonyms: [
      'physically handicapped', 'pwd', 'disability', 'person with disability',
      'differently abled', 'handicapped'
    ]
  },
  disabilityType: {
    category: 'demographics',
    label: 'Disability Type',
    synonyms: ['disability type', 'nature of disability', 'type of handicap']
  },
  disabilityPercent: {
    category: 'demographics',
    label: 'Disability Percentage',
    synonyms: ['disability percentage', 'disability %', 'percentage of disability']
  },

  // === FAMILY DETAILS ===
  fatherName: {
    category: 'family',
    label: "Father's Name",
    synonyms: [
      "father's name", 'father name', 'father full name', 'name of father',
      'parent name', 'pita ka naam'
    ]
  },
  fatherOccupation: {
    category: 'family',
    label: "Father's Occupation",
    synonyms: ["father's occupation", 'father occupation', 'father profession']
  },
  motherName: {
    category: 'family',
    label: "Mother's Name",
    synonyms: [
      "mother's name", 'mother name', 'mother full name', 'name of mother',
      'mata ka naam'
    ]
  },
  motherOccupation: {
    category: 'family',
    label: "Mother's Occupation",
    synonyms: ["mother's occupation", 'mother occupation', 'mother profession']
  },
  guardianName: {
    category: 'family',
    label: "Guardian's Name",
    synonyms: ["guardian's name", 'guardian name', 'name of guardian']
  },
  annualIncome: {
    category: 'family',
    label: 'Annual Family Income',
    synonyms: [
      'annual income', 'family income', 'annual family income', 'household income',
      'parent income', 'total family income'
    ]
  },

  // === ADDRESS DETAILS ===
  addressLine1: {
    category: 'address',
    label: 'Address Line 1',
    synonyms: [
      'address line 1', 'address 1', 'street address', 'residential address',
      'house no', 'flat no', 'address line1', 'permanent address line 1'
    ]
  },
  addressLine2: {
    category: 'address',
    label: 'Address Line 2',
    synonyms: [
      'address line 2', 'address 2', 'street address 2', 'apartment',
      'suite', 'locality', 'area', 'landmark'
    ]
  },
  city: {
    category: 'address',
    label: 'City / Town',
    synonyms: ['city', 'town', 'village', 'city / town', 'municipality']
  },
  district: {
    category: 'address',
    label: 'District',
    synonyms: ['district', 'zilla', 'county']
  },
  taluka: {
    category: 'address',
    label: 'Taluka / Tehsil / Sub-district',
    synonyms: ['taluka', 'tehsil', 'mandal', 'sub-district', 'sub district', 'block']
  },
  state: {
    category: 'address',
    label: 'State / Province',
    synonyms: ['state', 'province', 'state / union territory', 'region']
  },
  pincode: {
    category: 'address',
    label: 'Postal PIN / Pincode / ZIP',
    synonyms: [
      'pin code', 'pincode', 'postal code', 'zip code', 'zip', 'postal pin',
      'area pin code', 'pin'
    ]
  },
  country: {
    category: 'address',
    label: 'Country',
    synonyms: ['country', 'nation', 'country of residence']
  },

  // === EDUCATION - 10TH / SSC ===
  tenthSchool: {
    category: 'education_10th',
    label: '10th School / Institute Name',
    tier: '10th',
    synonyms: [
      '10th school', 'matric school', 'secondary school', 'ssc school',
      '10th institute', 'high school name'
    ]
  },
  tenthBoard: {
    category: 'education_10th',
    label: '10th Board of Examination',
    tier: '10th',
    synonyms: [
      '10th board', 'matric board', 'secondary board', 'ssc board',
      'class 10 board', '10th examination board'
    ]
  },
  tenthPassingYear: {
    category: 'education_10th',
    label: '10th Passing Year',
    tier: '10th',
    synonyms: [
      '10th passing year', '10th year of passing', 'matric year', 'ssc passing year',
      'class 10 pass year', '10th completion year'
    ]
  },
  tenthRollNo: {
    category: 'education_10th',
    label: '10th Roll Number / Registration No',
    tier: '10th',
    synonyms: [
      '10th roll no', '10th roll number', 'matric roll no', 'ssc hall ticket no',
      'class 10 roll no', '10th registration no'
    ]
  },
  tenthMarksObtained: {
    category: 'education_10th',
    label: '10th Marks Obtained',
    tier: '10th',
    synonyms: ['10th marks obtained', '10th score', '10th secured marks', 'ssc marks obtained']
  },
  tenthTotalMarks: {
    category: 'education_10th',
    label: '10th Maximum / Total Marks',
    tier: '10th',
    synonyms: ['10th total marks', '10th max marks', '10th maximum marks', 'ssc total marks']
  },
  tenthPercentage: {
    category: 'education_10th',
    label: '10th Percentage / CGPA',
    tier: '10th',
    synonyms: [
      '10th percentage', '10th %', '10th cgpa', 'ssc percentage', 'matric percentage',
      'class 10 percentage'
    ]
  },

  // === EDUCATION - 12TH / HSC / DIPLOMA ===
  twelfthSchool: {
    category: 'education_12th',
    label: '12th Junior College / School Name',
    tier: '12th',
    synonyms: [
      '12th school', '12th college', 'junior college', 'inter college',
      'hsc school', 'intermediate college', 'class 12 school'
    ]
  },
  twelfthBoard: {
    category: 'education_12th',
    label: '12th Board / Council',
    tier: '12th',
    synonyms: [
      '12th board', 'intermediate board', 'hsc board', 'class 12 board',
      'higher secondary board', '12th council'
    ]
  },
  twelfthStream: {
    category: 'education_12th',
    label: '12th Stream / Major (Science/Commerce/Arts)',
    tier: '12th',
    synonyms: [
      '12th stream', 'intermediate stream', 'hsc stream', '12th branch',
      'class 12 stream', 'subject group'
    ]
  },
  twelfthPassingYear: {
    category: 'education_12th',
    label: '12th Passing Year',
    tier: '12th',
    synonyms: [
      '12th passing year', '12th year of passing', 'inter pass year', 'hsc passing year',
      'class 12 pass year'
    ]
  },
  twelfthRollNo: {
    category: 'education_12th',
    label: '12th Roll Number',
    tier: '12th',
    synonyms: [
      '12th roll no', '12th roll number', 'inter roll no', 'hsc hall ticket no',
      'class 12 roll no'
    ]
  },
  twelfthMarksObtained: {
    category: 'education_12th',
    label: '12th Marks Obtained',
    tier: '12th',
    synonyms: ['12th marks obtained', '12th score', 'inter marks obtained', 'hsc marks']
  },
  twelfthTotalMarks: {
    category: 'education_12th',
    label: '12th Maximum / Total Marks',
    tier: '12th',
    synonyms: ['12th total marks', '12th max marks', 'inter total marks', 'hsc total marks']
  },
  twelfthPercentage: {
    category: 'education_12th',
    label: '12th Percentage / CGPA',
    tier: '12th',
    synonyms: [
      '12th percentage', '12th %', '12th cgpa', 'inter percentage', 'hsc percentage',
      'class 12 percentage'
    ]
  },

  // === EDUCATION - GRADUATION / UNDERGRADUATE ===
  gradCollege: {
    category: 'education_grad',
    label: 'Graduation College / Institute',
    tier: 'grad',
    synonyms: [
      'graduation college', 'degree college', 'college name', 'institute name',
      'bachelor college', 'undergraduate institute', 'ug college'
    ]
  },
  gradUniversity: {
    category: 'education_grad',
    label: 'Graduation University',
    tier: 'grad',
    synonyms: [
      'university', 'graduation university', 'degree university', 'affiliating university',
      'bachelor university', 'ug university'
    ]
  },
  gradDegree: {
    category: 'education_grad',
    label: 'Graduation Degree (B.Tech, B.E., B.Sc, BCA)',
    tier: 'grad',
    synonyms: [
      'degree', 'graduation degree', 'course name', 'degree name',
      'bachelor degree', 'ug degree', 'qualification'
    ]
  },
  gradBranch: {
    category: 'education_grad',
    label: 'Graduation Branch / Specialization / Major',
    tier: 'grad',
    synonyms: [
      'branch', 'specialization', 'major', 'discipline', 'department',
      'graduation branch', 'field of study'
    ]
  },
  gradStartYear: {
    category: 'education_grad',
    label: 'Graduation Start Year',
    tier: 'grad',
    synonyms: ['grad start year', 'admission year', 'year of joining', 'ug start year']
  },
  gradPassingYear: {
    category: 'education_grad',
    label: 'Graduation Passing Year / Expected Graduation',
    tier: 'grad',
    synonyms: [
      'graduation year', 'passing year', 'year of passing', 'expected graduation',
      'completion year', 'grad passing year', 'ug pass year'
    ]
  },
  gradRollNo: {
    category: 'education_grad',
    label: 'University Roll No / PRN / USN',
    tier: 'grad',
    synonyms: [
      'university roll no', 'registration number', 'prn', 'usn', 'enrollment no',
      'student id', 'hall ticket number'
    ]
  },
  gradCgpa: {
    category: 'education_grad',
    label: 'Graduation CGPA / GPA',
    tier: 'grad',
    synonyms: [
      'cgpa', 'gpa', 'cumulative grade', 'grad cgpa', 'ug cgpa', 'current cgpa'
    ]
  },
  gradPercentage: {
    category: 'education_grad',
    label: 'Graduation Percentage',
    tier: 'grad',
    synonyms: [
      'graduation percentage', 'grad percentage', 'aggregate percentage', 'ug %'
    ]
  },

  // === EDUCATION - POST GRADUATION / MASTERS ===
  pgCollege: {
    category: 'education_pg',
    label: 'PG College / Institute',
    tier: 'pg',
    synonyms: ['pg college', 'masters college', 'post graduation institute', 'pg institute']
  },
  pgUniversity: {
    category: 'education_pg',
    label: 'PG University',
    tier: 'pg',
    synonyms: ['pg university', 'masters university', 'post graduate university']
  },
  pgDegree: {
    category: 'education_pg',
    label: 'PG Degree (M.Tech, M.S., MCA, MBA)',
    tier: 'pg',
    synonyms: ['pg degree', 'masters degree', 'post graduate degree']
  },
  pgBranch: {
    category: 'education_pg',
    label: 'PG Branch / Specialization',
    tier: 'pg',
    synonyms: ['pg branch', 'pg specialization', 'masters branch']
  },
  pgPassingYear: {
    category: 'education_pg',
    label: 'PG Passing Year',
    tier: 'pg',
    synonyms: ['pg passing year', 'masters completion year', 'pg pass year']
  },
  pgCgpa: {
    category: 'education_pg',
    label: 'PG CGPA / Percentage',
    tier: 'pg',
    synonyms: ['pg cgpa', 'pg percentage', 'masters cgpa', 'post graduate %']
  },

  // === PROFESSIONAL & JOB APPLICATIONS ===
  currentCompany: {
    category: 'professional',
    label: 'Current Company / Employer',
    synonyms: [
      'current company', 'current employer', 'company name', 'present employer',
      'organization', 'current organization'
    ]
  },
  currentTitle: {
    category: 'professional',
    label: 'Current Job Title / Designation',
    synonyms: [
      'job title', 'current title', 'current role', 'designation', 'position',
      'present designation', 'current position'
    ]
  },
  totalExperienceYears: {
    category: 'professional',
    label: 'Total Experience (Years)',
    synonyms: [
      'total experience', 'years of experience', 'experience in years',
      'overall experience', 'work experience (years)', 'total exp'
    ]
  },
  noticePeriodDays: {
    category: 'professional',
    label: 'Notice Period (Days)',
    synonyms: [
      'notice period', 'notice period (days)', 'availability to join',
      'how soon can you join', 'notice period in days'
    ]
  },
  currentCtc: {
    category: 'professional',
    label: 'Current CTC / Salary',
    synonyms: [
      'current ctc', 'current salary', 'present ctc', 'present salary',
      'current annual salary', 'current compensation'
    ]
  },
  expectedCtc: {
    category: 'professional',
    label: 'Expected CTC / Salary',
    synonyms: [
      'expected ctc', 'expected salary', 'salary expectation', 'desired salary',
      'expected compensation', 'desired ctc'
    ]
  },
  skills: {
    category: 'professional',
    label: 'Key Skills / Technologies',
    synonyms: [
      'skills', 'key skills', 'technical skills', 'skills & competencies',
      'technologies', 'core competencies', 'top skills'
    ]
  },
  summary: {
    category: 'professional',
    label: 'Professional Summary / Bio',
    synonyms: [
      'summary', 'professional summary', 'bio', 'about you', 'cover letter',
      'short bio', 'personal statement', 'executive summary'
    ]
  },
  portfolioUrl: {
    category: 'professional',
    label: 'Portfolio / Website URL',
    synonyms: [
      'portfolio', 'portfolio url', 'website', 'personal website',
      'personal url', 'blog url'
    ]
  },
  linkedinUrl: {
    category: 'professional',
    label: 'LinkedIn Profile URL',
    synonyms: [
      'linkedin', 'linkedin profile', 'linkedin url', 'linkedin.com'
    ]
  },
  githubUrl: {
    category: 'professional',
    label: 'GitHub Profile URL',
    synonyms: [
      'github', 'github profile', 'github url', 'github.com', 'git profile'
    ]
  }
};

/**
 * Checks whether an element descriptor or name represents a blacklisted sensitive field.
 */
function isBlacklistedSensitiveField(descriptor) {
  if (!descriptor) return false;
  const text = (
    (descriptor.name || '') + ' ' +
    (descriptor.id || '') + ' ' +
    (descriptor.placeholder || '') + ' ' +
    (descriptor.ariaLabel || '') + ' ' +
    (descriptor.label || '') + ' ' +
    (descriptor.autocomplete || '')
  ).toLowerCase();

  return HARD_SAFETY_BLACKLIST.some(regex => regex.test(text));
}

/**
 * Normalizes input text for fuzzy token matching.
 */
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[_\-./\\:()[\],*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Levenshtein distance between two strings.
 */
function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Calculates string similarity ratio between 0.0 and 1.0.
 */
function stringSimilarity(s1, s2) {
  const norm1 = normalizeText(s1);
  const norm2 = normalizeText(s2);
  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;

  // Exact substring match bonus
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    return 0.85 + 0.15 * (minLen / maxLen);
  }

  const maxLen = Math.max(norm1.length, norm2.length);
  const dist = levenshteinDistance(norm1, norm2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Education tier detector using contextual hints from parent containers or tables.
 */
function detectEducationTierContext(contextText) {
  const text = (contextText || '').toLowerCase();
  // 1. Check Higher Secondary / 12th first because "Higher Secondary" contains the substring "Secondary"
  if (/(12th|hsc|higher secondary|intermediate|inter\b|class 12|xiith|\bxii\b|diploma)/i.test(text)) {
    return '12th';
  }
  // 2. Check 10th / Secondary (excluding higher secondary)
  if (/(10th|ssc|matric|\bsecondary\b|class 10|xth|\bx\b)/i.test(text)) {
    return '10th';
  }
  // 3. Check Post-Graduation / Master
  if (/(post[- ]?grad|pg\b|master|m\.tech|m\.s\.|mca|m\.sc|mba)/i.test(text)) {
    return 'pg';
  }
  // 4. Check Graduation / Bachelor Degree
  if (/(bachelor|b\.tech|b\.e\.|bca|b\.sc|bba|undergrad|ug\b|graduation|degree)/i.test(text)) {
    return 'grad';
  }
  return null;
}

/**
 * Match a form field descriptor against FIELD_DEFINITIONS.
 * Returns { fieldKey, confidence, matchedBy, label }
 * Confidence ranges:
 * - >= 0.80: High confidence (safe to fill)
 * - 0.60 - 0.79: Medium confidence (highlight yellow, offer preview)
 * - < 0.60: Low confidence (do not guess)
 */
function matchField(fieldDescriptor, customMappings = {}) {
  // 1. Safety check
  if (isBlacklistedSensitiveField(fieldDescriptor)) {
    return { fieldKey: null, confidence: 0, reason: 'blacklisted_sensitive' };
  }

  // 2. Custom per-site mapping check
  const siteSignature = fieldDescriptor.siteSignature;
  if (siteSignature && customMappings[siteSignature]) {
    const mappedKey = customMappings[siteSignature];
    if (FIELD_DEFINITIONS[mappedKey]) {
      return {
        fieldKey: mappedKey,
        confidence: 1.0,
        matchedBy: 'custom_site_mapping',
        label: FIELD_DEFINITIONS[mappedKey].label
      };
    }
  }

  // 3. Autocomplete standard attribute check
  const autocomplete = (fieldDescriptor.autocomplete || '').toLowerCase().trim();
  if (autocomplete) {
    const acMap = {
      name: 'fullName',
      'given-name': 'firstName',
      'additional-name': 'middleName',
      'family-name': 'lastName',
      email: 'email',
      tel: 'phone',
      bday: 'dob',
      'street-address': 'addressLine1',
      'address-line1': 'addressLine1',
      'address-line2': 'addressLine2',
      'address-level2': 'city',
      'address-level1': 'state',
      'postal-code': 'pincode',
      country: 'country',
      'organization-title': 'currentTitle',
      organization: 'currentCompany'
    };
    if (acMap[autocomplete]) {
      return {
        fieldKey: acMap[autocomplete],
        confidence: 0.98,
        matchedBy: 'autocomplete_attribute',
        label: FIELD_DEFINITIONS[acMap[autocomplete]].label
      };
    }
  }

  // 4. Extract candidate texts from element
  const candidateTexts = [
    fieldDescriptor.label,
    fieldDescriptor.ariaLabel,
    fieldDescriptor.placeholder,
    fieldDescriptor.name,
    fieldDescriptor.id,
    fieldDescriptor.labelText
  ].filter(Boolean).map(normalizeText);

  if (candidateTexts.length === 0) {
    return { fieldKey: null, confidence: 0, reason: 'no_candidate_text' };
  }

  // 5. Context education tier filter
  const contextTier = detectEducationTierContext(
    (fieldDescriptor.containerContext || '') + ' ' + (fieldDescriptor.tableHeader || '')
  );

  let bestMatch = { fieldKey: null, confidence: 0, matchedBy: null, label: null };

  for (const [key, def] of Object.entries(FIELD_DEFINITIONS)) {
    // If field has a tier requirement and context disagrees strongly, penalize
    if (def.tier && contextTier && def.tier !== contextTier) {
      continue;
    }

    for (const syn of def.synonyms) {
      for (const cand of candidateTexts) {
        if (!cand) continue;

        // Exact match
        if (cand === syn) {
          let conf = 0.95;
          if (def.tier && contextTier === def.tier) conf = 0.99;
          return { fieldKey: key, confidence: conf, matchedBy: 'exact_synonym', label: def.label };
        }

        // Fuzzy similarity
        const sim = stringSimilarity(cand, syn);
        let adjustedSim = sim;

        // Tier match bonus
        if (def.tier && contextTier === def.tier) {
          adjustedSim = Math.min(1.0, adjustedSim + 0.1);
        }

        if (adjustedSim > bestMatch.confidence) {
          bestMatch = {
            fieldKey: key,
            confidence: Math.round(adjustedSim * 100) / 100,
            matchedBy: 'fuzzy_synonym',
            label: def.label
          };
        }
      }
    }
  }

  return bestMatch;
}

// Export for Node (test suite) and browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HARD_SAFETY_BLACKLIST,
    FIELD_DEFINITIONS,
    isBlacklistedSensitiveField,
    normalizeText,
    levenshteinDistance,
    stringSimilarity,
    detectEducationTierContext,
    matchField
  };
} else {
  window.AutoFillFields = {
    HARD_SAFETY_BLACKLIST,
    FIELD_DEFINITIONS,
    isBlacklistedSensitiveField,
    normalizeText,
    levenshteinDistance,
    stringSimilarity,
    detectEducationTierContext,
    matchField
  };
}
