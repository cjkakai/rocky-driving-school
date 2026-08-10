import { useState, useEffect, useCallback, useMemo } from "react";
import { studentsAPI } from "../api/students.api";

const INITIAL_FILTERS = {
  searchQuery:        "",
  filterBranch:       "",
  filterStatus:       "",
  filterCourse:       "",
  filterCourseStatus: "",
  dateFrom:           "",
  dateTo:             "",
  filterExam:         "",
  filterExamResult:   "",
};

export function useStudents({ isBranchUser = false } = {}) {
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filters, setFilters]         = useState(INITIAL_FILTERS);
  const [expandedRow, setExpandedRow] = useState(null);
  const [page, setPage]               = useState(1);
  const [pageSize]                    = useState(20);
  const [totalCount, setTotalCount]   = useState(0);
  const [summary, setSummary]         = useState(null);

  const baseParams = useMemo(() => ({
    ...(filters.searchQuery        && { search:        filters.searchQuery }),
    ...(filters.filterStatus === "all"
      ? { status: "all" }
      : filters.filterStatus
      ? { status: filters.filterStatus }
      : {}),
    ...(!isBranchUser && filters.filterBranch && { branch_id: filters.filterBranch }),
    ...(filters.filterCourse        && { course_id:     filters.filterCourse }),
    ...(filters.filterCourseStatus  && { course_status: filters.filterCourseStatus }),
    ...(filters.dateFrom            && { date_from:     filters.dateFrom }),
    ...(filters.dateTo              && { date_to:       filters.dateTo }),
    ...(filters.filterExam          && { exam_id:       filters.filterExam }),
    ...(filters.filterExam && filters.filterExamResult && { exam_result: filters.filterExamResult }),
  }), [filters, isBranchUser]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: pageSize, ...baseParams };
      const data = await studentsAPI.getAll(params);
      if (Array.isArray(data)) {
        setStudents(data);
        setTotalCount(data.length);
      } else {
        setStudents(data.results ?? []);
        setTotalCount(data.count ?? 0);
      }
    } catch (err) {
      setError(err.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, baseParams]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, filters.searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchStudents, filters.searchQuery]);

  const fetchSummary = useCallback(() => {
    studentsAPI.getSummary(baseParams).then(setSummary).catch(() => {});
  }, [baseParams]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const setFiltersMany = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const toggleRow = useCallback((id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  }, []);

  const patchStudent = useCallback((id, updater) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? (typeof updater === "function" ? updater(s) : { ...s, ...updater }) : s))
    );
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    students, loading, error,
    filters, setFilter, setFiltersMany,
    expandedRow, toggleRow,
    page, setPage, pageSize, totalCount, totalPages,
    refresh: fetchStudents,
    refreshSummary: fetchSummary,
    patchStudent,
    summary,
  };
}
