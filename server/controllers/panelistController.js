const { query } = require('../config/db')

const listPapers = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT s.submission_id, s.title, s.authors, s.abstract, s.keywords,
              s.program, s.strand, s.section, s.school_year, s.status,
              s.is_published, s.slug, s.citation, s.published_at, s.created_at, s.updated_at,
              rg.group_name,
              u.name AS student_name,
              EXISTS (SELECT 1 FROM document_versions dv WHERE dv.submission_id = s.submission_id) AS has_file
       FROM submissions s
       LEFT JOIN research_groups rg ON rg.group_id = s.group_id
       LEFT JOIN users u ON u.user_id = s.submitted_by
       ORDER BY s.updated_at DESC, s.created_at DESC`
    )
    const data = rows.map(r => ({
      id: r.submission_id,
      title: r.title,
      authors: r.authors ? r.authors.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
      abstract: r.abstract,
      keywords: r.keywords ? r.keywords.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
      strand: r.strand || r.program,
      section: r.section,
      schoolYear: r.school_year,
      status: r.status,
      isPublished: !!r.is_published,
      slug: r.slug,
      citation: r.citation,
      publishedAt: r.published_at,
      createdAt: r.created_at,
      groupName: r.group_name,
      studentName: r.student_name,
      hasFile: !!r.has_file,
    }))
    res.json({ data })
  } catch (err) {
    console.error('panelist listPapers error:', err)
    res.status(500).json({ message: 'Failed to fetch papers' })
  }
}

module.exports = { listPapers }
