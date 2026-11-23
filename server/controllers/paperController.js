const pool = require('../config/db')

const ALLOWED_STUDENT_STATUSES = ['proposal', 'for_revision', 'needs_revision']

function normalizeStatus(status) {
  if (status === 'needs_revision') return 'for_revision'
  return status
}

function isStudentEditable(status) {
  return ALLOWED_STUDENT_STATUSES.includes(normalizeStatus(status))
}

async function addStatusHistory(submissionId, status, changedBy, note) {
  try {
    await pool.query(
      `INSERT INTO submission_status_history (submission_id, status, note, changed_by)
       VALUES (?, ?, ?, ?)`,
      [submissionId, status, note || null, changedBy || null]
    )
  } catch (err) {
    console.error('addStatusHistory error:', err)
  }
}

async function notifyAdviser(submissionId, message) {
  try {
    const [rows] = await pool.query(
      `SELECT rg.adviser_id, rg.created_by
       FROM submissions s
       JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.submission_id = ?`,
      [submissionId]
    )
    if (!rows.length) return
    const adviserId = rows[0].adviser_id || rows[0].created_by
    if (!adviserId) return
    await pool.query(
      `INSERT INTO notifications (user_id, submission_id, type, message)
       VALUES (?, ?, 'system', ?)`,
      [adviserId, submissionId, message]
    )
  } catch (err) {
    console.error('notifyAdviser error:', err)
  }
}

const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.user_id

    const [rows] = await pool.query(
      `SELECT DISTINCT rg.group_id, rg.group_name, rg.program, rg.school_year
       FROM research_groups rg
       LEFT JOIN group_members gm ON gm.group_id = rg.group_id
       WHERE gm.user_id = ? OR rg.created_by = ?
       ORDER BY rg.group_name ASC`,
      [userId, userId]
    )

    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load your groups' })
  }
}

const uploadPaper = async (req, res) => {
  const { title, authors, program, year, school_year, abstract, keywords, group_id, video_url } = req.body
  const userId = req.user.user_id
  const effectiveSchoolYear = school_year || (year ? `${year}-${Number(year) + 1}` : '')

  if (!title || !authors || !program || !effectiveSchoolYear || !group_id) {
    return res.status(400).json({ message: 'All required fields are missing' })
  }
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' })
  }

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [groupRows] = await connection.query(
      `SELECT DISTINCT rg.group_id, rg.group_name
       FROM research_groups rg
       LEFT JOIN group_members gm ON gm.group_id = rg.group_id
       WHERE rg.group_id = ? AND (gm.user_id = ? OR rg.created_by = ?)`,
      [group_id, userId, userId]
    )

    if (groupRows.length === 0) {
      await connection.rollback()
      return res.status(403).json({ message: 'You are not a member of the selected group' })
    }

    const groupId = groupRows[0].group_id

    const [existingSubmissionRows] = await connection.query(
      `SELECT submission_id, status
       FROM submissions
       WHERE group_id = ? AND title = ?
       ORDER BY submission_id DESC
       LIMIT 1`,
      [groupId, title]
    )

    let submissionId
    let createdNewSubmission = false
    if (existingSubmissionRows.length > 0) {
      const existing = existingSubmissionRows[0]
      if (['approved', 'published'].includes(existing.status)) {
        await connection.rollback()
        return res.status(409).json({ message: 'Cannot modify an approved or published paper.' })
      }
      submissionId = existing.submission_id
    } else {
      const [submissionResult] = await connection.query(
        `INSERT INTO submissions
          (group_id, title, abstract, keywords, authors, program, school_year, submitted_by, video_url, consent_status, file_path, file_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
         RETURNING submission_id`,
        [
          groupId,
          title,
          abstract || null,
          keywords || null,
          authors,
          program,
          effectiveSchoolYear,
          userId,
          video_url || null,
          `uploads/${req.file.filename}`,
          req.file.originalname
        ]
      )
      submissionId = submissionResult.insertId
      createdNewSubmission = true
    }

    const [versionRows] = await connection.query(
      'SELECT COALESCE(MAX(version_number), 0) AS latest_version FROM document_versions WHERE submission_id = ?',
      [submissionId]
    )
    const nextVersion = Number(versionRows[0].latest_version) + 1

    await connection.query(
      `INSERT INTO document_versions (submission_id, file_path, file_name, file_size, file_type, version_number, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [submissionId, `uploads/${req.file.filename}`, req.file.originalname, req.file.size || null, req.file.mimetype || null, nextVersion, userId]
    )

    await connection.query(
      `UPDATE submissions
       SET file_path = ?, file_name = ?, video_url = COALESCE(?, video_url), updated_at = NOW()
       WHERE submission_id = ?`,
      [`uploads/${req.file.filename}`, req.file.originalname, video_url || null, submissionId]
    )

    await connection.commit()

    if (createdNewSubmission) {
      await addStatusHistory(submissionId, 'submitted', userId, 'Submitted')
    }

    try {
      if (req && req.audit && typeof req.audit.log === 'function') {
        await req.audit.log({
          action: 'UPLOAD_VERSION',
          target_type: 'submission',
          target_id: submissionId,
          changes: { version: nextVersion, file_name: req.file.originalname }
        })

        if (createdNewSubmission) {
          await req.audit.log({
            action: 'CREATE_SUBMISSION',
            target_type: 'submission',
            target_id: submissionId,
            changes: { title, authors, program, school_year: effectiveSchoolYear }
          })
        }
      }
    } catch (e) {
      console.error('Audit logging failed', e)
    }

    res.status(201).json({
      message: 'Version uploaded successfully',
      version: nextVersion,
      paperId: submissionId
    })

  } catch (err) {
    if (connection) await connection.rollback()
    console.error(err)
    res.status(500).json({ message: 'Server error during upload' })
  } finally {
    if (connection) connection.release()
  }
}

const uploadPaperVersion = async (req, res) => {
  const { paperId } = req.params
  const userId = req.user.user_id

  if (!req.file) {
    return res.status(400).json({ message: 'File is required' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [submissionRows] = await connection.query(
      `SELECT submission_id, status FROM submissions WHERE submission_id = ? AND submitted_by = ?`,
      [paperId, userId]
    )

    if (submissionRows.length === 0) {
      await connection.rollback()
      return res.status(404).json({ message: 'Paper not found' })
    }

    const submission = submissionRows[0]
    if (!isStudentEditable(submission.status)) {
      await connection.rollback()
      return res.status(409).json({ message: 'You cannot replace the file of an approved or published paper.' })
    }

    const [versionRows] = await connection.query(
      `SELECT COALESCE(MAX(version_number), 0) AS latest_version FROM document_versions WHERE submission_id = ?`,
      [paperId]
    )
    const nextVersion = Number(versionRows[0].latest_version) + 1

    await connection.query(
      `INSERT INTO document_versions (submission_id, file_path, file_name, file_size, file_type, version_number, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paperId, `uploads/${req.file.filename}`, req.file.originalname, req.file.size || null, req.file.mimetype || null, nextVersion, userId]
    )

    await connection.query(
      `UPDATE submissions SET file_path = ?, file_name = ?, updated_at = NOW() WHERE submission_id = ?`,
      [`uploads/${req.file.filename}`, req.file.originalname, paperId]
    )

    await connection.commit()

    try {
      if (req && req.audit && typeof req.audit.log === 'function') {
        await req.audit.log({
          action: 'UPLOAD_VERSION',
          target_type: 'submission',
          target_id: submission.submission_id,
          changes: { version: nextVersion, file_name: req.file.originalname }
        })
      }
    } catch (e) {
      console.error('Audit logging failed', e)
    }

    res.status(201).json({
      message: 'New version uploaded successfully',
      version: nextVersion,
      paperId: submission.submission_id
    })
  } catch (err) {
    await connection.rollback()
    console.error(err)
    res.status(500).json({ message: 'Server error during version upload' })
  } finally {
    connection.release()
  }
}

const getMyPapers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
          s.submission_id AS paper_id,
          s.submission_id,
          rg.group_name,
          s.title,
          s.authors,
          s.program,
          s.strand,
          s.section,
          s.school_year,
          s.status,
          s.consent_status,
          s.consent_at,
          s.video_url,
          s.file_path,
          s.file_name,
          s.updated_at,
          s.created_at
       FROM submissions s
       JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.submitted_by = ?
       ORDER BY s.updated_at DESC, s.submission_id DESC`,
      [req.user.user_id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const getPaperDetail = async (req, res) => {
  const { paperId } = req.params
  const userId = req.user.user_id

  try {
    const [submissionRows] = await pool.query(
      `SELECT s.submission_id, s.group_id, rg.group_name, s.title, s.abstract, s.keywords, s.authors,
              s.program, s.strand, s.section, s.school_year, s.status, s.created_at, s.updated_at,
              s.video_url, s.consent_status, s.consent_at, s.author_consent_at, s.file_path, s.file_name
       FROM submissions s
       JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.submission_id = ?
         AND (
           EXISTS (
             SELECT 1 FROM group_members gm
             WHERE gm.group_id = rg.group_id AND gm.user_id = ?
           )
           OR s.submitted_by = ?
           OR rg.created_by = ?
         )`,
      [paperId, userId, userId, userId]
    )

    if (submissionRows.length === 0) {
      return res.status(404).json({ message: 'Paper not found' })
    }

    const submission = submissionRows[0]

    const [versions] = await pool.query(
      `SELECT version_number, file_path, file_name, file_size, file_type, uploaded_at
       FROM document_versions
       WHERE submission_id = ?
       ORDER BY version_number DESC`,
      [paperId]
    )

    const [reviews] = await pool.query(
      `SELECT r.review_id, r.reviewer_id, u.name AS reviewer_name,
              r.status_assigned, r.reviewed_at
       FROM reviews r
       JOIN users u ON u.user_id = r.reviewer_id
       WHERE r.submission_id = ?
       ORDER BY r.reviewed_at DESC`,
      [paperId]
    )

    const [allComments] = await pool.query(
      `SELECT rc.comment_id, rc.author_id, u.name AS author_name, rc.comment_text, rc.resolved, rc.created_at
       FROM review_comments rc
       JOIN users u ON u.user_id = rc.author_id
       WHERE rc.submission_id = ?
       ORDER BY rc.created_at ASC`,
      [paperId]
    )

    const reviewsWithComments = reviews.map((review) => ({
      ...review,
      comments: allComments.filter((c) => c.author_id === review.reviewer_id)
    }))

    const reviewerIds = new Set(reviews.map((r) => r.reviewer_id))
    const orphanComments = allComments.filter((c) => !reviewerIds.has(c.author_id))
    if (orphanComments.length) {
      reviewsWithComments.push({
        review_id: null,
        reviewer_id: null,
        reviewer_name: 'Adviser',
        status_assigned: null,
        reviewed_at: null,
        comments: orphanComments
      })
    }

    const [historyRows] = await pool.query(
      `SELECT status, note, changed_by, created_at
       FROM submission_status_history
       WHERE submission_id = ?
       ORDER BY created_at ASC`,
      [paperId]
    )

    const statusHistory = historyRows.map((h) => ({
      status: h.status,
      note: h.note,
      at: h.created_at,
      by: h.changed_by
    }))

    // Resolve actor names
    const actorIds = [...new Set(statusHistory.map((h) => h.by).filter(Boolean))]
    let actorNames = {}
    if (actorIds.length) {
      const placeholders = actorIds.map((_, i) => `$${i + 1}`).join(',')
      const [actors] = await pool.query(
        `SELECT user_id, name FROM users WHERE user_id IN (${placeholders})`,
        actorIds
      )
      actorNames = actors.reduce((acc, u) => { acc[u.user_id] = u.name; return acc }, {})
    }
    statusHistory.forEach((h) => { h.by = actorNames[h.by] || h.by })

    const currentFile = submission.file_path
      ? { fileName: submission.file_name || 'Paper file', filePath: submission.file_path }
      : (versions.length ? { fileName: versions[0].file_name, filePath: versions[0].file_path } : null)

    const consentStatus = submission.consent_status || (submission.author_consent_at ? 'granted' : 'pending')

    res.json({
      submission_id: submission.submission_id,
      group_id: submission.group_id,
      group_name: submission.group_name,
      submitted_by: submission.submitted_by,
      title: submission.title,
      abstract: submission.abstract,
      keywords: submission.keywords,
      authors: submission.authors,
      program: submission.program,
      strand: submission.strand,
      section: submission.section,
      school_year: submission.school_year,
      status: submission.status,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
      video_url: submission.video_url,
      videoUrl: submission.video_url,
      consent: { status: consentStatus, at: submission.consent_at || submission.author_consent_at || null },
      consent_status: consentStatus,
      author_consent_at: submission.author_consent_at || submission.consent_at || null,
      statusHistory,
      status_history: statusHistory,
      file: currentFile,
      versions,
      reviews: reviewsWithComments
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const updatePaper = async (req, res) => {
  const { paperId } = req.params
  const userId = req.user.user_id
  const { title, abstract, keywords, authors, program, school_year, video_url, videoUrl } = req.body
  const vidProvided = Object.prototype.hasOwnProperty.call(req.body, 'video_url') || Object.prototype.hasOwnProperty.call(req.body, 'videoUrl')
  const vid = vidProvided ? (video_url ?? videoUrl ?? null) : null

  try {
    const [rows] = await pool.query(
      `SELECT submission_id, status FROM submissions WHERE submission_id = ? AND submitted_by = ?`,
      [paperId, userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paper not found or not owned by you' })
    }
    if (!isStudentEditable(rows[0].status)) {
      return res.status(409).json({ message: 'You cannot edit this paper after it has been approved or published.' })
    }

    await pool.query(
      `UPDATE submissions
       SET title = COALESCE(?, title),
           abstract = COALESCE(?, abstract),
           keywords = COALESCE(?, keywords),
           authors = COALESCE(?, authors),
           program = COALESCE(?, program),
           school_year = COALESCE(?, school_year),
           video_url = CASE WHEN ? THEN ? ELSE video_url END,
           updated_at = NOW()
       WHERE submission_id = ?`,
      [title || null, abstract || null, keywords || null, authors || null, program || null, school_year || null, vidProvided, vid, paperId]
    )

    res.json({ message: 'Paper updated', paperId })
  } catch (err) {
    console.error('updatePaper error:', err)
    res.status(500).json({ message: 'Failed to update paper' })
  }
}

const resubmitPaper = async (req, res) => {
  const { paperId } = req.params
  const userId = req.user.user_id

  try {
    const [rows] = await pool.query(
      `SELECT submission_id, status FROM submissions WHERE submission_id = ? AND submitted_by = ?`,
      [paperId, userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paper not found or not owned by you' })
    }
    const status = rows[0].status
    if (status !== 'needs_revision' && status !== 'for_revision') {
      return res.status(400).json({ message: 'Only papers needing revision can be resubmitted' })
    }

    await pool.query(
      `UPDATE submissions SET status = 'under_review', updated_at = NOW() WHERE submission_id = ?`,
      [paperId]
    )

    await addStatusHistory(paperId, 'under_review', userId, 'Resubmitted')

    res.json({ message: 'Paper resubmitted for review', paperId, status: 'under_review' })
  } catch (err) {
    console.error('resubmitPaper error:', err)
    res.status(500).json({ message: 'Failed to resubmit paper' })
  }
}

const setPaperConsent = async (req, res) => {
  const { paperId } = req.params
  const userId = req.user.user_id
  const granted = req.body.granted === true || req.body.granted === 'true'

  try {
    const [rows] = await pool.query(
      `SELECT submission_id, status, consent_status FROM submissions WHERE submission_id = ? AND submitted_by = ?`,
      [paperId, userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paper not found or not owned by you' })
    }
    if (rows[0].status === 'published') {
      return res.status(409).json({ message: 'Consent is locked after a paper is published.' })
    }

    const newStatus = granted ? 'granted' : 'declined'
    const prevStatus = rows[0].consent_status
    await pool.query(
      `UPDATE submissions
       SET consent_status = ?, consent_at = NOW(),
           author_consent_at = CASE WHEN ? = 'granted' THEN COALESCE(author_consent_at, NOW()) ELSE NULL END,
           updated_at = NOW()
       WHERE submission_id = ?`,
      [newStatus, newStatus, paperId]
    )

    if (prevStatus !== newStatus) {
      await notifyAdviser(paperId, `Consent for paper ${paperId} was ${granted ? 'granted' : 'withdrawn'} by the student.`)
    }

    res.json({ consent: { status: newStatus, at: new Date().toISOString() }, status: newStatus })
  } catch (err) {
    console.error('setPaperConsent error:', err)
    res.status(500).json({ message: 'Failed to update consent' })
  }
}

const replacePaperFile = async (req, res) => {
  const { paperId } = req.params
  const userId = req.user.user_id

  if (!req.file) {
    return res.status(400).json({ message: 'File is required' })
  }

  try {
    const [rows] = await pool.query(
      `SELECT submission_id, status FROM submissions WHERE submission_id = ? AND submitted_by = ?`,
      [paperId, userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paper not found or not owned by you' })
    }
    if (!isStudentEditable(rows[0].status)) {
      return res.status(409).json({ message: 'You cannot replace the file of an approved or published paper.' })
    }

    const filePath = `uploads/${req.file.filename}`
    await pool.query(
      `UPDATE submissions SET file_path = ?, file_name = ?, updated_at = NOW() WHERE submission_id = ?`,
      [filePath, req.file.originalname, paperId]
    )

    res.status(200).json({ file: { fileName: req.file.originalname, filePath } })
  } catch (err) {
    console.error('replacePaperFile error:', err)
    res.status(500).json({ message: 'Failed to replace file' })
  }
}

const resolveFeedbackNote = async (req, res) => {
  const { paperId, noteId } = req.params
  const userId = req.user.user_id

  try {
    const [rows] = await pool.query(
      `SELECT submission_id FROM submissions WHERE submission_id = ? AND submitted_by = ?`,
      [paperId, userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paper not found or not owned by you' })
    }

    const [comments] = await pool.query(
      `SELECT comment_id FROM review_comments WHERE comment_id = ? AND submission_id = ?`,
      [noteId, paperId]
    )
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Feedback note not found' })
    }

    await pool.query(
      `UPDATE review_comments SET resolved = TRUE WHERE comment_id = ?`,
      [noteId]
    )

    res.json({ message: 'Feedback note resolved' })
  } catch (err) {
    console.error('resolveFeedbackNote error:', err)
    res.status(500).json({ message: 'Failed to resolve feedback note' })
  }
}

const dismissFeedbackNote = async (req, res) => {
  const { paperId, noteId } = req.params
  const userId = req.user.user_id

  try {
    const [rows] = await pool.query(
      `SELECT submission_id FROM submissions WHERE submission_id = ? AND submitted_by = ?`,
      [paperId, userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paper not found or not owned by you' })
    }

    const [comments] = await pool.query(
      `SELECT comment_id FROM review_comments WHERE comment_id = ? AND submission_id = ?`,
      [noteId, paperId]
    )
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Feedback note not found' })
    }

    await pool.query(
      `DELETE FROM review_comments WHERE comment_id = ?`,
      [noteId]
    )

    res.json({ message: 'Feedback note dismissed' })
  } catch (err) {
    console.error('dismissFeedbackNote error:', err)
    res.status(500).json({ message: 'Failed to dismiss feedback note' })
  }
}

module.exports = {
  getMyGroups, uploadPaper, uploadPaperVersion, getMyPapers, getPaperDetail,
  updatePaper, resubmitPaper, setPaperConsent, replacePaperFile,
  resolveFeedbackNote, dismissFeedbackNote
}
