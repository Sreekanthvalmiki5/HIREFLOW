import { BrowserRouter, Route, Routes } from "react-router";
import { GuestOnly, ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicLayout } from "@/layouts/PublicLayout";
import { RecruiterLayout } from "@/layouts/RecruiterLayout";
import { LandingPage } from "@/pages/LandingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { JobsPage } from "@/pages/jobs/JobsPage";
import { JobDetailPage } from "@/pages/jobs/JobDetailPage";
import { CandidateDashboard } from "@/pages/candidate/CandidateDashboard";
import { CandidateApplications } from "@/pages/candidate/CandidateApplications";
import { CandidateProfile } from "@/pages/candidate/CandidateProfile";
import { RecruiterDashboard } from "@/pages/recruiter/RecruiterDashboard";
import { JobFormPage } from "@/pages/recruiter/JobFormPage";
import { ApplicantsPage } from "@/pages/recruiter/ApplicantsPage";
import { RecruiterProfile } from "@/pages/recruiter/RecruiterProfile";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guests + candidates: top navbar layout */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />

          <Route element={<ProtectedRoute role="CANDIDATE" />}>
            <Route path="candidate" element={<CandidateDashboard />} />
            <Route path="candidate/applications" element={<CandidateApplications />} />
            <Route path="candidate/profile" element={<CandidateProfile />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

        {/* Recruiters: sidebar dashboard layout */}
        <Route element={<ProtectedRoute role="RECRUITER" />}>
          <Route element={<RecruiterLayout />}>
            <Route path="recruiter" element={<RecruiterDashboard />} />
            <Route path="recruiter/jobs/new" element={<JobFormPage />} />
            <Route path="recruiter/jobs/:id/edit" element={<JobFormPage />} />
            <Route path="recruiter/jobs/:id/applicants" element={<ApplicantsPage />} />
            <Route path="recruiter/profile" element={<RecruiterProfile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
