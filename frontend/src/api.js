import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Students
export const getStudents = () => API.get('/students/');
export const createStudent = (data) => API.post('/students/', data);
export const updateStudent = (id, data) => API.put(`/students/${id}/`, data);
export const deleteStudent = (id) => API.delete(`/students/${id}/`);

// Subjects
export const getSubjects = () => API.get('/subjects/');
export const createSubject = (data) => API.post('/subjects/', data);
export const updateSubject = (id, data) => API.put(`/subjects/${id}/`, data);
export const deleteSubject = (id) => API.delete(`/subjects/${id}/`);

// Sections
export const getSections = (subjectId = null) =>
  API.get('/sections/', { params: subjectId ? { subject: subjectId } : {} });
export const createSection = (data) => API.post('/sections/', data);
export const updateSection = (id, data) => API.put(`/sections/${id}/`, data);
export const deleteSection = (id) => API.delete(`/sections/${id}/`);

// Enrollments
export const getEnrollments = (filters = {}) => API.get('/enrollments/', { params: filters });
export const createEnrollment = (data) => API.post('/enrollments/', data);
export const dropEnrollment = (id) => API.delete(`/enrollments/${id}/`);

// Summaries
export const getSummaries = () => API.get('/summaries/');
export const getStudentSummary = (id) => API.get(`/summaries/${id}/`);

// Dashboard
export const getDashboardStats = () => API.get('/dashboard/');
