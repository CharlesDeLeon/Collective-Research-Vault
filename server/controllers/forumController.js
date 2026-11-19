const { query } = require('../config/db')

const normalizePost = (row, liked = false) => ({
  id: row.post_id,
  type: row.post_type,
  authorName: row.author_name,
  authorRole: row.author_role,
  text: row.body,
  mediaUrl: row.media_url || '',
  createdAt: row.created_at,
  editedAt: (new Date(row.updated_at) - new Date(row.created_at)) > 1000 ? row.updated_at : null,
  groupId: row.group_id,
  groupName: row.group_name,
  strand: row.strand,
  section: row.section,
  yearLevel: row.year_level,
  schoolYear: row.school_year,
  paperId: row.submission_id,
  paperTitle: row.paper_title,
  status: row.status,
  likes: row.likes_count,
  liked,
  reported: row.reported,
  hidden: row.hidden,
  removed: row.removed,
  comments: [],
})

const normalizeComment = (row) => ({
  id: row.comment_id,
  authorName: row.author_name,
  authorRole: row.author_role,
  text: row.body,
  createdAt: row.created_at,
  editedAt: row.edited ? row.updated_at : null,
  parentId: row.parent_id,
  reported: row.reported,
  hidden: row.hidden,
  removed: row.removed,
})

// GET /api/forum/posts
const listPosts = async (req, res) => {
  try {
    const userId = req.user.user_id
    const { groupId, strand, section, yearLevel, schoolYear, status, search, reported, page = 1, limit = 25 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let sql = `
      SELECT fp.*, u.name AS author_name, u.role AS author_role,
             rg.group_name, rg.adviser_id, rg.created_by AS group_created_by
      FROM forum_posts fp
      JOIN users u ON u.user_id = fp.author_id
      LEFT JOIN research_groups rg ON rg.group_id = fp.group_id
      WHERE fp.removed = FALSE
    `
    const params = []

    const role = String(req.user?.role || '').toLowerCase()
    if (role === 'adviser') {
      sql += ` AND (rg.adviser_id = ? OR rg.created_by = ? OR rg.group_id IS NULL)`
      params.push(userId, userId)
    }

    if (groupId) { sql += ` AND fp.group_id = ?`; params.push(groupId) }
    if (reported === 'true') { sql += ` AND fp.reported = TRUE` }
    if (strand) { sql += ` AND fp.strand = ?`; params.push(strand) }
    if (section) { sql += ` AND fp.section = ?`; params.push(section) }
    if (yearLevel) { sql += ` AND fp.year_level = ?`; params.push(yearLevel) }
    if (schoolYear) { sql += ` AND fp.school_year = ?`; params.push(schoolYear) }
    if (status) { sql += ` AND fp.status = ?`; params.push(status) }
    if (search) { sql += ` AND (fp.body ILIKE ? OR fp.title ILIKE ? OR fp.paper_title ILIKE ?)`; const t = `%${search}%`; params.push(t, t, t) }

    sql += ` ORDER BY fp.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(limit), offset)

    const [rows] = await query(sql, params)

    // Get liked status for current user
    const postIds = rows.map(r => r.post_id)
    let likedSet = new Set()
    if (postIds.length) {
      const [likes] = await query(
        `SELECT post_id FROM forum_post_likes WHERE user_id = ? AND post_id = ANY($2::int[])`,
        [userId, postIds]
      )
      likedSet = new Set(likes.map(l => l.post_id))
    }

    // Get comment counts
    const [counts] = postIds.length
      ? await query(
          `SELECT post_id, COUNT(*)::int AS c FROM forum_comments WHERE post_id = ANY($1::int[]) AND removed = FALSE GROUP BY post_id`,
          [postIds]
        )
      : [[]]
    const countMap = {}
    for (const c of counts) countMap[c.post_id] = c.c

    const posts = rows.map(r => ({ ...normalizePost(r, likedSet.has(r.post_id)), commentCount: countMap[r.post_id] || 0 }))

    res.json({ data: posts })
  } catch (err) {
    console.error('listPosts error:', err)
    res.status(500).json({ message: 'Failed to fetch posts' })
  }
}

// POST /api/forum/posts
const createPost = async (req, res) => {
  try {
    const userId = req.user.user_id
    const { type, text, mediaUrl, groupId, paperId, paperTitle, status, title, strand, section, yearLevel, schoolYear } = req.body
    if (!text && !mediaUrl && !paperTitle) {
      return res.status(400).json({ message: 'Post content is required' })
    }

    // If groupId provided, inherit strand/section/year from group if not given
    let gStrand = strand, gSection = section, gYear = yearLevel, gSchool = schoolYear, groupName = null
    if (groupId) {
      const [g] = await query('SELECT group_name, strand, section, year_level, school_year FROM research_groups WHERE group_id = ?', [groupId])
      if (g.length) {
        const gr = g[0]
        groupName = gr.group_name
        gStrand = gStrand || gr.strand
        gSection = gSection || gr.section
        gYear = gYear || gr.year_level
        gSchool = gSchool || gr.school_year
      }
    }

    const [result] = await query(
      `INSERT INTO forum_posts (author_id, group_id, post_type, title, body, media_url, strand, section, year_level, school_year, submission_id, paper_title, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING post_id`,
      [userId, groupId || null, type || 'update', title || null, text || '', mediaUrl || null,
       gStrand || null, gSection || null, gYear || null, gSchool || null,
       paperId || null, paperTitle || null, status || null]
    )

    const newPostId = result[0]?.post_id || result.insertId

    // Fetch the created post with author info
    const [rows] = await query(
      `SELECT fp.*, u.name AS author_name, u.role AS author_role, rg.group_name
       FROM forum_posts fp JOIN users u ON u.user_id = fp.author_id
       LEFT JOIN research_groups rg ON rg.group_id = fp.group_id
       WHERE fp.post_id = ?`,
      [newPostId]
    )
    res.status(201).json({ data: normalizePost(rows[0], false) })
  } catch (err) {
    console.error('createPost error:', err)
    res.status(500).json({ message: 'Failed to create post' })
  }
}

// GET /api/forum/posts/:id
const getPost = async (req, res) => {
  try {
    const userId = req.user.user_id
    const { id } = req.params
    const [rows] = await query(
      `SELECT fp.*, u.name AS author_name, u.role AS author_role, rg.group_name
       FROM forum_posts fp JOIN users u ON u.user_id = fp.author_id
       LEFT JOIN research_groups rg ON rg.group_id = fp.group_id
       WHERE fp.post_id = ?`,
      [id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Post not found' })

    const [comments] = await query(
      `SELECT fc.*, u.name AS author_name, u.role AS author_role
       FROM forum_comments fc JOIN users u ON u.user_id = fc.author_id
       WHERE fc.post_id = ? AND fc.removed = FALSE
       ORDER BY fc.created_at ASC`,
      [id]
    )

    const [likes] = await query(
      `SELECT 1 FROM forum_post_likes WHERE post_id = ? AND user_id = ?`,
      [id, userId]
    )

    const post = normalizePost(rows[0], likes.length > 0)
    post.comments = comments.map(normalizeComment)
    res.json({ data: post })
  } catch (err) {
    console.error('getPost error:', err)
    res.status(500).json({ message: 'Failed to fetch post' })
  }
}

// PATCH /api/forum/posts/:id
const updatePost = async (req, res) => {
  try {
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()
    const { id } = req.params
    const { text, mediaUrl, title } = req.body

    const [rows] = await query('SELECT author_id FROM forum_posts WHERE post_id = ?', [id])
    if (!rows.length) return res.status(404).json({ message: 'Post not found' })
    if (rows[0].author_id !== userId && role !== 'adviser' && role !== 'sysadmin') {
      return res.status(403).json({ message: 'Not allowed' })
    }

    await query(
      `UPDATE forum_posts SET body = COALESCE(?, body), media_url = COALESCE(?, media_url),
       title = COALESCE(?, title), updated_at = NOW() WHERE post_id = ?`,
      [text || null, mediaUrl !== undefined ? mediaUrl : null, title || null, id]
    )
    res.json({ message: 'Post updated' })
  } catch (err) {
    console.error('updatePost error:', err)
    res.status(500).json({ message: 'Failed to update post' })
  }
}

// DELETE /api/forum/posts/:id
const deletePost = async (req, res) => {
  try {
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()
    const { id } = req.params

    const [rows] = await query('SELECT author_id FROM forum_posts WHERE post_id = ?', [id])
    if (!rows.length) return res.status(404).json({ message: 'Post not found' })
    if (rows[0].author_id !== userId && role !== 'adviser' && role !== 'sysadmin') {
      return res.status(403).json({ message: 'Not allowed' })
    }

    await query('DELETE FROM forum_posts WHERE post_id = ?', [id])
    res.json({ message: 'Post deleted' })
  } catch (err) {
    console.error('deletePost error:', err)
    res.status(500).json({ message: 'Failed to delete post' })
  }
}

// POST /api/forum/posts/:id/like
const toggleLike = async (req, res) => {
  try {
    const userId = req.user.user_id
    const { id } = req.params
    const [existing] = await query('SELECT 1 FROM forum_post_likes WHERE post_id = ? AND user_id = ?', [id, userId])
    if (existing.length) {
      await query('DELETE FROM forum_post_likes WHERE post_id = ? AND user_id = ?', [id, userId])
      await query('UPDATE forum_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE post_id = ?', [id])
    } else {
      await query('INSERT INTO forum_post_likes (post_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING', [id, userId])
      await query('UPDATE forum_posts SET likes_count = likes_count + 1 WHERE post_id = ?', [id])
    }
    const [rows] = await query('SELECT likes_count FROM forum_posts WHERE post_id = ?', [id])
    const [liked] = await query('SELECT 1 FROM forum_post_likes WHERE post_id = ? AND user_id = ?', [id, userId])
    res.json({ likes: rows[0]?.likes_count || 0, liked: liked.length > 0 })
  } catch (err) {
    console.error('toggleLike error:', err)
    res.status(500).json({ message: 'Failed to toggle like' })
  }
}

// POST /api/forum/posts/:id/report
const reportPost = async (req, res) => {
  try {
    const { id } = req.params
    await query('UPDATE forum_posts SET reported = TRUE WHERE post_id = ?', [id])
    res.json({ message: 'Reported' })
  } catch (err) {
    console.error('reportPost error:', err)
    res.status(500).json({ message: 'Failed to report post' })
  }
}

// POST /api/forum/posts/:id/hide (adviser/admin)
const hidePost = async (req, res) => {
  try {
    const { id } = req.params
    const { hidden } = req.body
    await query('UPDATE forum_posts SET hidden = ? WHERE post_id = ?', [hidden !== false, id])
    res.json({ message: 'Updated' })
  } catch (err) {
    console.error('hidePost error:', err)
    res.status(500).json({ message: 'Failed to hide post' })
  }
}

// POST /api/forum/posts/:id/remove (adviser/admin)
const removePost = async (req, res) => {
  try {
    const { id } = req.params
    await query('UPDATE forum_posts SET removed = TRUE WHERE post_id = ?', [id])
    res.json({ message: 'Removed' })
  } catch (err) {
    console.error('removePost error:', err)
    res.status(500).json({ message: 'Failed to remove post' })
  }
}

// GET /api/forum/posts/:id/comments
const listComments = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await query(
      `SELECT fc.*, u.name AS author_name, u.role AS author_role
       FROM forum_comments fc JOIN users u ON u.user_id = fc.author_id
       WHERE fc.post_id = ? AND fc.removed = FALSE
       ORDER BY fc.created_at ASC`,
      [id]
    )
    res.json({ data: rows.map(normalizeComment) })
  } catch (err) {
    console.error('listComments error:', err)
    res.status(500).json({ message: 'Failed to fetch comments' })
  }
}

// POST /api/forum/posts/:id/comments
const addComment = async (req, res) => {
  try {
    const userId = req.user.user_id
    const { id } = req.params
    const { text, parentId } = req.body
    if (!text) return res.status(400).json({ message: 'Comment text is required' })

    const [result] = await query(
      `INSERT INTO forum_comments (post_id, parent_id, author_id, body) VALUES (?, ?, ?, ?) RETURNING comment_id`,
      [id, parentId || null, userId, text]
    )
    const newCommentId = result[0]?.comment_id || result.insertId
    const [rows] = await query(
      `SELECT fc.*, u.name AS author_name, u.role AS author_role
       FROM forum_comments fc JOIN users u ON u.user_id = fc.author_id
       WHERE fc.comment_id = ?`,
      [newCommentId]
    )
    res.status(201).json({ data: normalizeComment(rows[0]) })
  } catch (err) {
    console.error('addComment error:', err)
    res.status(500).json({ message: 'Failed to add comment' })
  }
}

// PATCH /api/forum/comments/:id
const updateComment = async (req, res) => {
  try {
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()
    const { id } = req.params
    const { text } = req.body

    const [rows] = await query('SELECT author_id FROM forum_comments WHERE comment_id = ?', [id])
    if (!rows.length) return res.status(404).json({ message: 'Comment not found' })
    if (rows[0].author_id !== userId && role !== 'adviser' && role !== 'sysadmin') {
      return res.status(403).json({ message: 'Not allowed' })
    }

    await query('UPDATE forum_comments SET body = ?, edited = TRUE, updated_at = NOW() WHERE comment_id = ?', [text, id])
    res.json({ message: 'Comment updated' })
  } catch (err) {
    console.error('updateComment error:', err)
    res.status(500).json({ message: 'Failed to update comment' })
  }
}

// DELETE /api/forum/comments/:id
const deleteComment = async (req, res) => {
  try {
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()
    const { id } = req.params

    const [rows] = await query('SELECT author_id FROM forum_comments WHERE comment_id = ?', [id])
    if (!rows.length) return res.status(404).json({ message: 'Comment not found' })
    if (rows[0].author_id !== userId && role !== 'adviser' && role !== 'sysadmin') {
      return res.status(403).json({ message: 'Not allowed' })
    }

    await query('DELETE FROM forum_comments WHERE comment_id = ?', [id])
    res.json({ message: 'Comment deleted' })
  } catch (err) {
    console.error('deleteComment error:', err)
    res.status(500).json({ message: 'Failed to delete comment' })
  }
}

// POST /api/forum/comments/:id/report
const reportComment = async (req, res) => {
  try {
    const { id } = req.params
    await query('UPDATE forum_comments SET reported = TRUE WHERE comment_id = ?', [id])
    res.json({ message: 'Reported' })
  } catch (err) {
    console.error('reportComment error:', err)
    res.status(500).json({ message: 'Failed to report comment' })
  }
}

module.exports = {
  listPosts, createPost, getPost, updatePost, deletePost,
  toggleLike, reportPost, hidePost, removePost,
  listComments, addComment, updateComment, deleteComment, reportComment,
}