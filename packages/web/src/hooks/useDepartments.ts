import { useEffect, useState } from "react";
import type { DepartmentWithAgents } from "../types";

export function useDepartments() {
  const [departments, setDepartments] = useState<DepartmentWithAgents[]>([]);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data: { departments: DepartmentWithAgents[] }) => {
        setDepartments(data.departments);
      })
      .catch(() => {
        // fetch failed; departments stays empty
      });
  }, []);

  return { departments, setDepartments };
}
