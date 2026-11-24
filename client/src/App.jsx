import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ResearchGallery from './pages/ResearchGallery'
import GalleryPaper from './pages/GalleryPaper'
import About from './pages/public/About'
import RequestSubmitted from './pages/public/RequestSubmitted'
import RequestStatus from './pages/public/RequestStatus'
import AccessLink from './pages/public/AccessLink'
import AccessView from './pages/public/AccessView'
import AccessDownload from './pages/public/AccessDownload'
import InviteAccept from './pages/public/InviteAccept'
import Landing from './pages/public/Landing'
import NotFoundPage from './pages/NotFoundPage'
import SessionExpiredModal from './components/SessionExpiredModal'
// Student
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import UploadForm from './pages/student/UploadForm'
import MyPapers from './pages/student/MyPapers'
import MyAccess from './pages/student/MyAccess'
import PaperDetail from './pages/student/PaperDetail'
import ActivityHistory from './pages/student/ActivityHistory'
import Forum from './pages/student/Forum'
import Groups from './pages/student/Groups'
import GroupDetail from './pages/student/GroupDetail'
import Profile from './pages/student/Profile'
import NotFound from './pages/student/NotFound'

// Adviser
import AdviserLayout from './pages/adviser/AdviserLayout'
import AdviserDashboard from './pages/adviser/AdviserDashboard'
import AdviserGroups from './pages/adviser/AdviserGroups'
import AdviserGroupDetail from './pages/adviser/AdviserGroupDetail'
import AdviserSubmissions from './pages/adviser/AdviserSubmissions'
import AdviserReview from './pages/adviser/AdviserReview'
import AdviserInbox from './pages/adviser/AdviserInbox'
import AdviserModeration from './pages/adviser/AdviserModeration'
import AdviserPanelists from './pages/adviser/AdviserPanelists'
import AdviserReports from './pages/adviser/AdviserReports'
import AdviserAnalytics from './pages/adviser/AdviserAnalytics'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLayout from './pages/admin/AdminLayout'
import AuditTrail from './pages/admin/AuditTrail'
import ManageUsers from './pages/admin/ManageUsers'
import ManageStorage from './pages/admin/ManageStorage'
import AdminModeration from './pages/admin/AdminModeration'
import AdminPosts from './pages/admin/AdminPosts'
import AdminGroups from './pages/admin/AdminGroups'
import AdminGroupDetail from './pages/admin/AdminGroupDetail'
import AdminAccessRequests from './pages/admin/AdminAccessRequests'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminRoles from './pages/admin/AdminRoles'
import AdminReports from './pages/admin/AdminReports'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminSettings from './pages/admin/AdminSettings'
import AdminProfile from './pages/admin/AdminProfile'

// Panelist
import PanelistLayout from './pages/panelist/PanelistLayout'
import PanelistDashboard from './pages/panelist/PanelistDashboard'
import PanelistGroups from './pages/panelist/PanelistGroups'
import PanelistGroupDetail from './pages/panelist/PanelistGroupDetail'
import PanelistPostDetail from './pages/panelist/PanelistPostDetail'
import PanelistForum from './pages/panelist/PanelistForum'


function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/gallery" element={<ResearchGallery />} />
        <Route path="/paper/:slug" element={<GalleryPaper />} />
        <Route path="/about" element={<About />} />
        <Route path="/request/submitted" element={<RequestSubmitted />} />
        <Route path="/access/status" element={<RequestStatus />} />
        <Route path="/access/status/:ref" element={<RequestStatus />} />
        <Route path="/access/:token" element={<AccessLink />} />
        <Route path="/access/:token/view" element={<AccessView />} />
        <Route path="/access/:token/download" element={<AccessDownload />} />
        <Route path="/invite/:token" element={<InviteAccept />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="upload" element={<UploadForm />} />
          <Route path="my-papers" element={<MyPapers />} />
          <Route path="my-papers/:paperId/edit" element={<UploadForm />} />
          <Route path="access" element={<MyAccess />} />
          <Route path="paper/:paperId" element={<PaperDetail />} />
          <Route path="forum" element={<Forum />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groups/:groupId" element={<GroupDetail />} />
          <Route path="notifications" element={<ActivityHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="feed" element={<Navigate to="/student/forum" replace />} />
          <Route path="history" element={<Navigate to="/student/notifications" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/faculty/*" element={<Navigate to="/adviser/dashboard" replace />} />
        <Route path="/coordinator/*" element={<Navigate to="/adviser/dashboard" replace />} />

        <Route
          path="/adviser"
          element={
            <ProtectedRoute allowedRole="adviser">
              <AdviserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/adviser/dashboard" replace />} />
          <Route path="dashboard" element={<AdviserDashboard />} />
          <Route path="groups" element={<AdviserGroups />} />
          <Route path="groups/:groupId" element={<AdviserGroupDetail />} />
          <Route path="reviews" element={<AdviserSubmissions />} />
          <Route path="reviews/:id" element={<AdviserReview />} />
          <Route path="inbox" element={<AdviserInbox />} />
          <Route path="moderation" element={<AdviserModeration />} />
          <Route path="panelists" element={<AdviserPanelists />} />
          <Route path="analytics" element={<AdviserAnalytics />} />
          <Route path="reports" element={<AdviserReports />} />
          <Route path="notifications" element={<ActivityHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="submissions" element={<Navigate to="/adviser/reviews" replace />} />
          <Route path="assignments/*" element={<Navigate to="/adviser/groups" replace />} />
          <Route path="faculty-assignment" element={<Navigate to="/adviser/groups" replace />} />
          <Route path="*" element={<Navigate to="/adviser/dashboard" replace />} />
        </Route>

          <Route
            path="/panelist"
            element={
              <ProtectedRoute allowedRole="external_panelist">
                <PanelistLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/panelist/dashboard" replace />} />
            <Route path="dashboard" element={<PanelistDashboard />} />
            <Route path="groups" element={<PanelistGroups />} />
            <Route path="groups/:groupId" element={<PanelistGroupDetail />} />
            <Route path="posts/:postId" element={<PanelistPostDetail />} />
            <Route path="forum" element={<PanelistForum />} />
            <Route path="gallery" element={<Navigate to="/gallery" replace />} />
            <Route path="notifications" element={<ActivityHistory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/panelist/dashboard" replace />} />
          </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole={['sysadmin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="users/:userId" element={<AdminUserDetail />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="groups" element={<AdminGroups />} />
          <Route path="groups/:groupId" element={<AdminGroupDetail />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="access-requests" element={<AdminAccessRequests />} />
          <Route path="audit" element={<AuditTrail />} />
          <Route path="storage" element={<ManageStorage />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="notifications" element={<AdminAnnouncements />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="manageUsers" element={<Navigate to="/admin/users" replace />} />
          <Route path="auditTrail" element={<Navigate to="/admin/audit" replace />} />
          <Route path="manageStorage" element={<Navigate to="/admin/storage" replace />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <SessionExpiredModal />
    </AuthProvider>
  )
}

export default App