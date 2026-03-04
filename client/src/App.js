import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import "./styles/theme.css";
import "./styles/roleBasedTheme.css";
import "./styles/barrelWorkflow.css";
import { RoleThemeProvider } from "./components/common/RoleThemeProvider";

// Layouts and Protection
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import GuestRoute from "./components/common/GuestRoute";
import AdminProtectedRoute from "./components/common/AdminProtectedRoute";
import AdminDashboardLayout from "./layouts/AdminDashboardLayout";
import ManagerProtectedRoute from "./components/common/ManagerProtectedRoute";
import ManagerDashboardLayout from "./layouts/ManagerDashboardLayout";

// Manager Pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerHome from "./pages/manager/ManagerHome";
import ManagerProfile from "./pages/manager/ManagerProfile";
import ManagerSettings from "./pages/manager/ManagerSettings";
import ManagerAttendance from "./pages/manager/ManagerAttendance";
import ManagerExpenses from "./pages/manager/ManagerExpenses";
import ComplaintManagement from "./pages/manager/ComplaintManagement";
import ManagerHangerSpace from "./pages/manager/ManagerHangerSpace";
import ManagerStock from "./pages/manager/ManagerStock";
import ManagerBarrelAllocation from "./pages/manager/ManagerBarrelAllocation";
import ManagerReturnBarrels from "./pages/manager/ManagerReturnBarrels";
import ManagerSellRequests from "./pages/manager/ManagerSellRequests";
import ManagerLatexBilling from "./pages/manager/ManagerLatexBilling";
import ManagerBillVerification from "./pages/manager/ManagerBillVerification";
import ManagerRateUpdate from "./pages/manager/ManagerRateUpdate";
import AccountantLiveRate from "./pages/accountant/AccountantLiveRate";
import ManagerWages from "./pages/manager/ManagerWages";
import ManagerStaffSalary from "./pages/manager/ManagerStaffSalary";
import ManagerShifts from "./pages/manager/ManagerShifts";
import ShiftManagement from "./pages/manager/ShiftManagement";
import StaffSchedule from "./pages/manager/StaffSchedule";
import ManagerChemicalRequests from "./pages/manager/ManagerChemicalRequests";
import ManagerNotifications from "./pages/manager/ManagerNotifications";
import PendingLeaves from "./pages/manager/PendingLeaves";
import LiveCheckins from "./pages/manager/LiveCheckins";
import LiveAttendance from "./pages/manager/LiveAttendance";

// Lab Pages
import LabProtectedRoute from "./components/common/LabProtectedRoute";
import LabDashboard from "./pages/lab/LabDashboard";
import LabDashboardLayout from "./layouts/LabDashboardLayout";
import LabAttendance from "./pages/lab/LabAttendance";
import LabLeave from "./pages/lab/LabLeave";
import LabSalary from "./pages/lab/LabSalary";
import LabCheckIn from "./pages/lab/LabCheckIn";
import LabDRCUpdate from "./pages/lab/LabDRCUpdate";
import AIRubberProcess from "./pages/lab/AIRubberProcess";
import LabChemicalRequests from "./pages/lab/LabChemicalRequests";
import LabReports from "./pages/lab/LabReports";
import LabShiftSchedule from "./pages/lab/LabShiftSchedule";

// Accountant Module
import AccountantProtectedRoute from "./components/common/AccountantProtectedRoute";
import AccountantLayoutAntigravity from "./layouts/AccountantLayoutAntigravity";
import AccountantDashboard from "./pages/accountant/AccountantDashboard";
import AccountantLatexVerify from "./pages/accountant/AccountantLatexVerify";
import AccountantExpenseTracker from "./pages/accountant/AccountantExpenseTracker";
import AccountantStockMonitor from "./pages/accountant/AccountantStockMonitor";
import AccountantAttendance from "./pages/accountant/AccountantAttendance";
import AccountantLeave from "./pages/accountant/AccountantLeave";
import AccountantSalaries from "./pages/accountant/AccountantSalaries";
import AccountantBillGeneration from "./pages/accountant/AccountantBillGeneration";
import AccountantDeliveryIntake from "./pages/accountant/AccountantDeliveryIntake";
import AccountantVendorLedger from "./pages/accountant/AccountantVendorLedger";
import AccountantDocuments from "./pages/accountant/AccountantDocuments";
import AccountantReports from "./pages/accountant/AccountantReports";
import AccountantAlerts from "./pages/accountant/AccountantAlerts";

// Public Pages
import HomePage from "./pages/HomePage";
import NewLandingPage from "./pages/NewLandingPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import HistoryPage from "./pages/HistoryPage";
import GalleryPage from "./pages/GalleryPage";
import AwardsPage from "./pages/AwardsPage";
import LandingPage from "./pages/LandingPage";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import StaffLoginPage from "./pages/auth/StaffLoginPage";

// User Dashboard Pages
import Profile from "./pages/user_dashboard/Profile";
import UserLiveRate from "./pages/UserLiveRate";
import UserDashboard from "./pages/user_dashboard/UserDashboard";
import MyActions from "./pages/user_dashboard/MyActions";
import Notifications from "./pages/user_dashboard/Notifications";
import UserRequests from "./pages/user_dashboard/UserRequests";
import UserTransactions from "./pages/user_dashboard/UserTransactions";
import UserBills from "./pages/user_dashboard/UserBills";
import UserTransactionDetail from "./pages/user_dashboard/UserTransactionDetail";
import MyBarrels from "./pages/user_dashboard/MyBarrels";
import SellBarrels from "./pages/user_dashboard/SellBarrels";

// Staff Pages
import StaffProtectedRoute from "./components/common/StaffProtectedRoute";
import StaffDashboardLayout from "./layouts/StaffDashboardLayout";
import StaffDashboard from "./pages/user_dashboard/StaffDashboard";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffLeave from "./pages/staff/StaffLeave";
import StaffSalary from "./pages/staff/StaffSalary";
import StaffEarningsAndBills from "./pages/staff/StaffEarningsAndBills";
import StaffIssues from "./pages/staff/StaffIssues";
import ReturnBarrels from "./pages/staff/ReturnBarrels";
import MySchedule from "./pages/staff/MySchedule";

// Field Staff Pages
import FieldStaffRoutes from "./pages/field-staff/FieldStaffRoutes";
import FieldStaffReports from "./pages/field-staff/FieldStaffReports";
import FieldStaffProfile from "./pages/field-staff/FieldStaffProfile";
import FieldStaffDashboard from "./components/dashboards/FieldStaffDashboard";
import FieldStaffDashboardPage from "./pages/field-staff/FieldStaffDashboardPage";
import FieldStaffSalary from "./pages/field-staff/FieldStaffSalary";

// Delivery Staff
import DeliveryProtectedRoute from "./components/common/DeliveryProtectedRoute";
import DeliveryDashboardLayout from "./layouts/DeliveryDashboardLayout";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import DeliveryRoutePlan from "./pages/delivery/DeliveryRoutePlan";
import DeliveryTasks from "./pages/delivery/DeliveryTasks";
import BarrelDeliveryTasks from "./pages/delivery/BarrelDeliveryTasks";
import DeliveryAssignedSellRequests from "./pages/delivery/DeliveryAssignedSellRequests";
import DeliveryBarrelIntake from "./pages/delivery/DeliveryBarrelIntake";
import DeliveryTaskHistory from "./pages/delivery/DeliveryTaskHistory";
import DeliveryShiftSchedule from "./pages/delivery/DeliveryShiftSchedule";
import VehicleInfo from "./pages/delivery/VehicleInfo";
import DeliveryLeave from "./pages/delivery/DeliveryLeave";
import DeliverySalary from "./pages/delivery/DeliverySalary";

// Admin Pages
import AdminHome from "./pages/admin/AdminHome";
import Attendance from "./pages/admin/Attendance";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminStaffManagement from "./pages/admin/AdminStaffManagement";
import WorkerSchedule from "./pages/admin/WorkerSchedule";
import WorkerDocuments from "./pages/admin/WorkerDocuments";
import YardStock from "./pages/admin/YardStock";
import GodownRubberStock from "./pages/admin/GodownRubberStock";
import HangerSpace from "./pages/admin/HangerSpace";
import ChemicalStockHistory from "./pages/admin/ChemicalStockHistory";
import AdminCreateBarrel from "./pages/admin/AdminCreateBarrel";
import BarrelManagement from "./pages/admin/BarrelManagement";
import BarrelIssueRegister from "./pages/admin/BarrelIssueRegister";
import AdminExpenses from "./pages/admin/AdminExpenses";
import AdminChemicalRequests from "./pages/admin/AdminChemicalRequests";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminRateVerification from "./pages/admin/AdminRateVerification";
import AdminRateApproval from "./pages/admin/AdminRateApproval";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminReports from "./pages/admin/AdminReports";
import AdminPerformance from "./pages/admin/AdminPerformance";
import AdminHealth from "./pages/admin/AdminHealth";
import AdminOverview from "./pages/admin/AdminOverview";
import VehicleManagement from "./pages/admin/VehicleManagement";

function App() {
  return (
    <RoleThemeProvider>
      <Routes>
        {/* New Landing Page - Standalone without layout */}
        <Route path="/" element={<NewLandingPage />} />
        
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/old-home" element={<HomePage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/awards" element={<AwardsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/staff/login"
          element={
            <GuestRoute>
              <StaffLoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          }
        />

        {/* User Dashboard Routes */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/live-rate"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserLiveRate />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/my-actions"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <MyActions />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/requests"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserRequests />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/my-barrels"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <MyBarrels />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/sell-barrels"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SellBarrels />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/transactions"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserBills />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/bills"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserBills />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/transactions/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserTransactionDetail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Staff Routes */}
        <Route
          path="/staff"
          element={
            <StaffProtectedRoute>
              <StaffDashboardLayout>
                <StaffDashboard />
              </StaffDashboardLayout>
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/attendance"
          element={
            <StaffProtectedRoute>
              <StaffDashboardLayout>
                <StaffAttendance />
              </StaffDashboardLayout>
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/schedule"
          element={
            <StaffProtectedRoute>
              <StaffDashboardLayout>
                <MySchedule />
              </StaffDashboardLayout>
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/leave"
          element={
            <StaffProtectedRoute>
              <StaffDashboardLayout>
                <StaffLeave />
              </StaffDashboardLayout>
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/salary"
          element={
            <StaffProtectedRoute>
              <StaffDashboardLayout>
                <StaffEarningsAndBills />
              </StaffDashboardLayout>
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/issues"
          element={
            <StaffProtectedRoute>
              <StaffDashboardLayout>
                <StaffIssues />
              </StaffDashboardLayout>
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/return-barrels"
          element={
            <StaffProtectedRoute>
              <StaffDashboardLayout>
                <ReturnBarrels />
              </StaffDashboardLayout>
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/profile"
          element={
            <StaffProtectedRoute>
              <StaffDashboardLayout>
                {/* Show field staff profile for field staff, generic profile for others */}
                <FieldStaffProfile />
              </StaffDashboardLayout>
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/settings"
          element={
            <StaffProtectedRoute>
              <StaffDashboardLayout>
                <div style={{padding: '20px'}}><h2>Settings</h2><p>This page is under development.</p></div>
              </StaffDashboardLayout>
            </StaffProtectedRoute>
          }
        />

        {/* Lab Routes */}
        <Route
          path="/lab/dashboard"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <LabDashboard />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />
        <Route
          path="/lab/attendance"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <LabAttendance />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />
        <Route
          path="/lab/leave"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <LabLeave />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />
        <Route
          path="/lab/shift-schedule"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <LabShiftSchedule />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />
        <Route
          path="/lab/check-in"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <LabCheckIn />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />
        <Route
          path="/lab/ai-rubber-process"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <AIRubberProcess />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />
        <Route
          path="/lab/drc-update"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <LabDRCUpdate />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />

        <Route
          path="/lab/chem-requests"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <LabChemicalRequests />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />
        <Route
          path="/lab/salary"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <LabSalary />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />
        <Route
          path="/lab/reports"
          element={
            <LabProtectedRoute>
              <LabDashboardLayout>
                <LabReports />
              </LabDashboardLayout>
            </LabProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerHome />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/home"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerHome />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/live"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <LiveCheckins />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/live-attendance"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <LiveAttendance />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/leaves"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <PendingLeaves />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/attendance"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerAttendance />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/expenses"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerExpenses />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/completed"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ComplaintManagement />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/hanger-space"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerHangerSpace />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/stock"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerStock />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/barrel-allocation"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerBarrelAllocation />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/returned-barrels"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerReturnBarrels />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/sell-requests"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerSellRequests />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/bill-verification"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerBillVerification />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/rates"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerRateUpdate />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/wages"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerWages />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/staff-salary"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerStaffSalary />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/shifts"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerShifts />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/shift-management"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ShiftManagement />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/staff-schedule"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <StaffSchedule />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/chem-requests"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerChemicalRequests />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/notifications"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerNotifications />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/profile"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerProfile />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />
        <Route
          path="/manager/settings"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboardLayout>
                <ManagerSettings />
              </ManagerDashboardLayout>
            </ManagerProtectedRoute>
          }
        />

        {/* Delivery Routes */}
        <Route
          path="/delivery"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <DeliveryDashboard />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/route-plan"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <DeliveryRoutePlan />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/tasks"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <DeliveryTasks />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/barrel-deliveries"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <BarrelDeliveryTasks />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/assigned-requests"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <DeliveryAssignedSellRequests />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/barrel-intake"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <DeliveryBarrelIntake />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/task-history"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <DeliveryTaskHistory />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/shift-schedule"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <DeliveryShiftSchedule />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/vehicle-info"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <VehicleInfo />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/leave"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <DeliveryLeave />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/salary"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <DeliverySalary />
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/profile"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <div style={{padding: '20px'}}><h2>My Profile</h2><p>This page is under development.</p></div>
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />
        <Route
          path="/delivery/settings"
          element={
            <DeliveryProtectedRoute>
              <DeliveryDashboardLayout>
                <div style={{padding: '20px'}}><h2>Settings</h2><p>This page is under development.</p></div>
              </DeliveryDashboardLayout>
            </DeliveryProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/home"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminHome />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <Attendance />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminStaff />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/staff-management"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminStaffManagement />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/worker-schedule"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <WorkerSchedule />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/worker-documents"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <WorkerDocuments />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/yard-stock"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <YardStock />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/godown-rubber-stock"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <GodownRubberStock />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/hanger-space"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <HangerSpace />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/chemical-stock-history"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <ChemicalStockHistory />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/create-barrel"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminCreateBarrel />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/barrel-requests"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <BarrelManagement />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/barrel-register"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <BarrelIssueRegister />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/barrel-management"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <BarrelManagement />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminStaffManagement />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminReports />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/performance"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminPerformance />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/health"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminHealth />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/overview"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminOverview />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/expenses"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminExpenses />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/chem-requests"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminChemicalRequests />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminNotifications />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/rates"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminRateVerification />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/rate-approval"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminRateApproval />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/vehicles"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <VehicleManagement />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminProfile />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminProtectedRoute>
              <AdminDashboardLayout>
                <AdminSettings />
              </AdminDashboardLayout>
            </AdminProtectedRoute>
          }
        />

        {/* Accountant Routes */}
        <Route
          path="/accountant"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantDashboard />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/dashboard"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantDashboard />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/rates"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantLiveRate />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/expenses"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantExpenseTracker />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/stock"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantStockMonitor />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/attendance"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantAttendance />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/leave"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantLeave />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/salaries"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantSalaries />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/bill-generation"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantBillGeneration />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/delivery-intake"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantDeliveryIntake />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/vendors"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantVendorLedger />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/documents"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantDocuments />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/reports"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantReports />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/alerts"
          element={
            <AccountantProtectedRoute>
              <AccountantLayoutAntigravity>
                <AccountantAlerts />
              </AccountantLayoutAntigravity>
            </AccountantProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RoleThemeProvider>
  );
}

export default App;