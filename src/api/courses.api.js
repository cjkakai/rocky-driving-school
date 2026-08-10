import request from "./client";

export const coursesAPI = {
  getAll: () => request("/api/courses/"),
  getForRegistration: () => request("/api/courses/?registration_only=true"),
  create: (data) => request("/api/courses/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/courses/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/api/courses/${id}/`, { method: "DELETE" }),
};

export const studentCoursesAPI = {
  getOne: (id) => request(`/api/student-courses/${id}/`),
  enroll: (data) =>
    request("/api/student-courses/", { method: "POST", body: JSON.stringify(data) }),
  activateCourse: (id) =>
    request(`/api/student-courses/${id}/activate_course/`, { method: "POST" }),
  applyRetake: (id) =>
    request(`/api/student-courses/${id}/apply_retake/`, { method: "POST" }),
  markCompleted: (id) =>
    request(`/api/student-courses/${id}/mark_completed/`, { method: "POST" }),
  transferCourse: (id, data) =>
    request(`/api/student-courses/${id}/transfer_course/`, { method: "POST", body: JSON.stringify(data) }),
};
