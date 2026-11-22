import { useCallback, useState } from 'react'
import useToast from '../context/useToast'
import { hideAdminPost, removeAdminPost, apiMessage } from '../services/adminService'

const COPY = {
  hide: {
    title: 'Hide post',
    message: 'The post will be marked as hidden. You can make it visible again at any time.',
    confirmLabel: 'Hide post',
    danger: false,
  },
  show: {
    title: 'Make post visible',
    message: 'The post will no longer be marked as hidden.',
    confirmLabel: 'Make visible',
    danger: false,
  },
  remove: {
    title: 'Remove post',
    message: 'The post will disappear from every feed and cannot be restored from here.',
    confirmLabel: 'Remove post',
    danger: true,
  },
}

export default function usePostActions(onChanged) {
  const { toast } = useToast()
  const [action, setAction] = useState(null)

  const request = useCallback((post, kind) => setAction({ post, kind }), [])
  const cancel = useCallback(() => setAction(null), [])

  const confirm = useCallback(async () => {
    const { post, kind } = action
    setAction(null)
    try {
      if (kind === 'remove') {
        await removeAdminPost(post.id)
        toast('Post removed.')
      } else {
        await hideAdminPost(post.id, kind === 'hide')
        toast(kind === 'hide' ? 'Post hidden.' : 'Post is visible again.')
      }
      onChanged(post, kind)
    } catch (e) {
      toast(apiMessage(e, 'Could not update this post.'), 'error')
    }
  }, [action, onChanged, toast])

  const modalProps = action ? { ...COPY[action.kind], onConfirm: confirm, onClose: cancel } : null

  return { request, modalProps }
}