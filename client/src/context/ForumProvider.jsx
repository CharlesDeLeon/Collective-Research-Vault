import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useAuth from './useAuth'
import { ForumContext } from './forumContext'
import { forumPlaceholderPosts } from '../services/forumPlaceholder'
import AddPostModal from '../components/paper/AddPostModal'

function kindOf(file) {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  return 'file'
}

export default function ForumProvider({ children }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState(forumPlaceholderPosts)
  const [composing, setComposing] = useState(false)
  const objectUrls = useRef(new Set())

  useEffect(() => {
    const urls = objectUrls.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const toAttachment = useCallback((file) => {
    const url = URL.createObjectURL(file)
    objectUrls.current.add(url)
    return {
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      size: file.size,
      kind: kindOf(file),
      url,
    }
  }, [])

  const authorName = user?.name ?? user?.full_name ?? 'You'
  const firstName = authorName.split(' ')[0]

  const openComposer = useCallback(() => setComposing(true), [])
  const closeComposer = useCallback(() => setComposing(false), [])

  const addPost = useCallback(
    ({ text, file, video }) => {
      setPosts((list) => [
        {
          id: `local-${Date.now()}`,
          authorName,
          text,
          createdAt: new Date().toISOString(),
          attachments: [file, video].filter(Boolean).map(toAttachment),
          liked: false,
          replies: [],
        },
        ...list,
      ])
      setComposing(false)
    },
    [authorName, toAttachment]
  )

  const addReply = useCallback(
    (postId, text) => {
      setPosts((list) =>
        list.map((p) =>
          p.id === postId
            ? { ...p, replies: [...p.replies, { id: `local-${Date.now()}`, authorName, text }] }
            : p
        )
      )
    },
    [authorName]
  )

  const toggleLike = useCallback((postId) => {
    setPosts((list) => list.map((p) => (p.id === postId ? { ...p, liked: !p.liked } : p)))
  }, [])

  const value = useMemo(
    () => ({ posts, addReply, toggleLike, openComposer }),
    [posts, addReply, toggleLike, openComposer]
  )

  return (
    <ForumContext.Provider value={value}>
      {children}
      {composing && (
        <AddPostModal firstName={firstName} onClose={closeComposer} onSubmit={addPost} />
      )}
    </ForumContext.Provider>
  )
}