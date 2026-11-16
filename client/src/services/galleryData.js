export const galleryPapers = [
  {
    id: 1,
    title: 'AI-Powered Attendance Monitoring System Using Facial Recognition',
    authors: 'Santos et al.',
    program: 'BSIT',
    schoolYear: '2024-2025',
    publishedAt: '2025-03-14T00:00:00Z',
    featured: true,
    keywords: ['facial recognition', 'machine learning', 'automation'],
    abstract:
      'An attendance system that recognizes students from camera frames, replacing paper logs and cutting the time teachers spend on roll call. The study describes how the recognition model was trained, how the system was tested in classrooms, and what limits it showed under different lighting conditions.',
  },
  {
    id: 2,
    title: 'Blockchain-Based Academic Records Management System',
    authors: 'Reyes et al.',
    program: 'BSCS',
    schoolYear: '2024-2025',
    publishedAt: '2025-02-20T00:00:00Z',
    featured: false,
    keywords: ['blockchain', 'credential verification', 'smart contracts'],
    abstract:
      'A tamper-proof way to issue and verify academic credentials, so a certificate can be checked by anyone without contacting the registrar.',
  },
  {
    id: 3,
    title: 'Mobile-Based Crop Disease Detection Using Deep Learning',
    authors: 'Bautista et al.',
    program: 'BSIT',
    schoolYear: '2024-2025',
    publishedAt: '2025-04-02T00:00:00Z',
    featured: true,
    keywords: ['deep learning', 'agriculture', 'mobile app'],
    abstract:
      'A phone app that identifies common crop diseases from a leaf photo, giving smallholder farmers a quick first diagnosis in the field.',
  },
  {
    id: 4,
    title: 'Interactive Heritage Walkthrough Using Real-Time 3D Environments',
    authors: 'Lim et al.',
    program: 'BSEMC',
    schoolYear: '2023-2024',
    publishedAt: '2024-06-10T00:00:00Z',
    featured: true,
    keywords: ['3D', 'game design', 'cultural heritage'],
    abstract:
      'A walkable 3D reconstruction of a local heritage site, built to let students explore places they cannot visit in person.',
  },
  {
    id: 5,
    title: 'Sentiment Analysis of Student Feedback Using Transformer Models',
    authors: 'Cruz et al.',
    program: 'BSCS',
    schoolYear: '2023-2024',
    publishedAt: '2024-05-22T00:00:00Z',
    featured: false,
    keywords: ['NLP', 'machine learning', 'education'],
    abstract:
      'Classifies free-text course feedback by tone and topic so instructors can spot recurring concerns without reading every comment.',
  },
  {
    id: 6,
    title: 'A Low-Cost IoT Monitoring System for Urban Rooftop Gardens',
    authors: 'Garcia et al.',
    program: 'BSIT',
    schoolYear: '2023-2024',
    publishedAt: '2024-06-03T00:00:00Z',
    featured: false,
    keywords: ['IoT', 'sensors', 'sustainability'],
    abstract:
      'Soil and weather sensors report to a simple dashboard and alert growers when plants need water or shade.',
  },
  {
    id: 7,
    title: 'Motion Graphics for Public Health Awareness: A Reception Study',
    authors: 'Villanueva et al.',
    program: 'BSEMC',
    schoolYear: '2022-2023',
    publishedAt: '2023-06-15T00:00:00Z',
    featured: false,
    keywords: ['animation', 'public health', 'audience study'],
    abstract:
      'Compares how different animation styles affect viewers’ recall of health messages in short public-service videos.',
  },
  {
    id: 8,
    title: 'Route Optimization for Campus Shuttle Scheduling Using Genetic Algorithms',
    authors: 'Mendoza et al.',
    program: 'BSCS',
    schoolYear: '2022-2023',
    publishedAt: '2023-05-30T00:00:00Z',
    featured: false,
    keywords: ['optimization', 'genetic algorithm', 'transport'],
    abstract:
      'Generates shuttle timetables that reduce waiting time at peak hours while keeping the number of vehicles the same.',
  },
  {
    id: 9,
    title: 'Accessibility Audit and Redesign of a Municipal Services Web Portal',
    authors: 'Aquino et al.',
    program: 'BSIT',
    schoolYear: '2022-2023',
    publishedAt: '2023-06-08T00:00:00Z',
    featured: false,
    keywords: ['accessibility', 'UX', 'e-government'],
    abstract:
      'Audits a city services website against accessibility guidelines and proposes a redesign that works with screen readers.',
  },
]

const KEYWORD_LIMIT = 8

export const SCHOOL_YEARS = [...new Set(galleryPapers.map((p) => p.schoolYear))].sort().reverse()

const keywordCounts = galleryPapers
  .flatMap((p) => p.keywords)
  .reduce((acc, k) => ({ ...acc, [k]: (acc[k] ?? 0) + 1 }), {})

export const KEYWORD_OPTIONS = Object.keys(keywordCounts)
  .sort((a, b) => keywordCounts[b] - keywordCounts[a] || a.localeCompare(b))
  .slice(0, KEYWORD_LIMIT)

export const getGalleryPaper = (id) =>
  galleryPapers.find((p) => String(p.id) === String(id)) ?? null

export function getRelatedPapers(paper, limit = 3) {
  return galleryPapers
    .filter((p) => p.id !== paper.id)
    .map((p) => ({
      paper: p,
      score:
        p.keywords.filter((k) => paper.keywords.includes(k)).length * 2 +
        (p.program === paper.program ? 1 : 0) +
        (p.schoolYear === paper.schoolYear ? 1 : 0),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.paper)
}