const { query } = require('../config/db')

const listPapers = async (req, res) => {
  try {
    const userId = req.user.user_id
    const [rows] = await query(
      `SELECT s.submission_id, s.title, s.authors, s.abstract, s.keywords,
              s.program, s.strand, s.section, s.school_year, s.status,
              s.is_published, s.slug, s.citation, s.published_at, s.created_at, s.updated_at,
              s.group_id, rg.group_name,
              u.name AS student_name,
              (s.file_path IS NOT NULL OR EXISTS (SELECT 1 FROM document_versions dv WHERE dv.submission_id = s.submission_id)) AS has_file
       FROM submissions s
       LEFT JOIN research_groups rg ON rg.group_id = s.group_id
       LEFT JOIN users u ON u.user_id = s.submitted_by
       WHERE s.group_id IN (SELECT group_id FROM panel_assignments WHERE faculty_id = ?)
       ORDER BY s.updated_at DESC, s.created_at DESC`,
      [userId]
    )
    const data = rows.map(r => ({
      id: r.submission_id,
      groupId: r.group_id,
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
    res.json({ data, pagination: { total: data.length, page: 1, limit: data.length } })
  } catch (err) {
    console.error('panelist listPapers error:', err)
    res.status(500).json({ message: 'Failed to fetch papers' })
  }
}

const listAssignedGroups = async (req, res) => {
  try {
    const userId = req.user.user_id
    const [rows] = await query(
      `SELECT rg.group_id, rg.group_name, rg.program, rg.strand, rg.section,
              rg.year_level, rg.school_year,
              (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = rg.group_id) AS member_count,
              (SELECT COUNT(*)::int FROM submissions s WHERE s.group_id = rg.group_id) AS submission_count
       FROM research_groups rg
       WHERE rg.group_id IN (SELECT group_id FROM panel_assignments WHERE faculty_id = ?)
       ORDER BY rg.group_name ASC`,
      [userId]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('panelist listAssignedGroups error:', err)
    res.status(500).json({ message: 'Failed to fetch assigned groups' })
  }
}

module.exports = { listPapers, listAssignedGroups }
