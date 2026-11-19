import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import Landing from './pages/public/Landing'
import NotFoundPage from './pages/NotFoundPage'
import SessionExpiredModal from './components/SessionExpiredModal'
// Student
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import UploadForm from './pages/student/UploadForm'
import MyPapers from './pages/student/MyPapers'
import PaperDetail from './pages/student/PaperDetail'
import ActivityHistory from './pages/student/ActivityHistory'
import Feed from './pages/student/Feed'
import Groups from './pages/student/Groups'
import GroupDetail from './pages/student/GroupDetail'
import Profile from './pages/student/Profile'
import NotFound from './pages/student/NotFound'

// Faculty
import FacultyLayout from './pages/faculty/FacultyLayout'
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import AssignmentsList from './pages/faculty/AssignmentsList'
import SubmissionDetail from './pages/faculty/SubmissionDetail'

// Coordinator
import CoordinatorLayout from './pages/coordinator/CoordinatorLayout'
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard'
import CoordinatorNotif from './pages/coordinator/CoordinatorNotif'
import FacultyAssignment from './pages/coordinator/FacultyAssignment'
import ManageGroups from './pages/coordinator/ManageGroups'
import ManageSubmissions from './pages/coordinator/ManageSubmissions'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLayout from './pages/admin/AdminLayout'
import AuditTrail from './pages/admin/AuditTrail'
import ManageUsers from './pages/admin/ManageUsers'
import ManageStorage from './pages/admin/ManageStorage'


function App() {
  return (
    <BrowserRouter>
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
            <Route path="paper/:paperId" element={<PaperDetail />} />
            <Route path="feed" element={<Feed />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:groupId" element={<GroupDetail />} />
            <Route path="notifications" element={<ActivityHistory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="forum" element={<Navigate to="/student/feed" replace />} />
            <Route path="history" element={<Navigate to="/student/notifications" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRole="adviser">
                <FacultyLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/faculty/dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="assignments" element={<AssignmentsList />} />
            <Route path="assignments/:group_id" element={<SubmissionDetail />} />
            <Route path="submission/:submission_id" element={<SubmissionDetail />} />
          </Route>

          <Route
            path="/coordinator"
            element={
              <ProtectedRoute allowedRole="adviser">
                <CoordinatorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/coordinator/dashboard" replace />} />
            <Route path="dashboard" element={<CoordinatorDashboard />} />
            <Route path="coordinatornotif" element={<CoordinatorNotif />} />
            <Route path="facultyassignment" element={<FacultyAssignment />} />
            <Route path="managegroups" element={<ManageGroups />} />
            <Route path="managesubmissions" element={<ManageSubmissions />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole={['sysadmin', 'admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="auditTrail" element={<AuditTrail />} />
            <Route path="manageUsers" element={<ManageUsers />} />
            <Route path="manageStorage" element={<ManageStorage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <SessionExpiredModal />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App