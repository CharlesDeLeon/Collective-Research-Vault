import { useCallback, useMemo, useState } from 'react'
import useAuth from './useAuth'
import useToast from './useToast'
import { ForumContext } from './forumContext'
import { FEED_GROUPS, SEED_POSTS, tagsFor } from '../services/feedData'
import AddPostModal from '../components/paper/AddPostModal'

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

export default function ForumProvider({ children }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState(SEED_POSTS)
  const [composing, setComposing] = useState(null)

  const authorName = user?.name ?? user?.full_name ?? 'You'
  const firstName = authorName.split(' ')[0]
  const myGroup = FEED_GROUPS.find((g) => g.mine)

  const openComposer = useCallback((preset = {}) => {
    setComposing(preset && preset.nativeEvent ? {} : preset)
  }, [])
  const closeComposer = useCallback(() => setComposing(null), [])

  const patchPost = useCallback((id, fn) => {
    setPosts((list) => list.map((p) => (p.id === id ? fn(p) : p)))
  }, [])

  const addPost = useCallback(
    ({ type, text, mediaUrl, paper }) => {
      const post = {
        id: newId('p'),
        type,
        authorName,
        authorRole: 'Student',
        text,
        mediaUrl: mediaUrl ?? '',
        createdAt: new Date().toISOString(),
        editedAt: null,
        ...tagsFor(myGroup.id),
        paperId: paper?.id ?? null,
        paperTitle: paper?.title ?? '',
        status: paper?.status ?? null,
        likes: 0,
        liked: false,
        reported: false,
        comments: [],
      }
      setPosts((list) => [post, ...list])
      setComposing(null)
      toast('Posted to the feed.')
      return post
    },
    [authorName, myGroup, toast]
  )

  const editPost = useCallback(
    (id, text) => {
      patchPost(id, (p) => ({ ...p, text, editedAt: new Date().toISOString() }))
      toast('Post updated.')
    },
    [patchPost, toast]
  )

  const deletePost = useCallback(
    (id) => {
      setPosts((list) => list.filter((p) => p.id !== id))
      toast('Post deleted.')
    },
    [toast]
  )

  const toggleLike = useCallback(
    (id) => {
      patchPost(id, (p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }))
    },
    [patchPost]
  )

  const reportPost = useCallback(
    (id) => {
      patchPost(id, (p) => ({ ...p, reported: true }))
      toast('Reported. A moderator will take a look.')
    },
    [patchPost, toast]
  )

  const addComment = useCallback(
    (postId, text, parentId = null) => {
      patchPost(postId, (p) => ({
        ...p,
        comments: [
          ...p.comments,
          {
            id: newId('c'),
            authorName,
            authorRole: 'Student',
            text,
            createdAt: new Date().toISOString(),
            editedAt: null,
            parentId,
            reported: false,
          },
        ],
      }))
    },
    [authorName, patchPost]
  )

  const editComment = useCallback(
    (postId, commentId, text) => {
      patchPost(postId, (p) => ({
        ...p,
        comments: p.comments.map((c) =>
          c.id === commentId ? { ...c, text, editedAt: new Date().toISOString() } : c
        ),
      }))
    },
    [patchPost]
  )

  const deleteComment = useCallback(
    (postId, commentId) => {
      patchPost(postId, (p) => ({
        ...p,
        comments: p.comments.filter((c) => c.id !== commentId && c.parentId !== commentId),
      }))
      toast('Comment deleted.')
    },
    [patchPost, toast]
  )

  const reportComment = useCallback(
    (postId, commentId) => {
      patchPost(postId, (p) => ({
        ...p,
        comments: p.comments.map((c) => (c.id === commentId ? { ...c, reported: true } : c)),
      }))
      toast('Reported. A moderator will take a look.')
    },
    [patchPost, toast]
  )

  const value = useMemo(
    () => ({
      posts,
      me: authorName,
      myGroup,
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
      posts,
      authorName,
      myGroup,
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