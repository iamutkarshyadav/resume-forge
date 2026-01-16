export function normalizeResumeData(data: any) {
  if (!data) return null;

  return {
    ...data,
    name: data.name || "Anonymous",
    email: data.email || "",
    phone: data.phone || "",
    summary: data.summary || "",
    skills: Array.isArray(data.skills) ? data.skills : [],
    experience: Array.isArray(data.experience) 
      ? data.experience.map((exp: any) => ({
          ...exp,
          bullets: Array.isArray(exp.bullets) ? exp.bullets : []
        }))
      : [],
    projects: Array.isArray(data.projects)
      ? data.projects.map((proj: any) => ({
          ...proj,
          bullets: Array.isArray(proj.bullets) ? proj.bullets : [],
          tech: Array.isArray(proj.tech) ? proj.tech : []
        }))
      : [],
    education: Array.isArray(data.education) ? data.education : [],
  };
}
