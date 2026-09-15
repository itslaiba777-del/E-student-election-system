import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT bearer token automatically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle session timeout (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const isAuthReq = error.config?.url?.includes('/auth/');
        const isPublicReq = error.config?.url?.includes('/system/settings') || error.config?.url?.includes('/universities');

        // Only redirect if user was logged in with a token, and it's not a public request or login attempt
        if (token && !isAuthReq && !isPublicReq && !window.location.pathname.includes('/session-expired') && window.location.pathname !== '/') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/session-expired';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API Helper Methods
export const authAPI = {
  unifiedLogin: (data) => api.post('/auth/login', data),
  studentLogin: (data) => api.post('/auth/student/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  superadminLogin: (data) => api.post('/auth/superadmin/login', data),
};

export const studentAPI = {
  verifyEligibility: (data) => api.post('/students/verify-eligibility', data),
  sendOtp: (data) => api.post('/students/send-otp', data),
  verifyOtp: (data) => api.post('/students/verify-otp', data),
  register: (data) => api.post('/students/register', data),
  getProfile: () => api.get('/students/profile'),
};

export const universityAPI = {
  getAll: () => api.get('/universities'),
  getById: (id) => api.get(`/universities/${id}`),
  create: (formData) =>
    api.post('/universities', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const academicAPI = {
  getPublicSettings: () => api.get('/academic-structure/public-settings'),
  getAllDepartments: () => api.get('/academic-structure/departments'),
  getAllPrograms: () => api.get('/academic-structure/programs'),
  getFaculties: (uniId) => api.get(`/academic-structure/university/${uniId}/faculties`),
  getDepartments: (facId) => api.get(`/academic-structure/faculty/${facId}/departments`),
  getPrograms: (deptId) => api.get(`/academic-structure/department/${deptId}/programs`),
  createFaculty: (data) => api.post('/academic-structure/faculties', data),
  createDepartment: (data) => api.post('/academic-structure/departments', data),
  createProgram: (data) => api.post('/academic-structure/programs', data),
  deleteDepartment: (id) => api.delete(`/academic-structure/departments/${id}`),
  deleteProgram: (id) => api.delete(`/academic-structure/programs/${id}`),
};

export const academicStructureAPI = academicAPI;

export const candidateAPI = {
  getByElection: (electionId, status) => api.get(`/candidates/election/${electionId}`, { params: { status } }),
  getMyNomination: () => api.get('/candidates/my-nomination'),
  nominate: (formData) =>
    api.post('/candidates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateDetails: (candidateId, formData) =>
    api.put(`/candidates/${candidateId}/details`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateStatus: (candidateId, status) => api.put(`/candidates/${candidateId}/status`, { status }),
};

export const electionAPI = {
  getAll: (params) => api.get('/elections', { params }),
  create: (data) => api.post('/elections', data),
  extendTime: (id, new_voting_end) => api.put(`/elections/${id}/extend`, { new_voting_end }),
  getResults: (id) => api.get(`/elections/${id}/results`),
};

export const voteAPI = {
  requestOTP: (electionId) => api.post('/votes/request-otp', { election_id: electionId }),
  verifyOTP: (electionId, otpCode) => api.post('/votes/verify-otp', { election_id: electionId, otp_code: otpCode }),
  verifyFace: (electionId, faceDescriptor) => api.post('/votes/verify-face', { election_id: electionId, face_descriptor: faceDescriptor }),
  castVote: (electionId, candidateId) => api.post('/votes/cast', { election_id: electionId, candidate_id: candidateId }),
};

export const superadminAPI = {
  getDashboard: () => api.get('/superadmin/dashboard'),
  getAdmins: () => api.get('/superadmin/admins'),
  createAdmin: (data) => api.post('/superadmin/admins', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admins/dashboard'),
  getStudents: () => api.get('/admins/students'),
  updateStudentStatus: (studentId, status) => api.put(`/admins/students/${studentId}/status`, { status }),
};

export default api;
