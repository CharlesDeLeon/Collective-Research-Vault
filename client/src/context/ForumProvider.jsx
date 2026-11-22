import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from './useAuth'
import useToast from './useToast'
import { ForumContext } from './forumContext'
import api from '../services/api'
import AddPostModal from '../components/paper/AddPostModal'

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

const normalizePost = (row) => ({
  id: row.id ?? row.post_id,
  type: row.type ?? row.post_type ?? 'update',
  authorName: row.authorName ?? row.author_name,
  authorRole: row.authorRole ?? row.author_role,
  text: row.text ?? row.body ?? '',
  mediaUrl: row.mediaUrl ?? row.media_url ?? '',
  createdAt: row.createdAt ?? row.created_at,
  editedAt: row.editedAt ?? row.updated_at ?? null,
  groupId: row.groupId ?? row.group_id,
  groupName: row.groupName ?? row.group_name,
  strand: row.strand,
  section: row.section,
  yearLevel: row.yearLevel ?? row.year_level,
  schoolYear: row.schoolYear ?? row.school_year,
  paperId: row.paperId ?? row.submission_id ?? row.paper_id,
  paperTitle: row.paperTitle ?? row.paper_title,
  status: row.status,
  likes: row.likes ?? row.likes_count ?? 0,
  liked: row.liked ?? false,
  reported: row.reported ?? false,
  hidden: row.hidden ?? false,
  removed: row.removed ?? false,
  comments: Array.isArray(row.comments) ? row.comments.map(normalizeComment) : [],
  commentCount: row.commentCount ?? row.comment_count ?? 0,
})

const normalizeComment = (row) => ({
  id: row.id ?? row.comment_id,
  authorName: row.authorName ?? row.author_name,
  authorRole: row.authorRole ?? row.author_role,
  text: row.text ?? row.body ?? '',
  createdAt: row.createdAt ?? row.created_at,
  editedAt: row.edited ? (row.updatedAt ?? row.updated_at) : (row.editedAt ?? null),
  parentId: row.parentId ?? row.parent_id ?? null,
  reported: row.reported ?? false,
  hidden: row.hidden ?? false,
  removed: row.removed ?? false,
})

const normalizeGroup = (row) => ({
  id: row.id ?? row.group_id,
  name: row.name ?? row.group_name,
  strand: row.strand ?? row.program ?? '',
  section: row.section ?? '',
  yearLevel: row.yearLevel ?? row.year_level ?? '',
  schoolYear: row.schoolYear ?? row.school_year ?? '',
  adviser: row.adviser ?? row.adviser_name ?? '',
  members: Array.isArray(row.members) ? row.members : [],
  mine: true,
  memberCount: row.member_count ?? row.memberCount ?? 0,
  submissionCount: row.submission_count ?? row.submissionCount ?? 0,
})

export default function ForumProvider({ children }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [composing, setComposing] = useState(null)

  const authorName = user?.name ?? user?.full_name ?? 'You'
  const firstName = authorName.split(' ')[0]
  const myGroup = groups[0] ?? null

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [postsRes, groupsRes] = await Promise.all([
        api.get('/forum/posts', { params: { limit: 200 } }),
        api.get('/groups'),
      ])
      const rawPosts = Array.isArray(postsRes.data?.data) ? postsRes.data.data : []
      const rawGroups = Array.isArray(groupsRes.data?.data) ? groupsRes.data.data : []
      setPosts(rawPosts.map(normalizePost))
      setGroups(rawGroups.map(normalizeGroup))
    } catch (e) {
      console.error(e)
      setError('Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openComposer = useCallback((preset = {}) => {
    setComposing(preset && preset.nativeEvent ? {} : preset)
  }, [])
  const closeComposer = useCallback(() => setComposing(null), [])

  const patchPost = useCallback((id, fn) => {
    setPosts((list) => list.map((p) => (p.id === id ? fn(p) : p)))
  }, [])

  const loadPost = useCallback(async (id) => {
    try {
      const res = await api.get(`/forum/posts/${id}`)
      const full = normalizePost(res.data?.data)
      if (full.comments?.length) {
        setPosts((list) => list.map((p) => (p.id === id ? { ...p, comments: full.comments } : p)))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const addPost = useCallback(
    async ({ type, text, mediaUrl, paper }) => {
      try {
        const res = await api.post('/forum/posts', {
          type,
          text,
          mediaUrl: mediaUrl ?? '',
          groupId: composing?.groupId ?? myGroup?.id,
          paperId: paper?.id ?? null,
          paperTitle: paper?.title ?? '',
          status: paper?.status ?? null,
        })
        const created = normalizePost(res.data?.data)
        setPosts((list) => [created, ...list])
        setComposing(null)
        toast('Posted to the feed.')
        return created
      } catch (e) {
        console.error(e)
        toast('Failed to post.')
      }
    },
    [myGroup, composing, toast]
  )

  const editPost = useCallback(
    async (id, text) => {
      try {
        await api.patch(`/forum/posts/${id}`, { text })
        patchPost(id, (p) => ({ ...p, text, editedAt: new Date().toISOString() }))
        toast('Post updated.')
      } catch (e) {
        console.error(e)
        toast('Failed to update post.')
      }
    },
    [patchPost, toast]
  )

  const deletePost = useCallback(
    async (id) => {
      try {
        await api.delete(`/forum/posts/${id}`)
        setPosts((list) => list.filter((p) => p.id !== id))
        toast('Post deleted.')
      } catch (e) {
        console.error(e)
        toast('Failed to delete post.')
      }
    },
    [toast]
  )

  const toggleLike = useCallback(
    async (id) => {
      // optimistic
      patchPost(id, (p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }))
      try {
        const res = await api.post(`/forum/posts/${id}/like`)
        patchPost(id, (p) => ({ ...p, likes: res.data?.likes ?? p.likes, liked: res.data?.liked ?? p.liked }))
      } catch (e) {
        console.error(e)
        // revert on failure
        patchPost(id, (p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }))
      }
    },
    [patchPost]
  )

  const reportPost = useCallback(
    async (id) => {
      try {
        await api.post(`/forum/posts/${id}/report`)
        patchPost(id, (p) => ({ ...p, reported: true }))
        toast('Reported. A moderator will take a look.')
      } catch (e) {
        console.error(e)
        toast('Failed to report.')
      }
    },
    [patchPost, toast]
  )

  const addComment = useCallback(
    async (postId, text, parentId = null) => {
      try {
        const res = await api.post(`/forum/posts/${postId}/comments`, { text, parentId })
        const created = normalizeComment(res.data?.data)
        patchPost(postId, (p) => ({ ...p, comments: [...(p.comments || []), created] }))
      } catch (e) {
        console.error(e)
        toast('Failed to add comment.')
      }
    },
    [patchPost, toast]
  )

  const editComment = useCallback(
    async (postId, commentId, text) => {
      try {
        await api.patch(`/forum/comments/${commentId}`, { text })
        patchPost(postId, (p) => ({
          ...p,
          comments: (p.comments || []).map((c) =>
            c.id === commentId ? { ...c, text, editedAt: new Date().toISOString() } : c
          ),
        }))
      } catch (e) {
        console.error(e)
        toast('Failed to update comment.')
      }
    },
    [patchPost, toast]
  )

  const deleteComment = useCallback(
    async (postId, commentId) => {
      try {
        await api.delete(`/forum/comments/${commentId}`)
        patchPost(postId, (p) => ({
          ...p,
          comments: (p.comments || []).filter((c) => c.id !== commentId && c.parentId !== commentId),
        }))
        toast('Comment deleted.')
      } catch (e) {
        console.error(e)
        toast('Failed to delete comment.')
      }
    },
    [patchPost, toast]
  )

  const reportComment = useCallback(
    async (postId, commentId) => {
      try {
        await api.post(`/forum/comments/${commentId}/report`)
        patchPost(postId, (p) => ({
          ...p,
          comments: (p.comments || []).map((c) => (c.id === commentId ? { ...c, reported: true } : c)),
        }))
        toast('Reported. A moderator will take a look.')
      } catch (e) {
        console.error(e)
        toast('Failed to report.')
      }
    },
    [patchPost, toast]
  )

  const value = useMemo(
    () => ({
      posts,
      groups,
      me: authorName,
      myGroup,
      loading,
      error,
      refresh: fetchAll,
      loadPost,
      openComposer,
      addPost,
      editPost,
      deletePost,
      toggleLike,
      reportPost,
      addComment,
      editComment,
      deleteComment,
      reportComment,
    }),
    [
      posts, groups, authorName, myGroup, loading, error, fetchAll, loadPost,
      openComposer, addPost, editPost, deletePost, toggleLike, reportPost,
      addComment, editComment, deleteComment, reportComment,
    ]
  )

  return (
    <ForumContext.Provider value={value}>
      {children}
      {composing && (
        <AddPostModal
          firstName={firstName}
          preset={composing}
          onClose={closeComposer}
          onSubmit={addPost}
        />
      )}
    </ForumContext.Provider>
  )
}