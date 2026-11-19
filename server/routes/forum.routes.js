const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  listPosts, createPost, getPost, updatePost, deletePost,
  toggleLike, reportPost, hidePost, removePost,
  listComments, addComment, updateComment, deleteComment, reportComment,
} = require('../controllers/forumController')

router.use(authMiddleware)

// Posts
router.get('/posts', listPosts)
router.post('/posts', createPost)
router.get('/posts/:id', getPost)
router.patch('/posts/:id', updatePost)
router.delete('/posts/:id', deletePost)
router.post('/posts/:id/like', toggleLike)
router.post('/posts/:id/report', reportPost)
router.post('/posts/:id/hide', roleMiddleware('adviser', 'sysadmin'), hidePost)
router.post('/posts/:id/remove', roleMiddleware('adviser', 'sysadmin'), removePost)

// Comments
router.get('/posts/:id/comments', listComments)
router.post('/posts/:id/comments', addComment)
router.patch('/comments/:id', updateComment)
router.delete('/comments/:id', deleteComment)
router.post('/comments/:id/report', reportComment)

module.exports = router